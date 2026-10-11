import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_VERSION, initialLevels, levelSize, mergeImported, normLevel, orderByFileName } from '../../src/logic/levels.ts';
import { parseMap } from '../../src/logic/world.ts';
import type { Level } from '../../src/logic/types.ts';

const MAP = ['WWWWW', 'WK eW', 'WWWWW'];
const level = (id: string, name = id, map = MAP): Level => ({ id, name, map });
/** Seven levels with the ids and names of the ones the game ships. */
const builtIns = (): Level[] => Array.from({ length: 7 }, (_, i) => level('level-' + (i + 1), 'Level ' + (i + 1)));

afterEach(() => { vi.useRealTimers(); });

describe('levels: Level format', () => {
  it('Minimal level', () => {
    const l = normLevel({ id: 'level-1', name: 'Level 1', map: ['WWWWW', 'WK eW', 'WWWWW'] }, 0);
    expect(l).toEqual({ id: 'level-1', name: 'Level 1', map: ['WWWWW', 'WK eW', 'WWWWW'] });
    const world = parseMap(l.map);
    expect([world.cols, world.rows]).toEqual([5, 3]);
    expect(world.robot).toMatchObject({ x: 1, y: 1 });
    expect(world.grid[1][3]).toBe('e');
  });
});

describe('levels: Level validation', () => {
  it('No robot start', () => {
    expect(() => normLevel({ id: 'a', name: 'A', map: ['WWW', 'W W', 'WWW'] }, 2))
      .toThrow('Level 2: map needs exactly one K (robot)');
  });

  it('Map given as one text', () => {
    expect(normLevel({ id: 'a', name: 'A', map: 'WWWW\nWK W\nWWWW' }, 0).map).toEqual(['WWWW', 'WK W', 'WWWW']);
  });

  it('No exit', () => {
    expect(normLevel({ id: 'a', name: 'A', map: ['WWWW', 'WK W', 'WWWW'] }, 0).map).toHaveLength(3);
  });

  it('rejects two robot starts', () => {
    expect(() => normLevel({ map: ['KK'] }, 0)).toThrow('exactly one K');
  });

  it('rejects what is not an object', () => {
    for (const bad of [null, undefined, 'WKW', 7]) {
      expect(() => normLevel(bad, 4)).toThrow('Level 4 is not an object');
    }
  });

  it('rejects a map that is missing, empty or not text rows', () => {
    for (const map of [undefined, [], [['W', 'K']], ['WKW', 5], 42, {}]) {
      expect(() => normLevel({ id: 'a', name: 'A', map }, 1)).toThrow('Level 1: map must be an array of strings');
    }
  });

  it('fills in a missing id and name', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1234);
    expect(normLevel({ map: ['K'] }, 2)).toEqual({ id: 'level-1234-2', name: 'Level 3', map: ['K'] });
  });

  it('turns an id or name that is not text into text', () => {
    expect(normLevel({ id: 12, name: 3, map: ['K'] }, 0)).toEqual({ id: '12', name: '3', map: ['K'] });
  });

  it('keeps only id, name and map', () => {
    expect(Object.keys(normLevel({ id: 'a', name: 'A', map: ['K'], author: 'me' }, 0)).sort()).toEqual(['id', 'map', 'name']);
  });

  it('accepts any symbols and rows of any length', () => {
    expect(normLevel({ id: 'a', name: 'A', map: ['?!', 'K   zzz', ''] }, 0).map).toEqual(['?!', 'K   zzz', '']);
  });
});

describe('levels: Built-in level versioning', () => {
  it('Upgrade from an older version', () => {
    const stored = [level('level-1', 'Old level 1', ['K  ']), level('my-maze', 'My maze')];
    const { levels, versionChanged } = initialLevels(JSON.stringify(stored), '4', builtIns());
    expect(levels.map(l => l.id)).toEqual(['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7', 'my-maze']);
    expect(levels[0]).toEqual(builtIns()[0]);
    expect(versionChanged).toBe(true);
  });

  it('Same version', () => {
    const stored = [level('my-maze', 'My maze'), level('level-1', 'Changed level 1', ['K  '])];
    const { levels, versionChanged } = initialLevels(JSON.stringify(stored), '5', builtIns());
    expect(levels).toEqual(stored);
    expect(versionChanged).toBe(false);
  });

  it('is at version 5', () => {
    expect(BUILTIN_VERSION).toBe('5');
  });

  it('gives the built-in levels when nothing is stored', () => {
    expect(initialLevels(null, null, builtIns())).toEqual({ levels: builtIns(), versionChanged: true });
  });

  it('gives the built-in levels when the version matches but the stored list is empty or missing', () => {
    expect(initialLevels('[]', '5', builtIns())).toEqual({ levels: builtIns(), versionChanged: false });
    expect(initialLevels(null, '5', builtIns())).toEqual({ levels: builtIns(), versionChanged: false });
  });

  it('ignores stored data that is not a list of valid levels', () => {
    const broken = ['{not json', '{"id":"a"}', '"text"', JSON.stringify([level('ok'), { id: 'bad', name: 'Bad', map: ['WWW'] }])];
    for (const json of broken) {
      expect(initialLevels(json, '5', builtIns()).levels).toEqual(builtIns());
      expect(initialLevels(json, '4', builtIns()).levels).toEqual(builtIns());
    }
  });
});

describe('levels: Console export and import', () => {
  it('Import a new level', () => {
    const levels = builtIns();
    expect(mergeImported(levels, [level('my-maze')])).toBe(1);
    expect(levels).toHaveLength(8);
    expect(levels[7]).toEqual(level('my-maze'));
  });

  it('Import replaces by id', () => {
    const levels = builtIns();
    const replacement = level('level-2', 'Harder level 2', ['WKW']);
    expect(mergeImported(levels, [replacement])).toBe(1);
    expect(levels).toHaveLength(7);
    expect(levels[1]).toEqual(replacement);
    expect(levels.map(l => l.id)).toEqual(builtIns().map(l => l.id));
  });

  it('Import with an invalid level', () => {
    const levels = builtIns();
    const list = [level('new-1'), { id: 'new-2', name: 'No robot', map: ['WWW'] }, level('level-1', 'Replaced')];
    expect(() => mergeImported(levels, list)).toThrow('Level 1: map needs exactly one K');
    expect(levels).toEqual(builtIns());
  });

  it('accepts the list as JSON text', () => {
    const levels = builtIns();
    expect(mergeImported(levels, JSON.stringify([level('a'), level('b')]))).toBe(2);
    expect(levels.map(l => l.id).slice(7)).toEqual(['a', 'b']);
  });

  it('rejects anything that is not a list', () => {
    const levels = builtIns();
    expect(() => mergeImported(levels, level('a'))).toThrow('importLevels expects an array');
    expect(() => mergeImported(levels, '{"id":"a"}')).toThrow('importLevels expects an array');
    expect(() => mergeImported(levels, 'not json')).toThrow();
    expect(levels).toEqual(builtIns());
  });

  it('imports nothing from an empty list', () => {
    const levels = builtIns();
    expect(mergeImported(levels, [])).toBe(0);
    expect(levels).toEqual(builtIns());
  });
});

describe('levelSize', () => {
  it('is width x height, the width being the longest row', () => {
    expect(levelSize(level('a', 'A', ['WWWWWWWWWWWWWWW', 'WK', 'W         e   W', 'WWWWWWWWWWWWWWW']))).toBe('15x4');
    expect(levelSize(level('a', 'A', ['K']))).toBe('1x1');
  });
});

describe('orderByFileName', () => {
  it('orders by name with numbers compared as numbers', () => {
    const files = {
      '../levels/level-10.json': 'ten',
      '../levels/level-9.json': 'nine',
      '../levels/level-1.json': 'one',
      '../levels/level-2.json': 'two',
    };
    expect(orderByFileName(files)).toEqual(['one', 'two', 'nine', 'ten']);
  });

  it('gives an empty list for no files', () => {
    expect(orderByFileName({})).toEqual([]);
  });
});
