// Optional browser QA: supply PLAYWRIGHT_MODULE if Playwright is in an external tool cache.
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/conversation/route.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3002';
let failNext = false;
let release;
let calls = 0;
const oldFetch = globalThis.fetch;
const oldKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = 'browser-test-only';
globalThis.fetch = async (_url, init) => {
  calls++;
  if (release) await new Promise((resolve) => { release = resolve; });
  if (failNext) { failNext = false; throw new Error('mock provider failure'); }
  const body = JSON.parse(init.body);
  const text = body.contents.at(-1).parts[0].text;
  const previousQuestion = [...body.contents.slice(0, -1)].reverse().find((item) => item.role === 'model')?.parts[0].text;
  const clarification = text.includes('requests clarification');
  const reply = body.contents.length === 1 ? 'What experience would you like to share?' : clarification ? previousQuestion : `Thinking about ${text.slice(0, 70)}, what did you learn in example ${calls}?`;
  const suggestions = text === 'I volunteer at a library.'
    ? [{ kind: 'skill', text: 'Library volunteering', evidence: 'volunteer at a library' }]
    : text === 'I helped organise donations.'
      ? [{ kind: 'experience', text: 'Organising donations', evidence: 'organise donations' }]
      : [];
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply, suggestions }) }] }, finishReason: 'STOP' }] }));
};
try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL);
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((link) => link === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((link) => getComputedStyle(link).clipPath), 'inset(100%)');
    // Verify the actual HTTP endpoint's missing-key error before mocking Gemini.
    const real = await page.request.post(`${baseURL}/api/conversation`, { data: { action: 'start', history: [], questionStyle: 'standard' } });
    assert.equal(real.status(), 503);
    assert.equal((await real.json()).error.code, 'NOT_CONFIGURED');
    await page.route('**/api/conversation', async (route) => {
      const response = await POST(new Request('http://localhost/api/conversation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request().postData(),
      }));
      await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
    });
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), true);
    await page.getByRole('radio', { name: /Simple/ }).check();
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), false);
    await page.getByRole('button', { name: 'Start your interview' }).focus();
    await page.keyboard.press('Enter');
    await page.getByText('What experience would you like to share?', { exact: true }).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 1);
    await page.getByLabel('Add to your story').fill('I volunteer at a library.');
    await page.getByRole('button', { name: 'Clarify question' }).click();
    await page.getByText('Question 1 of up to 12 · 0 answered').waitFor();
    assert.equal(await page.getByLabel('Add to your story').inputValue(), 'I volunteer at a library.');
    assert.equal(await page.locator('.chat-line').count(), 3);
    await page.getByText('Could you clarify this question?', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Clarify question' }).isDisabled(), true);
    failNext = true;
    await page.getByRole('button', { name: 'Send answer' }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('Add to your story').inputValue(), 'I volunteer at a library.');
    assert.equal(await page.locator('.chat-line').count(), 3);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByText(/Question 2 of up to/).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 5);
    if (width === 320) await page.getByRole('button', { name: /Career canvas/ }).click();
    assert.equal(await page.getByLabel('Suggested skill').inputValue(), 'Library volunteering');
    await page.getByText('“volunteer at a library”').waitFor();
    await page.getByLabel('Suggested skill').fill('Visitor support');
    await page.getByRole('button', { name: 'Approve' }).click();
    assert.equal(await page.getByLabel('Confirmed skill').inputValue(), 'Visitor support');
    if (width === 320) await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    await page.getByRole('button', { name: 'Correct this answer' }).click();
    await page.getByLabel('Correct your answer').fill('I volunteer at a food bank.');
    await page.getByRole('button', { name: 'Save correction' }).click();
    await page.getByLabel('Add to your story').waitFor();
    await page.getByText('I volunteer at a food bank.', { exact: true }).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 5);
    assert.equal(await page.getByText('I volunteer at a library.', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Skip question' }).click();
    await page.getByText(/Question 3 of up to/).waitFor();
    // Hold a request and submit twice; the ref lock must allow just one SDK call.
    await page.getByLabel('Add to your story').fill('I helped organise donations.');
    const before = calls;
    release = () => {};
    await page.getByRole('button', { name: 'Send answer' }).click();
    await page.getByRole('button', { name: 'Please wait…' }).waitFor();
    await page.locator('.message-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(calls, before + 1);
    assert.equal(await page.getByLabel('Add to your story').getAttribute('readonly'), '');
    release(); release = undefined;
    await page.getByText(/Question 4 of up to/).waitFor();
    assert.equal(await page.getByLabel('Suggested experience').inputValue(), 'Organising donations');
    await page.getByRole('button', { name: 'End interview', exact: true }).click();
    await page.getByText('Interview ended. Your history is available above.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Send answer' }).isDisabled(), true);
    await page.screenshot({ path: `/tmp/access-task02-${width}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No horizontal overflow');
    // Preserve Task 01 canvas, preferences, fictional roles and draft controls.
    if (width === 320) await page.getByRole('button', { name: /Career canvas/ }).click();
    await page.getByLabel('Add something yourself').fill('Event planning');
    await page.getByRole('button', { name: 'Add confirmed experience' }).click();
    await page.getByRole('button', { name: 'Choose a role' }).click();
    await page.getByRole('button', { name: 'Prepare a demo draft' }).click();
    assert.match(await page.getByLabel('Curriculum vitae').inputValue(), /Visitor support/);
    assert.doesNotMatch(await page.getByLabel('Curriculum vitae').inputValue(), /Organising donations/);
    assert.match(await page.getByLabel('Curriculum vitae').inputValue(), /Event planning/, 'Candidate-added confirmed skill remains available');
    await page.getByRole('button', { name: 'Reset session' }).click();
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), true);
    await page.getByRole('radio', { name: /Standard/ }).check();
    release = () => {};
    await page.getByRole('button', { name: 'Start your interview' }).click();
    await page.getByRole('button', { name: 'Please wait…' }).waitFor();
    await page.getByRole('button', { name: 'Reset session' }).click();
    release(); release = undefined;
    await page.getByRole('button', { name: 'Start your interview' }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: keyboard start, real missing-key HTTP error, mocked contextual replies, failure/retry, correction, skip, duplicate protection, end, canvas/draft, reset, no overflow or runtime errors.`);
    await page.close();
  }
} finally {
  globalThis.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  await browser.close();
}
