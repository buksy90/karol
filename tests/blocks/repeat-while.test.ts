import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STEP_LIMIT } from '../../src/logic/interpreter.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, canGo, loopWhile, move, not, repeat, turn, use, when } from '../helpers/program.ts';
import { addCustom, label, loadMap, play, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('block-repeat-while: Loop while the condition is true', () => {
  it('Walk up to the wall', () => {
    // the wall is four cells ahead of the robot
    loadMap('WWWWWW', 'WK   W', 'WWWWWW');
    const loop = loopWhile(canGo(), move()), after = turn();
    play(loop, after);
    const execution = useExecutionStore();
    expect(robotAt()).toBe('4,1');
    expect(execution.err).toEqual({});
    expect(execution.ok[after.id]).toBe(true);
  });

  it('Condition false from the start', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const inside = turn();
    const said = play(loopWhile(canGo(), inside));
    const execution = useExecutionStore();
    expect(useWorldStore().robot.d).toBe(1);
    expect(execution.ok[inside.id]).toBeUndefined();
    expect(execution.err).toEqual({});
    // one check, then the press of Step that finds the program finished
    expect(said).toEqual([t('ms.step', 1), t('ms.fin')]);
  });

  it('Turn until the way is free', () => {
    // walls ahead (east) and to the left (north); the way west is free
    loadMap('WWWW', 'W KW', 'WWWW');
    play(loopWhile(not(canGo()), turn()));
    expect(useWorldStore().robot).toEqual({ x: 2, y: 1, d: 3 });
    expect(useExecutionStore().err).toEqual({});
  });

  it('checks before every round, as a step of its own', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const said = run(loopWhile(canGo(), move()));
    const yes = t('s.canfwd') + '? ' + t('ui.yes'), no = t('s.canfwd') + '? ' + t('ui.no');
    // check, move, check, move, check, and the tick that finds the program finished
    expect(said).toEqual([t('ms.run'), yes, yes, yes, yes, no, t('ms.fin')]);
  });
});

describe('block-repeat-while: Loop that does nothing', () => {
  it('Empty body', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const loop = loopWhile(canGo()), after = move();
    const said = run(loop, after);
    const execution = useExecutionStore();
    expect(said.at(-1)).toBe(t('ms.loopstuck'));
    expect(execution.err).toEqual({ [loop.id]: true });
    expect(execution.active).toBe(false);
    expect(execution.ok[after.id]).toBeUndefined();
  });

  it('Body that only checks a false condition', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const loop = loopWhile(canGo(), when(not(canGo()), move()));
    const said = run(loop);
    // the loop's check, the If's check, and the step that reports the loop
    expect(said).toHaveLength(4);
    expect(said.at(-1)).toBe(t('ms.loopstuck'));
    expect(useExecutionStore().err).toEqual({ [loop.id]: true });
    expect(robotAt()).toBe('1,1');
  });

  it('Failed action counts as progress', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const said = play(loopWhile(canGo(), use(1)));
    expect(said.at(-1)).toBe(t('ms.toolong'));
    expect(said).not.toContain(t('ms.loopstuck'));
    expect(said).toHaveLength(STEP_LIMIT + 1);
  });

  it('counts an action anywhere inside the round', () => {
    loadMap('WWWWWW', 'WK   W', 'WWWWWW');
    play(loopWhile(canGo(), repeat(1, when(canGo(), move()))));
    expect(robotAt()).toBe('4,1');
    expect(useExecutionStore().err).toEqual({});
  });
});

describe('block-repeat-while: Nesting', () => {
  it('Loop inside a custom block', () => {
    loadMap('WWWWWWW', 'WK    W', 'WWWWWWW');
    const walk = call(addCustom('Walk', loopWhile(canGo(), move())));
    play(walk);
    const execution = useExecutionStore();
    expect(robotAt()).toBe('5,1');
    expect(execution.err).toEqual({});
    expect(execution.ok).toEqual({ [walk.id]: true });
  });

  it('holds other containers', () => {
    loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
    play(loopWhile(canGo(), repeat(2, when(canGo(), move()))));
    expect(robotAt()).toBe('6,1');
  });
});

describe('block-repeat-while: Empty condition', () => {
  it('Missing sensor', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const loop = loopWhile(null, move());
    const said = run(loop);
    const execution = useExecutionStore();
    expect(said.at(-1)).toBe(t('ms.nocond'));
    expect(execution.err).toEqual({ [loop.id]: true });
    expect(execution.active).toBe(false);
    expect(robotAt()).toBe('1,1');
  });
});

describe('block-repeat-while: Repeat while label', () => {
  it('English label', () => {
    expect(label('while')).toBe('🔄 Repeat while');
    useSettingsStore().setLanguage('sk');
    expect(label('while')).toBe('🔄 Opakuj, kým platí');
  });
});
