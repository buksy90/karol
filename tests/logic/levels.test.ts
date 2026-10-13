import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_VERSION, initialLevels, levelSize, mergeImported, normLevel, orderByFileName } from '../../src/logic/levels.ts';
import { COLOR_NAMES } from '../../src/logic/colors.ts';
import { parseMap } from '../../src/logic/world.ts';
import type { Level } from '../../src/logic/types.ts';

const MAP = ['WWWWW', 'WK eW', 'WWWWW'];
const level = (id: string, name = id, map = MAP): Level => ({ id, name, map });
/** Eight levels with the ids and names of the ones the game ships. */
const builtIns = (): Level[] => Array.from({ length: 8 }, (_, i) => level('level-' + (i + 1), 'Level ' + (i + 1)));

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

// A corridor with a locked door at 4,1: floor at 2,1 and 3,1, a key at 5,1 and the exit at 6,1.
const PAINT_MAP = ['WWWWWWWW', 'WK  Lke', 'WWWWWWWW'];
const SPRAY = { type: 'spray', position: [2, 1], color: 'red', uses: 3 };
const FLAG = { position: [2, 1], colors: [['red', 'blue']], onDrawn: { unlockDoor: [4, 1] } };
const painted = (extra: object, map: string[] = PAINT_MAP): unknown => ({ id: 'a', name: 'A', map, ...extra });
const withItem = (change: object): unknown => painted({ items: [{ ...SPRAY, ...change }] });
const withFlag = (change: object): unknown => painted({ flags: [{ ...FLAG, ...change }] });

describe('levels: Positions in a level', () => {
  it('Position on the map', () => {
    // [3, 1] is column 3 of row 1: a flag may name it as its door only because the locked door is there
    const map = ['WWWWW', 'WK LW', 'WWWWW'];
    expect(() => normLevel(painted({ flags: [{ position: [2, 1], colors: [['red']], onDrawn: { unlockDoor: [3, 1] } }] }, map), 0)).not.toThrow();
    expect(() => normLevel(painted({ flags: [{ position: [2, 1], colors: [['red']], onDrawn: { unlockDoor: [1, 3] } }] }, map), 0)).toThrow('locked door');
  });
});

describe('levels: Level items', () => {
  it('A spray on the floor', () => {
    const l = normLevel(painted({ items: [SPRAY] }), 0);
    expect(l.items).toEqual([SPRAY]);
    expect([...parseMap(l.map, l.items).sprays]).toEqual([['2,1', { color: COLOR_NAMES.red, uses: 3 }]]);
  });

  it('A spray with a hex colour', () => {
    const l = normLevel(withItem({ color: '#1e90ff', uses: 2 }), 0);
    expect([...parseMap(l.map, l.items).sprays]).toEqual([['2,1', { color: '#1e90ff', uses: 2 }]]);
  });

  it('Level without items', () => {
    const l = normLevel(painted({}), 0);
    expect(Object.keys(l).sort()).toEqual(['id', 'map', 'name']);
    expect(parseMap(l.map, l.items, l.flags).sprays.size).toBe(0);
  });

  it('leaves out items and flags that are empty lists or null', () => {
    expect(Object.keys(normLevel(painted({ items: [], flags: [] }), 0)).sort()).toEqual(['id', 'map', 'name']);
    expect(Object.keys(normLevel(painted({ items: null, flags: null }), 0)).sort()).toEqual(['id', 'map', 'name']);
  });

  it('keeps only the properties of an item and of a flag', () => {
    const l = normLevel(painted({ items: [{ ...SPRAY, note: 'x' }], flags: [{ ...FLAG, note: 'x', onDrawn: { unlockDoor: [4, 1], sound: 'ding' } }] }), 0);
    expect(l.items).toEqual([SPRAY]);
    expect(l.flags).toEqual([FLAG]);
  });
});

describe('levels: Level flags', () => {
  it('A three by three flag', () => {
    const map = ['WWWWWWWWWWWWWWW', 'WK      d   WWW', 'WWWWWWWWW   WWW', 'WWWWWWWWW   L W', 'WWWWWWWWWWWWWWW'];
    const flag = { position: [9, 1], colors: [['black', 'black', 'black'], ['red', 'red', 'red'], ['yellow', 'yellow', 'yellow']], onDrawn: { unlockDoor: [12, 3] } };
    const l = normLevel(painted({ flags: [flag] }, map), 0);
    expect(l.flags).toEqual([flag]);
    const w = parseMap(l.map, l.items, l.flags);
    expect(w.flags[0].position).toEqual([9, 1]);
    expect(w.flags[0].colors.map(row => row.length)).toEqual([3, 3, 3]);
    expect(w.flags[0].colors.map(row => row[0])).toEqual([COLOR_NAMES.black, COLOR_NAMES.red, COLOR_NAMES.yellow]);
    expect([...w.flagDoors]).toEqual(['12,3']);
  });

  it('Flag that is not square', () => {
    const map = ['WWWWWWW', 'WK   LW', 'W    WW', 'WWWWWWW'];
    const l = normLevel(painted({ flags: [{ position: [1, 1], colors: [['red', 'red', 'red', 'red'], ['blue', 'blue', 'blue', 'blue']], onDrawn: { unlockDoor: [5, 1] } }] }, map), 0);
    expect([l.flags![0].colors[0].length, l.flags![0].colors.length]).toEqual([4, 2]);
  });

  it('accepts a flag cell on the robot start, but not a spray there', () => {
    expect(() => normLevel(withFlag({ position: [1, 1], colors: [['red', 'red']] }), 0)).not.toThrow();
    expect(() => normLevel(withItem({ position: [1, 1] }), 0)).toThrow('Level 0: item 0 must lie on plain floor');
  });

  it('treats the cells that pad a short row as floor', () => {
    const map = ['WWWWWW', 'WK', 'WWWWLW'];
    expect(() => normLevel(painted({ items: [{ ...SPRAY, position: [4, 1] }], flags: [{ position: [3, 1], colors: [['red', 'red']], onDrawn: { unlockDoor: [4, 2] } }] }, map), 0)).not.toThrow();
  });
});

describe('levels: Items and flags are kept', () => {
  it('Export and import', () => {
    const levels = builtIns();
    mergeImported(levels, JSON.stringify([painted({ id: 'flagged', items: [SPRAY], flags: [FLAG] })]));
    expect(levels[8]).toEqual({ id: 'flagged', name: 'A', map: PAINT_MAP, items: [SPRAY], flags: [FLAG] });
  });

  it('Reload', () => {
    const stored = [painted({ id: 'flagged', items: [SPRAY], flags: [FLAG] })];
    expect(initialLevels(JSON.stringify(stored), BUILTIN_VERSION, builtIns()).levels).toEqual(stored);
    expect(initialLevels(JSON.stringify(stored), 'older', builtIns()).levels[8]).toEqual(stored[0]);
  });
});

describe('levels: Level validation (items and flags)', () => {
  it('Spray in a wall', () => {
    expect(() => normLevel(withItem({ position: [0, 0] }), 3)).toThrow('Level 3: item 0 must lie on plain floor');
    // nor on a door, a key, the exit or outside the map
    for (const position of [[4, 1], [5, 1], [6, 1], [9, 1], [2, 7], [-1, 1]]) {
      expect(() => normLevel(withItem({ position }), 3)).toThrow('Level 3: item 0 must lie on plain floor');
    }
  });

  it('Unknown colour', () => {
    expect(() => normLevel(withItem({ color: 'pink' }), 1)).toThrow('Level 1: item 0 has an unknown color');
    expect(() => normLevel(withFlag({ colors: [['red', 'pink']] }), 1)).toThrow('Level 1: flag 0 has an unknown color');
  });

  it('Malformed hex value', () => {
    for (const color of ['#12', '#12345g', '1e90ff', '#1e90ff80', 7, null]) {
      expect(() => normLevel(withItem({ color }), 0)).toThrow('unknown color');
      expect(() => normLevel(withFlag({ colors: [['red', color]] }), 0)).toThrow('unknown color');
    }
  });

  it('Colours are kept as written', () => {
    const l = normLevel(painted({ items: [SPRAY], flags: [{ ...FLAG, colors: [['#F00', 'blue']] }] }), 0);
    expect(l.items![0].color).toBe('red');
    expect(l.flags![0].colors).toEqual([['#F00', 'blue']]);
  });

  it('Unknown item type', () => {
    expect(() => normLevel(withItem({ type: 'hammer' }), 0)).toThrow('Level 0: item 0 has an unknown type');
    expect(() => normLevel(painted({ items: ['spray'] }), 0)).toThrow('Level 0: item 0 is not an object');
  });

  it('Spray without uses', () => {
    for (const uses of [undefined, 0, 2.5, -1, 100, '3']) {
      expect(() => normLevel(withItem({ uses }), 0)).toThrow('Level 0: item 0 needs uses from 1 to 99');
    }
    expect(() => normLevel(withItem({ uses: 99 }), 0)).not.toThrow();
  });

  it('Two sprays on one cell', () => {
    expect(() => normLevel(painted({ items: [SPRAY, { ...SPRAY, color: 'blue' }] }), 0)).toThrow('Level 0: item 1 shares its cell with another item');
  });

  it('Flag rows of different length', () => {
    const colors = [['red', 'red', 'red'], ['red', 'red'], ['red', 'red', 'red']];
    expect(() => normLevel(withFlag({ colors }), 2)).toThrow('Level 2: flag 0 needs colors as rows of the same length');
    for (const bad of [undefined, [], [[]], 'red', ['red']]) {
      expect(() => normLevel(withFlag({ colors: bad }), 2)).toThrow('Level 2: flag 0 needs colors as rows of the same length');
    }
  });

  it('Flag over a wall', () => {
    // a wall, the door, the key, the exit, and beyond the right and bottom edges
    for (const position of [[1, 0], [3, 1], [4, 1], [5, 1], [7, 1], [2, 3]]) {
      expect(() => normLevel(withFlag({ position }), 5)).toThrow('Level 5: flag 0 must cover only plain floor');
    }
  });

  it('Flag door that is not a locked door', () => {
    for (const unlockDoor of [[3, 1], [0, 0], [40, 1]]) {
      expect(() => normLevel(withFlag({ onDrawn: { unlockDoor } }), 0)).toThrow('Level 0: flag 0 must unlock a locked door');
    }
  });

  it('Flag without a door', () => {
    for (const onDrawn of [undefined, {}, { unlockDoor: [4] }, { unlockDoor: '4,1' }]) {
      expect(() => normLevel(withFlag({ onDrawn }), 0)).toThrow('Level 0: flag 0 needs onDrawn.unlockDoor [x, y]');
    }
  });

  it('rejects items or flags that are not lists, and positions that are not two whole numbers', () => {
    expect(() => normLevel(painted({ items: SPRAY }), 0)).toThrow('Level 0: items must be an array');
    expect(() => normLevel(painted({ flags: FLAG }), 0)).toThrow('Level 0: flags must be an array');
    for (const position of [undefined, [2], [2, 1, 0], [2.5, 1], ['2', '1'], '2,1']) {
      expect(() => normLevel(withItem({ position }), 0)).toThrow('Level 0: item 0 needs a position [x, y]');
      expect(() => normLevel(withFlag({ position }), 0)).toThrow('Level 0: flag 0 needs a position [x, y]');
    }
  });

  it('names the item or flag that is wrong by its place in the list', () => {
    expect(() => normLevel(painted({ items: [SPRAY, { ...SPRAY, position: [3, 1], color: 'pink' }] }), 0)).toThrow('Level 0: item 1 has an unknown color');
    expect(() => normLevel(painted({ flags: [FLAG, { ...FLAG, colors: [] }] }), 0)).toThrow('Level 0: flag 1 needs colors');
  });
});

describe('levels: Built-in level versioning', () => {
  it('Upgrade from an older version', () => {
    const stored = [level('level-1', 'Old level 1', ['K  ']), level('my-maze', 'My maze')];
    const { levels, versionChanged } = initialLevels(JSON.stringify(stored), '5', builtIns());
    expect(levels.map(l => l.id)).toEqual(['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7', 'level-8', 'my-maze']);
    expect(levels[0]).toEqual(builtIns()[0]);
    expect(versionChanged).toBe(true);
  });

  it('Same version', () => {
    const stored = [level('my-maze', 'My maze'), level('level-1', 'Changed level 1', ['K  '])];
    const { levels, versionChanged } = initialLevels(JSON.stringify(stored), '6', builtIns());
    expect(levels).toEqual(stored);
    expect(versionChanged).toBe(false);
  });

  it('is at version 6', () => {
    expect(BUILTIN_VERSION).toBe('6');
  });

  it('gives the built-in levels when nothing is stored', () => {
    expect(initialLevels(null, null, builtIns())).toEqual({ levels: builtIns(), versionChanged: true });
  });

  it('gives the built-in levels when the version matches but the stored list is empty or missing', () => {
    expect(initialLevels('[]', '6', builtIns())).toEqual({ levels: builtIns(), versionChanged: false });
    expect(initialLevels(null, '6', builtIns())).toEqual({ levels: builtIns(), versionChanged: false });
  });

  it('ignores stored data that is not a list of valid levels', () => {
    const broken = ['{not json', '{"id":"a"}', '"text"', JSON.stringify([level('ok'), { id: 'bad', name: 'Bad', map: ['WWW'] }])];
    for (const json of broken) {
      expect(initialLevels(json, '6', builtIns()).levels).toEqual(builtIns());
      expect(initialLevels(json, '5', builtIns()).levels).toEqual(builtIns());
    }
  });
});

describe('levels: Console export and import', () => {
  it('Import a new level', () => {
    const levels = builtIns();
    expect(mergeImported(levels, [level('my-maze')])).toBe(1);
    expect(levels).toHaveLength(9);
    expect(levels[8]).toEqual(level('my-maze'));
  });

  it('Import replaces by id', () => {
    const levels = builtIns();
    const replacement = level('level-2', 'Harder level 2', ['WKW']);
    expect(mergeImported(levels, [replacement])).toBe(1);
    expect(levels).toHaveLength(8);
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
    expect(levels.map(l => l.id).slice(8)).toEqual(['a', 'b']);
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
