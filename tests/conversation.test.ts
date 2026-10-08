import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';
import { POST } from '../src/app/api/conversation/route.ts';
import { CLARIFICATION_REQUEST, ConversationRequestSchema, ConversationResponseSchema, INTERVIEW_LIMIT } from '../src/lib/contracts.ts';
import { prepareTurn } from '../src/lib/interview.ts';

const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = originalModel;
});
const question = { id: 'q1', role: 'assistant', content: 'What experience would you like to share?' };
const answer = { id: 'a1', role: 'user', content: 'I volunteer at a library.' };
function request(body: unknown) {
  return new Request('http://localhost/api/conversation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function sentThinking(init: RequestInit | undefined) {
  return JSON.parse(String(init?.body)).generationConfig.thinkingConfig;
}
function fakeGemini(reply = 'What did you enjoy about helping library visitors?', suggestions: { kind: 'skill' | 'experience' | 'education'; text: string; evidence: string }[] = []) {
  process.env.GEMINI_API_KEY = 'test-secret';
  return mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => new Response(JSON.stringify({
    candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ reply, suggestions }) }] }, finishReason: 'STOP' }],
  }), { headers: { 'Content-Type': 'application/json' } }));
}

test('start returns typed initial question and bounded SDK configuration', async () => {
  delete process.env.GEMINI_MODEL;
  const sdk = fakeGemini('What is one experience you would like to tell me about?');
  const response = await POST(request({ action: 'start', history: [], questionStyle: 'standard' }));
  assert.equal(response.status, 200);
  const result = ConversationResponseSchema.parse(await response.json());
  assert.equal(result.history.length, 1);
  assert.equal(result.interview.questions, 1);
  assert.deepEqual(result.suggestions, []);
  const [url, init] = sdk.mock.calls[0].arguments;
  assert.match(String(url), /gemini-3.6-flash/);
  assert.deepEqual(sentThinking(init), { thinkingLevel: 'LOW' });
  const sent = JSON.parse(String(init!.body));
  assert.equal(sent.generationConfig.responseMimeType, 'application/json');
  assert.equal(sent.generationConfig.maxOutputTokens, 1024);
  assert.match(sent.systemInstruction.parts[0].text, /Question style: standard/);
  assert.ok(init!.signal);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});

test('follow-up sends actual context and retains history in order', async () => {
  process.env.GEMINI_MODEL = 'another-enabled-model';
  const sdk = fakeGemini();
  const body = { action: 'answer', history: [question], answer: answer.content, questionStyle: 'simple' };
  const snapshot = JSON.stringify(body);
  const response = await POST(request(body));
  const result = ConversationResponseSchema.parse(await response.json());
  assert.deepEqual(result.history[0], question);
  assert.equal(result.history[1].content, answer.content);
  assert.match(result.reply, /library/);
  assert.equal(result.interview.answered, 1);
  assert.equal(JSON.stringify(body), snapshot);
  const sent = JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body));
  assert.deepEqual(sent.contents.map((item: {role:string}) => item.role), ['model', 'user']);
  assert.equal(sent.contents[1].parts[0].text, answer.content);
  assert.match(sent.systemInstruction.parts[0].text, /Question style: simple/);
  assert.equal(sentThinking(sdk.mock.calls[0].arguments[1]), undefined);
});

test('profile suggestions carry exact answer evidence and unsupported evidence fails safely', async () => {
  fakeGemini('What did you learn from volunteering?', [{ kind: 'skill', text: 'Library volunteering', evidence: 'volunteer at a library' }]);
  const body = { action: 'answer', history: [question], answer: answer.content, questionStyle: 'standard' };
  const accepted = ConversationResponseSchema.parse(await (await POST(request(body))).json());
  assert.deepEqual(accepted.suggestions, [{ kind: 'skill', text: 'Library volunteering', evidence: 'volunteer at a library' }]);

  mock.restoreAll();
  process.env.GEMINI_API_KEY = 'test-secret';
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply: 'What did you learn?', suggestions: [{ kind: 'skill', text: 'Leadership', evidence: 'managed a team' }] }) }] }, finishReason: 'STOP' }] })));
  const rejected = await POST(request(body));
  assert.equal(rejected.status, 502);
  assert.equal((await rejected.json()).error.code, 'INVALID_RESPONSE');
});

test('Gemini-selected profile tool validates, deduplicates, dispatches pending evidence and returns strict JSON', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  let step = 0;
  const sdk = mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    step++;
    if (step === 1) return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ functionCall: {
      name: 'propose_profile_updates', id: 'call-1', args: { items: [
        { kind: 'experience', text: 'Library volunteering', evidence: 'volunteer at a library' },
        { kind: 'experience', text: 'Library volunteering!', evidence: 'volunteer at a library' },
      ] },
    } }] }, finishReason: 'STOP' }] }), { headers: { 'Content-Type': 'application/json' } });
    assert.equal(body.contents.at(-1).parts[0].functionResponse.name, 'propose_profile_updates');
    assert.equal(body.contents.at(-1).parts[0].functionResponse.response.items.length, 1);
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ reply: 'What did you enjoy about helping library visitors?', suggestions: [] }) }] }, finishReason: 'STOP' }] }), { headers: { 'Content-Type': 'application/json' } });
  });
  const result = ConversationResponseSchema.parse(await (await POST(request({ action: 'answer', history: [question], answer: answer.content, questionStyle: 'simple' }))).json());
  assert.equal(step, 2);
  assert.deepEqual(result.suggestions, [{ kind: 'experience', text: 'Library volunteering', evidence: 'volunteer at a library' }]);
  assert.deepEqual(result.toolTrace, { selected: true, functionName: 'propose_profile_updates', arguments: result.suggestions, dispatched: true, outcome: 'pending_for_review' });
  assert.ok(!JSON.stringify(result).includes('test-secret'));
  const selection = JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body));
  assert.equal(selection.toolConfig.functionCallingConfig.mode, 'AUTO');
  assert.equal(selection.tools[0].functionDeclarations[0].name, 'propose_profile_updates');
  const finalShape = JSON.parse(String(sdk.mock.calls[1].arguments[1]!.body)).generationConfig;
  assert.equal(finalShape.responseMimeType, 'application/json');
  assert.ok(finalShape.responseJsonSchema);
});

test('malformed or unsupported tool arguments fail closed; a model no-tool choice remains supported', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  for (const call of [
    { name: 'propose_profile_updates', args: { items: [{ kind: 'skill', text: 'Leadership', evidence: 'not in this answer' }] } },
    { name: 'propose_profile_updates', args: { items: [{ kind: 'skill', text: 'Leadership', evidence: 'volunteer at a library', confirmed: true }] } },
    { name: 'unknown_tool', args: {} },
  ]) {
    const bad = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ functionCall: call }] }, finishReason: 'STOP' }] })));
    const response = await POST(request({ action: 'answer', history: [question], answer: answer.content, questionStyle: 'standard' }));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    bad.mock.restore();
  }
  let step = 0;
  const noTool = mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    step++;
    const body = JSON.parse(String(init.body));
    if (step === 1) {
      assert.equal(body.toolConfig.functionCallingConfig.mode, 'AUTO');
      return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: 'No new work-related claim is clear.' }] }, finishReason: 'STOP' }] }));
    }
    assert.ok(body.generationConfig.responseJsonSchema);
    assert.equal(body.contents.at(-2).role, 'model');
    assert.equal(body.contents.at(-1).role, 'user');
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify({ reply: 'What did you learn from volunteering?', suggestions: [] }) }] }, finishReason: 'STOP' }] }));
  });
  const result = ConversationResponseSchema.parse(await (await POST(request({ action: 'answer', history: [question], answer: 'I enjoyed my Saturday.', questionStyle: 'standard' }))).json());
  assert.equal(step, 2);
  assert.deepEqual(result.suggestions, []);
  assert.deepEqual(result.toolTrace, { selected: false, functionName: null, arguments: [], dispatched: false, outcome: 'no_tool_selected' });
  noTool.mock.restore();
});

test('skip is explicit; correction removes stale answers without mutating original history', async () => {
  fakeGemini();
  const skip = ConversationResponseSchema.parse(await (await POST(request({ action: 'skip', history: [question], questionStyle: 'standard' }))).json());
  assert.equal(skip.interview.answered, 0);
  assert.equal(skip.history[1].content, '[Question skipped by candidate]');
  const history = [question, answer, { ...question, id: 'q2', content: 'What did you do there?' }, { ...answer, id: 'a2', content: 'I helped visitors.' }, { ...question, id: 'q3', content: 'What did you learn?' }];
  const corrected = prepareTurn(ConversationRequestSchema.parse({ action: 'correct', history, messageId: 'a1', answer: 'I volunteer at a food bank.', questionStyle: 'standard' }));
  assert.equal(corrected.length, 2);
  assert.equal(corrected[1].content, 'I volunteer at a food bank.');
  assert.equal(history.length, 5);
  assert.equal(history[1].content, answer.content);
});

test('clarification repeats the pending question without counting an answer or extracting claims', async () => {
  const sdk = fakeGemini(question.content, [{ kind: 'skill', text: 'Fabricated skill', evidence: 'What experience' }]);
  const response = await POST(request({ action: 'clarify', history: [question], questionStyle: 'simple' }));
  assert.equal(response.status, 200);
  const result = ConversationResponseSchema.parse(await response.json());
  assert.deepEqual(result.suggestions, []);
  assert.equal(result.interview.questions, 1);
  assert.equal(result.interview.answered, 0);
  assert.equal(result.history[1].content, CLARIFICATION_REQUEST);
  assert.equal(result.history[2].content, question.content);
  const sent = JSON.parse(String(sdk.mock.calls[0].arguments[1]!.body));
  assert.match(sent.contents[1].parts[0].text, /requests clarification/);
  assert.match(sent.systemInstruction.parts[0].text, /dedicated clarification request/);
  assert.equal((await POST(request({ action: 'clarify', history: result.history, questionStyle: 'simple' }))).status, 400, 'Only one clarification is allowed for each pending question.');
});

test('end works without credentials; final turn ends at the deterministic limit', async () => {
  delete process.env.GEMINI_API_KEY;
  const ended = ConversationResponseSchema.parse(await (await POST(request({ action: 'end', history: [question, answer], questionStyle: 'standard' }))).json());
  assert.equal(ended.interview.status, 'ended');
  assert.deepEqual(ended.history, [question, answer]);
  const history = Array.from({ length: INTERVIEW_LIMIT * 2 - 1 }, (_, index) => ({ id: `m${index}`, role: index % 2 ? 'user' : 'assistant', content: index % 2 ? 'An answer.' : `Question ${index}?` }));
  const last = ConversationResponseSchema.parse(await (await POST(request({ action: 'answer', history, answer: 'Final answer.', questionStyle: 'standard' }))).json());
  assert.equal(last.interview.status, 'ended');
  assert.equal(last.interview.questions, INTERVIEW_LIMIT);
  assert.equal(last.history.length, INTERVIEW_LIMIT * 2);
});

test('invalid requests, oversized bodies and malformed JSON are rejected before Gemini', async () => {
  const sdk = fakeGemini();
  for (const body of [
    {}, { action: 'answer', history: [question], answer: ' ', questionStyle: 'standard' },
    { action: 'start', history: [question], questionStyle: 'standard' }, { action: 'answer', history: [answer], answer: 'hello', questionStyle: 'standard' },
    { action: 'correct', history: [question, answer], messageId: 'q1', answer: 'hello', questionStyle: 'standard' },
    { action: 'answer', history: [question], answer: 'a'.repeat(4001), questionStyle: 'standard' },
    { action: 'start', history: [], questionStyle: 'standard', key: 'never-accept-client-keys' },
    { action: 'end', history: [question, answer, question], questionStyle: 'standard' },
    { action: 'start', history: [], questionStyle: 'standard', padding: 'a'.repeat(64_001) },
  ]) assert.equal((await POST(request(body))).status, 400);
  assert.equal((await POST(new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal(sdk.mock.calls.length, 0);
});

test('missing key produces helpful error without revealing secrets', async () => {
  delete process.env.GEMINI_API_KEY;
  const response = await POST(request({ action: 'start', history: [], questionStyle: 'standard' }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'NOT_CONFIGURED');
});

test('malformed, blank, multiple and repeated model questions fail safely', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  for (const text of ['not json', JSON.stringify({ reply: '' }), JSON.stringify({ reply: 'Two questions? Really?' }), JSON.stringify({ reply: question.content })]) {
    const sdk = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] })));
    const response = await POST(request({ action: 'answer', history: [question], answer: answer.content, questionStyle: 'standard' }));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error.code, 'INVALID_RESPONSE');
    sdk.mock.restore();
  }
});

test('provider errors, refusal and timeout preserve request; exact retry works', async () => {
  process.env.GEMINI_API_KEY = 'test-secret';
  const body = { action: 'answer', history: [question], answer: answer.content, questionStyle: 'standard' };
  const original = JSON.stringify(body);
  for (const [failure, status, code] of [
    [new Error('secret upstream details'), 502, 'PROVIDER_ERROR'],
    [new DOMException('deadline', 'TimeoutError'), 504, 'TIMEOUT'],
  ] as const) {
    const sdk = mock.method(globalThis, 'fetch', async () => { throw failure; });
    const response = await POST(request(body));
    assert.equal(response.status, status);
    const result = await response.json();
    assert.equal(result.error.code, code);
    assert.ok(!JSON.stringify(result).includes('secret upstream'));
    assert.equal(JSON.stringify(body), original);
    sdk.mock.restore();
  }
  const expired = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 504, message: 'Deadline expired before operation could complete.' } }), { status: 504 }));
  const timedOut = await POST(request(body));
  assert.equal(timedOut.status, 504);
  assert.equal((await timedOut.json()).error.code, 'TIMEOUT');
  expired.mock.restore();
  const sdk = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: { code: 429, message: 'quota', status: 'RESOURCE_EXHAUSTED' } }), { status: 429 }));
  assert.equal((await POST(request(body))).status, 429);
  assert.equal(sdk.mock.calls.length, 1, 'No hidden SDK retries');
  sdk.mock.restore();
  const refusal = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'SAFETY' }] })));
  assert.equal((await POST(request(body))).status, 502);
  refusal.mock.restore();
  fakeGemini();
  const result = ConversationResponseSchema.parse(await (await POST(request(body))).json());
  assert.equal(result.history.filter((item) => item.role === 'user').length, 1);
  assert.equal(JSON.stringify(body), original);
});
