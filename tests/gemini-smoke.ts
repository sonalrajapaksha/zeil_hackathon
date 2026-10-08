import assert from 'node:assert/strict';
import { POST } from '../src/app/api/conversation/route.ts';
import { ConversationResponseSchema } from '../src/lib/contracts.ts';

if (!process.env.GEMINI_API_KEY?.trim()) {
  console.log('SKIP: no GEMINI_API_KEY; no live API verification performed.');
  process.exit(0);
}
async function turn(body: unknown) {
  const response = await POST(new Request('http://localhost/api/conversation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  if (!response.ok) {
    const result = await response.json();
    // Print only our sanitised error, never credentials or upstream messages.
    throw new Error(`${response.status}: ${result.error.code} — ${result.error.message}`);
  }
  return ConversationResponseSchema.parse(await response.json());
}
const start = await turn({ action: 'start', history: [], questionStyle: 'simple' });
console.log(`PASS initial Gemini question: ${start.reply}`);
const clarification = await turn({ action: 'clarify', history: start.history, questionStyle: 'simple' });
assert.equal(clarification.interview.questions, start.interview.questions);
assert.equal(clarification.interview.answered, 0);
assert.deepEqual(clarification.suggestions, []);
console.log(`PASS Gemini clarification restates the pending question: ${clarification.reply}`);
const example = 'I volunteer at a community library on Saturdays. I help visitors find books and keep the children’s area organised.';
const follow = await turn({ action: 'answer', history: clarification.history, answer: example, questionStyle: 'simple' });
assert.equal(follow.history.length, 5);
assert.match(follow.reply, /librar|book|visitor|children|organi|volunteer/i);
assert.ok(follow.suggestions.every((suggestion) => example.toLocaleLowerCase().includes(suggestion.evidence.toLocaleLowerCase())));
console.log(`PASS contextual Gemini follow-up: ${follow.reply}`);
console.log(`PASS grounded profile proposals: ${JSON.stringify(follow.suggestions)}`);
assert.equal(follow.toolTrace.selected, true, 'Gemini must autonomously select the profile update function for the grounded example.');
assert.equal(follow.toolTrace.functionName, 'propose_profile_updates');
assert.equal(follow.toolTrace.dispatched, true);
assert.deepEqual(follow.toolTrace.arguments, follow.suggestions);
console.log(`PASS genuine Hands trace: model selected ${follow.toolTrace.functionName}; arguments=${JSON.stringify(follow.toolTrace.arguments)}; server dispatched; outcome=${follow.toolTrace.outcome}.`);
const noToolAnswer = await turn({ action: 'answer', history: follow.history, answer: 'I do not want to share another work example right now.', questionStyle: 'simple' });
assert.equal(noToolAnswer.toolTrace.selected, false);
assert.equal(noToolAnswer.toolTrace.dispatched, false);
console.log(`PASS genuine no-tool path: selected=${noToolAnswer.toolTrace.selected}; dispatched=${noToolAnswer.toolTrace.dispatched}; outcome=${noToolAnswer.toolTrace.outcome}.`);
const end = await turn({ action: 'end', history: follow.history, questionStyle: 'simple' });
assert.equal(end.interview.status, 'ended');
console.log('PASS real interview start → answer → contextual follow-up → end; history retained.');
