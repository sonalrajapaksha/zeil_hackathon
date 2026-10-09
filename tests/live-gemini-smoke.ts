// Real provider connection/audio-output smoke. This is NOT unscripted spoken proof.
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/live-token/route.ts';
process.env.GEMINI_LIVE_ENABLED = 'true';
const response = await POST(new Request('http://localhost/api/live-token', { method: 'POST', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' }, body: JSON.stringify({ questionStyle: 'simple' }) }));
assert.equal(response.status, 200, `Live token failed: ${response.status} ${response.ok ? '' : JSON.stringify(await response.json())}`);
const { token, model } = await response.json();
const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`);
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Live output timed out')), 30000);
    socket.onopen = () => socket.send(JSON.stringify({ setup: { model: model.startsWith('models/') ? model : `models/${model}` } }));
    socket.onerror = () => { clearTimeout(timer); reject(new Error('Live WebSocket failed')); };
    socket.onclose = (event) => { clearTimeout(timer); reject(new Error(`Live closed with code ${event.code}`)); };
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data instanceof Blob ? await event.data.text() : String(event.data));
      if (message.setupComplete) socket.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: 'Start career voice practice with one simple work-related question.' }] }], turnComplete: true } }));
      if (message.serverContent?.modelTurn?.parts?.some((part: { inlineData?: { mimeType?: string; data?: string } }) => part.inlineData?.mimeType?.startsWith('audio/pcm') && part.inlineData.data)) {
        clearTimeout(timer); resolve();
      }
    };
  });
  console.log('Real Gemini Live: single-use token + WebSocket setup + native PCM response PASS. No microphone, human turn-taking or video verified.');
} finally { socket.onclose = null; socket.close(); }
