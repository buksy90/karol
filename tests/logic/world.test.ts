import { describe, expect, it } from 'vitest';
import { canMoveForward, KEY, moveForward, parseMap, probeForward, SLOT_COUNT, turnLeft, useItem } from '../../src/logic/world.ts';
import moveBlock from '../../src/blocks/move-forward.ts';
import type { MessageKey, Slots, World } from '../../src/logic/types.ts';
import { at, emptySlots, NORTH, SOUTH, WEST, worldOf } from '../helpers/world.ts';

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
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'wall', key: null, won: false });
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
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'locked', key: null, won: false });
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
    expect(moveForward(w, emptySlots())).toEqual({ moved: false, blocked: 'stuck', key: null, won: false });
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
    expect(slots[0]).toBe(KEY);
    expect(said).toEqual([['ms.key', 1]]);
  });

  it('First free slot', () => {
    const w = worldOf('WWWWW', 'WKk W', 'WWWWW');
    const slots = emptySlots();
    slots[0] = KEY; slots[2] = KEY;
    expect(moveForward(w, slots).key).toBe(2);
    expect(slots.slice(0, 4)).toEqual([KEY, KEY, KEY, null]);
  });

  it('Inventory full', () => {
    const w = worldOf('WWWWW', 'WKk W', 'WWWWW');
    const slots: Slots = Array(SLOT_COUNT).fill(KEY);
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
    slots[0] = KEY;
    expect(useItem(w, slots, 1)).toBe('opened');
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
    slots[1] = KEY;
    expect(useItem(w, slots, 2)).toBe('opened');
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
    slots[0] = KEY;
    for (const n of [2, 0, 9, 12, -1]) expect(useItem(w, slots, n)).toBe('empty');
    expect(w.grid[1][2]).toBe('L');
    expect(slots[0]).toBe(KEY);
  });

  it('takes only a whole number as a slot: a fraction or a non-number is an empty slot', () => {
    for (const n of [1.5, 1.999, 0.5, 1.0000001, NaN, Infinity]) {
      const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
      const slots: Slots = Array(SLOT_COUNT).fill(KEY);
      expect(useItem(w, slots, n)).toBe('empty');
      expect(w.grid[1][2]).toBe('L');
      expect(slots).toEqual(Array(SLOT_COUNT).fill(KEY));
    }
  });

  it('uses each of the slots 1 to 8', () => {
    for (let n = 1; n <= SLOT_COUNT; n++) {
      const w = worldOf('WWWWW', 'WKL W', 'WWWWW');
      const slots = emptySlots();
      slots[n - 1] = KEY;
      expect(useItem(w, slots, n)).toBe('opened');
      expect(slots).toEqual(emptySlots());
    }
  });

  it('does nothing with a key when there is no locked door ahead', () => {
    for (const ahead of ['W', ' ', 'D', 'O', 'k', 'e']) {
      const w = worldOf('WWWWW', 'WK' + ahead + ' W', 'WWWWW');
      const slots = emptySlots();
      slots[0] = KEY;
      expect(useItem(w, slots, 1)).toBe('nothing');
      expect(slots[0]).toBe(KEY);
      expect(w.grid[1][2]).toBe(ahead);
    }
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
