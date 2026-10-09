// Deterministic transport + synthetic microphone, never real spoken proof.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3013';
try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.liveTracks = [];
      const nativeGet = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (options) => {
        if (window.denyMic) throw new DOMException('Denied', 'NotAllowedError');
        const stream = await nativeGet(options);
        window.liveTracks.push(...stream.getTracks());
        return stream;
      };
      const nativeStart = AudioBufferSourceNode.prototype.start;
      const nativeStop = AudioBufferSourceNode.prototype.stop;
      window.playedAudio = 0; window.stoppedAudio = 0;
      AudioBufferSourceNode.prototype.start = function (...args) { window.playedAudio++; return nativeStart.apply(this, args); };
      AudioBufferSourceNode.prototype.stop = function (...args) { window.stoppedAudio++; return nativeStop.apply(this, args); };
    });
    await page.route('**/api/conversation', (route) => route.fulfill({ json: {
      reply: 'What experience would you like to share?', suggestions: [], toolTrace: { selected: false, functionName: null, arguments: [], dispatched: false, outcome: 'no_tool_selected' },
      history: [{ id: 'q1', role: 'assistant', content: 'What experience would you like to share?' }], interview: { status: 'active', questions: 1, answered: 0, limit: 12 },
    } }));
    let tokenFails = false;
    await page.route('**/api/live-token', (route) => route.fulfill(tokenFails ? { status: 503, json: { error: { message: 'Voice is unavailable. Continue by text.' } } } : { json: { token: 'auth_tokens/browser-fixture', model: 'test-live', expiresAt: new Date(Date.now() + 300000).toISOString() } }));
    let socket, holdSetup = false, closed = false;
    const messages = [];
    await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
      socket = ws; closed = false;
      ws.onClose(() => { closed = true; });
      ws.onMessage((raw) => {
        const message = JSON.parse(raw);
        messages.push(message);
        if (message.setup && !holdSetup) ws.send(JSON.stringify({ setupComplete: {} }));
      });
    });
    await page.goto(baseURL);
    await page.getByRole('radio', { name: /Simple/ }).check();
    await page.getByRole('button', { name: 'Start your interview' }).click();
    await page.getByRole('button', { name: 'Optional voice practice' }).focus(); await page.keyboard.press('Enter');
    const start = page.getByRole('button', { name: 'Start voice & allow microphone' });
    await page.locator('#message').fill('My unsent answer stays here.');
    // Denial preserves candidate input and allows immediate text fallback.
    await page.evaluate(() => { window.denyMic = true; });
    await start.focus(); await page.keyboard.press('Enter');
    await page.getByRole('alert').filter({ hasText: 'Microphone permission was not granted' }).waitFor();
    assert.equal(await page.locator('#message').inputValue(), 'My unsent answer stays here.');
    await page.evaluate(() => { window.denyMic = false; });
    tokenFails = true;
    await start.click();
    await page.getByRole('alert').filter({ hasText: 'Voice is unavailable' }).waitFor();
    assert.ok(await page.evaluate(() => window.liveTracks.every((track) => track.readyState === 'ended')));
    tokenFails = false;
    await start.focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Mute microphone', exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
    for (let attempt = 0; attempt < 50 && !messages.some((message) => message.realtimeInput?.audio); attempt++) await page.waitForTimeout(100);
    assert.ok(messages.some((message) => message.realtimeInput?.audio?.mimeType.startsWith('audio/pcm;rate=')), 'microphone frames use realtimeInput');
    await page.getByRole('button', { name: 'Mute microphone', exact: true }).click();
    assert.ok(await page.evaluate(() => window.liveTracks.filter((track) => track.readyState === 'live').every((track) => !track.enabled)));
    assert.ok(messages.some((message) => message.realtimeInput?.audioStreamEnd));
    await page.getByRole('button', { name: 'Unmute microphone' }).click();
    assert.ok(await page.evaluate(() => window.liveTracks.filter((track) => track.readyState === 'live').every((track) => track.enabled)));
    await page.getByRole('button', { name: 'Skip voice question' }).click();
    await page.getByRole('button', { name: 'Clarify voice question' }).click();
    assert.ok(messages.some((message) => JSON.stringify(message.clientContent ?? {}).includes('clarify')));
    // A long queued PCM frame must stop immediately on interruption.
    const pcm = Buffer.alloc(24000 * 2 * 3).toString('base64');
    socket.send(JSON.stringify({ serverContent: { inputTranscription: { text: 'I helped library visitors.' }, outputTranscription: { text: 'What did you enjoy?' }, modelTurn: { parts: [{ inlineData: { data: pcm, mimeType: 'audio/pcm;rate=24000' } }] } } }));
    await page.getByText('I helped library visitors.', { exact: true }).waitFor();
    await page.waitForFunction(() => window.playedAudio > 0);
    socket.send(JSON.stringify({ serverContent: { interrupted: true } }));
    await page.waitForFunction(() => window.stoppedAudio > 0);
    await page.screenshot({ path: `/tmp/access-task13-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.getByRole('button', { name: 'Review this answer in text' }).click();
    assert.equal(await page.locator('#message').inputValue(), 'My unsent answer stays here.\n\nI helped library visitors.');
    assert.equal(await page.locator('#message').evaluate((el) => el === document.activeElement), true);
    await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
    assert.equal(closed, true);
    // Stop must cancel a pending socket even before Gemini sends setupComplete.
    holdSetup = true;
    const setupCount = messages.filter((message) => message.setup).length;
    await start.click();
    await page.getByText('Connecting to Gemini Live.', { exact: true }).waitFor();
    for (let attempt = 0; attempt < 50 && messages.filter((message) => message.setup).length === setupCount; attempt++) await page.waitForTimeout(100);
    assert.ok(messages.filter((message) => message.setup).length > setupCount);
    await page.getByRole('button', { name: 'Stop voice' }).click();
    await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
    assert.equal(closed, true);
    assert.equal(await page.locator('#message').inputValue(), 'My unsent answer stays here.\n\nI helped library visitors.');
    holdSetup = false;
    // Remote closure is recoverable, then Reset releases the next session.
    await start.click();
    await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
    socket.close({ code: 1011, reason: 'fixture provider failure' });
    await page.getByText('Voice connection ended. Retry voice or continue by text.', { exact: true }).waitFor();
    assert.equal(await page.locator('#message').inputValue(), 'My unsent answer stays here.\n\nI helped library visitors.');
    await start.click();
    await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
    await page.locator('.preferences summary').click();
    await page.getByRole('radio', { name: 'Standard', exact: true }).check();
    await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
    assert.equal(await page.locator('#message').inputValue(), 'My unsent answer stays here.\n\nI helped library visitors.');
    await page.locator('.preferences summary').click();
    await start.click();
    await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
    await page.getByRole('button', { name: 'Reset & delete' }).click();
    await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
    assert.equal(closed, true);
    assert.deepEqual(errors, []);
    console.log(`Live browser ${width}: PASS (synthetic microphone / deterministic WebSocket)`);
    await page.close();
  }
} finally { await browser.close(); }
