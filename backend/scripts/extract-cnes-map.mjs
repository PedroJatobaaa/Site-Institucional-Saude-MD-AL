import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const xml = fs.readFileSync(path.join(root, 'xmlprofissionaiscnes.xml'), 'utf8');
const re = /NM_FANTA="([^"]+)"[^>]*CNES="(\d+)"/g;
const map = new Map();
let m;
while ((m = re.exec(xml))) {
  map.set(m[2], m[1]);
}
const out = path.join(root, 'backend/src/data/cnesEstabelecimentos.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(Object.fromEntries(map), null, 2));
console.log(`Wrote ${map.size} entries to ${out}`);
