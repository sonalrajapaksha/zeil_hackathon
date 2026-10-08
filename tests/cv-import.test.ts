import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';
import { POST } from '../src/app/api/cv-import/route.ts';

const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = originalModel;
});
const pdf = new Uint8Array([...new TextEncoder().encode('%PDF-1.4\n'), ...new TextEncoder().encode('Sample CV')]);
function request(bytes = pdf, type = 'application/pdf') {
  const form = new FormData(); form.set('file', new Blob([bytes], { type }), 'sample.pdf');
  return new Request('http://localhost/api/cv-import', { method: 'POST', body: form });
}
function gemini(output: unknown = { suggestions: [{ kind: 'experience', text: 'Helped library visitors', evidence: 'I helped library visitors find books.' }] }) {
  process.env.GEMINI_API_KEY = 'test-secret';
  return mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const result = body.generationConfig.responseJsonSchema.properties.findings
      ? { findings: JSON.parse(body.contents[0].parts[0].text).map((item: { index: number; text: string; evidence: string }) => ({ index: item.index, supported: true, sensitive: /wheelchair|condition|treatment/i.test(`${item.text} ${item.evidence}`) })) }
      : output;
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(result) }] }, finishReason: 'STOP' }] }), { headers: { 'Content-Type': 'application/json' } });
  });
}

test('sends actual PDF bytes through Gemini native inlineData and returns pending evidence proposals', async () => {
  const sdk = gemini();
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.deepEqual(result, { suggestions: [{ kind: 'experience', text: 'Helped library visitors', evidence: 'I helped library visitors find books.' }] });
  const sent = JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body));
  const parts = sent.contents[0].parts;
  assert.equal(parts[1].inlineData.mimeType, 'application/pdf');
  assert.equal(Buffer.from(parts[1].inlineData.data, 'base64').toString(), Buffer.from(pdf).toString());
  assert.match(sent.systemInstruction.parts[0].text, /untrusted data/);
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.equal(sent.generationConfig.maxOutputTokens, 1024);
  assert.equal(sdk.mock.calls.length, 2, 'Claims are checked against the PDF in a second native multimodal call.');
  const verification = JSON.parse(String(sdk.mock.calls[1].arguments[1]!.body));
  assert.equal(verification.contents[0].parts[1].inlineData.mimeType, 'application/pdf');
  assert.match(verification.systemInstruction.parts[0].text, /directly supports the claim/);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});

test('rejects wrong MIME, invalid PDF signature, oversized and missing files before Gemini', async () => {
  const sdk = gemini();
  for (const req of [request(pdf, 'text/plain'), request(new TextEncoder().encode('not a PDF')), request(new Uint8Array(5 * 1024 * 1024 + 1))]) {
    const response = await POST(req);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
  }
  const emptyForm = new FormData();
  const missing = await POST(new Request('http://localhost/api/cv-import', { method: 'POST', body: emptyForm }));
  assert.equal(missing.status, 400);
  assert.equal(sdk.mock.calls.length, 0);
});

test('sensitive and malformed suggestions fail safely or are removed', async () => {
  gemini({ suggestions: [
    { kind: 'skill', text: 'Customer support', evidence: 'I answered questions.' },
    { kind: 'experience', text: 'Uses a wheelchair', evidence: 'I use a wheelchair.' },
  ] });
  const safe = await POST(request());
  assert.deepEqual(await safe.json(), { suggestions: [{ kind: 'skill', text: 'Customer support', evidence: 'I answered questions.' }] });
  mock.restoreAll();
  gemini({ suggestions: [{ kind: 'experience', text: 'Unverified' }] });
  const invalid = await POST(request());
  assert.equal(invalid.status, 502);
  assert.equal((await invalid.json()).error.code, 'INVALID_RESPONSE');
});

test('missing key and provider failure return safe errors', async () => {
  delete process.env.GEMINI_API_KEY;
  assert.equal((await POST(request())).status, 503);
  process.env.GEMINI_API_KEY = 'test-secret';
  mock.method(globalThis, 'fetch', async () => { throw new Error('private provider detail'); });
  const response = await POST(request());
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.error.code, 'PROVIDER_ERROR');
  assert.ok(!JSON.stringify(body).includes('private provider detail'));
});
