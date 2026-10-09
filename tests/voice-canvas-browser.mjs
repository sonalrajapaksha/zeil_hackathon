// Synthetic microphone + transport fixtures through real extraction/application handlers.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { POST as profilePOST } from '../src/app/api/profile-proposals/route.ts';
import { POST as applicationPOST } from '../src/app/api/application/route.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3022';
const oldFetch = globalThis.fetch;
const oldKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = 'synthetic-test-only';
let failNext = false;
const libraryAnswer = 'I helped library visitors use computers. I studied mathematics.';
const proposals = [
  { kind: 'skill', text: 'Customer assistance', evidence: 'helped library visitors' },
  { kind: 'experience', text: 'Library volunteering', evidence: 'helped library visitors use computers' },
  { kind: 'education', text: 'Mathematics study', evidence: 'studied mathematics' },
];
globalThis.fetch = async (_url, init) => {
  if (failNext) { failNext = false; throw new Error('Fixture provider failure'); }
  const body = JSON.parse(init.body);
  const schema = body.generationConfig.responseJsonSchema.properties;
  const input = JSON.parse(body.contents[0].parts[0].text);
  const output = schema.findings ? { findings: input.map((_, index) => ({ index, sensitive: false })) }
    : schema.sensitive ? { sensitive: false }
    : schema.cvText ? { cvText: `CV\n${input.evidence.map((item) => item.text).join('\n')}`, coverLetter: `Letter\n${input.evidence.map((item) => item.text).join('\n')}`, unverifiedClaims: [] }
    : { suggestions: input.candidateAnswer === libraryAnswer ? proposals : [{ kind: 'experience', text: 'Booking coordination', evidence: 'organised bookings' }] };
  return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] }, finishReason: 'STOP' }] });
};
try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const requests = [];
    let textCalls = 0;
    let hold, release;
    await page.route('**/api/conversation', (route) => { textCalls++; return route.fulfill({ status: 500, json: {} }); });
    await page.route('**/api/profile-proposals', async (route) => {
      requests.push(JSON.parse(route.request().postData()));
      if (hold) await new Promise((resolve) => { release = resolve; });
      const response = await profilePOST(new Request('http://localhost/api/profile-proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request().postData() }));
      await route.fulfill({ status: response.status, json: await response.json() }).catch(() => {});
    });
    await page.route('**/api/application', async (route) => {
      const response = await applicationPOST(new Request('http://localhost/api/application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request().postData() }));
      await route.fulfill({ status: response.status, json: await response.json() });
    });
    await page.route('**/api/live-token', (route) => route.fulfill({ json: { token: 'auth_tokens/fixture', model: 'fixture', expiresAt: new Date(Date.now() + 300000).toISOString() } }));
    let socket;
    await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
      socket = ws;
      ws.onMessage((raw) => { if (JSON.parse(raw).setup) ws.send(JSON.stringify({ setupComplete: {} })); });
    });
    await page.goto(baseURL);
    await page.getByRole('radio', { name: /Simple/ }).check();
    await page.getByRole('button', { name: 'Start a conversation', exact: true }).click();
    await page.getByRole('button', { name: 'Start conversation', exact: true }).last().click();
    await page.locator('.voice-stage[data-voice-state="listening"]').waitFor();
    await page.getByRole('button', { name: 'View transcript (0 turns)' }).click();
    const send = (serverContent) => socket.send(JSON.stringify({ serverContent }));
    send({ inputTranscription: { text: 'I helped library ' } });
    send({ outputTranscription: { text: 'The interviewer says CEO, which is not candidate evidence.' } });
    await page.getByText('I helped library', { exact: true }).waitFor();
    assert.equal(requests.length, 0, 'Partial audio is never extracted');
    send({ inputTranscription: { text: 'visitors use computers. I studied mathematics.', finished: true } });
    await page.getByText('Voice suggestions are ready in your Career Canvas. Review each one before approving.', { exact: true }).waitFor();
    assert.deepEqual(requests, [{ answer: libraryAnswer }], 'Only completed candidate input is sent');
    assert.equal(textCalls, 0, 'Voice does not require the text interview');
    assert.equal(await page.locator('#message').count(), 0, 'Text controls remain hidden during voice');
    assert.equal(await page.locator('.chat-line').count(), 0);
    send({ turnComplete: true }); send({ turnComplete: true });
    await page.waitForTimeout(100);
    assert.equal(requests.length, 1, 'Completion signals cannot replay a completed answer');
    send({ inputTranscription: { text: libraryAnswer, finished: true } });
    for (let attempt = 0; attempt < 40 && requests.length < 2; attempt++) await page.waitForTimeout(25);
    assert.equal(requests.length, 2);
    await page.waitForFunction(() => !document.querySelector('.voice-discovery').textContent.includes('Discovering'));
    const canvasSummary = page.locator('.canvas-companion > summary');
    assert.equal(await page.locator('.canvas-companion').evaluate((element) => element.open), false, 'Career profile stays compact during the conversation');
    await canvasSummary.waitFor();
    assert.match(await canvasSummary.innerText(), /1 experience · 1 skill/);
    assert.match(await canvasSummary.innerText(), /3 awaiting review/);
    await canvasSummary.click();
    await page.getByLabel('Suggested skill').waitFor();
    assert.equal(await page.locator('.note-item').count(), 3, 'Repeated evidence does not duplicate cards');
    assert.equal(await page.getByLabel('Suggested education').inputValue(), 'Mathematics study');
    assert.ok(!JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('access-candidate-v1')))).includes('Mathematics study'), 'Unapproved voice evidence is not persisted');
    await page.getByLabel('Suggested skill').fill('Visitor support');
    await page.locator('.note-item').filter({ has: page.getByLabel('Suggested skill') }).getByRole('button', { name: 'Approve' }).click();
    await page.getByLabel('Confirmed skill').waitFor();
    await page.screenshot({ path: `/tmp/access-voice-canvas-${width}.png`, fullPage: true });
    failNext = true;
    send({ inputTranscription: { text: 'I organised bookings.', finished: true } });
    await page.getByRole('button', { name: 'Retry voice suggestions' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Stop voice' }).isEnabled(), true, 'Extraction failure does not stop audio');
    await page.getByRole('button', { name: 'Retry voice suggestions' }).click();
    await page.getByRole('button', { name: 'Retry voice suggestions' }).waitFor({ state: 'hidden' });
    assert.deepEqual(requests.slice(-2), [{ answer: 'I organised bookings.' }, { answer: 'I organised bookings.' }]);
    // A command is excluded, and the next model completion resets suppression.
    const beforeClarify = requests.length;
    await page.getByRole('button', { name: 'Clarify voice question' }).click();
    send({ inputTranscription: { text: 'Could you clarify?', finished: true }, turnComplete: true });
    await page.waitForTimeout(100); assert.equal(requests.length, beforeClarify);
    await page.getByRole('button', { name: 'Stop voice' }).click();
    await page.getByRole('button', { name: 'Choose a role' }).click();
    await page.getByRole('button', { name: 'Prepare application draft' }).click();
    await page.getByLabel('Curriculum vitae').waitFor();
    for (const label of ['Curriculum vitae', 'Cover letter']) {
      const value = await page.getByLabel(label).inputValue();
      assert.match(value, /Visitor support/);
      assert.doesNotMatch(value, /Library volunteering|Mathematics study|Booking coordination|CEO/);
    }
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CV (.txt)' }).click();
    const download = await downloadEvent;
    const downloadPath = `/tmp/access-voice-cv-${width}.txt`;
    await download.saveAs(downloadPath);
    assert.match(await readFile(downloadPath, 'utf8'), /Visitor support/);
    // Reset while extraction is waiting must prevent late profile resurrection.
    assert.equal(textCalls, 0, 'The entire voice-to-export journey needs no text interview');
    await page.getByRole('button', { name: 'Reset & delete' }).click();
    await page.getByRole('radio', { name: /Simple/ }).check();
    await page.getByRole('button', { name: 'Start a conversation', exact: true }).click();
    await page.getByRole('button', { name: 'Start conversation', exact: true }).last().click();
    await page.locator('.voice-stage[data-voice-state="listening"]').waitFor();
    hold = true;
    send({ inputTranscription: { text: 'I organised bookings.', finished: true } });
    await page.getByText(/Discovering career details/).waitFor();
    for (let attempt = 0; attempt < 40 && !release; attempt++) await page.waitForTimeout(25);
    assert.equal(typeof release, 'function');
    await page.getByRole('button', { name: 'Reset & delete' }).click();
    release(); hold = false;
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => localStorage.getItem('access-candidate-v1')), null);
    assert.deepEqual(errors, []);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`Voice→Canvas→confirmed draft/export ${width}: PASS (synthetic transport, real route handlers; reset, retry, privacy, no text submission)`);
    await page.close();
  }
} finally { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; await browser.close(); }
