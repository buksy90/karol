// Levels: {id, name, map} where map is a list of text rows, with optional items and flags.
import { toHex } from './colors.ts';
import type { Flag, Level, Position, SprayItem } from './types.ts';

/** Bumped when the built-in levels change, so stored copies of them are replaced. */
export const BUILTIN_VERSION = '6';

const MAX_USES = 99;

const isPosition = (p: unknown): p is Position => Array.isArray(p) && p.length === 2 && p.every(n => Number.isInteger(n));
const isObject = (o: unknown): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o);

/** The list under `items` or `flags`: missing is no entries, anything but a list is an error. */
function listOf(raw: unknown, name: string, level: string): unknown[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw Error(level + ': ' + name + ' must be an array');
  return raw;
}

/** Validate the sprays of a level. `cell` gives the map symbol at a position, undefined off the map. */
function normItems(raw: unknown, cell: (p: Position) => string | undefined, level: string): SprayItem[] {
  const taken = new Set<string>();
  return listOf(raw, 'items', level).map((item, j) => {
    const bad = (what: string) => Error(level + ': item ' + j + ' ' + what);
    if (!isObject(item)) throw bad('is not an object');
    const { type, position, color, uses } = item;
    if (type !== 'spray') throw bad('has an unknown type');
    if (!isPosition(position)) throw bad('needs a position [x, y]');
    if (cell(position) !== ' ') throw bad('must lie on plain floor');
    if (taken.has(position.join())) throw bad('shares its cell with another item');
    taken.add(position.join());
    if (typeof color !== 'string' || !toHex(color)) throw bad('has an unknown color');
    if (!Number.isInteger(uses) || (uses as number) < 1 || (uses as number) > MAX_USES) throw bad('needs uses from 1 to ' + MAX_USES);
    return { type, position: [position[0], position[1]], color, uses: uses as number };
  });
}

/** Validate the flags of a level. */
function normFlags(raw: unknown, cell: (p: Position) => string | undefined, level: string): Flag[] {
  return listOf(raw, 'flags', level).map((flag, j) => {
    const bad = (what: string) => Error(level + ': flag ' + j + ' ' + what);
    if (!isObject(flag)) throw bad('is not an object');
    const { position, colors, onDrawn } = flag;
    if (!isPosition(position)) throw bad('needs a position [x, y]');
    if (!Array.isArray(colors) || !colors.length || colors.some(row => !Array.isArray(row) || !row.length || row.length !== colors[0].length))
      throw bad('needs colors as rows of the same length');
    const rows = colors as unknown[][];
    if (rows.some(row => row.some(color => typeof color !== 'string' || !toHex(color)))) throw bad('has an unknown color');
    const [x, y] = position;
    if (rows.some((row, dy) => row.some((_, dx) => !' K'.includes(cell([x + dx, y + dy]) || 'W')))) throw bad('must cover only plain floor');
    const door = isObject(onDrawn) ? onDrawn.unlockDoor : undefined;
    if (!isPosition(door)) throw bad('needs onDrawn.unlockDoor [x, y]');
    if (cell(door) !== 'L') throw bad('must unlock a locked door');
    return { position: [x, y], colors: rows.map(row => [...row] as string[]), onDrawn: { unlockDoor: [door[0], door[1]] } };
  });
}

/** Validate anything that claims to be a level and fill in a missing id or name. Throws on a bad map, item or flag. */
export function normLevel(l: unknown, i: number): Level {
  const raw = l as Partial<Record<keyof Level, unknown>> | null;
  if (!raw || typeof raw !== 'object') throw Error('Level ' + i + ' is not an object');
  let m = raw.map;
  if (typeof m === 'string') m = m.split('\n');
  if (!Array.isArray(m) || !m.length || m.some(r => typeof r !== 'string')) throw Error('Level ' + i + ': map must be an array of strings');
  if (m.join('').split('K').length !== 2) throw Error('Level ' + i + ': map needs exactly one K (robot)');
  const map: string[] = m, cols = Math.max(...map.map(r => r.length));
  // the symbol at a position, with short rows padded with floor as the world pads them
  const cell = ([x, y]: Position) => x >= 0 && x < cols && y >= 0 && y < map.length ? map[y][x] || ' ' : undefined;
  const level: Level = { id: String(raw.id || ('level-' + Date.now() + '-' + i)), name: String(raw.name || ('Level ' + (i + 1))), map };
  const items = normItems(raw.items, cell, 'Level ' + i), flags = normFlags(raw.flags, cell, 'Level ' + i);
  if (items.length) level.items = items;
  if (flags.length) level.flags = flags;
  return level;
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
