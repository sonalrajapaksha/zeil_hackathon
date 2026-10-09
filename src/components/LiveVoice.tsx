"use client";

import { useEffect, useRef, useState } from 'react';
import { encodePcm, decodePcm } from '@/lib/live-audio';
import type { LiveServerMessage } from '@google/genai';

type Transcript = { role: 'You' | 'Access · Gemini Live'; text: string };
type Resources = {
  cancelled: boolean; ready: boolean; muted: boolean; controller: AbortController;
  stream?: MediaStream; context?: AudioContext; source?: MediaStreamAudioSourceNode;
  capture?: AudioWorkletNode; socket?: WebSocket; session?: { sendRealtimeInput: (input: unknown) => void; sendClientContent: (input: unknown) => void }; timer?: ReturnType<typeof setTimeout>;
  sources: Set<AudioBufferSourceNode>; nextPlay: number;
};

export function LiveVoice({ questionStyle, available, onUseText }: {
  questionStyle?: 'simple' | 'standard'; available: boolean; onUseText: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [status, setStatus] = useState('Voice is off.');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<Transcript[]>([]);
  const resources = useRef<Resources | null>(null);
  const transcriptRole = useRef<Transcript['role'] | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const active = state !== 'idle';

  function clearPlayback(current: Resources) {
    for (const source of current.sources) { source.onended = null; try { source.stop(); } catch { /* A failed start has no playback to stop. */ } source.disconnect(); }
    current.sources.clear(); current.nextPlay = 0;
  }
  function dispose(current: Resources) {
    current.cancelled = true; current.ready = false; current.controller.abort();
    clearTimeout(current.timer);
    current.stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
    if (current.capture) { current.capture.port.onmessage = null; current.capture.disconnect(); }
    current.source?.disconnect();
    clearPlayback(current);
    if (current.socket) {
      current.socket.onmessage = null; current.socket.onerror = null;
      current.socket.close();
    }
    void current.context?.close().catch(() => {});
  }
  function stop(message = 'Voice stopped. Continue with your text interview.', failure = '') {
    const current = resources.current;
    resources.current = null;
    if (current) dispose(current);
    transcriptRole.current = null;
    setState('idle'); setMuted(false); setStatus(message); setError(failure);
  }
  useEffect(() => () => {
    const current = resources.current;
    resources.current = null;
    if (current) dispose(current);
  }, []);
  useEffect(() => {
    if (resources.current) stop('Voice stopped because your question style or workspace changed. Your text is unchanged.');
  }, [questionStyle, available]);
  useEffect(() => {
    function leave() { if (resources.current) stop('Voice stopped while Access was in the background.'); }
    function visibility() { if (document.hidden) leave(); }
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', leave);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', leave); };
  }, []);

  function append(role: Transcript['role'], text: string) {
    const continuing = transcriptRole.current === role;
    transcriptRole.current = role;
    setTranscript((previous) => {
      const next = [...previous];
      if (continuing && next.at(-1)?.role === role) {
        next[next.length - 1] = { role, text: (next.at(-1)!.text + text).slice(0, 4000) };
      } else next.push({ role, text: text.slice(0, 4000) });
      return next.slice(-40);
    });
  }
  async function start() {
    if (resources.current || !available || !questionStyle) return;
    setError(''); setMuted(false); setTranscript([]); transcriptRole.current = null;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
      setError('Live voice needs a browser with microphone and audio support on HTTPS or localhost. Continue by text.');
      return;
    }
    const current: Resources = { cancelled: false, ready: false, muted: false, controller: new AbortController(), sources: new Set(), nextPlay: 0 };
    resources.current = current;
    const valid = () => resources.current === current && !current.cancelled;
    const fail = () => { if (valid()) stop('Voice is off.', 'Voice disconnected. Retry voice or continue by text. Your text and profile are unchanged.'); };
    setState('connecting'); setStatus('Waiting for microphone permission.');
    try {
      // Create/resume audio during the button gesture, including on Safari.
      current.context = new AudioContext({ sampleRate: 24_000 });
      await current.context.resume();
      if (!valid()) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
      if (!valid()) { stream.getTracks().forEach((track) => track.stop()); return; }
      current.stream = stream;
      stream.getAudioTracks().forEach((track) => { track.onended = fail; });
      setStatus('Connecting to Gemini Live.');
      current.timer = setTimeout(fail, 20_000);
      await current.context.audioWorklet.addModule('/live-pcm-worklet.js');
      if (!valid()) return;
      const response = await fetch('/api/live-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionStyle }), signal: current.controller.signal });
      const body = await response.json();
      if (!valid()) return;
      if (!response.ok) throw new Error(typeof body.error?.message === 'string' ? body.error.message : 'Voice is unavailable. Continue by text.');
      if (typeof body.token !== 'string' || !body.token.startsWith('auth_tokens/') || typeof body.model !== 'string' || !Number.isFinite(Date.parse(body.expiresAt))) throw new Error('Voice credentials were unusable. Continue by text.');
      const receive = (message: LiveServerMessage) => {
        if (!valid()) return;
        try {
          if (message.goAway) { stop('Voice session ended. Start voice again or continue by text.'); return; }
          if (message.setupComplete) {
            current.ready = true;
            clearTimeout(current.timer);
            current.timer = setTimeout(() => { if (valid()) stop('Five-minute voice session ended. Continue by text or start a new voice session.'); }, Math.min(5 * 60_000, Math.max(0, Date.parse(body.expiresAt) - Date.now())));
            setState('live'); setStatus('Connected. Microphone on — you can speak or interrupt.');
          }
          const content = message.serverContent;
          if (!content) return;
          if (content.interrupted) { clearPlayback(current); transcriptRole.current = null; setStatus('Interrupted. Listening to you.'); }
          if (content.inputTranscription?.text) append('You', content.inputTranscription.text);
          if (content.outputTranscription?.text) append('Access · Gemini Live', content.outputTranscription.text);
          for (const part of content.modelTurn?.parts ?? []) {
            const audio = part.inlineData;
            if (!audio?.data || !audio.mimeType?.startsWith('audio/pcm')) continue;
            const context = current.context!;
            const samples = decodePcm(audio.data);
            const rate = Number(/rate=(\d+)/.exec(audio.mimeType)?.[1] ?? 24_000);
            if (rate < 8000 || rate > 96000 || samples.length > rate * 10 || current.nextPlay - context.currentTime > 20) throw new Error('Invalid audio');
            const buffer = context.createBuffer(1, samples.length, rate);
            buffer.copyToChannel(samples, 0);
            const source = context.createBufferSource();
            source.buffer = buffer; source.connect(context.destination);
            current.sources.add(source);
            source.onended = () => { current.sources.delete(source); source.disconnect(); if (valid() && !current.sources.size) setStatus(current.muted ? 'Connected. Microphone muted.' : 'Connected. Listening to you.'); };
            const when = Math.max(context.currentTime, current.nextPlay);
            source.start(when); current.nextPlay = when + buffer.duration;
            setStatus('Gemini is speaking. You can interrupt or stop.');
          }
          if (content.turnComplete) transcriptRole.current = null;
        } catch { fail(); }
      };
      // Native WebSocket lets Stop also close a socket still awaiting setup.
      // The installed SDK's connect() exposes its Session only after setup completes.
      const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(body.token)}`);
      current.socket = socket;
      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => {
          if (!valid()) { socket.close(); reject(new Error('Voice stopped.')); return; }
          socket.send(JSON.stringify({ setup: { model: body.model.startsWith('models/') ? body.model : `models/${body.model}` } }));
        };
        socket.onmessage = async (event) => {
          if (!valid()) return;
          try {
            const message = JSON.parse(event.data instanceof Blob ? await event.data.text() : event.data) as LiveServerMessage;
            if (!valid()) return;
            receive(message);
            if (message.setupComplete) resolve();
          } catch { reject(new Error('Voice returned an unusable response. Continue by text.')); fail(); }
        };
        socket.onerror = () => { reject(new Error('Voice could not connect. Retry voice or continue by text.')); fail(); };
        socket.onclose = () => {
          reject(new Error('Voice connection ended. Retry voice or continue by text.'));
          if (valid()) stop('Voice connection ended. Retry voice or continue by text.');
        };
      });
      if (!valid()) { socket.close(); return; }
      const send = (content: unknown) => {
        if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount > 256_000) throw new Error('Voice disconnected');
        socket.send(JSON.stringify(content));
      };
      const session = {
        sendRealtimeInput: (input: unknown) => send({ realtimeInput: input }),
        sendClientContent: (input: unknown) => send({ clientContent: input }),
      };
      current.session = session;
      current.source = current.context.createMediaStreamSource(stream);
      current.capture = new AudioWorkletNode(current.context, 'access-microphone');
      current.capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (!valid() || !current.ready || current.muted) return;
        try { session.sendRealtimeInput({ audio: { data: encodePcm(event.data), mimeType: `audio/pcm;rate=${current.context!.sampleRate}` } }); } catch { fail(); }
      };
      current.source.connect(current.capture);
      // The worklet outputs silence; connecting keeps capture running without mic feedback.
      current.capture.connect(current.context.destination);
      session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'Start optional career voice practice with one question.' }] }], turnComplete: true });
    } catch (failure) {
      if (!valid()) return;
      const denied = failure instanceof DOMException && ['NotAllowedError', 'PermissionDeniedError'].includes(failure.name);
      stop('Voice is off.', denied ? 'Microphone permission was not granted. You can retry or complete everything by text.' : failure instanceof Error && !(failure instanceof DOMException) ? failure.message : 'Microphone or audio is unavailable. Retry voice or continue by text.');
    }
  }
  function toggleMute() {
    const current = resources.current;
    if (!current?.session || !current.ready) return;
    current.muted = !current.muted;
    current.stream?.getAudioTracks().forEach((track) => { track.enabled = !current.muted; });
    setMuted(current.muted);
    setStatus(current.muted ? 'Connected. Microphone muted.' : 'Connected. Microphone on.');
    try { if (current.muted) current.session.sendRealtimeInput({ audioStreamEnd: true }); } catch { stop('Voice is off.', 'Voice disconnected. Continue by text or retry.'); }
  }
  function command(text: string) {
    try { resources.current?.session?.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch { stop('Voice is off.', 'Voice disconnected. Continue by text or retry.'); }
  }

  return <section className="live-voice" aria-labelledby="live-heading">
    <h3 id="live-heading"><button type="button" className="text-button" aria-expanded={open} aria-controls="live-controls" onClick={() => { if (open) stop(); setOpen(!open); }}>Optional voice practice</button></h3>
    {open && <div id="live-controls">
      <p>Talk with Gemini Live and hear its replies. Starting requests microphone permission and sends audio directly to Google Gemini. Access does not record audio or save this transcript. Voice practice is separate from your text interview and career canvas.</p>
      <p role="status">{status}</p>
      {error && <p role="alert">{error}</p>}
      <div className="live-actions">
        <button ref={startButton} type="button" className="button button-dark" disabled={active || !available || !questionStyle} onClick={() => void start()}>Start voice &amp; allow microphone</button>
        <button type="button" className="text-button" disabled={state !== 'live'} aria-pressed={muted} onClick={toggleMute}>{muted ? 'Unmute microphone' : 'Mute microphone'}</button>
        <button type="button" className="text-button" disabled={!active} onClick={() => { stop(); startButton.current?.focus(); }}>Stop voice</button>
      </div>
      {state === 'live' && <div className="live-actions"><button type="button" className="text-button" onClick={() => command('Skip this voice question and ask about a different work-related topic.')}>Skip voice question</button><button type="button" className="text-button" onClick={() => command('Please clarify the current voice question, then restate it. This is not a career answer.')}>Clarify voice question</button></div>}
      {transcript.length > 0 && <div className="live-transcript" role="region" tabIndex={0} aria-label="Voice practice transcript"><p>Automatic transcript — check for mistakes before using an answer.</p>{transcript.map((line, index) => <div key={index}><strong>{line.role}</strong><p>{line.text}</p>{line.role === 'You' && <button type="button" className="text-button" onClick={() => { stop(); onUseText(line.text); }}>Review this answer in text</button>}</div>)}</div>}
      <p>You can stop and use the text controls below at any time. Voice answers are never added to your profile automatically.</p>
    </div>}
  </section>;
}
