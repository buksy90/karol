// Checks that every path listed in a "## Code" section of a capability spec exists.
// A spec without a Code section, or an entry pointing at nothing, fails the check.
// Paths may end in a wildcard file name such as levels/*.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specsDir = path.join(root, 'openspec', 'specs');

function exists(ref) {
  if (!ref.includes('*')) return fs.existsSync(path.join(root, ref));
  const dir = path.join(root, path.dirname(ref));
  const pattern = new RegExp('^' + path.basename(ref).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return fs.existsSync(dir) && fs.readdirSync(dir).some(name => pattern.test(name));
}

let problems = 0, checked = 0;
for (const name of fs.readdirSync(specsDir).sort()) {
  const file = path.join(specsDir, name, 'spec.md');
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const section = text.match(/^## Code\s*$([\s\S]*?)(?=^## )/m);
  if (!section) { console.log(`${name}: no "## Code" section`); problems++; continue; }
  const refs = [...section[1].matchAll(/^- `([^`]+)`/gm)].map(m => m[1]);
  if (!refs.length) { console.log(`${name}: "## Code" section lists no paths`); problems++; continue; }
  for (const ref of refs) {
    checked++;
    if (!exists(ref)) { console.log(`${name}: ${ref} does not exist`); problems++; }
  }
}

if (problems) { console.log(`\n${problems} problem(s)`); process.exit(1); }
console.log(`All ${checked} code references in the specs exist.`);
