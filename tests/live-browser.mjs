// Deterministic transport + synthetic microphone, never real spoken proof.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3013';
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: width === 1440 ? 'no-preference' : 'reduce' });
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
    await page.route('**/api/profile-proposals', (route) => route.fulfill({ json: { suggestions: [] } }));
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
    await page.getByRole('button', { name: 'I’d rather type' }).click();
    await page.getByRole('button', { name: 'Voice conversation' }).focus(); await page.keyboard.press('Enter');
    const start = page.getByRole('button', { name: 'Start voice & allow microphone' });
    await page.locator('#message').fill('My unsent answer stays here.');
    // Denial preserves candidate input and allows immediate text fallback.
    await page.evaluate(() => { window.denyMic = true; });
    await start.focus(); await page.keyboard.press('Enter');
    await page.getByRole('alert').filter({ hasText: 'Microphone permission was not granted' }).waitFor();
    assert.equal(await page.locator('.voice-signal svg').evaluate((el) => getComputedStyle(el).stroke), 'rgb(180, 35, 44)', 'Microphone denial turns the signal red');
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
    await page.locator('.voice-stage[data-voice-state="listening"]').waitFor();
    assert.equal(await page.locator('.voice-signal svg').evaluate((el) => getComputedStyle(el).stroke), 'rgb(255, 255, 255)', 'Working microphone has a white waveform');
    assert.equal(await page.locator('.voice-stage').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(35, 118, 64)', 'Working voice fills the stage green');
    assert.equal(await page.locator('.voice-question').evaluate((el) => getComputedStyle(el).color), 'rgb(255, 255, 255)', 'Active-stage text is white');
    if (width === 1440) await page.waitForFunction(() => [...document.querySelector('.voice-signal path').getAttribute('d').matchAll(/[ML]\d+ ([\d.-]+)/g)].some((point) => Math.abs(Number(point[1]) - 40) > 0.1));
    else assert.equal(await page.locator('.voice-signal path').getAttribute('d'), 'M0 40 L240 40', 'Reduced motion keeps the waveform static');
    await page.locator('.preferences summary').click();
    await page.getByLabel('Higher contrast').check();
    assert.equal(await page.locator('.voice-stage').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(20, 83, 45)', 'High contrast uses a darker green stage');
    assert.equal(await page.locator('.voice-question').evaluate((el) => getComputedStyle(el).color), 'rgb(255, 255, 255)', 'High contrast keeps active text white');
    await page.getByLabel('Higher contrast').uncheck();
    await page.locator('.preferences summary').click();
    const sessionCount = messages.filter((message) => message.setup).length;
    await start.evaluate((el) => el.click());
    assert.equal(messages.filter((message) => message.setup).length, sessionCount, 'Disabled start never duplicates the session');
    await page.getByRole('button', { name: 'Mute microphone', exact: true }).click();
    await page.locator('.voice-stage[data-voice-state="muted"]').waitFor();
    await page.waitForFunction(() => document.querySelector('.voice-signal path').getAttribute('d') === 'M0 40 L240 40');
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
    await page.locator('.voice-stage[data-voice-state="speaking"]').waitFor();
    await page.screenshot({ path: `/tmp/access-redesign-speaking-${width}.png`, fullPage: true });
    socket.send(JSON.stringify({ serverContent: { interrupted: true } }));
    await page.waitForFunction(() => window.stoppedAudio > 0);
    await page.locator('.voice-stage[data-voice-state="interrupted"]').waitFor();
    await page.screenshot({ path: `/tmp/access-task13-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.getByRole('region', { name: 'Voice practice transcript' }).focus();
    socket.send(JSON.stringify({ serverContent: { outputTranscription: { text: ' Here is more context.'.repeat(100) }, turnComplete: true } }));
    await page.waitForFunction(() => document.querySelector('.voice-question').textContent.length > 1000);
    assert.equal(await page.getByRole('region', { name: 'Voice practice transcript' }).evaluate((el) => el === document.activeElement), true, 'Streaming preserves transcript focus');
    assert.equal(await page.getByRole('region', { name: 'Voice practice transcript' }).getAttribute('aria-live'), null, 'Partial transcripts do not flood announcements');
    assert.equal(await page.locator('.voice-question').evaluate((el) => el.clientHeight < el.scrollHeight), true, 'Long current turn scrolls without displacing stop controls');
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
