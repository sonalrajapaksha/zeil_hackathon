// Optional browser QA: supply PLAYWRIGHT_MODULE if Playwright is in an external tool cache.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { POST } from '../src/app/api/conversation/route.ts';
import { POST as applicationPOST } from '../src/app/api/application/route.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3002';
let failNext = false;
let release;
let calls = 0;
const questionStyles = [];
const oldFetch = globalThis.fetch;
const oldKey = process.env.GEMINI_API_KEY;
const interviewStyles = [];
process.env.GEMINI_API_KEY = 'browser-test-only';
globalThis.fetch = async (_url, init) => {
  calls++;
  if (release) await new Promise((resolve) => { release = resolve; });
  if (failNext) { failNext = false; throw new Error('mock provider failure'); }
  const body = JSON.parse(init.body);
  const systemInstruction = body.systemInstruction ?? body.config?.systemInstruction;
  if (systemInstruction) questionStyles.push(JSON.stringify(systemInstruction));
  if (body.generationConfig.responseJsonSchema?.properties?.findings) {
    const items = JSON.parse(body.contents[0].parts[0].text);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ findings: items.map((item) => ({ index: item.index, sensitive: false })) }) }] }, finishReason: 'STOP' }] }));
  }
  if (body.generationConfig.responseJsonSchema?.properties?.sensitive) {
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ sensitive: false }) }] }, finishReason: 'STOP' }] }));
  }
  if (body.generationConfig.responseJsonSchema?.properties?.cvText) {
    const input = JSON.parse(body.contents[0].parts[0].text);
    const details = input.evidence.map((item) => item.text);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      cvText: `CV for ${input.job.title}\n${details.join('\n')}`,
      coverLetter: `Kia ora ${input.job.company} team, I am interested in the ${input.job.title} role. ${details.join('; ')}`,
      unverifiedClaims: [],
    }) }] }, finishReason: 'STOP' }] }));
  }
  if (body.tools?.some((tool) => tool.functionDeclarations?.some((declaration) => declaration.name === 'propose_profile_updates'))) {
    return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: 'No profile tool needed in this deterministic browser fixture.' }] }, finishReason: 'STOP' }] }));
  }
  const text = body.contents.at(-1).parts[0].text;
  const previousQuestion = [...body.contents.slice(0, -1)].reverse().find((item) => item.role === 'model')?.parts[0].text;
  const clarification = text.includes('requests clarification');
  const candidateText = body.contents.filter((item) => item.role === 'user').map((item) => item.parts?.find((part) => part.text)?.text).findLast((value) => value === 'I volunteer at a library.' || value === 'I helped organise donations.') || text;
  const reply = body.contents.length === 1 ? 'What experience would you like to share?' : clarification ? previousQuestion : `Thinking about ${candidateText.slice(0, 70)}, what did you learn in example ${calls}?`;
  const suggestions = candidateText === 'I volunteer at a library.'
    ? [{ kind: 'skill', text: 'Library volunteering', evidence: 'volunteer at a library' }]
    : candidateText === 'I helped organise donations.'
      ? [{ kind: 'experience', text: 'Organising donations', evidence: 'organise donations' }]
      : [];
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ reply, suggestions }) }] }, finishReason: 'STOP' }] }));
};
try {
  for (const width of [1280, 640, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const activate = async (control, key = 'Enter') => { await control.focus(); await page.keyboard.press(key); };
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Welcome screen has no horizontal overflow');
    const baseCopySize = await page.locator('.welcome-intro').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((link) => link === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('link', { name: 'Skip to main content' }).evaluate((link) => getComputedStyle(link).clipPath), 'inset(100%)');
    // Verify the actual HTTP endpoint rejects malformed input before mocking Gemini.
    const real = await page.request.post(`${baseURL}/api/conversation`, { data: { action: 'start', history: [], questionStyle: 'standard', extra: true } });
    assert.equal(real.status(), 400);
    assert.equal((await real.json()).error.code, 'INVALID_REQUEST');
    await page.route('**/api/conversation', async (route) => {
      const request = JSON.parse(route.request().postData() || '{}');
      if (request.action === 'start') interviewStyles.push(request.questionStyle);
      const response = await POST(new Request('http://localhost/api/conversation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request().postData(),
      }));
      await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
    });
    await page.route('**/api/application', async (route) => {
      const response = await applicationPOST(new Request('http://localhost/api/application', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: route.request().postData(),
      }));
      await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
    });
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), true);
    await page.getByRole('radio', { name: /Simple/ }).focus(); await page.keyboard.press('Space');
    await page.locator('.preferences summary').focus(); await page.keyboard.press('Enter');
    for (const label of ['Larger text', 'Higher contrast', 'Reduce motion']) {
      const control = page.getByLabel(label); await control.focus(); await page.keyboard.press('Space');
    }
    await page.locator('.preferences summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), false);
    await page.waitForFunction((size) => parseFloat(getComputedStyle(document.querySelector('.welcome-intro')).fontSize) > size, baseCopySize);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.privacy-note p')).color === 'rgb(0, 0, 0)');
    assert.ok(await page.locator('.welcome-intro').evaluate((element) => parseFloat(getComputedStyle(element).fontSize)) > baseCopySize, 'Large text enlarges welcome copy');
    assert.equal(await page.locator('.privacy-note p').evaluate((element) => getComputedStyle(element).color), 'rgb(0, 0, 0)', 'High contrast darkens muted copy');
    assert.equal(await page.locator('.journey').evaluate((element) => getComputedStyle(element).scrollBehavior), 'auto', 'Reduced motion removes smooth scrolling');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Accessibility preferences do not cause horizontal overflow');
    await page.getByRole('button', { name: 'Start your interview' }).focus();
    await page.keyboard.press('Enter');
    await page.getByText('What experience would you like to share?', { exact: true }).waitFor();
    await page.locator('[aria-live="polite"]').filter({ hasText: 'A new AI question is ready.' }).waitFor();
    assert.equal(interviewStyles.at(-1), 'simple', 'Simple preference reaches the conversation API');
    assert.ok(questionStyles.at(-1).includes('Question style: simple'), 'Simple preference reaches Gemini');
    await activate(page.getByRole('button', { name: 'Your draft' }));
    await page.locator('[aria-live="polite"]').filter({ hasText: 'Choose a fictional role' }).waitFor();
    await activate(page.getByRole('button', { name: 'Your story', exact: true }));
    await page.locator('[aria-live="polite"]').filter({ hasText: 'Your story and career canvas are ready.' }).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 1);
    await page.getByLabel('Add to your story').fill('I volunteer at a library.');
    await page.getByRole('button', { name: 'Clarify question' }).focus(); await page.keyboard.press('Enter');
    await page.getByText('Question 1 of up to 12 · 0 answered').waitFor();
    assert.equal(await page.getByLabel('Add to your story').inputValue(), 'I volunteer at a library.');
    assert.equal(await page.locator('.chat-line').count(), 3);
    await page.getByText('Could you clarify this question?', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Clarify question' }).isDisabled(), true);
    failNext = true;
    await page.getByRole('button', { name: 'Send answer' }).focus(); await page.keyboard.press('Enter');
    await page.locator('#interview-error').waitFor();
    assert.equal(await page.locator('#interview-error').getAttribute('role'), 'alert');
    assert.equal(await page.getByLabel('Add to your story').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.getByLabel('Add to your story').getAttribute('aria-describedby'), 'interview-error');
    await page.locator('[aria-live="polite"]').filter({ hasText: 'The AI is unavailable.' }).waitFor();
    assert.equal(await page.getByLabel('Add to your story').inputValue(), 'I volunteer at a library.');
    assert.equal(await page.locator('.chat-line').count(), 3);
    await page.getByRole('button', { name: 'Retry', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.getByText(/Question 2 of up to/).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 5);
    if (width <= 650) { await page.getByRole('button', { name: /Career canvas/ }).focus(); await page.keyboard.press('Enter'); }
    assert.equal(await page.getByLabel('Suggested skill').inputValue(), 'Library volunteering');
    await page.locator('[aria-live="polite"]').filter({ hasText: 'profile suggestion to review are ready' }).waitFor();
    await page.getByText('“volunteer at a library”').waitFor();
    await page.getByLabel('Suggested skill').fill('Visitor support');
    await page.getByRole('button', { name: 'Approve' }).focus(); await page.keyboard.press('Enter');
    assert.equal(await page.getByLabel('Confirmed skill').inputValue(), 'Visitor support');
    await page.locator('[aria-live="polite"]').filter({ hasText: 'Suggestion confirmed and added to your profile.' }).waitFor();
    if (width <= 650) { await page.getByRole('button', { name: 'Conversation', exact: true }).focus(); await page.keyboard.press('Enter'); }
    await page.getByRole('button', { name: 'Correct this answer' }).focus(); await page.keyboard.press('Enter');
    await page.getByLabel('Correct your answer').fill('I volunteer at a food bank.');
    await page.getByRole('button', { name: 'Save correction' }).focus(); await page.keyboard.press('Enter');
    await page.getByLabel('Add to your story').waitFor();
    await page.getByText('I volunteer at a food bank.', { exact: true }).waitFor();
    assert.equal(await page.locator('.chat-line').count(), 5);
    assert.equal(await page.getByText('I volunteer at a library.', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Skip question' }).focus(); await page.keyboard.press('Enter');
    await page.getByText(/Question 3 of up to/).waitFor();
    // Hold a request and submit twice; the ref lock must allow just one SDK call.
    await page.getByLabel('Add to your story').fill('I helped organise donations.');
    const before = calls;
    release = () => {};
    await page.getByRole('button', { name: 'Send answer' }).focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Please wait…' }).waitFor();
    await page.locator('.message-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(calls, before + 1);
    assert.equal(await page.getByLabel('Add to your story').getAttribute('readonly'), '');
    release(); release = undefined;
    await page.getByText(/Question 4 of up to/).waitFor();
    assert.equal(await page.getByLabel('Suggested experience').inputValue(), 'Organising donations');
    await page.getByRole('button', { name: 'End interview', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.getByText('Interview ended. Your history is available above.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Send answer' }).isDisabled(), true);
    await page.screenshot({ path: `/tmp/access-task02-${width}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No horizontal overflow');
    // Preserve Task 01 canvas, preferences, fictional roles and draft controls.
    if (width <= 650) { await page.getByRole('button', { name: /Career canvas/ }).focus(); await page.keyboard.press('Enter'); }
    await page.getByLabel('Add something yourself').fill('Event planning');
    await page.getByRole('button', { name: 'Add confirmed experience' }).focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Choose a role' }).focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Prepare application draft' }).focus(); await page.keyboard.press('Enter');
    await page.getByRole('textbox', { name: 'Curriculum vitae' }).waitFor();
    assert.match(await page.getByLabel('Curriculum vitae').inputValue(), /Visitor support/);
    assert.doesNotMatch(await page.getByLabel('Curriculum vitae').inputValue(), /Organising donations/);
    assert.match(await page.getByLabel('Curriculum vitae').inputValue(), /Event planning/, 'Candidate-added confirmed skill remains available');
    await page.getByLabel('Curriculum vitae').fill('My reviewed CV edit.');
    await page.getByLabel('Cover letter').fill('My reviewed letter edit.');
    const cvDownloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CV (.txt)' }).focus(); await page.keyboard.press('Enter');
    const cvDownload = await cvDownloadEvent;
    assert.equal(cvDownload.suggestedFilename(), 'access-harbour-support-cv.txt');
    await page.locator('[aria-live="polite"]').filter({ hasText: 'Your CV downloaded as access-harbour-support-cv.txt.' }).waitFor();
    const cvPath = `/tmp/${width}-access-cv.txt`;
    await cvDownload.saveAs(cvPath);
    const exportedCV = await readFile(cvPath, 'utf8');
    assert.match(exportedCV, /My reviewed CV edit\./);
    assert.doesNotMatch(exportedCV, /Organising donations/);
    const letterDownloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cover letter (.txt)' }).focus(); await page.keyboard.press('Enter');
    const letterDownload = await letterDownloadEvent;
    assert.equal(letterDownload.suggestedFilename(), 'access-harbour-support-cover-letter.txt');
    await page.locator('[aria-live="polite"]').filter({ hasText: 'Your cover letter downloaded as access-harbour-support-cover-letter.txt.' }).waitFor();
    const letterPath = `/tmp/${width}-access-letter.txt`;
    await letterDownload.saveAs(letterPath);
    assert.match(await readFile(letterPath, 'utf8'), /My reviewed letter edit\./);
    failNext = true;
    await activate(page.getByRole('button', { name: 'Prepare application draft' }));
    await page.locator('.application-error').waitFor();
    assert.equal(await page.getByLabel('Curriculum vitae').inputValue(), 'My reviewed CV edit.', 'A failed generation preserves candidate edits');
    await activate(page.getByRole('button', { name: 'Retry draft' }));
    await page.getByLabel('Curriculum vitae').evaluate((element) => new Promise((resolve) => {
      const check = () => element.value !== 'My reviewed CV edit.' ? resolve(true) : setTimeout(check, 10);
      check();
    }));
    await activate(page.getByRole('button', { name: /Junior Data Analyst/ }));
    await page.getByText(/Current draft: Customer Support Assistant/).waitFor();
    await activate(page.getByRole('button', { name: 'Prepare application draft' }));
    await page.getByLabel('Curriculum vitae').evaluate((element) => new Promise((resolve) => {
      const check = () => element.value.includes('CV for Junior Data Analyst') ? resolve(true) : setTimeout(check, 10);
      check();
    }));
    assert.match(await page.getByLabel('Cover letter').inputValue(), /Northstar Analytics/);
    await page.screenshot({ path: `/tmp/access-task04-${width}.png`, fullPage: true });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('access-candidate-v1')));
    assert.equal(saved.version, 1);
    assert.equal(saved.profile.preferences.questionStyle, 'simple');
    assert.ok(saved.profile.skills.some((item) => item.name === 'Visitor support' && item.confirmed));
    assert.ok(saved.profile.skills.some((item) => item.name === 'Event planning' && item.confirmed));
    assert.ok(!JSON.stringify(saved).includes('Organising donations'));
    assert.equal(saved.history, undefined, 'Interview history is not saved');
    assert.ok(!JSON.stringify(saved).includes('I volunteer at a library.'), 'Full candidate answers are not saved');
    await page.reload();
    assert.equal(await page.getByRole('radio', { name: /Simple/ }).isChecked(), true);
    await activate(page.locator('.preferences summary'));
    assert.equal(await page.getByLabel('Larger text').isChecked(), true);
    assert.equal(await page.getByLabel('Higher contrast').isChecked(), true);
    assert.equal(await page.getByLabel('Reduce motion').isChecked(), true);
    await activate(page.locator('.preferences summary'));
    await activate(page.getByRole('button', { name: 'Start your interview' }));
    await page.getByText('What experience would you like to share?', { exact: true }).waitFor();
    if (width <= 650) await activate(page.getByRole('button', { name: /Career canvas/ }));
    assert.equal(await page.getByLabel('Confirmed skill').count(), 2);
    if (width <= 650) await activate(page.getByRole('button', { name: 'Conversation', exact: true }));
    await activate(page.getByRole('button', { name: 'Reset & delete' }));
    assert.equal(await page.getByRole('button', { name: 'Start your interview' }).isDisabled(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('access-candidate-v1')), null);
    await page.getByRole('radio', { name: /Standard/ }).check();
    release = () => {};
    await activate(page.getByRole('button', { name: 'Start your interview' }));
    await page.getByRole('button', { name: 'Please wait…' }).waitFor();
    assert.equal(interviewStyles.at(-1), 'standard', 'Standard preference reaches the conversation API');
    await activate(page.getByRole('button', { name: 'Reset & delete' }));
    release(); release = undefined;
    await page.getByRole('button', { name: 'Start your interview' }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: keyboard interview, approved-profile persistence/reload, edited CV/letter downloads, sensitive/approval filtering, error recovery, reset/delete, no overflow or runtime errors.`);
    await page.close();
  }
} finally {
  globalThis.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey;
  await browser.close();
}
