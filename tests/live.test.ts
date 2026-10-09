import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { POST } from '../src/app/api/live-token/route.ts';
import { decodePcm, encodePcm } from '../src/lib/live-audio.ts';

const original = { key: process.env.GEMINI_API_KEY, enabled: process.env.GEMINI_LIVE_ENABLED, model: process.env.GEMINI_LIVE_MODEL };
afterEach(() => {
  mock.restoreAll();
  for (const [name, value] of Object.entries({ GEMINI_API_KEY: original.key, GEMINI_LIVE_ENABLED: original.enabled, GEMINI_LIVE_MODEL: original.model })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});
function request(body: unknown = { questionStyle: 'simple' }, origin = 'http://localhost') {
  return new Request('http://localhost/api/live-token', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
}
function enabled() { process.env.GEMINI_LIVE_ENABLED = 'true'; process.env.GEMINI_API_KEY = 'long-lived-test-secret'; }

test('Live is opt-in, same-origin and validates a bounded strict question style', async () => {
  delete process.env.GEMINI_LIVE_ENABLED;
  assert.equal((await POST(request())).status, 503);
  enabled();
  const provider = mock.method(globalThis, 'fetch', async () => { throw new Error('must not call'); });
  assert.equal((await POST(request({}, 'https://other.example'))).status, 403);
  assert.equal((await POST(request({}, ''))).status, 403);
  for (const body of [{}, { questionStyle: 'unknown' }, { questionStyle: 'simple', key: 'secret' }, { questionStyle: 'x'.repeat(1025) }]) assert.equal((await POST(request(body))).status, 400);
  delete process.env.GEMINI_API_KEY;
  assert.equal((await POST(request())).status, 503);
  assert.equal(provider.mock.calls.length, 0);
});

test('server mints a single-use five-minute token locked to safe Live configuration', async () => {
  enabled(); delete process.env.GEMINI_LIVE_MODEL;
  const provider = mock.method(globalThis, 'fetch', async () => Response.json({ name: 'auth_tokens/test-only' }));
  const before = Date.now();
  const response = await POST(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(body.token, 'auth_tokens/test-only');
  assert.equal(body.model, 'gemini-3.8-live');
  assert.ok(!JSON.stringify(body).includes('long-lived-test-secret'));
  const [url, init] = provider.mock.calls[0].arguments as unknown as [string, RequestInit];
  assert.match(String(url), /v1alpha\/auth_tokens/);
  const sent = JSON.parse(String(init.body));
  assert.equal(sent.uses, 1);
  assert.ok(Date.parse(sent.expireTime) - before <= 301000);
  assert.ok(Date.parse(sent.newSessionExpireTime) - before <= 61000);
  const config = sent.bidiGenerateContentSetup;
  assert.match(config.model, /gemini-3.8-live/);
  assert.deepEqual(config.generationConfig.responseModalities, ['AUDIO']);
  assert.equal(config.generationConfig.maxOutputTokens, 512);
  assert.deepEqual(config.inputAudioTranscription, {});
  assert.deepEqual(config.outputAudioTranscription, {});
  assert.match(JSON.stringify(config.systemInstruction), /familiar words/);
  assert.match(JSON.stringify(config.systemInstruction), /Never ask for or infer disability/);
  assert.ok(init.signal);
});

test('provider errors and malformed credentials fail safely without leaking secrets', async () => {
  enabled();
  for (const [payload, status, expected] of [[{ error: { message: 'long-lived-test-secret', code: 429 } }, 429, 429], [{ error: { message: 'long-lived-test-secret', code: 401 } }, 401, 502], [{ name: 'bad-token' }, 200, 502]] as const) {
    mock.method(globalThis, 'fetch', async () => Response.json(payload, { status }));
    const response = await POST(request());
    assert.equal(response.status, expected);
    assert.ok(!JSON.stringify(await response.json()).includes('long-lived-test-secret'));
    mock.restoreAll();
  }
});

test('PCM encoding clamps amplitudes and decodes little-endian samples for playback', () => {
  const encoded = encodePcm(new Float32Array([-2, -0.5, 0, 0.5, 2]));
  const decoded = decodePcm(encoded);
  assert.deepEqual([...decoded].map((sample) => Math.round(sample * 32768)), [-32768, -16384, 0, 16384, 32767]);
  assert.throws(() => decodePcm(btoa('a')));
  assert.throws(() => decodePcm(''));
});
