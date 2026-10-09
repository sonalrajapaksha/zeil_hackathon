// Deterministic provider fixtures verify mode boundaries, persistence and safe Live shutdown.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const baseURL = process.env.ACCESS_TEST_URL || 'http://localhost:3020';
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.addInitScript(() => {
    window.liveTracks = [];
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await getUserMedia(options); window.liveTracks.push(...stream.getTracks()); return stream;
    };
  });
  let conversationRequests = 0, liveTokenRequests = 0, socketClosed = false, socket;
  await page.route('**/api/conversation', async (route) => {
    conversationRequests++;
    const request = JSON.parse(route.request().postData() || '{}');
    const history = request.action === 'start'
      ? [{ id: 'q1', role: 'assistant', content: 'What work would you like to share?' }]
      : [...request.history, { id: 'a1', role: 'user', content: request.answer }, { id: 'q2', role: 'assistant', content: 'What did you learn from that?' }];
    await route.fulfill({ json: {
      reply: history.at(-1).content, history, suggestions: request.action === 'answer' ? [{ kind: 'skill', text: 'Event coordination', evidence: 'I organized weekly events.' }] : [],
      toolTrace: { selected: false, functionName: null, arguments: [], dispatched: false, outcome: 'no_tool_selected' },
      interview: { status: 'active', questions: request.action === 'answer' ? 2 : 1, answered: request.action === 'answer' ? 1 : 0, limit: 12 },
    } });
  });
  await page.route('**/api/profile-proposals', (route) => route.fulfill({ json: { suggestions: [] } }));
  await page.route('**/api/live-token', (route) => { liveTokenRequests++; return route.fulfill({ json: { token: 'auth_tokens/mode-fixture', model: 'test-live', expiresAt: new Date(Date.now() + 300000).toISOString() } }); });
  await page.routeWebSocket('wss://generativelanguage.googleapis.com/**', (ws) => {
    socket = ws; socketClosed = false;
    ws.onClose(() => { socketClosed = true; });
    ws.onMessage((raw) => { if (JSON.parse(raw).setup) ws.send(JSON.stringify({ setupComplete: {} })); });
  });

  await page.goto(baseURL);
  await page.locator('.preferences summary').click();
  await page.getByRole('radio', { name: /Simple/ }).check();
  await page.locator('.preferences summary').click();
  await page.getByRole('button', { name: 'Start a conversation', exact: true }).click();
  assert.equal(await page.getByRole('radio', { name: 'Speak' }).isChecked(), true, 'No saved choice defaults to Voice');
  assert.equal(conversationRequests, 0, 'Selecting Voice does not start the text interview');
  assert.equal(liveTokenRequests, 0, 'Selecting Voice does not open Gemini Live');
  assert.equal(await page.evaluate(() => window.liveTracks.length), 0, 'Selecting Voice does not request the microphone');
  assert.equal(await page.locator('#message').count(), 0, 'Text interface is absent in Voice mode');
  assert.equal(await page.getByRole('button', { name: 'View transcript (0 turns)' }).getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('.canvas-companion').evaluate((element) => element.open), false, 'Career editor starts compact');
  await page.locator('.canvas-companion > summary').click();
  assert.equal(await page.locator('.canvas-companion').evaluate((element) => element.open), true, 'Career profile opens on request');

  await page.locator('.interview-mode label').filter({ hasText: 'Type' }).click();
  await page.getByText('What work would you like to share?', { exact: true }).waitFor();
  assert.equal(await page.locator('.voice-stage').count(), 0, 'Voice interface is absent in Text mode');
  await page.getByLabel('Add to your story').fill('I organized weekly events.');
  await page.getByRole('button', { name: 'Send answer' }).click();
  await page.getByRole('button', { name: 'Approve' }).waitFor();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByText('Confirmed', { exact: true }).waitFor();
  await page.screenshot({ path: '/tmp/access-interview-text-1280.png', fullPage: true });
  await page.getByLabel('Add to your story').fill('An unsent text note.');

  const requestCount = conversationRequests;
  await page.locator('.interview-mode label').filter({ hasText: 'Speak' }).click();
  assert.equal(conversationRequests, requestCount, 'Switching to Voice does not send the text history');
  assert.equal(liveTokenRequests, 0, 'Switching to Voice still requires an explicit start action');
  assert.equal(await page.locator('#message').count(), 0);
  const start = page.locator('.live-voice').getByRole('button', { name: 'Start conversation', exact: true });
  await start.click();
  await page.getByRole('button', { name: 'Mute microphone' }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
  socket.send(JSON.stringify({ serverContent: { inputTranscription: { text: 'I helped at the community centre.' }, turnComplete: true } }));
  await page.getByRole('button', { name: 'View transcript (1 turn)' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'View transcript (1 turn)' }).getAttribute('aria-expanded'), 'false', 'Transcript stays collapsed during voice activity');
  await page.screenshot({ path: '/tmp/access-interview-voice-1280.png', fullPage: true });

  await page.locator('.interview-mode label').filter({ hasText: 'Type' }).click();
  await page.getByText('Stop the live voice conversation and switch to Text?', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.liveTracks.some((track) => track.readyState === 'live')), true, 'Voice is not stopped before confirmation');
  await page.getByRole('button', { name: 'Keep using Voice' }).click();
  assert.equal(await page.getByRole('button', { name: 'Mute microphone' }).isEnabled(), true, 'Cancel keeps the session active');
  await page.locator('.interview-mode label').filter({ hasText: 'Type' }).click();
  await page.getByRole('button', { name: 'Stop voice and switch' }).click();
  await page.getByLabel('Add to your story').waitFor();
  await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
  assert.equal(socketClosed, true, 'Confirmed switch closes the Live session');
  assert.equal(await page.locator('#message').inputValue(), 'An unsent text note.');
  assert.equal(await page.locator('.note-item.confirmed').count(), 1, 'Confirmed Canvas evidence survives switching');

  await page.locator('.interview-mode label').filter({ hasText: 'Speak' }).click();
  await page.locator('.live-voice').getByRole('button', { name: 'Start conversation', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.live-actions button[aria-pressed]').disabled);
  await page.getByRole('button', { name: 'Choose a role' }).click();
  await page.waitForFunction(() => window.liveTracks.every((track) => track.readyState === 'ended'));
  await page.getByRole('button', { name: /Back to your story/ }).click();
  await page.locator('.interview-mode label').filter({ hasText: 'Type' }).click();
  assert.equal(await page.getByText('Stop the live voice conversation and switch to Text?', { exact: true }).count(), 0, 'Leaving the interview stops Live and clears active-session state');

  await page.waitForFunction(() => JSON.parse(localStorage.getItem('access-candidate-v1')).profile.preferences.interviewMode === 'text');

  await page.reload();
  await page.getByRole('button', { name: 'Continue in text', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Use voice instead' }).count(), 1, 'Saved Text choice is honoured on return');
  await page.getByRole('button', { name: 'Continue in text', exact: true }).click();
  await page.getByRole('radio', { name: 'Type' }).waitFor();
  assert.equal(await page.getByRole('radio', { name: 'Type' }).isChecked(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(await page.evaluate(() => window.liveTracks.map((track) => track.readyState)), [], 'Returning to Text does not request microphone access');
  console.log('Interview mode browser: PASS (exclusive interfaces, saved Text, shared Canvas, collapsed transcript, confirmed Live shutdown)');
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 320, height: 900 } });
  await mobile.route('**/api/conversation', (route) => route.fulfill({ json: {
    reply: 'What would you like to share?', history: [{ id: 'mobile-q', role: 'assistant', content: 'What would you like to share?' }], suggestions: [],
    toolTrace: { selected: false, functionName: null, arguments: [], dispatched: false, outcome: 'no_tool_selected' }, interview: { status: 'active', questions: 1, answered: 0, limit: 12 },
  } }));
  await mobile.goto(baseURL);
  await mobile.locator('.preferences summary').click();
  await mobile.getByRole('radio', { name: /Simple/ }).check();
  await mobile.locator('.preferences summary').click();
  await mobile.getByRole('button', { name: 'Start a conversation', exact: true }).click();
  assert.equal(await mobile.locator('.canvas-companion > summary').isVisible(), true, 'Compact profile summary stays available on mobile');
  await mobile.locator('.canvas-companion > summary').click();
  assert.equal(await mobile.locator('.canvas-companion').evaluate((element) => element.open), true, 'Mobile profile expands on request');
  assert.equal(await mobile.getByRole('radio', { name: 'Speak' }).isVisible(), true, 'Mode control stays accessible while profile is expanded');
  await mobile.screenshot({ path: '/tmp/access-interview-canvas-320.png', fullPage: true });
  await mobile.locator('.interview-mode label').filter({ hasText: 'Type' }).click();
  await mobile.getByLabel('Add to your story').waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Mobile mode selector and interview have no horizontal overflow');
  await mobile.close();
} finally { await browser.close(); }
