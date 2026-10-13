import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defs } from '../../src/blocks/index.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, move, repeat, turn } from '../helpers/program.ts';
import { addCustom, loadMap, play, robotAt, run, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const corridor = () => loadMap('WWWWWWW', 'WK    W', 'WWWWWWW');

/**
 * Custom blocks each containing the next one; the innermost contains a Turn left.
 * @returns the id of the outermost
 */
function nested(count: number): string {
  let id = addCustom('Block ' + count, turn());
  for (let i = count - 1; i >= 1; i--) id = addCustom('Block ' + i, call(id));
  return id;
}

describe('custom-blocks: Executing a custom block', () => {
  it('Stepping through a call', () => {
    corridor();
    const use1 = call(addCustom('Two steps', move(), move()));
    setProgram(use1);
    const execution = useExecutionStore();
    step();
    expect(execution.current).toBe(use1.id);
    expect(robotAt()).toBe('2,1');
    step();
    expect(execution.current).toBe(use1.id);
    expect(robotAt()).toBe('3,1');
    expect(execution.ok).toEqual({ [use1.id]: true });
  });

  it('Failure inside a call', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const use1 = call(addCustom('Step', move())), after = turn();
    const said = run(use1, after);
    const execution = useExecutionStore();
    expect(execution.err).toEqual({ [use1.id]: true });
    expect(execution.active).toBe(false);
    expect(execution.ok[after.id]).toBeUndefined();
    expect(said.at(-1)).toBe(t('ms.wall'));
  });

  it('Empty custom block', () => {
    corridor();
    const use1 = call(addCustom('Nothing')), after = move();
    const said = play(use1, after);
    const execution = useExecutionStore();
    // one step for the Move forward, none for the custom block
    expect(said).toEqual([t('ms.step', 1), t('ms.fin')]);
    expect(robotAt()).toBe('2,1');
    expect(execution.ok).toEqual({ [after.id]: true });
    expect(execution.err).toEqual({});
  });

  it('runs the blocks inside in order', () => {
    corridor();
    play(call(addCustom('Turn round', move(), turn(), turn(), move())));
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 3 });
  });

  it('marks the containers around the call as executed', () => {
    corridor();
    const use1 = call(addCustom('Step', move()));
    const loop = repeat(2, use1);
    play(loop);
    expect(useExecutionStore().ok).toEqual({ [loop.id]: true, [use1.id]: true });
    expect(robotAt()).toBe('3,1');
  });

  it('runs custom blocks inside custom blocks', () => {
    corridor();
    const inner = addCustom('Step', move());
    const outer = addCustom('Three steps', call(inner), repeat(2, call(inner)));
    const use1 = call(outer);
    const said = play(use1);
    expect(robotAt()).toBe('4,1');
    expect(said).toHaveLength(4);
    expect(useExecutionStore().ok).toEqual({ [use1.id]: true });
  });

  it('skips a use of a custom block that no longer exists', () => {
    corridor();
    const after = move();
    const said = play(call('gone'), after);
    expect(said).toEqual([t('ms.step', 1), t('ms.fin')]);
    expect(robotAt()).toBe('2,1');
  });

  it('has no label of its own: the block shows the custom block name', () => {
    expect(defs.call.labelKey).toBeUndefined();
  });
});

describe('custom-blocks: Nesting depth limit', () => {
  it('Call nested too deep', () => {
    corridor();
    const use1 = call(nested(21)), after = move();
    const said = run(use1, after);
    const execution = useExecutionStore();
    expect(said.at(-1)).toBe('Too many custom blocks inside each other!');
    expect(execution.err).toEqual({ [use1.id]: true });
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect(execution.ok[after.id]).toBeUndefined();
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 1 });
  });

  it('Exactly at the limit', () => {
    corridor();
    const use1 = call(nested(20));
    const said = play(use1);
    const execution = useExecutionStore();
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 0 });
    expect(execution.ok).toEqual({ [use1.id]: true });
    expect(execution.err).toEqual({});
    expect(said).not.toContain(t('ms.toodeep'));
  });

  it('marks the block in the program, not one hidden inside, also when the deep call sits in a loop', () => {
    corridor();
    const loop = repeat(2, call(nested(21)));
    play(loop);
    const execution = useExecutionStore();
    expect(execution.err).toEqual({ [loop.children![0].id]: true });
    expect(execution.active).toBe(false);
  });

  it('says it in Slovak', () => {
    corridor();
    useSettingsStore().setLanguage('sk');
    expect(play(call(nested(21))).at(-1)).toBe('Príliš veľa vlastných blokov vnorených do seba!');
  });
});
