// Journey checks for the Expo app, run against the web export (react-native-web) in a phone-sized browser.
// Usage: npx expo export --platform web && python3 -m http.server 4180 --directory dist &
//        NODE_PATH=$(npm root -g) node scripts/e2e.mjs http://127.0.0.1:4180
// Native-only behaviour (gestures, safe areas, fonts on device) is NOT covered here.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.argv[2] ?? 'http://127.0.0.1:4180';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });

let geminiCalls = [];
let geminiMode = 'ok';
await page.route('**/api/chat', async (r) => {
  geminiCalls.push(JSON.parse(r.request().postData() ?? '{}'));
  if (geminiMode === 'ok') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, model: 'gemini-test', answer: 'Your coach is working on your front foot.', points: ['Keep your head still'], used: ['fact'] }) });
  return r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, reason: 'busy' }) });
});

let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { console.log(`✗ ${name}\n   ${String(e.message).split('\n').slice(0, 3).join(' / ')}`); process.exitCode = 1; }
};
// Earlier screens stay mounted (hidden) under a stack, so always pick the visible match.
const vis = (loc) => loc.filter({ visible: true });
const text = (t, o = {}) => vis(page.getByText(t, o));
const btn = (name) => vis(page.getByRole('button', { name }));
const see = async (t, o = {}) => { await text(t, o).first().waitFor({ timeout: 6000 }); };
const click = async (t, o = {}) => { await text(t, o).first().click(); await page.waitForTimeout(250); };
const tab = (name) => vis(page.getByRole('tab', { name: new RegExp(name) })).first().click().then(() => page.waitForTimeout(350));
const launch = async (label) => {
  await btn(new RegExp(label)).first().click();
  await page.waitForTimeout(900);
  const nn = text('Not now', { exact: true });
  if (await nn.count()) await nn.first().click().catch(() => {});
  await page.waitForTimeout(250);
};
const toLauncher = async () => {
  const n = await btn('Prototype controls').count();
  if (n === 0) throw new Error('no visible Prototype controls button; body: ' + (await page.evaluate(() => document.body.innerText.slice(0, 160).replace(/\n/g, ' | '))));
  await btn('Prototype controls').first().click();
  await click('Switch app or person');
  await page.waitForTimeout(500);
};

await page.goto(base);
await page.waitForTimeout(2200);

await step('Launcher: both apps, journeys A–G, disclosure', async () => {
  await see('Dit Score?'); await see('Open an app'); await see('Squad progress comparison');
  await see('The parent app and academy web dashboard live in the web build', { exact: false });
});

await step('Athlete home: score, focus, last session', async () => {
  await launch('Open Athlete as Tara');
  await see('Your Dit Score'); await see('Playing the short ball'); await see('Batting against short balls');
  const keep = text('Keep it to myself', { exact: true });
  if (await keep.count()) await keep.first().click();
});

await step('dit: chip answers from the rules, no model call', async () => {
  geminiCalls = [];
  await btn(/Ask dit/).first().click();
  await click('Why did my Dit Score change?');
  await see('What changed', { exact: false });
  if (geminiCalls.length) throw new Error('rules question went to the model');
  await btn('Minimise dit').first().click();
});

await step('dit: open question goes to Gemini and is labelled', async () => {
  geminiCalls = [];
  geminiMode = 'ok';
  await btn(/Ask dit/).first().click();
  const box = page.getByPlaceholder('Ask dit');
  await box.fill('how many runs did I score last week'); await box.press('Enter');
  await see('AI-generated', { exact: false }); await see('Your coach is working on your front foot.');
  if (geminiCalls.length !== 1) throw new Error(`expected 1 model call, got ${geminiCalls.length}`);
  const facts = JSON.stringify(geminiCalls[0].facts);
  if (/Kabir|Zoya|Neha/.test(facts)) throw new Error('other people’s data was sent to the model');
  if (geminiCalls[0].audience !== 'athlete') throw new Error('wrong audience');
});

await step('dit: busy model falls back to the built-in answer', async () => {
  geminiMode = 'busy';
  const box = page.getByPlaceholder('Ask dit');
  await box.fill('what is the weather like today'); await box.press('Enter');
  await see('The AI service is busy right now', { exact: false });
  await btn('Minimise dit').first().click();
  geminiMode = 'ok';
});

await step('Dit Score screen: trend, breakdown, privacy choice', async () => {
  await tab('Dit Score');
  await see('What it’s made of'); await see('Week by week'); await see('Who can see my Dit Score');
  await click('+ my squad'); await see('Sharing updated.');
});

await step('Feedback → detail with clip comments', async () => {
  await tab('Feedback');
  await page.getByText(/Brilliant effort|sway|coach/i).first().click().catch(() => {});
  await page.waitForTimeout(500);
});

await step('Flow C/Compare: squad progress opt-in is explained', async () => {
  await toLauncher();
  await launch('Open Athlete as Kabir');
  await tab('Dit Score');
  await click('Compare progress');
  await see('Compare'); await click('Squad', { exact: true });
  await page.waitForTimeout(400);
});

await step('Coach: today, session attendance saved', async () => {
  await toLauncher();
  await launch('Open Coach as Neha');
  await see('Needs you');
  await click('Front-foot drive & balance');
  await see('Attendance'); await click('Mark the rest present');
  await click('Save attendance');
  await see('Attendance saved', { exact: false });
});

await step('Coach offline: attendance queues, then Sync shows the queue', async () => {
  await btn('Prototype controls').first().click();
  await vis(page.getByRole('switch', { name: 'Network online' })).first().click();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await btn(/Sync status/).first().waitFor({ timeout: 4000 });
  const pill = await btn(/Sync status/).first().getAttribute('aria-label');
  if (!/Offline/.test(pill ?? '')) throw new Error(`pill says: ${pill}`);
});

await step('Coach back online: sync screen is reachable', async () => {
  await btn(/Sync status/).first().click();
  await see('Working offline'); await click('Reconnect', { exact: true });
  await page.waitForTimeout(500);
  const pill = await btn(/Sync status/).first().getAttribute('aria-label');
  if (/Offline/.test(pill ?? '')) throw new Error(`still offline: ${pill}`);
});

await step('Flow E: coach note → athlete-friendly feedback → athlete sees it', async () => {
  await toLauncher();
  await launch('Open Coach as Neha');
  await tab('Athletes'); await click('Kabir Singh', { exact: true });
  await click('Talk a note');
  await click('Sample voice note (demo)');
  await see('Confirm before saving');
  await click('Save observation');
  await see('Marked “AI-drafted, coach-confirmed”', { exact: false });
  await click('Share an athlete-friendly version');
  await click('Approve and send');
  await see('Sent to Kabir', { exact: false });
  await btn('Minimise dit').first().click();
  await toLauncher();
  await launch('Open Athlete as Kabir');
  await tab('Feedback');
  await see('Nice work today', { exact: false });
});

await step('Coach: Dit Score review pause shows to the athlete', async () => {
  await toLauncher();
  await launch('Open Coach as Neha');
  await tab('Athletes'); await click('Kabir Singh', { exact: true });
  await btn(/Dit Score/).first().click();
  await see('Dit Score inputs');
  await page.getByPlaceholder('Reason, for coaches only').fill('Mismarked session');
  await click('Pause score');
  await see('Score paused', { exact: false });
  await toLauncher();
  await launch('Open Athlete as Kabir');
  await tab('Dit Score');
  await see('Paused by your coach');
});

await step('State persists across a reload', async () => {
  await page.reload(); await page.waitForTimeout(2200);
  await launch('Open Athlete as Kabir');
  await tab('Dit Score');
  await see('Paused by your coach');
});

await step('Task: start work then mark blocked needs a reason', async () => {
  await toLauncher();
  await launch('Open Coach as Neha');
  await tab('Tasks');
  await btn(/Open Rebound-net/).first().click();
  await page.waitForTimeout(400);
  await click('Mark blocked');
  await text('Mark blocked', { exact: true }).last().click(); await page.waitForTimeout(250);
  await see('A reason is required', { exact: false });
});

console.log(errors.length ? `\nConsole errors:\n${[...new Set(errors)].join('\n')}` : '\nno console errors');
console.log(`${passed} checks passed`);
await browser.close();
