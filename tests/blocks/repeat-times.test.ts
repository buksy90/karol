import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNode } from '../../src/logic/program.ts';
import { defs } from '../../src/blocks/index.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, move, repeat, turn } from '../helpers/program.ts';
import { addCustom, label, loadMap, play, robotAt, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const corridor = () => loadMap('WWWWWWWWWW', 'WK       W', 'WWWWWWWWWW');
/** How many left turns the robot has made since the level started. */
const turnsMade = () => (90 - useWorldStore().angle) / 90;

describe('block-repeat-times: Fixed number of rounds', () => {
  it('Three rounds', () => {
    corridor();
    play(repeat(3, move()));
    expect(robotAt()).toBe('4,1');
  });

  it('New block', () => {
    expect(createNode(defs.for)).toMatchObject({ n: 2, children: [] });
    expect(defs.for.number).toMatchObject({ min: 1, max: 99 });
  });

  it('runs the blocks inside in order', () => {
    corridor();
    // forward, turn round on the spot (4 turns), twice
    play(repeat(2, move(), turn(), turn(), turn(), turn()));
    expect(robotAt()).toBe('3,1');
    expect(turnsMade()).toBe(8);
  });
});

describe('repeat-times run', () => {
  // The number field keeps only 1 to 99; this is the guard behind it.
  it('clamps a round count outside 1 to 99', () => {
    corridor();
    play(repeat(0, move()));
    expect(robotAt()).toBe('2,1');
    play(repeat(500, turn()));
    expect(turnsMade()).toBe(99);
  });
});

describe('block-repeat-times: Nesting', () => {
  it('Loop inside a loop', () => {
    corridor();
    play(repeat(2, repeat(3, move())));
    expect(robotAt()).toBe('7,1');
  });
});

describe('block-repeat-times: Round start is a step', () => {
  it('Stepping through a loop', () => {
    corridor();
    const inside = move(), after = turn();
    const loop = repeat(2, inside);
    setProgram(loop, after);
    const execution = useExecutionStore();
    const current: (string | null)[] = [];
    for (let i = 0; i < 6; i++) { step(); current.push(execution.current); }
    expect(current).toEqual([loop.id, inside.id, loop.id, inside.id, loop.id, after.id]);
  });

  it('Empty loop', () => {
    corridor();
    const said = play(repeat(3));
    // four steps, then the press of Step that finds the program finished
    expect(said).toEqual([t('ms.step', 1), t('ms.step', 2), t('ms.step', 3), t('ms.step', 4), t('ms.fin')]);
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 1 });
  });
});

describe('block-repeat-times: Rounds-left badge', () => {
  it('Counting down', () => {
    corridor();
    const loop = repeat(3, move());
    setProgram(loop);
    const execution = useExecutionStore();
    const badges: string[] = [];
    while (badges.length < 7) { step(); badges.push(execution.counts[loop.id].text); }
    // the badge changes at each round start and stays while the block inside executes
    expect(badges).toEqual(['⏳ 3', '⏳ 3', '⏳ 2', '⏳ 2', '⏳ 1', '⏳ 1', '⏳ 0']);
  });

  it('Badge after the run', () => {
    corridor();
    const first = move(), loop = repeat(2);
    const execution = useExecutionStore();
    play(first, loop);
    expect(execution.active).toBe(false);
    expect(execution.counts[loop.id].text).toBe('⏳ 0');
    // a new run starts without it
    step();
    expect(execution.current).toBe(first.id);
    expect(execution.counts).toEqual({});
    // and so does a changed program (the editor calls clearMarks on every change)
    play();
    expect(execution.counts[loop.id].text).toBe('⏳ 0');
    execution.clearMarks();
    expect(execution.counts).toEqual({});
  });

  it('pops again at every change, faster at higher speed', () => {
    corridor();
    const loop = repeat(2);
    setProgram(loop);
    const execution = useExecutionStore();
    step();
    const first = { ...execution.counts[loop.id] };
    execution.setSpeed(15);
    step();
    const second = execution.counts[loop.id];
    expect(second.key).not.toBe(first.key);
    expect(first.duration).toBe('0.45s');
    expect(second.duration).toBe('0.1s');
  });
});

describe('block-repeat-times: Repeat inside a custom block', () => {
  it('Loop hidden inside a custom block', () => {
    corridor();
    const use1 = call(addCustom('Twice', repeat(2, move())));
    const said = play(use1);
    expect(said).toEqual([t('ms.step', 1), t('ms.step', 2), t('ms.fin')]);
    expect(robotAt()).toBe('3,1');
    expect(useExecutionStore().counts).toEqual({});
  });
});

describe('block-repeat-times: Repeat label', () => {
  it('Slovak label', () => {
    expect([label('for'), t(defs.for.suffixKey!)]).toEqual(['🔁 Repeat', 'times']);
    useSettingsStore().setLanguage('sk');
    expect([label('for'), t(defs.for.suffixKey!)]).toEqual(['🔁 Zopakuj', 'krát']);
  });
});
