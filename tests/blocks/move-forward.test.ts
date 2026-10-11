import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KEY } from '../../src/logic/world.ts';
import { useExecutionStore, WIN_DELAY } from '../../src/stores/execution.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import type { MessageKey } from '../../src/logic/types.ts';
import { move, turn } from '../helpers/program.ts';
import { label, loadMap, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

/** Run a Move forward that must fail, followed by a block that must not execute. */
function expectFailure(message: MessageKey, robotStays: string) {
  const failing = move(), after = turn();
  const said = run(failing, after);
  const execution = useExecutionStore();
  expect(robotAt()).toBe(robotStays);
  expect(said.at(-1)).toBe(t(message));
  expect(execution.err).toEqual({ [failing.id]: true });
  expect(execution.ok[after.id]).toBeUndefined();
  expect(useWorldStore().robot.d).toBe(1);
  expect(execution.active).toBe(false);
}

describe('block-move-forward: Move one cell', () => {
  it('Free floor ahead', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const block = move();
    run(block);
    expect(useWorldStore().robot).toEqual({ x: 2, y: 1, d: 1 });
    expect(useExecutionStore().ok).toEqual({ [block.id]: true });
    expect(useExecutionStore().err).toEqual({});
  });

  it('Key ahead', () => {
    loadMap('WWWWW', 'WKk W', 'WWWWW');
    const said = run(move());
    expect(robotAt()).toBe('2,1');
    expect(useInventoryStore().slots[0]).toBe(KEY);
    expect(useWorldStore().grid[1][2]).not.toBe('k');
    expect(said).toContain(t('ms.key', 1));
  });

  it('Exit ahead', () => {
    loadMap('WWWWW', 'WKe W', 'WWWWW');
    const winning = move(), after = move();
    const said = run(winning, after);
    const execution = useExecutionStore(), ui = useUiStore();
    expect(robotAt()).toBe('2,1');
    expect(said.at(-1)).toBe(t('ms.win'));
    expect(execution.active).toBe(false);
    expect(execution.ok).toEqual({ [winning.id]: true });
    expect(execution.err).toEqual({});
    // the level is won: the dialog follows after a moment
    expect(ui.dialog).toBeNull();
    vi.advanceTimersByTime(WIN_DELAY);
    expect(ui.dialog).toBe('win');
  });
});

describe('block-move-forward: Blocked by a wall', () => {
  it('Wall ahead', () => {
    loadMap('WWW', 'WKW', 'WWW');
    expectFailure('ms.wall', '1,1');
  });

  it('fails the same way at the edge of the map', () => {
    loadMap('WWW', 'W K');
    expectFailure('ms.wall', '2,1');
  });
});

describe('block-move-forward: Blocked by a locked door', () => {
  it('Locked door ahead', () => {
    loadMap('WWWWW', 'WKL W', 'WWWWW');
    expectFailure('ms.locked', '1,1');
  });
});

describe('block-move-forward: Pushing a crate', () => {
  it('Crate can be pushed', () => {
    loadMap('WWWWWW', 'WKb  W', 'WWWWWW');
    const pushing = move(), after = turn();
    run(pushing, after);
    const execution = useExecutionStore();
    expect(robotAt()).toBe('2,1');
    expect([...useWorldStore().boxes]).toEqual(['3,1']);
    expect(execution.ok).toEqual({ [pushing.id]: true, [after.id]: true });
    expect(execution.err).toEqual({});
  });

  it('Crate against a wall', () => {
    loadMap('WWWW', 'WKbW', 'WWWW');
    expectFailure('ms.stuck', '1,1');
    expect([...useWorldStore().boxes]).toEqual(['2,1']);
  });
});

describe('block-move-forward: Move forward label', () => {
  it('English label', () => {
    expect(label('move')).toBe('⬆ Move forward');
    useSettingsStore().setLanguage('sk');
    expect(label('move')).toBe('⬆ Choď');
  });
});
