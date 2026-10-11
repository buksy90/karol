import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { orderByFileName } from '../../src/logic/levels.ts';
import type { Level } from '../../src/logic/types.ts';
import { useExecutionStore, WIN_DELAY } from '../../src/stores/execution.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { move, turn } from '../helpers/program.ts';
import { blockStorage, reloadPage, run, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

// the level files, loaded the way src/main.ts loads them
const builtIns = orderByFileName(import.meta.glob<Level>('../../levels/*.json', { eager: true, import: 'default' }));
const BUILT_IN_IDS = ['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7'];
const myMaze: Level = { id: 'my-maze', name: 'My maze', map: ['WWWWW', 'WK eW', 'WWWWW'] };

let stored: Map<string, string>;
beforeEach(() => { stored = setupStores(); });
afterEach(teardownStores);

/** Start the game: what src/main.ts does with the levels. */
function start() {
  const levels = useLevelsStore();
  levels.init(builtIns);
  return levels;
}
const storedLevels = (): Level[] => JSON.parse(stored.get('karol.levels')!);

describe('levels: Built-in levels', () => {
  it('Level list on first start', () => {
    const levels = start();
    expect(levels.current).toBe('level-1');
    expect(levels.levels.map(l => l.id)).toEqual(BUILT_IN_IDS);
    expect(levels.levels.map(l => l.name)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7']);
    const world = useWorldStore();
    expect(world.map).toEqual(builtIns[0].map);
    expect([world.cols, world.rows]).toEqual([15, 4]);
    expect(useUiStore().status).toBe(t('ms.ready'));
  });
});

describe('the first level', () => {
  it('can be won: walk along the corridor, turn towards the exit and step onto it', () => {
    start();
    const world = useWorldStore();
    const exitRow = world.grid.findIndex(row => row.includes('e'));
    const exitColumn = world.grid[exitRow].indexOf('e');
    const walk = Array.from({ length: exitColumn - world.robot.x }, move);
    // three left turns face the robot south, where the exit is
    expect(exitRow).toBe(world.robot.y + 1);
    const said = run(...walk, turn(), turn(), turn(), move());
    expect(said.at(-1)).toBe(t('ms.win'));
    expect(world.grid[world.robot.y][world.robot.x]).toBe('e');
    vi.advanceTimersByTime(WIN_DELAY);
    expect(useUiStore().dialog).toBe('win');
  });
});

describe('levels: Level picker', () => {
  it('Choosing another level', () => {
    const levels = start();
    setProgram(move(), turn(), move());
    step();
    levels.load('level-3');
    const world = useWorldStore();
    expect(levels.current).toBe('level-3');
    expect(world.map).toEqual(builtIns[2].map);
    expect(world.grid[world.robot.y][world.robot.x]).toBe(' ');
    expect(builtIns[2].map[world.robot.y][world.robot.x]).toBe('K');
    expect(world.robot.d).toBe(1);
    expect(useUiStore().status).toBe(t('ms.loaded', 'Level 3'));
    expect(useProgramStore().blocks).toHaveLength(3);
    // the run that was being stepped is over
    expect(useExecutionStore().active).toBe(false);
  });
});

describe('the next level', () => {
  it('has no next level on the last level', () => {
    const levels = start();
    levels.load('level-7');
    expect(levels.next).toBeNull();
  });

  it('knows the level that Next level leads to', () => {
    const levels = start();
    expect(levels.next!.id).toBe('level-2');
    levels.load('level-2');
    expect(levels.next!.id).toBe('level-3');
  });
});

describe('levels: Remembering levels', () => {
  it('Reload', () => {
    start().load('level-4');
    expect(stored.get('karol.level')).toBe('level-4');
    reloadPage();
    const levels = start();
    expect(levels.current).toBe('level-4');
    expect(useWorldStore().map).toEqual(builtIns[3].map);
  });

  it('Stored level no longer exists', () => {
    stored.set('karol.level', 'gone');
    const levels = start();
    expect(levels.current).toBe('level-1');
    expect(stored.get('karol.level')).toBe('level-1');
  });

  it('Storage blocked', () => {
    blockStorage();
    const levels = start();
    expect(levels.levels.map(l => l.id)).toEqual(BUILT_IN_IDS);
    expect(levels.current).toBe('level-1');
    expect(() => levels.load('level-2')).not.toThrow();
    expect(useWorldStore().map).toEqual(builtIns[1].map);
  });

  it('stores the list and the current level under karol.levels and karol.level', () => {
    start();
    expect(storedLevels()).toEqual(builtIns);
    expect(stored.get('karol.level')).toBe('level-1');
  });

  it('loads the first level for an id that is not in the list', () => {
    const levels = start();
    levels.load('level-5');
    levels.load('nope');
    expect(levels.current).toBe('level-1');
  });
});

describe('levels: Built-in level versioning', () => {
  it('Upgrade from an older version', () => {
    stored.set('karol.levels', JSON.stringify([{ id: 'level-1', name: 'Old level 1', map: ['WKW'] }, myMaze]));
    stored.set('karol.ver', '4');
    const levels = start();
    expect(levels.levels.map(l => l.id)).toEqual([...BUILT_IN_IDS, 'my-maze']);
    expect(levels.levels[0]).toEqual(builtIns[0]);
    expect(stored.get('karol.ver')).toBe('5');
    expect(storedLevels().map(l => l.id)).toEqual([...BUILT_IN_IDS, 'my-maze']);
  });

  it('Same version', () => {
    const mine = [myMaze, { id: 'level-1', name: 'My level 1', map: ['WKW'] }];
    stored.set('karol.levels', JSON.stringify(mine));
    stored.set('karol.ver', '5');
    const levels = start();
    expect(levels.levels).toEqual(mine);
    expect(levels.current).toBe('my-maze');
  });

  it('stores the version on first start', () => {
    start();
    expect(stored.get('karol.ver')).toBe('5');
  });
});

describe('levels: Console export and import', () => {
  it('Export', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const levels = start();
    const exported = levels.exportLevels();
    expect(exported).toEqual(builtIns);
    expect(log).toHaveBeenCalledWith(JSON.stringify(builtIns, null, 2));
    log.mockRestore();
  });

  it('Import a new level', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const levels = start();
    expect(levels.importLevels([myMaze])).toBe(1);
    expect(levels.levels.map(l => l.id)).toEqual([...BUILT_IN_IDS, 'my-maze']);
    expect(storedLevels()[7]).toEqual(myMaze);
    expect(log).toHaveBeenCalledWith('Imported 1 level(s)');
    log.mockRestore();
  });

  it('Import replaces by id', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const levels = start();
    const replacement = { id: 'level-2', name: 'Harder level 2', map: ['WKeW'] };
    expect(levels.importLevels(JSON.stringify([replacement]))).toBe(1);
    expect(levels.levels.map(l => l.id)).toEqual(BUILT_IN_IDS);
    expect(levels.levels[1]).toEqual(replacement);
    expect(storedLevels()[1]).toEqual(replacement);
    log.mockRestore();
  });

  it('Import with an invalid level', () => {
    const levels = start();
    const before = stored.get('karol.levels');
    expect(() => levels.importLevels([myMaze, { id: 'broken', name: 'No robot', map: ['WWW'] }])).toThrow('Level 1');
    expect(levels.levels).toEqual(builtIns);
    expect(stored.get('karol.levels')).toBe(before);
  });

  it('an imported level can be loaded and survives a reload', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    start().importLevels([myMaze]);
    reloadPage();
    const levels = start();
    levels.load('my-maze');
    expect(useWorldStore().map).toEqual(myMaze.map);
    log.mockRestore();
  });
});
