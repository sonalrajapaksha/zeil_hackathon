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
  return mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    const shape = body.generationConfig.responseJsonSchema.properties;
    const input = JSON.parse(body.contents[0].parts[0].text);
    const result = shape.findings
      ? { findings: input.map((item: { index: number; text: string; evidence: string[] }) => ({ index: item.index, sensitive: /treatment|condition/i.test(`${item.text} ${item.evidence.join(' ')}`) })) }
      : shape.sensitive ? { sensitive: /condition|treatment|access need/i.test(JSON.stringify(input)) } : output;
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(result) }] }, finishReason: 'STOP' }] }), { headers: { 'Content-Type': 'application/json' } });
  });
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
  assert.equal(sdk.mock.calls.length, 3, 'Profile and completed draft receive separate semantic screens around generation.');
  const sent = JSON.parse(String(sdk.mock.calls[1].arguments[1]!.body));
  const prompt = sent.contents[0].parts[0].text;
  assert.match(prompt, /Harbour Digital/);
  assert.match(prompt, /Clear communication/);
  assert.doesNotMatch(prompt, /autistic|accommodations|021 234 5678|Unconfirmed leadership|might lead/);
  assert.match(sent.systemInstruction.parts[0].text, /untrusted data, not instructions/);
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.equal(sent.generationConfig.maxOutputTokens, 2048);
  assert.match(JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body)).systemInstruction.parts[0].text, /reasonably implies disability/);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});

test('semantic profile screen removes indirect medical disclosures before drafting', async () => {
  const sdk = fakeGemini();
  const privateClaim = { id: 's2', name: 'I need schedule changes because of a condition', evidence: 'My condition makes commuting difficult.', confirmed: true };
  const response = await POST(request({ profile: { ...profile, skills: [skill, privateClaim] }, jobId: 'harbour-support' }));
  assert.equal(response.status, 200);
  assert.equal(sdk.mock.calls.length, 3);
  const generation = JSON.parse(String(sdk.mock.calls[1].arguments[1]!.body));
  assert.doesNotMatch(generation.contents[0].parts[0].text, /condition|commuting difficult/i);
});

test('incomplete semantic screen fails closed before application generation', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  const sdk = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ findings: [] }) }] }, finishReason: 'STOP' }] })));
  const response = await POST(request({ profile, jobId: 'harbour-support' }));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
  assert.equal(sdk.mock.calls.length, 1, 'Draft generation must not run without a complete safety result.');
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
    { cvText: 'I need a schedule change because of my condition.', coverLetter: 'Letter', unverifiedClaims: [] },
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
  const deadline = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 504, message: 'Deadline expired before operation could complete.' } }), { status: 504 }));
  const timedOut = await POST(request({ profile, jobId: 'harbour-support' }));
  assert.equal(timedOut.status, 504);
  assert.equal((await timedOut.json()).error.code, 'TIMEOUT');
  deadline.mock.restore();
});
