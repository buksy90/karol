import { describe, expect, it } from 'vitest';
import { canMoveForward, moveForward, parseMap, probeForward, SLOT_COUNT, turnLeft, useItem } from '../../src/logic/world.ts';
import moveBlock from '../../src/blocks/move-forward.ts';
import { COLOR_NAMES } from '../../src/logic/colors.ts';
import type { MessageKey, Slots, SprayItem, World } from '../../src/logic/types.ts';
import { at, emptySlots, key, NORTH, SOUTH, spray, WEST, worldOf } from '../helpers/world.ts';

/** Execute a Move forward block and collect what it says, as message keys with their arguments. */
function executeMove(world: World, slots: Slots) {
  const said: (MessageKey | string | number)[][] = [];
  const result = moveBlock.execute({ world, slots, node: { id: 'm', type: 'move' }, say: (key, ...args) => { said.push([key, ...args]); } });
  return { result, said };
}

describe('world: Map symbols', () => {
  it('Rows of different length', () => {
    const w = worldOf('WWWWWWWWWWWWWWW', 'WK        ', 'WWWWWWWWWWWWWWW');
    expect(w.cols).toBe(15);
    expect(w.rows).toBe(3);
    expect(w.grid[1]).toHaveLength(15);
    expect(w.grid[1].slice(10).join('')).toBe('     ');
  });

  it('Lowercase aliases', () => {
    const w = worldOf('wwwww', 'wKd w', 'wwwww');
    expect(w.grid[0].join('')).toBe('WWWWW');
    expect(w.grid[1][2]).toBe('D');
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    w.robot.d = NORTH;
    expect(probeForward(w).blocked).toBe('wall');
  });

  it('Unknown symbol', () => {
    const w = worldOf('WWWWW', 'WK? W', 'WWWWW');
    expect(canMoveForward(w)).toBe(true);
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect(at(w)).toBe('2,1');
  });
});

describe('world: Robot start', () => {
  it('Level start', () => {
    const w = worldOf('WWWWW', 'WK  W', 'WWWWW');
    expect(w.robot).toEqual({ x: 1, y: 1, d: 1 });
    expect(w.angle).toBe(90);
    expect(w.grid[1][1]).toBe(' ');
  });
});

describe('world: Enterable cells', () => {
  it('Wall ahead', () => {
    const w = worldOf('WWW', 'WKW', 'WWW');
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'wall', picked: null, won: false });
    expect(at(w)).toBe('1,1');
  });

  it('Edge of the map', () => {
    const w = worldOf('WK ');
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect(at(w)).toBe('2,0');
    // no cell beyond the end of the row, and no row above or below
    expect(probeForward(w).blocked).toBe('wall');
    w.robot.d = NORTH;
    expect(probeForward(w).blocked).toBe('wall');
    w.robot.d = SOUTH;
    expect(moveForward(w, emptySlots()).moved).toBe(false);
    expect(at(w)).toBe('2,0');
  });

  it('Open door ahead', () => {
    const w = worldOf('WWWW', 'WKDW', 'WWWW');
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect(at(w)).toBe('2,1');
  });

  it('enters an opened locked door, a key cell and the exit, but not a locked door', () => {
    for (const cell of ['O', 'k', 'e']) {
      expect(canMoveForward(worldOf('WWWW', 'WK' + cell + 'W', 'WWWW'))).toBe(true);
    }
    const w = worldOf('WWWW', 'WKLW', 'WWWW');
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'locked', picked: null, won: false });
    expect(at(w)).toBe('1,1');
  });
});

describe('world: Crates', () => {
  it('Free floor behind the crate', () => {
    const w = worldOf('WWWWWW', 'WKb  W', 'WWWWWW');
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect(at(w)).toBe('2,1');
    expect([...w.boxes]).toEqual(['3,1']);
  });

  it('Two crates in a row', () => {
    const w = worldOf('WWWWWW', 'WKbb W', 'WWWWWW');
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'stuck', picked: null, won: false });
    expect(at(w)).toBe('1,1');
    expect([...w.boxes].sort()).toEqual(['2,1', '3,1']);
  });

  it('Key or exit behind the crate', () => {
    for (const behind of ['k', 'e']) {
      const w = worldOf('WWWWWW', 'WKb' + behind + ' W', 'WWWWWW');
      expect(moveForward(w, emptySlots()).blocked).toBe('stuck');
      expect(at(w)).toBe('1,1');
      expect([...w.boxes]).toEqual(['2,1']);
    }
  });

  it('Crate pushed into a doorway', () => {
    const w = worldOf('WWWWWW', 'WKbD W', 'WWWWWW');
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect([...w.boxes]).toEqual(['3,1']);
    expect(w.grid[1][3]).toBe('D');
  });

  it('is pushed onto an opened locked door, but not onto a locked one, a wall or off the map', () => {
    expect(canMoveForward(worldOf('WWWWWW', 'WKbO W', 'WWWWWW'))).toBe(true);
    expect(probeForward(worldOf('WWWWWW', 'WKbL W', 'WWWWWW')).blocked).toBe('stuck');
    expect(probeForward(worldOf('WWWW', 'WKbW', 'WWWW')).blocked).toBe('stuck');
    expect(probeForward(worldOf('Kb')).blocked).toBe('stuck');
  });

  it('the cell a crate started on is plain floor', () => {
    const w = worldOf('WWWWWW', 'WKb  W', 'WWWWWW');
    expect(w.grid[1][2]).toBe(' ');
  });

  it('probing reports the push without doing it', () => {
    const w = worldOf('WWWWWW', 'WKb  W', 'WWWWWW');
    expect(probeForward(w)).toEqual({ nx: 2, ny: 1, cell: ' ', blocked: null, push: { from: '2,1', to: '3,1' } });
    expect([...w.boxes]).toEqual(['2,1']);
    expect(at(w)).toBe('1,1');
  });
});

describe('world: Keys', () => {
  it('Picking up a key', () => {
    const w = worldOf('WWWWW', 'WKk W', 'WWWWW');
    const slots = emptySlots();
    const { result, said } = executeMove(w, slots);
    expect(result).toEqual({ ok: true });
    expect(w.grid[1][2]).toBe(' ');
    expect(slots[0]).toEqual(key());
    expect(said).toEqual([['ms.key', 1]]);
  });

  it('First free slot', () => {
    const w = worldOf('WWWWW', 'WKk W', 'WWWWW');
    const slots = emptySlots();
    slots[0] = key(); slots[2] = key();
    expect(moveForward(w, slots).picked).toEqual({ slot: 2, item: key() });
    expect(slots.slice(0, 4)).toEqual([key(), key(), key(), null]);
  });

  it('Inventory full', () => {
    const w = worldOf('WWWWW', 'WKk W', 'WWWWW');
    const slots: Slots = Array.from({ length: SLOT_COUNT }, key);
    const { result, said } = executeMove(w, slots);
    expect(result).toEqual({ ok: true });
    expect(at(w)).toBe('2,1');
    expect(w.grid[1][2]).toBe('k');
    expect(said).toEqual([['ms.invfull']]);
  });
});

describe('world: Doors', () => {
  it('Unlocked door stays open', () => {
    const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
    const slots = emptySlots();
    slots[0] = key();
    expect(useItem(w, slots, 1)).toEqual({ result: 'opened' });
    expect(w.grid[1][2]).toBe('O');
    expect(at(w)).toBe('1,1');
    expect(moveForward(w, slots).moved).toBe(true);
    expect(at(w)).toBe('2,1');
    // walking back in from the other side works too
    moveForward(w, slots);
    turnLeft(w); turnLeft(w);
    expect(moveForward(w, slots).moved).toBe(true);
    expect(at(w)).toBe('2,1');
  });
});

describe('world: Exit', () => {
  it('Reaching the exit', () => {
    const w = worldOf('WWWWW', 'WKe W', 'WWWWW');
    const { result, said } = executeMove(w, emptySlots());
    expect(at(w)).toBe('2,1');
    expect(said).toEqual([['ms.win']]);
    // ok: false is what stops the program
    expect(result).toEqual({ ok: false, won: true });
  });
});

describe('world: Inventory', () => {
  it('Slot freed by using a key', () => {
    const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
    const slots = emptySlots();
    slots[1] = key();
    expect(useItem(w, slots, 2)).toEqual({ result: 'opened' });
    expect(slots).toEqual(emptySlots());
  });

  it('has 8 slots', () => {
    expect(SLOT_COUNT).toBe(8);
  });
});

describe('useItem', () => {
  it('reports an empty slot, also for numbers outside 1 to 8', () => {
    const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
    const slots = emptySlots();
    slots[0] = key();
    for (const n of [2, 0, 9, 12, -1]) expect(useItem(w, slots, n)).toEqual({ result: 'empty' });
    expect(w.grid[1][2]).toBe('L');
    expect(slots[0]).toEqual(key());
  });

  it('takes only a whole number as a slot: a fraction or a non-number is an empty slot', () => {
    for (const n of [1.5, 1.999, 0.5, 1.0000001, NaN, Infinity]) {
      const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
      const slots: Slots = Array.from({ length: SLOT_COUNT }, key);
      expect(useItem(w, slots, n)).toEqual({ result: 'empty' });
      expect(w.grid[1][2]).toBe('L');
      expect(slots).toEqual(Array.from({ length: SLOT_COUNT }, key));
    }
  });

  it('uses each of the slots 1 to 8', () => {
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
      const slots = emptySlots();
      slots[n - 1] = key();
      expect(useItem(w, slots, n)).toEqual({ result: 'opened' });
      expect(slots).toEqual(emptySlots());
    }
  });

  it('does nothing with a key when there is no locked door ahead', () => {
    for (const ahead of ['W', ' ', 'D', 'O', 'k', 'e']) {
      const w = worldOf('WWWWW', 'WK' + ahead + ' W', 'WWWWW');
      const slots = emptySlots();
      slots[0] = key();
      expect(useItem(w, slots, 1)).toEqual({ result: 'nothing' });
      expect(slots[0]).toEqual(key());
      expect(w.grid[1][2]).toBe(ahead);
    }
  });
});

const RED = COLOR_NAMES.red, GREEN = COLOR_NAMES.green, BLUE = COLOR_NAMES.blue;
const redSpray = (x: number, y: number, uses = 3, color = 'red'): SprayItem => ({ type: 'spray', position: [x, y], color, uses });

/** A corridor with a spray on the cell ahead, which is also a one-cell flag that opens the door after it. */
function oneCellFlag(sprayColor: string, flagColor: string): { w: World; slots: Slots } {
  const w = parseMap(['WWWWW', 'WK LW', 'WWWWW'], [redSpray(2, 1, 3, sprayColor)],
    [{ position: [2, 1], colors: [[flagColor]], onDrawn: { unlockDoor: [3, 1] } }]);
  const slots = emptySlots();
  moveForward(w, slots);
  return { w, slots };
}

/**
 * A room that is a 3x3 flag of a red, a green and a blue row, with its door at 4,1.
 * The robot stands on the bottom-left cell, 1,3, which expects blue, with a blue spray in slot 1.
 * Every other cell already has its colour, except those given in `others`.
 */
function flagRoom(others: Record<string, string> = {}): { w: World; slots: Slots } {
  const w = parseMap(['WWWWWW', 'W   LW', 'W   WW', 'WK  WW', 'WWWWWW'], [],
    [{ position: [1, 1], colors: [['red', 'red', 'red'], ['green', 'green', 'green'], ['blue', 'blue', 'blue']], onDrawn: { unlockDoor: [4, 1] } }]);
  [RED, GREEN, BLUE].forEach((color, j) => { for (let i = 0; i < 3; i++) w.paint.set((1 + i) + ',' + (1 + j), color); });
  w.paint.delete('1,3');
  for (const cell of Object.keys(others)) w.paint.set(cell, others[cell]);
  const slots = emptySlots();
  slots[0] = spray(BLUE, 5);
  return { w, slots };
}

describe('parseMap sprays and flags', () => {
  it('puts the sprays on their cells, with no paint and no flag done', () => {
    const w = parseMap(['WWWWW', 'WK LW', 'WWWWW'], [redSpray(2, 1)], [{ position: [2, 1], colors: [['red']], onDrawn: { unlockDoor: [3, 1] } }]);
    expect([...w.sprays]).toEqual([['2,1', { color: RED, uses: 3 }]]);
    expect(w.paint.size).toBe(0);
    expect(w.flags.map(f => f.done)).toEqual([false]);
    expect([...w.flagDoors]).toEqual(['3,1']);
    expect(w.grid[1][2]).toBe(' ');
  });

  it('holds every colour as #rrggbb, however the level wrote it', () => {
    const w = parseMap(['WWWWW', 'WK LW', 'WWWWW'], [redSpray(2, 1)], [{ position: [2, 1], colors: [['#F00']], onDrawn: { unlockDoor: [3, 1] } }]);
    expect(w.sprays.get('2,1')!.color).toBe(RED);
    expect(w.flags[0].colors).toEqual([['#ff0000']]);
  });

  it('copies sprays and flags, so the world leaves the level as it was', () => {
    const items = [redSpray(2, 1, 1)];
    const flags = [{ position: [2, 1] as [number, number], colors: [['red']], onDrawn: { unlockDoor: [3, 1] as [number, number] } }];
    const before = JSON.stringify({ items, flags });
    const w = parseMap(['WWWWW', 'WK LW', 'WWWWW'], items, flags);
    const slots = emptySlots();
    moveForward(w, slots);
    useItem(w, slots, 1);
    expect(w.flags[0].done).toBe(true);
    expect(JSON.stringify({ items, flags })).toBe(before);
  });

  it('has no sprays, paint or flags for a map alone', () => {
    const w = worldOf('WWW', 'WKW', 'WWW');
    expect([w.sprays.size, w.paint.size, w.flags.length, w.flagDoors.size]).toEqual([0, 0, 0, 0]);
  });
});

describe('world: Enterable cells (sprays)', () => {
  it('Spray ahead', () => {
    const w = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1)]);
    expect(canMoveForward(w)).toBe(true);
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect(at(w)).toBe('2,1');
  });
});

describe('world: Crates (sprays)', () => {
  it('Spray behind the crate', () => {
    const w = parseMap(['WWWWWW', 'WKb  W', 'WWWWWW'], [redSpray(3, 1)]);
    expect(moveForward(w, emptySlots()).blocked).toBe('stuck');
    expect(at(w)).toBe('1,1');
    expect([...w.boxes]).toEqual(['2,1']);
    expect(w.sprays.has('3,1')).toBe(true);
  });
});

describe('painting: Picking up a spray', () => {
  it('Picking up a spray', () => {
    const w = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1)]);
    const slots = emptySlots();
    const { result, said } = executeMove(w, slots);
    expect(result).toEqual({ ok: true });
    expect(w.sprays.size).toBe(0);
    expect(slots[0]).toEqual(spray(RED, 3));
    expect(said).toEqual([['ms.spray', 3, 1]]);
  });

  it('Two sprays of the same colour', () => {
    const w = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1, 5)]);
    const slots = emptySlots();
    slots[0] = spray(RED, 2);
    expect(moveForward(w, slots).picked).toEqual({ slot: 2, item: spray(RED, 5) });
    expect(slots.slice(0, 3)).toEqual([spray(RED, 2), spray(RED, 5), null]);
  });

  it('Inventory full', () => {
    const w = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1)]);
    const slots: Slots = Array.from({ length: SLOT_COUNT }, key);
    const { result, said } = executeMove(w, slots);
    expect(result).toEqual({ ok: true });
    expect(at(w)).toBe('2,1');
    expect(w.sprays.has('2,1')).toBe(true);
    expect(said).toEqual([['ms.invfull']]);
  });
});

describe('painting: Colours', () => {
  it('Colour by name', () => {
    const { w, slots } = oneCellFlag('red', 'blue');
    useItem(w, slots, 1);
    expect(w.paint.get('2,1')).toBe(COLOR_NAMES.red);
  });

  it('Colour by hex value', () => {
    const { w, slots } = oneCellFlag('#1e90ff', 'blue');
    useItem(w, slots, 1);
    expect(w.paint.get('2,1')).toBe('#1e90ff');
  });

  it('Name and hex value of the same colour', () => {
    const { w, slots } = oneCellFlag('red', COLOR_NAMES.red.toUpperCase());
    expect(useItem(w, slots, 1)).toMatchObject({ result: 'painted', flagDone: true });
  });

  it('Short and long hex, upper and lower case', () => {
    const { w, slots } = oneCellFlag('#ff0000', '#F00');
    expect(useItem(w, slots, 1)).toMatchObject({ result: 'painted', flagDone: true });
    expect(w.flags[0].done).toBe(true);
  });

  it('Close but different', () => {
    const { w, slots } = oneCellFlag('#fe0000', '#ff0000');
    expect(useItem(w, slots, 1)).toMatchObject({ result: 'painted', flagDone: false });
    expect(w.flags[0].done).toBe(false);
    expect(w.grid[1][3]).toBe('L');
  });
});

describe('painting: Painting a cell', () => {
  it('Painting plain floor', () => {
    const w = worldOf('WWWW', 'WK W', 'WWWW');
    const slots = emptySlots();
    slots[0] = spray(RED, 3);
    expect(useItem(w, slots, 1)).toEqual({ result: 'painted', color: RED, left: 2, flagDone: false });
    expect([...w.paint]).toEqual([['1,1', RED]]);
    expect(at(w)).toBe('1,1');
  });

  it('Painting over', () => {
    const w = worldOf('WWWW', 'WK W', 'WWWW');
    const slots = emptySlots();
    slots[0] = spray(BLUE, 3);
    w.paint.set('1,1', RED);
    useItem(w, slots, 1);
    expect([...w.paint]).toEqual([['1,1', BLUE]]);
  });

  it('Standing in a doorway', () => {
    for (const door of ['D', 'O']) {
      const w = worldOf('WWWWW', 'WK' + door + ' W', 'WWWWW');
      const slots = emptySlots();
      slots[0] = spray(RED, 3);
      moveForward(w, slots);
      expect(useItem(w, slots, 1)).toEqual({ result: 'nothing' });
      expect(w.paint.size).toBe(0);
      expect(slots[0]).toEqual(spray(RED, 3));
    }
  });

  it('Crate pushed onto paint', () => {
    const w = worldOf('WWWWWW', 'WKb  W', 'WWWWWW');
    w.paint.set('3,1', RED);
    expect(moveForward(w, emptySlots()).moved).toBe(true);
    expect([...w.boxes]).toEqual(['3,1']);
    expect(w.paint.get('3,1')).toBe(RED);
  });

  it('does not paint a cell where a key or a spray was left lying, or a symbol that is not floor', () => {
    const full = (): Slots => [spray(RED, 3), ...Array.from({ length: SLOT_COUNT - 1 }, key)];
    const onKey = worldOf('WWWWW', 'WKk W', 'WWWWW'), onSpray = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1)]), onOther = worldOf('WWWWW', 'WK? W', 'WWWWW');
    for (const w of [onKey, onSpray, onOther]) {
      const slots = full();
      moveForward(w, slots);
      expect(useItem(w, slots, 1)).toEqual({ result: 'nothing' });
      expect(w.paint.size).toBe(0);
      expect(slots[0]).toEqual(spray(RED, 3));
    }
  });

  it('paint does not change what can enter a cell', () => {
    const w = worldOf('WWWWW', 'WK  W', 'WWWWW');
    w.paint.set('2,1', RED);
    expect(moveForward(w, emptySlots()).moved).toBe(true);
  });
});

describe('painting: Spray uses', () => {
  it('Uses left', () => {
    const w = worldOf('WWWW', 'WK W', 'WWWW');
    const slots = emptySlots();
    slots[1] = spray(RED, 3);
    useItem(w, slots, 2);
    expect(slots[1]).toEqual(spray(RED, 2));
  });

  it('Last use', () => {
    const w = worldOf('WWWW', 'WK W', 'WWWW');
    const slots = emptySlots();
    slots[1] = spray(RED, 1);
    expect(useItem(w, slots, 2)).toEqual({ result: 'painted', color: RED, left: 0, flagDone: false });
    expect(w.paint.get('1,1')).toBe(RED);
    expect(slots).toEqual(emptySlots());
  });

  it('Same colour again', () => {
    const w = worldOf('WWWW', 'WK W', 'WWWW');
    const slots = emptySlots();
    slots[0] = spray(RED, 2);
    w.paint.set('1,1', RED);
    useItem(w, slots, 1);
    expect(w.paint.get('1,1')).toBe(RED);
    expect(slots[0]).toEqual(spray(RED, 1));
  });

  it('Slot freed by an empty spray', () => {
    const w = parseMap(['WWWWW', 'WK  W', 'WWWWW'], [redSpray(2, 1)]);
    const slots = emptySlots();
    slots[0] = spray(BLUE, 1); slots[1] = spray(GREEN, 4);
    useItem(w, slots, 1);
    expect(slots[0]).toBeNull();
    expect(moveForward(w, slots).picked).toEqual({ slot: 1, item: spray(RED, 3) });
    expect(slots[1]).toEqual(spray(GREEN, 4));
  });
});

describe('painting: Flags', () => {
  it('Last cell painted', () => {
    const { w, slots } = flagRoom();
    expect(w.flags[0].done).toBe(false);
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: true });
    expect(w.flags[0].done).toBe(true);
  });

  it('One cell wrong', () => {
    const { w, slots } = flagRoom({ '2,2': RED });
    expect(useItem(w, slots, 1)).toMatchObject({ result: 'painted', flagDone: false });
    expect(w.paint.size).toBe(9);
    expect(w.flags[0].done).toBe(false);
    expect(w.grid[1][4]).toBe('L');
  });

  it('Wrong cell corrected', () => {
    const { w, slots } = flagRoom({ '1,3': RED });
    expect(w.flags[0].done).toBe(false);
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: true });
  });

  it('Paint outside the flag', () => {
    const w = parseMap(['WWWWWW', 'WK  LW', 'WWWWWW'], [], [{ position: [2, 1], colors: [['red']], onDrawn: { unlockDoor: [4, 1] } }]);
    const slots = emptySlots();
    slots[0] = spray(RED, 5);
    // paint outside the flag neither finishes it nor stands in its way
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: false });
    w.paint.set('3,1', BLUE);
    moveForward(w, slots);
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: true });
  });

  it('a flag of one row and several columns is compared column by column', () => {
    const w = parseMap(['WWWWWW', 'WK  LW', 'WWWWWW'], [], [{ position: [1, 1], colors: [['red', 'blue', 'red']], onDrawn: { unlockDoor: [4, 1] } }]);
    const slots = emptySlots();
    slots[0] = spray(RED, 5); slots[1] = spray(BLUE, 5);
    useItem(w, slots, 1); moveForward(w, slots);
    useItem(w, slots, 2); moveForward(w, slots);
    expect(w.flags[0].done).toBe(false);
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: true });
  });
});

describe('painting: Finishing a flag opens its door', () => {
  it('Door opens', () => {
    const { w, slots } = flagRoom();
    useItem(w, slots, 1);
    expect(w.grid[1][4]).toBe('O');
    // up along the left side, then east through the door
    turnLeft(w); moveForward(w, slots); moveForward(w, slots);
    turnLeft(w); turnLeft(w); turnLeft(w);
    for (let i = 0; i < 3; i++) expect(moveForward(w, slots).moved).toBe(true);
    expect(at(w)).toBe('4,1');
  });

  it('Flag spoiled afterwards', () => {
    const { w, slots } = flagRoom();
    useItem(w, slots, 1);
    slots[1] = spray(RED, 1);
    expect(useItem(w, slots, 2)).toMatchObject({ result: 'painted', flagDone: false });
    expect(w.paint.get('1,3')).toBe(RED);
    expect(w.flags[0].done).toBe(true);
    expect(w.grid[1][4]).toBe('O');
  });

  it('Two flags', () => {
    const w = parseMap(['WWWWWW', 'WK  LW', 'WWWWLW', 'WWWWWW'], [], [
      { position: [1, 1], colors: [['red']], onDrawn: { unlockDoor: [4, 1] } },
      { position: [2, 1], colors: [['red']], onDrawn: { unlockDoor: [4, 2] } },
    ]);
    const slots = emptySlots();
    slots[0] = spray(RED, 5);
    useItem(w, slots, 1);
    expect(w.flags.map(f => f.done)).toEqual([true, false]);
    expect([w.grid[1][4], w.grid[2][4]]).toEqual(['O', 'L']);
    moveForward(w, slots);
    expect(useItem(w, slots, 1)).toMatchObject({ flagDone: true });
    expect([w.grid[1][4], w.grid[2][4]]).toEqual(['O', 'O']);
  });
});

describe('world: Doors (flags)', () => {
  it('Door opened by a flag', () => {
    const { w, slots } = oneCellFlag('red', 'red');
    expect(moveForward(w, slots).blocked).toBe('flagdoor');
    useItem(w, slots, 1);
    expect(moveForward(w, slots).moved).toBe(true);
    expect(at(w)).toBe('3,1');
  });

  it('a key opens the door of a flag too', () => {
    const { w, slots } = oneCellFlag('red', 'blue');
    slots[1] = key();
    expect(useItem(w, slots, 2)).toEqual({ result: 'opened' });
    expect(moveForward(w, slots).moved).toBe(true);
    expect(w.flags[0].done).toBe(false);
  });
});

describe('painting: Flag doors', () => {
  it('Ordinary locked door', () => {
    // what the map draws follows from this: a door is a flag door only when a flag names it
    const w = parseMap(['WWWWWW', 'WKL LW', 'WWWWWW'], [], [{ position: [3, 1], colors: [['red']], onDrawn: { unlockDoor: [4, 1] } }]);
    expect(w.flagDoors.has('2,1')).toBe(false);
    expect(w.flagDoors.has('4,1')).toBe(true);
    expect(probeForward(w).blocked).toBe('locked');
  });
});

describe('turnLeft', () => {
  it('goes east, north, west, south and keeps counting the angle down', () => {
    const w = worldOf('WWW', 'WKW', 'WWW');
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) { turnLeft(w); seen.push(w.robot.d); }
    expect(seen).toEqual([NORTH, WEST, SOUTH, 1]);
    expect(w.angle).toBe(90 - 360);
    expect(at(w)).toBe('1,1');
  });
});

describe('parseMap rooms', () => {
  it('numbers the cells of each room; walls and doors belong to none', () => {
    const w = parseMap(['WWWWWWW', 'WK D LW', 'WWWWW W', 'W O   W', 'WWWWWWW']);
    const room = (x: number, y: number) => w.roomMap[y][x];
    expect(room(0, 0)).toBe(-1);
    expect(room(3, 1)).toBe(-1);
    expect(room(5, 1)).toBe(-1);
    expect(room(2, 3)).toBe(-1);
    expect(room(1, 1)).toBe(room(2, 1));
    expect(room(4, 1)).not.toBe(room(1, 1));
    expect(room(1, 3)).not.toBe(room(3, 3));
    // around the corner is still the same room
    expect(room(5, 2)).toBe(room(3, 3));
    expect(new Set(w.roomMap.flat()).size).toBe(5);
  });

  it('starts the robot at 1,1 when the map has no K', () => {
    expect(parseMap(['WWW', 'W W', 'WWW']).robot).toEqual({ x: 1, y: 1, d: 1 });
  });
});
