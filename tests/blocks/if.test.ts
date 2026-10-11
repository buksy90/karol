import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, canGo, loopWhile, move, repeat, turn, when } from '../helpers/program.ts';
import { addCustom, label, loadMap, play, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('block-if: Conditional execution', () => {
  it('Condition is true', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    play(when(canGo(), move()));
    expect(robotAt()).toBe('2,1');
  });

  it('Condition is false', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const block = when(canGo(), move()), after = turn();
    const said = play(block, after);
    const execution = useExecutionStore();
    expect(robotAt()).toBe('1,1');
    expect(execution.ok[after.id]).toBe(true);
    expect(execution.err).toEqual({});
    expect(said.at(-1)).toBe(t('ms.fin'));
  });

  it('checks once, as a step of its own', () => {
    loadMap('WWWWWW', 'WK   W', 'WWWWWW');
    const said = play(when(canGo(), move()));
    // the check, the move, and the press of Step that finds the program finished
    expect(said).toHaveLength(3);
    expect(robotAt()).toBe('2,1');
  });
});

describe('block-if: Condition checked at execution time', () => {
  it('World changed earlier in the run', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const said = run(move(), when(canGo(), move()));
    expect(said).toContain(t('s.canfwd') + '? ' + t('ui.no'));
    expect(robotAt()).toBe('2,1');
    expect(useExecutionStore().err).toEqual({});
  });
});

describe('block-if: Nesting', () => {
  it('If inside a loop', () => {
    // the wall is three cells ahead of the robot
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const said = play(repeat(5, when(canGo(), move())));
    expect(robotAt()).toBe('3,1');
    expect(useExecutionStore().err).toEqual({});
    expect(said.at(-1)).toBe(t('ms.fin'));
  });

  it('holds other containers and custom blocks, and works inside them', () => {
    loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
    const twoSteps = addCustom('Two steps', when(canGo(), move(), move()));
    play(when(canGo(), repeat(2, move()), when(canGo(), call(twoSteps)), loopWhile(canGo(), move())));
    expect(robotAt()).toBe('6,1');
    expect(useExecutionStore().err).toEqual({});
  });
});

describe('block-if: Empty condition', () => {
  it('Missing sensor', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const block = when(null, move()), after = move();
    const said = run(block, after);
    const execution = useExecutionStore();
    expect(said.at(-1)).toBe(t('ms.nocond'));
    expect(execution.err).toEqual({ [block.id]: true });
    expect(execution.active).toBe(false);
    expect(execution.ok[after.id]).toBeUndefined();
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 1 });
  });
});

describe('block-if: If label', () => {
  it('Slovak label', () => {
    expect(label('if')).toBe('❓ If');
    useSettingsStore().setLanguage('sk');
    expect(label('if')).toBe('❓ Ak');
  });
});
