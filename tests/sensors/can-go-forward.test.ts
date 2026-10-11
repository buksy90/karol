import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { moveForward } from '../../src/logic/world.ts';
import { defs, isCondition } from '../../src/blocks/index.ts';
import canGoForward from '../../src/sensors/can-go-forward.ts';
import { librarySensors } from '../../src/sensors/index.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import type { World } from '../../src/logic/types.ts';
import { label, setupStores, teardownStores } from '../helpers/stores.ts';
import { emptySlots, worldOf } from '../helpers/world.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const check = (world: World): boolean => canGoForward.evaluate({ world });
/** A corridor with the robot at its start and these cells after it. */
const ahead = (cells: string): World => worldOf('WWWWWW', ('WK' + cells).padEnd(5) + 'W', 'WWWWWW');

describe('sensor-can-go-forward: True when a move would succeed', () => {
  it('Free floor ahead', () => {
    expect(check(ahead(' '))).toBe(true);
  });

  it('Wall ahead', () => {
    expect(check(ahead('W'))).toBe(false);
  });

  it('Edge of the map ahead', () => {
    expect(check(worldOf('WWW', '  K', 'WWW'))).toBe(false);
  });

  it('Locked door ahead', () => {
    expect(check(ahead('L'))).toBe(false);
  });

  it('Open door, key or exit ahead', () => {
    for (const cell of ['D', 'k', 'e', 'O']) expect(check(ahead(cell))).toBe(true);
  });

  it('agrees with what Move forward then does, in every direction', () => {
    const maps = [[' ', true], ['W', false], ['L', false], ['D', true], ['k', true], ['e', true], ['b ', true], ['bW', false]] as const;
    for (const [cells, expected] of maps) {
      const world = ahead(cells);
      expect(check(world)).toBe(expected);
      expect(moveForward(world, emptySlots()).moved).toBe(expected);
    }
    // walls on the other three sides
    const world = ahead(' ');
    for (const d of [0, 2, 3]) { world.robot.d = d; expect(check(world)).toBe(false); }
  });

  it('does not change the world', () => {
    const world = ahead('bk');
    const state = () => JSON.stringify([world.grid, [...world.boxes], world.robot, world.angle]);
    const before = state();
    check(world);
    expect(state()).toBe(before);
  });
});

describe('sensor-can-go-forward: Crates count only if pushable', () => {
  it('Pushable crate', () => {
    expect(check(ahead('b '))).toBe(true);
    expect(check(ahead('bD'))).toBe(true);
  });

  it('Stuck crate', () => {
    for (const behind of ['W', 'L', 'k', 'e', 'b']) expect(check(ahead('b' + behind))).toBe(false);
  });
});

describe('sensor-can-go-forward: Placement in the library', () => {
  // Dragging needs a pointer; what can be checked here is what the drop code relies on.
  it('is offered in the Sensors section and is a condition', () => {
    expect(librarySensors).toContain(canGoForward);
    expect(defs.canfwd).toBe(canGoForward);
    expect(isCondition('canfwd')).toBe(true);
  });
});

describe('sensor-can-go-forward: Can go forward label', () => {
  it('Slovak label', () => {
    expect(label('canfwd')).toBe('👀 Can go forward');
    useSettingsStore().setLanguage('sk');
    expect(label('canfwd')).toBe('👀 Môžem ísť dopredu');
  });
});
