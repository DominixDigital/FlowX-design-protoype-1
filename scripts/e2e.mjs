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
const go = async (r) => { await page.goto(`${base}/#${r}`); await page.waitForTimeout(500); };
const step = async (name, fn) => { try { await fn(); console.log('✓', name); } catch (e) { console.log('✗', name, '-', e.message.split('\n')[0]); await page.screenshot({ path: `fail-${name.replace(/\W+/g, '_')}.png` }); } };
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
  await page.getByRole('button', { name: 'Close Huddle' }).click();
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
  await page.getByRole('button', { name: 'Draft with Huddle' }).click();
  await page.getByRole('button', { name: 'Insert into coach comment' }).click();
  await page.getByRole('button', { name: 'Close Huddle' }).click();
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
  await page.evaluate(() => { const k = 'flowx-proto-v1:sim'; const s = JSON.parse(localStorage.getItem(k)); s.conflictOnSync = true; localStorage.setItem(k, JSON.stringify(s)); });
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
  await page.evaluate(() => { const k = 'flowx-proto-v1:personas'; const s = JSON.parse(localStorage.getItem(k)); s.coach.personId = 'p-arjun'; localStorage.setItem(k, JSON.stringify(s)); });
  await go('/coach/tasks/t-101'); await page.reload(); await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Prototype controls' }).click();
  await page.getByRole('button', { name: /Cancel Kabir’s throwdown task/ }).click();
  await expectText('This task was cancelled');
});
await step('athlete: feedback withdrawn state', async () => {
  await go('/athlete/feedback/f-3');
  await expectText('Your coach withdrew this feedback');
});
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
