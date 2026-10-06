// Extract the pinned source into a new isolated directory; never edit a checkout or existing data.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const baseline = 'f41f7db45e6a2ecf593241288b6ba5f02c405c71';
const repository = fileURLToPath(new URL('../../../../', import.meta.url));
const [destination] = process.argv.slice(2);
if (!destination) throw new Error('Usage: prepare-legacy.mjs NEW_ISOLATED_DIRECTORY');
const root = resolve(destination);
const revision = spawnSync('git', ['rev-parse', baseline], { cwd: repository, encoding: 'utf8' });
if (revision.status !== 0 || revision.stdout.trim() !== baseline) throw new Error('Pinned legacy revision unavailable');
mkdirSync(root); // Refuse reuse, including an existing empty directory.
const archive = spawn('git', ['archive', baseline], { cwd: repository, stdio: ['ignore', 'pipe', 'inherit'] });
const extracted = spawn('tar', ['-xf', '-', '-C', root], { stdio: ['pipe', 'inherit', 'inherit'] });
archive.stdout.pipe(extracted.stdin);
const exits = await Promise.all([archive, extracted].map(child => new Promise((resolveExit, reject) => {
  child.once('error', reject);
  child.once('exit', resolveExit);
})));
if (exits.some(code => code !== 0)) throw new Error('Legacy archive extraction failed');
copyFileSync(new URL('./legacy-fixture-worker.ts.txt', import.meta.url), resolve(root, 'packages/workshop-backend/src/book-fixture-worker.ts'));
writeFileSync(resolve(root, '.book-fixture-provenance.json'), JSON.stringify({ baseline }) + '\n', { flag: 'wx' });
console.log('Prepared pinned legacy source:', root);
