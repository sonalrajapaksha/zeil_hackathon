"use client";

import { useEffect, useRef, useState } from 'react';
import { collectVoiceAnswer, type VoiceAnswerBuffer } from '@/lib/live-answers';
import { CvImportErrorSchema, INTERVIEW_LIMIT, ProfileProposalsResponseSchema } from '@/lib/contracts';
import type { ProfileSuggestion } from '@/lib/profile-suggestions';
import type { CandidateProfile } from '@/lib/contracts';
import type { InterviewController } from '@/lib/interview-controller';
import { encodePcm, decodePcm } from '@/lib/live-audio';
import type { LiveServerMessage } from '@google/genai';

type VoiceTurn = { id: string; answer: string; status: 'queued' | 'done' | 'error'; error?: string };
type Transcript = { role: 'You' | 'Access · Gemini Live'; text: string; finalized: boolean };
type Resources = {
  cancelled: boolean; ready: boolean; muted: boolean; controller: AbortController;
  stream?: MediaStream; context?: AudioContext; source?: MediaStreamAudioSourceNode;
  capture?: AudioWorkletNode; socket?: WebSocket; session?: { sendRealtimeInput: (input: unknown) => void; sendClientContent: (input: unknown) => void }; timer?: ReturnType<typeof setTimeout>;
  sources: Set<AudioBufferSourceNode>; nextPlay: number; answer: VoiceAnswerBuffer;
};

export function LiveVoice({ questionStyle, available, visible, profile, controller, onSessionActive, onUseText, onSuggestions }: {
  onSuggestions: (items: ProfileSuggestion[], answer: string, turnId: string) => void; questionStyle?: 'simple' | 'standard'; available: boolean; visible: boolean; profile: CandidateProfile; controller: InterviewController; onSessionActive: (active: boolean) => void; onUseText: (text: string) => void;
}) {
  const [state, setState] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [status, setStatus] = useState('Voice is off.');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<Transcript[]>([]);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [voiceTurns, setVoiceTurns] = useState<VoiceTurn[]>([]);
  const [answerNotice, setAnswerNotice] = useState('');
  const nextTurn = voiceTurns.find((turn) => turn.status === 'queued');
  const failedTurn = voiceTurns.find((turn) => turn.status === 'error');
  const queuedCount = voiceTurns.filter((turn) => turn.status === 'queued').length;
  const resources = useRef<Resources | null>(null);
  const transcriptRole = useRef<Transcript['role'] | null>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const waveform = useRef<SVGPathElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const active = state !== 'idle';

  // One bounded extraction at a time, independent of microphone/session state.
  useEffect(() => {
    if (!nextTurn) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/profile-proposals', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: nextTurn.answer }), signal: controller.signal,
        });
        const body: unknown = await response.json();
        if (!response.ok) {
          const failure = CvImportErrorSchema.safeParse(body);
          throw new Error(failure.success ? failure.data.error.message : 'Voice suggestions are unavailable. Retry suggestions or use text.');
        }
        const { suggestions } = ProfileProposalsResponseSchema.parse(body);
        if (cancelled) return;
        onSuggestions(suggestions, nextTurn.answer, nextTurn.id);
        setVoiceTurns((turns) => turns.map((turn) => turn.id === nextTurn.id ? { ...turn, answer: '', status: 'done' } : turn));
        setAnswerNotice(suggestions.length ? 'Voice suggestions are ready in your Career Canvas. Review each one before approving.' : 'Voice answer reviewed. No new career details were found.');
      } catch (failure) {
        if (cancelled) return;
        const message = controller.signal.aborted ? 'Voice suggestions took too long. Retry suggestions or use text.' : failure instanceof Error && !(failure.name === 'ZodError') ? failure.message : 'Voice suggestions could not be checked. Retry suggestions or use text.';
        setVoiceTurns((turns) => turns.map((turn) => turn.id === nextTurn.id ? { ...turn, status: 'error', error: message } : turn));
      } finally { clearTimeout(timeout); }
    })();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [nextTurn, onSuggestions]);

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
    setState('idle'); setMuted(false); setStatus(message); setError(failure); onSessionActive(false);
  }
  useEffect(() => () => {
    const current = resources.current;
    resources.current = null;
    if (current) dispose(current);
    onSessionActive(false);
  }, [onSessionActive]);
  useEffect(() => {
    if (resources.current) stop('Voice stopped because your question style or workspace changed. Your text is unchanged.');
  }, [questionStyle, available]);
  useEffect(() => {
    if (controller.completed && resources.current) stop('Your interview is complete. Review or correct your career canvas at any time.');
  }, [controller.completed]);
  useEffect(() => {
    function leave() { if (resources.current) stop('Voice stopped while Access was in the background.'); }
    function visibility() { if (document.hidden) leave(); }
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', leave);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', leave); };
  }, []);

  // A passive branch observes the microphone; it never sits in the PCM send path.
  useEffect(() => {
    const current = resources.current;
    const path = waveform.current;
    const flat = 'M0 40 L240 40';
    path?.setAttribute('d', flat);
    if (state !== 'live' || muted || !current?.source || !current.context || !path) return;
    const analyser = current.context.createAnalyser();
    analyser.fftSize = 256;
    const samples = new Float32Array(analyser.fftSize);
    const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastDraw = 0;
    current.source.connect(analyser); // No connection to speakers: no feedback.
    function draw(now: number) {
      if (resources.current !== current || current!.cancelled) return;
      if (now - lastDraw >= 50) {
        lastDraw = now;
        const reduced = systemMotion.matches || !!stage.current?.closest('.reduced-motion');
        if (reduced) path!.setAttribute('d', flat);
        else {
          analyser.getFloatTimeDomainData(samples);
          const points = Array.from({ length: 49 }, (_, index) => {
            const sample = samples[Math.min(samples.length - 1, Math.round(index * (samples.length - 1) / 48))];
            return `${index === 0 ? 'M' : 'L'}${index * 5} ${(40 - Math.max(-1, Math.min(1, sample * 5)) * 32).toFixed(2)}`;
          });
          path!.setAttribute('d', points.join(' '));
        }
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      try { current.source?.disconnect(analyser); } catch { /* Session cleanup may already have disconnected the source. */ }
      analyser.disconnect();
      path.setAttribute('d', flat);
    };
  }, [state, muted]);

  function append(role: Transcript['role'], text: string) {
    const continuing = transcriptRole.current === role;
    transcriptRole.current = role;
    setTranscript((previous) => {
      const next = [...previous];
      if (continuing && next.at(-1)?.role === role) {
        next[next.length - 1] = { role, text: (next.at(-1)!.text + text).slice(0, 4000), finalized: false };
      } else next.push({ role, text: text.slice(0, 4000), finalized: false });
      return next.slice(-40);
    });
  }
  async function start() {
    if (resources.current || !available || !questionStyle) return;
    setError(''); setMuted(false); transcriptRole.current = null;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
      setError('Live voice needs a browser with microphone and audio support on HTTPS or localhost. Continue by text.');
      return;
    }
    const current: Resources = { cancelled: false, ready: false, muted: false, controller: new AbortController(), sources: new Set(), nextPlay: 0, answer: { text: '', overflow: false, suppressed: false, interrupted: false } };
    resources.current = current;
    onSessionActive(true);
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
      const response = await fetch('/api/live-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionStyle, controller, profile }), signal: current.controller.signal });
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
          const completed = collectVoiceAnswer(current.answer, content);
          if (completed?.tooLong) setAnswerNotice('This voice answer is too long for automatic suggestions. Review a shorter version by text.');
          else if (completed?.answer) {
            const turn: VoiceTurn = { id: crypto.randomUUID(), answer: completed.answer, status: 'queued' };
            setVoiceTurns((turns) => turns.length < INTERVIEW_LIMIT ? [...turns, turn] : turns);
          }
          if (content.turnComplete) {
            transcriptRole.current = null;
            setTranscript((previous) => previous.map((line) => ({ ...line, finalized: true })));
          }
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
    const current = resources.current;
    if (current) { current.answer.text = ''; current.answer.overflow = false; current.answer.suppressed = true; }
    try { resources.current?.session?.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch { stop('Voice is off.', 'Voice disconnected. Continue by text or retry.'); }
  }

  const visualState = error ? 'error' : state === 'connecting' ? 'connecting' : state === 'idle' ? 'idle' : resources.current?.sources.size ? 'speaking' : muted ? 'muted' : status.startsWith('Interrupted.') ? 'interrupted' : 'listening';
  const currentQuestion = transcript.filter((line) => line.role === 'Access · Gemini Live').at(-1)?.text;
  if (!visible) return null;
  return <section className="live-voice" aria-labelledby="live-heading">
      <h3 id="live-heading">Speak with Access</h3>
      <p className="voice-consent">Start when you’re ready. Gemini receives your microphone audio and a short summary of profile details already in this workspace to avoid repeat questions. Completed answers may suggest more details for your review. Access does not save audio or the full transcript.</p>
      <div ref={stage} className="voice-stage" data-voice-state={visualState}>
        <div className="voice-signal" aria-hidden="true"><span /><span /><span /><svg viewBox="0 0 240 80"><path ref={waveform} d="M0 40 L240 40" /></svg></div>
        <p className="voice-state-label">{visualState === 'speaking' ? 'Access is speaking' : visualState === 'listening' ? 'Listening · microphone on' : visualState === 'interrupted' ? 'Interrupted · listening to you' : visualState === 'muted' ? 'Microphone muted' : visualState === 'connecting' ? 'Getting connected' : visualState === 'error' ? 'Let’s try again' : 'Ready when you are'}</p>
        <p className="voice-question" tabIndex={0} aria-label="Current voice turn">{currentQuestion || 'Your experiences matter. Let’s discover what they mean.'}</p>
      </div>
      <p role="status">{status}</p>
      {error && <p role="alert">{error}</p>}
      <div className="live-actions">
        <button ref={startButton} type="button" className="button button-dark" disabled={active || !available || !questionStyle} onClick={() => void start()}>Start conversation</button>
        <button type="button" className="text-button" disabled={state !== 'live'} aria-pressed={muted} onClick={toggleMute}>{muted ? 'Unmute microphone' : 'Mute microphone'}</button>
        <button type="button" className="text-button" disabled={!active} onClick={() => { stop(); startButton.current?.focus(); }}>Stop voice</button>
      </div>
      {state === 'live' && <div className="live-actions"><button type="button" className="text-button" onClick={() => command('Skip this voice question and ask about a different work-related topic.')}>Skip voice question</button><button type="button" className="text-button" onClick={() => command('Please clarify the current voice question, then restate it. This is not a career answer.')}>Clarify voice question</button></div>}
      <div className="voice-discovery">
        <p role="status">{queuedCount ? `Discovering career details from ${queuedCount} voice answer${queuedCount === 1 ? '' : 's'}… You can keep talking.` : answerNotice || 'Your completed answers will become suggestions here. You keep the final say.'}</p>
        {failedTurn && <div role="alert"><p>{failedTurn.error}</p><button type="button" className="text-button" onClick={() => setVoiceTurns((turns) => turns.map((turn) => turn.status === 'error' ? { ...turn, status: 'queued', error: undefined } : turn))}>Retry voice suggestions</button></div>}
        {voiceTurns.length >= INTERVIEW_LIMIT && <p>Automatic suggestions cover up to {INTERVIEW_LIMIT} voice answers in this workspace. You can continue sharing details by text.</p>}
      </div>
      <div className="transcript-disclosure">
        <button type="button" className="transcript-toggle" aria-expanded={transcriptExpanded} aria-controls="live-transcript" onClick={() => setTranscriptExpanded((expanded) => !expanded)}>{transcriptExpanded ? 'Collapse transcript' : `View transcript (${transcript.length} ${transcript.length === 1 ? 'turn' : 'turns'})`}</button>
        <div id="live-transcript" className="live-transcript" role="region" tabIndex={0} aria-label="Voice conversation transcript" hidden={!transcriptExpanded}>
          <p>Automatic transcript. Check for mistakes before using an answer.</p>
          {transcript.length === 0 && <p>No transcript turns yet.</p>}
          {transcript.map((line, index) => <div key={index}><strong>{line.role}</strong><span className="transcript-state">{line.finalized ? 'Final' : 'Partial'}</span><p>{line.text}</p>{line.role === 'You' && <button type="button" className="text-button" onClick={() => onUseText(line.text)}>Review this answer in text</button>}</div>)}
        </div>
      </div>
  </section>;
}
