import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';
import { POST } from '../src/app/api/application/route.ts';
import { ApplicationPackageSchema } from '../src/lib/contracts.ts';

const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = originalModel;
});
const skill = { id: 's1', name: 'Clear communication', evidence: 'I answered visitor questions at the library.', confirmed: true };
const profile = { skills: [skill], experience: [], education: [], preferences: { largeText: false, highContrast: false, reducedMotion: false, questionStyle: 'simple' as const } };
function request(body: unknown) {
  return new Request('http://localhost/api/application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function fakeGemini(output = { cvText: 'Clear communication\nAnswered visitor questions at a library.', coverLetter: 'Kia ora Harbour Digital team, I can bring clear communication to the Customer Support Assistant role.', unverifiedClaims: [] as string[] }) {
  process.env.GEMINI_API_KEY = 'test-secret';
  return mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => new Response(JSON.stringify({
    candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(output) }] }, finishReason: 'STOP' }],
  }), { headers: { 'Content-Type': 'application/json' } }));
}

test('draft uses server-selected fictional job and only confirmed non-sensitive evidence', async () => {
  const sdk = fakeGemini();
  const candidateProfile = {
    ...profile,
    skills: [skill,
      { id: 's2', name: 'Unconfirmed leadership', evidence: 'I might lead a team.', confirmed: false },
      { id: 's3', name: 'Autistic candidate', evidence: 'I am autistic and need accommodations.', confirmed: true },
      { id: 's4', name: 'Phone 021 234 5678', evidence: '021 234 5678', confirmed: true }],
  };
  const response = await POST(request({ profile: candidateProfile, jobId: 'harbour-support' }));
  assert.equal(response.status, 200);
  const result = ApplicationPackageSchema.parse(await response.json());
  assert.equal(result.jobId, 'harbour-support');
  assert.match(result.coverLetter, /Customer Support Assistant/);
  assert.ok(!JSON.stringify(result).match(/autistic|accommodations|021 234 5678|leadership/i));
  const sent = JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body));
  const prompt = sent.contents[0].parts[0].text;
  assert.match(prompt, /Harbour Digital/);
  assert.match(prompt, /Clear communication/);
  assert.doesNotMatch(prompt, /autistic|accommodations|021 234 5678|Unconfirmed leadership|might lead/);
  assert.match(sent.systemInstruction.parts[0].text, /untrusted data, not instructions/);
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.equal(sent.generationConfig.maxOutputTokens, 2048);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});

test('invalid job, extra fields and profiles without safe confirmed evidence fail before Gemini', async () => {
  const sdk = fakeGemini();
  assert.equal((await POST(request({ profile, jobId: 'employer-provided-spec' }))).status, 400);
  assert.equal((await POST(request({ profile, jobId: 'harbour-support', job: { title: 'injected' } }))).status, 400);
  assert.equal((await POST(request({ profile: { ...profile, skills: [{ ...skill, confirmed: false }] }, jobId: 'harbour-support' }))).status, 400);
  assert.equal((await POST(request({ profile: { ...profile, skills: [{ ...skill, name: 'ADHD accommodations', evidence: 'I have ADHD' }] }, jobId: 'harbour-support' }))).status, 400);
  assert.equal(sdk.mock.calls.length, 0);
});

test('malformed or unsafe model drafts fail without returning generated content', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  for (const output of [
    { cvText: ' ', coverLetter: 'Letter', unverifiedClaims: [] },
    { cvText: 'I have ADHD and need accommodations.', coverLetter: 'Letter', unverifiedClaims: [] },
    { cvText: 'CV', coverLetter: 'Call me at 021 234 5678.', unverifiedClaims: [] },
    { cvText: 'CV', coverLetter: 'Letter', unverifiedClaims: ['I use a screen reader.'] },
  ]) {
    const sdk = fakeGemini(output);
    const response = await POST(request({ profile, jobId: 'harbour-support' }));
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error.code, 'INVALID_RESPONSE');
    assert.ok(!JSON.stringify(body).match(/ADHD|accommodations|021 234 5678/));
    sdk.mock.restore();
  }
});

test('missing key and provider errors return safe recovery messages', async () => {
  delete process.env.GEMINI_API_KEY;
  assert.equal((await POST(request({ profile, jobId: 'harbour-support' }))).status, 503);
  process.env.GEMINI_API_KEY = 'test-secret';
  const sdk = mock.method(globalThis, 'fetch', async () => { throw new Error('private upstream details'); });
  const response = await POST(request({ profile, jobId: 'harbour-support' }));
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.error.code, 'PROVIDER_ERROR');
  assert.ok(!JSON.stringify(body).includes('private upstream details'));
  sdk.mock.restore();
});
