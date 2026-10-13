import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNode } from '../../src/logic/program.ts';
import { COLOR_NAMES } from '../../src/logic/colors.ts';
import type { LevelContent } from '../../src/logic/types.ts';
import { defs } from '../../src/blocks/index.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { move, turn, use } from '../helpers/program.ts';
import { label, loadLevel, loadMap, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('block-use-item: Slot number', () => {
  it('New block', () => {
    expect(createNode(defs.use).n).toBe(1);
    expect(defs.use.number).toMatchObject({ min: 1, max: 8 });
  });
});

describe('block-use-item: Unlock a door with a key', () => {
  it('Key used on a locked door', () => {
    loadMap('WWWWWW', 'WKkL W', 'WWWWWW');
    const pickUp = move(), unlock = use(1);
    const said = run(pickUp, unlock);
    const execution = useExecutionStore();
    expect(useWorldStore().grid[1][3]).toBe('O');
    expect(useInventoryStore().slots[0]).toBeNull();
    expect(said).toContain(t('ms.open'));
    expect(robotAt()).toBe('2,1');
    expect(execution.err).toEqual({});
    expect(execution.ok[unlock.id]).toBe(true);
  });
});

describe('block-use-item: Chosen slot is empty', () => {
  it('Empty slot', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const failing = use(3), after = turn();
    const said = run(failing, after);
    const execution = useExecutionStore();
    expect(said).toContain(t('ms.slot', 3));
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[after.id]).toBe(true);
    expect(said.at(-1)).toBe(t('ms.fin'));
  });
});

describe('block-use-item: Nothing to use the item on', () => {
  it('Key used on a wall', () => {
    loadMap('WWWW', 'WKkW', 'WWWW');
    const pickUp = move(), failing = use(1), after = turn();
    const said = run(pickUp, failing, after);
    const execution = useExecutionStore();
    expect(said).toContain(t('ms.nothing'));
    expect(useInventoryStore().slots[0]).toEqual({ type: 'key' });
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[after.id]).toBe(true);
  });
});

/** A corridor with a red spray on the cell next to the robot. */
const corridor = (uses: number, row = 'WK   W'): LevelContent => ({
  map: ['W'.repeat(row.length), row, 'W'.repeat(row.length)],
  items: [{ type: 'spray', position: [2, 1], color: 'red', uses }],
});
const RED = COLOR_NAMES.red;

describe('block-use-item: Paint with a spray', () => {
  it('Spray with uses left', () => {
    loadLevel(corridor(3));
    const paint = use(1);
    const said = run(move(), paint);
    expect([...useWorldStore().paint]).toEqual([['2,1', RED]]);
    expect(robotAt()).toBe('2,1');
    expect(said).toContain(t('ms.paint', 2));
    expect(t('ms.paint', 2)).toBe('Painted! ×2 left.');
    expect(useInventoryStore().slots[0]).toEqual({ type: 'spray', color: RED, uses: 2 });
    expect(useExecutionStore().err).toEqual({});
    expect(useExecutionStore().ok[paint.id]).toBe(true);
  });

  it('Last use of a spray', () => {
    loadLevel(corridor(1));
    const said = run(move(), use(1));
    expect(useWorldStore().paint.get('2,1')).toBe(RED);
    expect(useInventoryStore().slots[0]).toBeNull();
    expect(said).toContain(t('ms.paintlast'));
    expect(t('ms.paintlast')).toBe('Painted! The spray is empty.');
    expect(useExecutionStore().err).toEqual({});
  });

  it('Used again after the spray ran out', () => {
    loadLevel(corridor(1));
    const again = use(1), after = turn();
    const said = run(move(), use(1), again, after);
    const execution = useExecutionStore();
    expect(said).toContain(t('ms.slot', 1));
    expect(execution.err).toEqual({ [again.id]: true });
    expect(execution.ok[after.id]).toBe(true);
  });

  it('Paint that finishes a flag', () => {
    loadLevel({ ...corridor(1, 'WK  LW'), flags: [{ position: [3, 1], colors: [['red']], onDrawn: { unlockDoor: [4, 1] } }] });
    const paint = use(1), through = move();
    const said = run(move(), move(), paint, through);
    const execution = useExecutionStore();
    expect(said).toContain(t('ms.flag'));
    expect(t('ms.flag')).toBe('🎨 The flag is done! A door opened 🔓');
    // the flag message takes the place of the paint message
    expect(said).not.toContain(t('ms.paintlast'));
    expect(execution.err).toEqual({});
    expect(execution.ok[through.id]).toBe(true);
    expect(robotAt()).toBe('4,1');
  });

  it('Spray with a locked door ahead', () => {
    loadLevel(corridor(3, 'WK LW'));
    run(move(), use(1));
    expect(useWorldStore().paint.get('2,1')).toBe(RED);
    expect(useWorldStore().grid[1][3]).toBe('L');
    expect(useExecutionStore().err).toEqual({});
  });
});

describe('block-use-item: Nothing to use the item on (sprays)', () => {
  it('Spray used in a doorway', () => {
    loadLevel(corridor(3, 'WK D W'));
    const failing = use(1), after = turn();
    const said = run(move(), move(), failing, after);
    const execution = useExecutionStore();
    expect(robotAt()).toBe('3,1');
    expect(said).toContain(t('ms.nothing'));
    expect(useWorldStore().paint.size).toBe(0);
    expect(useInventoryStore().slots[0]).toEqual({ type: 'spray', color: RED, uses: 3 });
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[after.id]).toBe(true);
  });
});

describe('block-use-item: Use item label', () => {
  it('Slovak label', () => {
    expect(label('use')).toBe('🎒 Use item');
    useSettingsStore().setLanguage('sk');
    expect(label('use')).toBe('🎒 Použi');
  });
});
