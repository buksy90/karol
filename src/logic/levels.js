// Levels: {id, name, map} where map is a list of text rows.

export const BUILTIN_VERSION = '5';

export function normLevel(l, i) {
  if (!l || typeof l !== 'object') throw Error('Level ' + i + ' is not an object');
  let m = l.map;
  if (typeof m === 'string') m = m.split('\n');
  if (!Array.isArray(m) || !m.length || m.some(r => typeof r !== 'string')) throw Error('Level ' + i + ': map must be an array of strings');
  if (m.join('').split('K').length !== 2) throw Error('Level ' + i + ': map needs exactly one K (robot)');
  return { id: String(l.id || ('level-' + Date.now() + '-' + i)), name: String(l.name || ('Level ' + (i + 1))), map: m };
}

// The level list at start-up. With a matching version the stored list is used as it is;
// otherwise the built-ins come first and replace stored levels with the same id.
export function initialLevels(storedJson, storedVersion, builtIns) {
  let stored = [];
  try { const j = JSON.parse(storedJson); if (Array.isArray(j)) stored = j.map(normLevel); } catch (e) { /* ignore bad data */ }
  const defs = builtIns.map(normLevel);
  if (storedVersion === BUILTIN_VERSION) return { levels: stored.length ? stored : defs, versionChanged: false };
  return { levels: defs.concat(stored.filter(l => !defs.some(d => d.id === l.id))), versionChanged: true };
}

// Validate everything first, then merge by id into `levels`. Returns the number imported.
export function mergeImported(levels, arg) {
  const arr = typeof arg === 'string' ? JSON.parse(arg) : arg;
  if (!Array.isArray(arr)) throw Error('importLevels expects an array');
  const add = arr.map(normLevel);
  add.forEach(l => { const i = levels.findIndex(x => x.id === l.id); if (i >= 0) levels[i] = l; else levels.push(l); });
  return add.length;
}

export const levelSize = l => Math.max(...l.map.map(r => r.length)) + 'x' + l.map.length;

// Built-in level files in name order, numbers compared as numbers (level-10 after level-9).
export function orderByFileName(files) {
  return Object.keys(files)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(k => files[k]);
}
