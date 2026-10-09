import assert from 'node:assert/strict';
import { POST } from '../src/app/api/profile-proposals/route.ts';
import { ProfileProposalsResponseSchema } from '../src/lib/contracts.ts';
if (!process.env.GEMINI_API_KEY?.trim()) { console.log('SKIP: no API key; no genuine voice extraction evidence.'); process.exit(0); }
for (const answer of ['I volunteer at a community library. I help visitors find books and use computers.', 'Could you explain what you mean by experience?']) {
  const response = await POST(new Request('http://localhost/api/profile-proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer }) }));
  assert.equal(response.status, 200, `Extraction failed with HTTP ${response.status}`);
  const { suggestions } = ProfileProposalsResponseSchema.parse(await response.json());
  assert.ok(suggestions.every((item) => answer.toLowerCase().includes(item.evidence.toLowerCase())));
  if (answer.startsWith('I volunteer')) assert.ok(suggestions.length > 0); else assert.equal(suggestions.length, 0);
  console.log(`Genuine Gemini voice-profile extraction: ${suggestions.length} grounded pending proposals (${answer.startsWith('I volunteer') ? 'work example' : 'clarification'}). No human microphone proof.`);
}
