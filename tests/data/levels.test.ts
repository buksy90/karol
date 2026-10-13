import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COLOR_NAMES, toHex } from '../../src/logic/colors.ts';
import { levelSize, normLevel, orderByFileName } from '../../src/logic/levels.ts';
import type { Level } from '../../src/logic/types.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { move, repeat, turn, use } from '../helpers/program.ts';
import { setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';

// the level files, found the way src/main.ts finds them
const files = import.meta.glob<Level>('../../levels/*.json', { eager: true, import: 'default' });
const paths = Object.keys(files);
const inOrder = orderByFileName(files);

describe('levels: Built-in levels', () => {
  it('What each level teaches', () => {
    // the sizes; what a level teaches is for a person to judge
    expect(inOrder.map(levelSize)).toEqual(['15x4', '15x9', '15x9', '15x9', '15x15', '15x16', '15x15', '15x7']);
  });

  it('ships eight levels, level-1 to level-8, named Level 1 to Level 8, in this order', () => {
    expect(inOrder.map(l => l.id)).toEqual(['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7', 'level-8']);
    expect(inOrder.map(l => l.name)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8']);
  });
});

describe('levels: Built-in levels, level 8', () => {
  beforeEach(() => { setupStores(); });
  afterEach(teardownStores);

  function loadLevel8() {
    const levels = useLevelsStore();
    levels.init(inOrder);
    levels.load('level-8');
    return useWorldStore();
  }

  it('Level 8 layout', () => {
    const world = loadLevel8();
    const { black, red, yellow } = COLOR_NAMES;
    // three sprays in the start corridor, in the order the robot meets them
    expect([...world.sprays].sort()).toEqual([['3,1', { color: black, uses: 3 }], ['5,1', { color: red, uses: 3 }], ['7,1', { color: yellow, uses: 3 }]]);
    expect(world.robot).toEqual({ x: 1, y: 1, d: 1 });
    expect(world.grid[1][8]).toBe('D');
    // the room behind the door is exactly the flag: 3x3, a black, a red and a yellow row
    const flag = world.flags[0];
    expect(world.flags).toHaveLength(1);
    expect(flag.position).toEqual([9, 1]);
    expect(flag.colors).toEqual([[black, black, black], [red, red, red], [yellow, yellow, yellow]]);
    const room = world.roomMap[1][9];
    const roomCells = world.roomMap.flatMap((row, y) => row.map((id, x) => id === room ? x + ',' + y : '').filter(Boolean));
    expect(roomCells.sort()).toEqual(['10,1', '10,2', '10,3', '11,1', '11,2', '11,3', '9,1', '9,2', '9,3']);
    // the exit is in the room behind the flag's door
    expect(flag.onDrawn.unlockDoor).toEqual([12, 3]);
    expect(world.grid[3][12]).toBe('L');
    expect(world.roomMap[5][13]).toBe(world.roomMap[3][13]);
    expect(world.grid[5][13]).toBe('e');
  });

  it('Level 8 can be solved', () => {
    const world = loadLevel8(), execution = useExecutionStore();
    setProgram(
      repeat(8, move()),
      use(1), repeat(2, move(), use(1)),
      repeat(3, turn()), move(), repeat(3, turn()),
      use(2), repeat(2, move(), use(2)),
      turn(), move(), turn(),
      use(3), repeat(2, move(), use(3)),
      repeat(2, move()),
      repeat(3, turn()),
      repeat(2, move()),
    );
    let paintedWhenDone = 0, last = '';
    do {
      last = step();
      if (world.flags[0].done && !paintedWhenDone) paintedWhenDone = world.paint.size;
    } while (execution.active);
    expect(paintedWhenDone).toBe(9);
    expect(useInventoryStore().slots.every(slot => slot === null)).toBe(true);
    expect(execution.err).toEqual({});
    expect(world.grid[world.robot.y][world.robot.x]).toBe('e');
    expect(last).toBe(t('ms.win'));
  });
});

describe('the level files', () => {
  it.each(paths)('%s has enough paint of each colour for its flags', path => {
    const level = files[path];
    const needed: Record<string, number> = {}, available: Record<string, number> = {};
    for (const flag of level.flags ?? []) for (const color of flag.colors.flat()) needed[toHex(color)!] = (needed[toHex(color)!] ?? 0) + 1;
    for (const item of level.items ?? []) available[toHex(item.color)!] = (available[toHex(item.color)!] ?? 0) + item.uses;
    for (const color of Object.keys(needed)) expect(available[color] ?? 0, color).toBeGreaterThanOrEqual(needed[color]);
  });

  it.each(paths)('%s is a valid level', path => {
    const level = files[path];
    expect(normLevel(level, 0)).toEqual(level);
  });

  it.each(paths)('%s is named after its id', path => {
    expect(path.split('/').pop()).toBe(files[path].id + '.json');
  });

  it('have ids that differ', () => {
    const ids = paths.map(path => files[path].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(paths)('%s has an exit', path => {
    expect(files[path].map.join('')).toContain('e');
  });
});
