// Levels: {id, name, map} where map is a list of text rows.
import type { Level } from './types.ts';

/** Bumped when the built-in levels change, so stored copies of them are replaced. */
export const BUILTIN_VERSION = '5';

/** Validate anything that claims to be a level and fill in a missing id or name. Throws on a bad map. */
export function normLevel(l: unknown, i: number): Level {
  const raw = l as Partial<Record<keyof Level, unknown>> | null;
  if (!raw || typeof raw !== 'object') throw Error('Level ' + i + ' is not an object');
  let m = raw.map;
  if (typeof m === 'string') m = m.split('\n');
  if (!Array.isArray(m) || !m.length || m.some(r => typeof r !== 'string')) throw Error('Level ' + i + ': map must be an array of strings');
  if (m.join('').split('K').length !== 2) throw Error('Level ' + i + ': map needs exactly one K (robot)');
  return { id: String(raw.id || ('level-' + Date.now() + '-' + i)), name: String(raw.name || ('Level ' + (i + 1))), map: m };
}

/**
 * The level list at start-up. With a matching version the stored list is used as it is;
 * otherwise the built-ins come first and replace stored levels with the same id.
 */
export function initialLevels(storedJson: string | null, storedVersion: string | null, builtIns: unknown[]): { levels: Level[]; versionChanged: boolean } {
  let stored: Level[] = [];
  try { const j: unknown = JSON.parse(storedJson as string); if (Array.isArray(j)) stored = j.map(normLevel); } catch (e) { /* ignore bad data */ }
  const defs = builtIns.map(normLevel);
  if (storedVersion === BUILTIN_VERSION) return { levels: stored.length ? stored : defs, versionChanged: false };
  return { levels: defs.concat(stored.filter(l => !defs.some(d => d.id === l.id))), versionChanged: true };
}

/**
 * Validate everything first, then merge by id into `levels`.
 * @param arg an array of levels, or the same as JSON text
 * @returns the number imported
 */
export function mergeImported(levels: Level[], arg: unknown): number {
  const arr: unknown = typeof arg === 'string' ? JSON.parse(arg) : arg;
  if (!Array.isArray(arr)) throw Error('importLevels expects an array');
  const add = arr.map(normLevel);
  add.forEach(l => { const i = levels.findIndex(x => x.id === l.id); if (i >= 0) levels[i] = l; else levels.push(l); });
  return add.length;
}

/** Size as shown in the level list, e.g. "15x4". */
export const levelSize = (l: Level): string => Math.max(...l.map.map(r => r.length)) + 'x' + l.map.length;

/** Built-in level files in name order, numbers compared as numbers (level-10 after level-9). */
export function orderByFileName<T>(files: Record<string, T>): T[] {
  return Object.keys(files)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(k => files[k]);
}
