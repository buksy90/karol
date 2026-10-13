import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNode } from '../../src/logic/program.ts';
import { KEY } from '../../src/logic/world.ts';
import { defs } from '../../src/blocks/index.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { move, turn, use } from '../helpers/program.ts';
import { label, loadMap, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';

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
    expect(useInventoryStore().slots[0]).toBe(KEY);
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[after.id]).toBe(true);
  });
});

describe('block-use-item: Use item label', () => {
  it('Slovak label', () => {
    expect(label('use')).toBe('🔑 Use item');
    useSettingsStore().setLanguage('sk');
    expect(label('use')).toBe('🔑 Použi');
  });
});
