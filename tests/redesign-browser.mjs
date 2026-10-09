// UI regression evidence uses deterministic transcripts; never claims human audio proof.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true });
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3020';
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    let microphoneRequests = 0, providerRequests = 0;
    await page.addInitScript(() => {
      window.micRequests = 0;
      navigator.mediaDevices.getUserMedia = async () => { window.micRequests++; throw new DOMException('Denied', 'NotAllowedError'); };
    });
    page.on('request', (request) => { if (request.url().includes('/api/')) providerRequests++; });
    await page.goto(baseURL);
    await page.getByRole('heading', { name: /Your experience\.\s*Your future\./ }).waitFor();
    await page.getByRole('button', { name: 'Pause example' }).click();
    assert.equal(await page.locator('.preview-signal span').first().evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await page.waitForTimeout(950);
    assert.equal(providerRequests, 0, 'Preview never calls an API');
    assert.equal(await page.evaluate(() => window.micRequests), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: landing reflows`);
    await page.screenshot({ path: `/tmp/access-redesign-welcome-${width}.png`, fullPage: true });
    await page.getByRole('radio', { name: /Simple/ }).check();
    await page.getByRole('button', { name: 'Start a conversation', exact: true }).click();
    await page.locator('.voice-stage[data-voice-state="idle"]').waitFor();
    assert.equal(await page.getByRole('radio', { name: 'Voice' }).isChecked(), true, 'Voice is the default mode');
    assert.equal(await page.getByRole('radio', { name: 'Text' }).isChecked(), false);
    assert.equal(await page.locator('#message').count(), 0, 'Text interface is absent in Voice mode');
    const transcript = page.getByRole('button', { name: 'View transcript (0 turns)' });
    assert.equal(await transcript.getAttribute('aria-expanded'), 'false', 'Transcript starts collapsed');
    await transcript.focus(); await page.keyboard.press('Space');
    assert.equal(await page.getByRole('button', { name: 'Collapse transcript' }).getAttribute('aria-expanded'), 'true', 'Transcript disclosure works from the keyboard');
    await page.getByRole('button', { name: 'Collapse transcript' }).click();
    assert.equal(await page.evaluate(() => window.micRequests), 0, 'Voice route requires a second explicit microphone action');
    assert.equal(providerRequests, 0, 'Voice route does not start a text interview');
    await page.getByRole('button', { name: 'Start conversation', exact: true }).last().click();
    await page.getByRole('alert').filter({ hasText: 'Microphone permission was not granted' }).waitFor();
    microphoneRequests = await page.evaluate(() => window.micRequests);
    assert.equal(microphoneRequests, 1);
    await page.locator('.voice-stage[data-voice-state="error"]').waitFor();
    await page.locator('.preferences summary').click();
    for (const label of ['Larger text', 'Higher contrast', 'Reduce motion']) await page.getByLabel(label).check();
    await page.locator('.preferences summary').click();
    assert.equal(await page.locator('.voice-signal span').first().evaluate((el) => getComputedStyle(el).animationName), 'none');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: combined preferences reflow`);
    await page.screenshot({ path: `/tmp/access-redesign-voice-${width}.png`, fullPage: true });
    await page.close();
    console.log(`Redesign ${width}: PASS (preview controls, consent, error, combined preferences, reflow)`);
  }
} finally { await browser.close(); }
