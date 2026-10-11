import { describe, expect, it } from 'vitest';
import { countRound, createEnv, LOOP_LIMIT, MAX_DEPTH, runList } from '../../src/logic/interpreter.ts';
import { defs } from '../../src/blocks/index.ts';
import type { CustomBlocks, ProgramNode, Step } from '../../src/logic/types.ts';
import { call, canGo, loopWhile, move, not, repeat, turn, use, when } from '../helpers/program.ts';

/**
 * Drive the generator the way a run does and collect what it yields.
 * @param answers the results of the condition checks, in order; a missing answer counts as false
 */
function stepsOf(program: ProgramNode[], answers: boolean[] = [], customs: CustomBlocks = {}): Step[] {
  const env = createEnv(defs, customs);
  const gen = runList(program, env);
  const steps: Step[] = [];
  let result: boolean | undefined;
  for (;;) {
    const r = gen.next(result);
    if (r.done) return steps;
    result = undefined;
    if (r.value.t === 'cond') result = answers.shift() ?? false;
    if (r.value.t === 'action') env.counters.actions++;
    steps.push(r.value);
    if (steps.length > 2000) throw Error('the test program does not end');
  }
}

/** A step as short text: "action b1", "cond b2", "loop b3 2", "stuck b4". */
const brief = (s: Step): string => s.t + ' ' + s.id + (s.t === 'loop' ? ' ' + s.cnt : '');
const briefly = (program: ProgramNode[], answers?: boolean[], customs?: CustomBlocks): string[] =>
  stepsOf(program, answers, customs).map(brief);

describe('runList: actions', () => {
  it('yields one step per action, top to bottom, with the block and its definition', () => {
    const a = turn(), b = move(), c = use(3);
    expect(stepsOf([a, b, c])).toEqual([
      { t: 'action', id: a.id, node: a, def: defs.rot },
      { t: 'action', id: b.id, node: b, def: defs.move },
      { t: 'action', id: c.id, node: c, def: defs.use },
    ]);
  });

  it('yields nothing for an empty program', () => {
    expect(stepsOf([])).toEqual([]);
  });
});

describe('runList: If', () => {
  it('checks once and runs the body when the answer is true', () => {
    const inside = move(), after = turn();
    const block = when(canGo(), inside);
    expect(briefly([block, after], [true])).toEqual(['cond ' + block.id, 'action ' + inside.id, 'action ' + after.id]);
  });

  it('skips the body when the answer is false', () => {
    const inside = move(), after = turn();
    const block = when(canGo(), inside);
    expect(briefly([block, after], [false])).toEqual(['cond ' + block.id, 'action ' + after.id]);
  });

  it('hands over its condition, which is null for an empty slot', () => {
    const inverted = not(canGo());
    const [first] = stepsOf([when(inverted)]);
    expect(first).toMatchObject({ t: 'cond', cond: inverted });
    const [empty] = stepsOf([when(null)]);
    expect(empty).toMatchObject({ t: 'cond', cond: null });
  });
});

describe('runList: Repeat N times', () => {
  it('starts every round with a step counting the rounds left, and ends with 0', () => {
    const inside = move();
    const loop = repeat(3, inside);
    expect(briefly([loop])).toEqual([
      'loop ' + loop.id + ' 3', 'action ' + inside.id,
      'loop ' + loop.id + ' 2', 'action ' + inside.id,
      'loop ' + loop.id + ' 1', 'action ' + inside.id,
      'loop ' + loop.id + ' 0',
    ]);
  });

  it('takes N + 1 steps when empty', () => {
    expect(stepsOf([repeat(3)])).toHaveLength(4);
  });

  it('treats a number below 1 or an empty field as 1, and above 99 as 99', () => {
    const rounds = (n: number | '') => stepsOf([repeat(n, move())]).filter(s => s.t === 'action').length;
    expect(rounds(0)).toBe(1);
    expect(rounds(-5)).toBe(1);
    expect(rounds('')).toBe(1);
    expect(rounds(99)).toBe(99);
    expect(rounds(500)).toBe(99);
  });

  it('multiplies when nested', () => {
    const steps = stepsOf([repeat(2, repeat(3, move()))]);
    expect(steps.filter(s => s.t === 'action')).toHaveLength(6);
  });
});

describe('runList: Repeat while', () => {
  it('checks before every round and ends on the first false', () => {
    const inside = move(), after = turn();
    const loop = loopWhile(canGo(), inside);
    expect(briefly([loop, after], [true, true, false])).toEqual([
      'cond ' + loop.id, 'action ' + inside.id,
      'cond ' + loop.id, 'action ' + inside.id,
      'cond ' + loop.id, 'action ' + after.id,
    ]);
  });

  it('never runs the body when the first answer is false', () => {
    const loop = loopWhile(canGo(), move());
    expect(briefly([loop], [false])).toEqual(['cond ' + loop.id]);
  });

  it('reports a round in which no action executed as stuck', () => {
    const loop = loopWhile(canGo());
    expect(briefly([loop], [true]).slice(0, 2)).toEqual(['cond ' + loop.id, 'stuck ' + loop.id]);
    const checking = loopWhile(canGo(), when(canGo(), move()));
    expect(briefly([checking], [true, false]).slice(0, 3))
      .toEqual(['cond ' + checking.id, 'cond ' + checking.children![0].id, 'stuck ' + checking.id]);
  });

  it('is not stuck when an action executed somewhere inside the round', () => {
    const loop = loopWhile(canGo(), repeat(1, when(canGo(), move())));
    const steps = briefly([loop], [true, true, false]);
    expect(steps.some(s => s.startsWith('stuck'))).toBe(false);
  });
});

describe('runList: custom block call', () => {
  it('runs the body with every step carrying the id of the call block', () => {
    const first = move(), second = turn();
    const use1 = call('c1'), after = move();
    const steps = stepsOf([use1, after], [], { c1: { name: 'Corner', body: [first, second] } });
    expect(steps.map(brief)).toEqual(['action ' + use1.id, 'action ' + use1.id, 'action ' + after.id]);
    expect(steps.slice(0, 2).map(s => s.t === 'action' && s.node)).toEqual([first, second]);
  });

  it('marks checks inside the body on the call block too', () => {
    const use1 = call('c1');
    const customs = { c1: { name: 'A', body: [when(canGo(), move()), loopWhile(canGo(), turn())] } };
    expect(briefly([use1], [true, true, false], customs)).toEqual([
      'cond ' + use1.id, 'action ' + use1.id,
      'cond ' + use1.id, 'action ' + use1.id, 'cond ' + use1.id,
    ]);
  });

  it('runs a Repeat inside the body without round-start steps', () => {
    const use1 = call('c1');
    const customs = { c1: { name: 'A', body: [repeat(2, move())] } };
    expect(briefly([use1], [], customs)).toEqual(['action ' + use1.id, 'action ' + use1.id]);
  });

  it('keeps the outermost call as the marked block through nested calls', () => {
    const use1 = call('outer');
    const customs = {
      outer: { name: 'Outer', body: [move(), call('inner')] },
      inner: { name: 'Inner', body: [turn()] },
    };
    expect(briefly([use1], [], customs)).toEqual(['action ' + use1.id, 'action ' + use1.id]);
  });

  it('takes no step for an empty body or a custom block that no longer exists', () => {
    const after = move();
    expect(briefly([call('c1'), call('gone'), after], [], { c1: { name: 'Empty', body: [] } })).toEqual(['action ' + after.id]);
  });

  it('shows a Repeat that calls a custom block as usual', () => {
    const use1 = call('c1');
    const loop = repeat(2, use1);
    expect(briefly([loop], [], { c1: { name: 'A', body: [move()] } })).toEqual([
      'loop ' + loop.id + ' 2', 'action ' + use1.id,
      'loop ' + loop.id + ' 1', 'action ' + use1.id,
      'loop ' + loop.id + ' 0',
    ]);
  });
});

describe('runList: nesting depth of custom blocks', () => {
  /** c1 contains c2, which contains c3, and so on; the last one contains a Move forward. */
  function chain(length: number): CustomBlocks {
    const customs: CustomBlocks = {};
    for (let i = 1; i <= length; i++) {
      customs['c' + i] = { name: 'Block ' + i, body: [i < length ? call('c' + (i + 1)) : move()] };
    }
    return customs;
  }

  it('runs custom blocks nested MAX_DEPTH deep', () => {
    expect(MAX_DEPTH).toBe(20);
    expect(stepsOf([call('c1')], [], chain(20))).toHaveLength(1);
  });

  it('skips the call that would go deeper, without a step', () => {
    expect(stepsOf([call('c1')], [], chain(21))).toEqual([]);
  });

  it('ends a custom block that calls itself', () => {
    const customs = { c1: { name: 'Again', body: [move(), call('c1')] } };
    expect(stepsOf([call('c1')], [], customs)).toHaveLength(MAX_DEPTH);
  });
});

describe('loop round limit', () => {
  it('createEnv starts the counters at zero', () => {
    const customs = {};
    expect(createEnv(defs, customs)).toEqual({ defs, customs, counters: { ops: 0, actions: 0 } });
  });

  it('countRound throws once more than LOOP_LIMIT rounds were started', () => {
    const env = createEnv(defs, {});
    env.counters.ops = LOOP_LIMIT - 1;
    expect(() => countRound(env)).not.toThrow();
    expect(() => countRound(env)).toThrow('long');
  });

  it('stops loops that would run for too long, even when no step is shown', () => {
    const customs = { c1: { name: 'Busy', body: [repeat(99, repeat(99, repeat(99)))] } };
    const gen = runList([call('c1'), move()], createEnv(defs, customs));
    expect(() => gen.next()).toThrow('long');
  });

  it('counts the rounds of Repeat while as well', () => {
    const env = createEnv(defs, {});
    env.counters.ops = LOOP_LIMIT;
    expect(() => runList([loopWhile(canGo(), move())], env).next()).toThrow('long');
  });
});
