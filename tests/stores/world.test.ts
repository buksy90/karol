import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COLOR_NAMES } from '../../src/logic/colors.ts';
import type { LevelContent } from '../../src/logic/types.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { move, turn, use } from '../helpers/program.ts';
import { loadLevel, loadMap, play, robotAt, setupStores, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);
const FLOOR = String.fromCharCode(32);

describe('the play helper', () => {
  it('runs a program on a loaded map', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    play(move());
    expect(robotAt()).toBe('2,1');
  });
});

describe('world: Robot start', () => {
  it('Level start', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const world = useWorldStore();
    expect(world.robot).toEqual({ x: 1, y: 1, d: 1 });
    play(turn(), move());
    world.reset();
    expect(world.robot).toEqual({ x: 1, y: 1, d: 1 });
    expect(world.angle).toBe(90);
  });
});

describe('world: Doors', () => {
  it('Reset locks the door again', () => {
    loadMap('WWWWWW', 'WKkL W', 'WWWWWW');
    const world = useWorldStore();
    play(move(), use(1));
    expect(world.grid[1][3]).toBe('O');
    world.reset();
    expect(world.grid[1][3]).toBe('L');
  });
});

describe('world: Inventory', () => {
  it('Empty inventory at level start', () => {
    loadMap('WWWWW', 'WKk W', 'WWWWW');
    const inventory = useInventoryStore();
    expect(inventory.slots).toEqual(Array(8).fill(null));
    play(move());
    expect(inventory.slots[0]).toEqual({ type: 'key' });
    useWorldStore().reset();
    expect(inventory.slots).toEqual(Array(8).fill(null));
  });
});

describe('world: Level reset', () => {
  it('Reset after moving things', () => {
    loadMap('WWWWWWW', 'WKkb  W', 'WWWLWWW', 'WWWWWWW');
    const world = useWorldStore(), inventory = useInventoryStore();
    const before = { grid: world.grid.map(r => r.join('')), boxes: [...world.boxes], robot: { ...world.robot } };
    // pick up the key, push the crate, turn south and unlock the door
    play(move(), move(), turn(), turn(), turn(), use(1));
    expect(world.boxes.has('4,1')).toBe(true);
    expect(world.grid[2][3]).toBe('O');
    expect(world.grid[1][2]).toBe(FLOOR);
    world.reset();
    expect(world.grid.map(r => r.join(''))).toEqual(before.grid);
    expect([...world.boxes]).toEqual(before.boxes);
    expect(world.robot).toEqual(before.robot);
    expect(inventory.slots.every(s => s === null)).toBe(true);
  });

  it('counts resets, so the view can snap the robot back', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const world = useWorldStore();
    const n = world.resets;
    world.reset();
    expect(world.resets).toBe(n + 1);
  });

  it('load replaces the map and resets to it', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    loadMap('WWWWW', 'W   W', 'W  KW', 'WWWWW');
    const world = useWorldStore();
    expect([world.cols, world.rows]).toEqual([5, 4]);
    expect(world.robot).toEqual({ x: 3, y: 2, d: 1 });
  });
});

/** A spray, then two cells that are a flag, then the door the flag opens. */
const PAINT_LEVEL: LevelContent = {
  map: ['WWWWWWW', 'WK   LW', 'WWWWWWW'],
  items: [{ type: 'spray', position: [2, 1], color: 'red', uses: 3 }],
  flags: [{ position: [3, 1], colors: [['red', 'red']], onDrawn: { unlockDoor: [5, 1] } }],
};

describe('world: Level reset (painting)', () => {
  it('Reset after painting', () => {
    loadLevel(PAINT_LEVEL);
    const world = useWorldStore(), inventory = useInventoryStore();
    play(move(), move(), use(1), move(), use(1));
    expect([...world.paint.keys()]).toEqual(['3,1', '4,1']);
    expect(world.sprays.size).toBe(0);
    expect(inventory.slots[0]).toEqual({ type: 'spray', color: COLOR_NAMES.red, uses: 1 });
    expect(world.flags[0].done).toBe(true);
    expect(world.grid[1][5]).toBe('O');
    world.reset();
    expect([...world.sprays]).toEqual([['2,1', { color: COLOR_NAMES.red, uses: 3 }]]);
    expect(world.paint.size).toBe(0);
    expect(world.flags[0].done).toBe(false);
    expect(world.grid[1][5]).toBe('L');
    expect(inventory.slots.every(slot => slot === null)).toBe(true);
  });

  it('a second run starts with full sprays, and the level itself is never changed', () => {
    loadLevel(PAINT_LEVEL);
    const before = JSON.stringify(PAINT_LEVEL);
    play(move(), use(1), use(1), use(1));
    expect(useInventoryStore().slots[0]).toBeNull();
    play(move());
    expect(useInventoryStore().slots[0]).toEqual({ type: 'spray', color: COLOR_NAMES.red, uses: 3 });
    expect(JSON.stringify(PAINT_LEVEL)).toBe(before);
  });
});

describe('painting: Finishing a flag opens its door', () => {
  it('Reset', () => {
    loadLevel(PAINT_LEVEL);
    const world = useWorldStore();
    play(move(), move(), use(1), move(), use(1), move());
    expect(robotAt()).toBe('5,1');
    world.reset();
    expect(world.paint.size).toBe(0);
    expect(world.grid[1][5]).toBe('L');
  });
});
