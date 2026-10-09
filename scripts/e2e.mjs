// End-to-end check of the signature loop across all four surfaces.
// Usage: npm run dev, then: node scripts/e2e.mjs http://127.0.0.1:5173
// Needs Playwright (npm i -D playwright, or set PW to a global install path).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const base = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const go = async (r) => {
  await page.goto(`${base}/#${r}`); await page.waitForTimeout(500);
  // First visit to each app shows dit's intro (Flow A); dismiss it.
  const notNow = page.getByRole('button', { name: 'Not now' });
  if (await notNow.count()) { await notNow.first().click(); await page.waitForTimeout(150); }
};
const step = async (name, fn) => { try { await fn(); console.log('✓', name); } catch (e) { console.log('✗', name, '-', e.message.split('\n')[0]); await page.screenshot({ path: `/tmp/claude-0/-home-user-FlowX-design-protoype-1/f668c462-61f6-5788-a05d-4ae4d8b0dff3/scratchpad/shots/fail-${name.replace(/\W+/g, '_')}.png` }); } };
const expectText = async (t) => { await page.getByText(t, { exact: false }).first().waitFor({ timeout: 5000 }); };

await go('/'); await page.evaluate(() => localStorage.clear()); await go('/');

await step('coach: attendance saved', async () => {
  await go('/coach/session/s-1005');
  await page.getByRole('button', { name: 'Mark the rest present' }).click();
  await page.getByRole('button', { name: /Save attendance/ }).click();
  await expectText('Attendance saved: 6 present');
});
await step('coach: voice note → confirmed observation', async () => {
  await go('/coach/athlete/a-kabir?session=s-1005');
  await page.getByRole('button', { name: 'Talk a note' }).click();
  await page.getByRole('button', { name: 'Sample voice note (demo)' }).click();
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expectText('Marked “AI-drafted, coach-confirmed”');
  await page.getByRole('button', { name: 'Minimise dit' }).click();
  await expectText('Head stayed still on the drive this time');
});
await step('coach: reassessment submitted', async () => {
  await go('/coach/reassess/r-1');
  await page.getByLabel('What you saw today').fill('Head still on 7 of 10 drives, still reaching for wide balls.');
  await page.getByText('Improving', { exact: true }).click();
  await page.getByLabel('Milestone').fill('Still head on 7 of 10 drives');
  await page.getByRole('button', { name: 'Submit for approval' }).click();
  await expectText('Submitted. Waiting for head coach approval');
});
await step('web: head coach approves', async () => {
  await go('/web/reassessments/r-1');
  await page.getByRole('button', { name: 'Approve' }).click();
  await expectText('Approved with a milestone');
});
await step('web: report drafted with Huddle, approved, shared', async () => {
  await go('/web/reports?athlete=a-kabir');
  await page.getByRole('button', { name: 'Start October report' }).click();
  await page.getByRole('button', { name: 'Pull latest' }).click();
  await page.getByRole('button', { name: 'Draft with dit' }).click();
  await page.getByRole('button', { name: 'Insert into coach comment' }).click();
  await page.getByRole('button', { name: 'Minimise dit' }).click();
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expectText('Draft saved');
  await page.getByRole('button', { name: /^Approve/ }).click();
  await page.getByRole('button', { name: 'Share with family' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Share report' }).click();
  await expectText('Guardians have been notified');
});
await step('parent: notification deep link opens the new report', async () => {
  await go('/parent/notifications');
  await page.getByText('October 2026 report is ready').first().click();
  await expectText('Progress report · October 2026');
  await expectText('Still head on 7 of 10 drives');
});
await step('web: timeline shows mobile observation (HC01.07)', async () => {
  await go('/web/athletes/a-kabir');
  await expectText('Head stayed still on the drive this time');
});
await step('offline: note queued, then syncs on reconnect', async () => {
  await go('/coach/sync');
  await page.getByRole('button', { name: 'Go offline' }).click();
  await go('/coach/capture?mode=note&athlete=a-zoya');
  await page.getByLabel('Observation').fill('Run-up held together for the whole spell today.');
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expectText('Saved offline');
  await go('/coach/sync');
  await expectText('Working offline');
  await page.getByRole('button', { name: 'Reconnect' }).click();
  await expectText('All synced');
});
await step('conflict: attendance conflict resolved explicitly', async () => {
  await page.evaluate(() => { const k = 'ditdit-proto-v2:sim'; const s = JSON.parse(localStorage.getItem(k)); s.conflictOnSync = true; localStorage.setItem(k, JSON.stringify(s)); });
  await go('/coach/session/s-1005');
  await page.reload(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Kabir Singh absent' }).click();
  await page.getByRole('button', { name: /Save corrections/ }).click();
  await expectText('Someone changed this attendance');
  await go('/coach/sync');
  await page.getByRole('button', { name: 'Keep server' }).click();
  await expectText('Server version kept');
});
await step('stale: task cancelled server-side blocks commit', async () => {
  await page.evaluate(() => { const k = 'ditdit-proto-v2:personas'; const s = JSON.parse(localStorage.getItem(k)); s.coach.personId = 'p-arjun'; localStorage.setItem(k, JSON.stringify(s)); });
  await go('/coach/tasks/t-101'); await page.reload(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Prototype controls' }).click();
  await page.getByRole('button', { name: /Cancel Kabir’s throwdown task/ }).click();
  await expectText('This task was cancelled');
});
await step('athlete: feedback withdrawn state', async () => {
  await go('/athlete/feedback/f-3');
  await expectText('Your coach withdrew this feedback');
});

await step('Flow A: intro shows once and can be dismissed', async () => {
  await page.evaluate(() => { const k = 'ditdit-proto-v2:personas'; const s = JSON.parse(localStorage.getItem(k)); s.athlete.personId = 'p-tara'; localStorage.setItem(k, JSON.stringify(s)); });
  await page.goto(`${base}/#/athlete?intro=1`); await page.reload(); await page.waitForTimeout(500);
  await expectText('Hi, I’m dit.');
  await page.getByRole('button', { name: 'What’s my Dit Score?' }).click();
  await expectText('Your Dit Score is');
  await page.getByRole('button', { name: 'Minimise dit' }).click();
});
await step('Flow C: why did my Dit Score change', async () => {
  await go('/athlete/score');
  await page.getByRole('button', { name: 'Why did it change?' }).click();
  await expectText('What changed');
  await page.getByRole('button', { name: 'Minimise dit' }).click();
});
await step('Flow B: explain my mistake', async () => {
  await go('/athlete/session/s-0991');
  await page.getByRole('button', { name: 'What should I improve?' }).first().click();
  await page.getByRole('button', { name: 'Show me the mistake' }).click();
  await expectText('You turn your head away here');
  await page.getByRole('button', { name: 'Minimise dit' }).click();
});
await step('Flow D: milestone share needs a guardian (under 16)', async () => {
  await go('/athlete?milestone=1');
  await page.getByRole('button', { name: 'Share it' }).click();
  await page.getByRole('button', { name: 'Ask a parent to approve' }).click();
  await expectText('Nothing is shared until they say yes');
  await go('/parent?child=a-tara');
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await expectText('shared with their squad');
});
await step('Flow E: coach approves athlete-friendly feedback', async () => {
  await page.evaluate(() => { const k = 'ditdit-proto-v2:personas'; const s = JSON.parse(localStorage.getItem(k)); s.coach.personId = 'p-neha'; localStorage.setItem(k, JSON.stringify(s)); });
  await go('/coach/athlete/a-kabir?session=s-1005'); await page.reload(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Talk a note' }).click();
  await page.getByRole('button', { name: 'Sample voice note (demo)' }).click();
  await page.getByRole('button', { name: 'Save observation' }).click();
  await page.getByRole('button', { name: 'Share an athlete-friendly version' }).click();
  await page.getByRole('button', { name: 'Approve and send' }).click();
  await expectText('Sent to Kabir');
});
await step('Flow F: parent explanation', async () => {
  await go('/parent?child=a-kabir');
  await page.getByRole('button', { name: 'Explain it simply' }).click();
  await expectText('isn’t a measure of talent');
  await page.getByRole('button', { name: 'Minimise dit' }).click();
});
await step('Flow G: comparison eligibility', async () => {
  await go('/athlete/score/compare');
  await page.getByRole('tab', { name: 'Squad progress' }).click();
  await expectText('hasn’t turned on squad comparison');
  await page.evaluate(() => { const k = 'ditdit-proto-v2:personas'; const s = JSON.parse(localStorage.getItem(k)); s.athlete.personId = 'p-kabir'; localStorage.setItem(k, JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(400);
  const nn = page.getByRole('button', { name: 'Not now' }); if (await nn.count()) await nn.first().click();
  await page.getByRole('tab', { name: 'Squad progress' }).click();
  await expectText('Progress over 4 weeks');
});
await step('Coach score review: pause shows on athlete', async () => {
  await go('/coach/athlete/a-kabir/score');
  await page.getByLabel('Pause the score').fill('Session on 2 Oct mismarked');
  await page.getByRole('button', { name: 'Pause score' }).click();
  await go('/athlete/score');
  await expectText('Paused by your coach');
});
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
