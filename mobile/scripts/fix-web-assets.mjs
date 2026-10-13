// Static hosts (Vercel among them) won't serve paths containing "node_modules". After `expo export --platform web`,
// move dist/assets/node_modules to dist/assets/vendor and rewrite the references in the JS bundles.
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const from = join(dist, 'assets', 'node_modules');
if (existsSync(from)) renameSync(from, join(dist, 'assets', 'vendor'));
const jsDir = join(dist, '_expo', 'static', 'js', 'web');
let n = 0;
for (const f of existsSync(jsDir) ? readdirSync(jsDir) : []) {
  const p = join(jsDir, f);
  const s = readFileSync(p, 'utf8');
  const t = s.split('/assets/node_modules/').join('/assets/vendor/');
  if (t !== s) { writeFileSync(p, t); n++; }
}
console.log(`fix-web-assets: rewrote ${n} bundle(s)`);
