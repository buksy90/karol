import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { evaluate } from '../../src/logic/conditions.ts';
import { createNode } from '../../src/logic/program.ts';
import { defs, isCondition, libraryBlocks } from '../../src/blocks/index.ts';
import notBlock from '../../src/blocks/not.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { canGo, loopWhile, move, not, when } from '../helpers/program.ts';
import { label, loadMap, robotAt, run, setupStores, t, teardownStores } from '../helpers/stores.ts';
import { worldOf } from '../helpers/world.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const blocked = () => worldOf('WWW', 'WKW', 'WWW');
const free = () => worldOf('WWWW', 'WK W', 'WWWW');

describe('block-not: Negation', () => {
  it('Way is blocked', () => {
    expect(evaluate(not(canGo()), defs, { world: blocked() })).toBe(true);
  });

  it('Way is free', () => {
    expect(evaluate(not(canGo()), defs, { world: free() })).toBe(false);
  });

  it('inverts whatever it is given', () => {
    expect(notBlock.apply(true)).toBe(false);
    expect(notBlock.apply(false)).toBe(true);
  });
});

describe('block-not: Placement', () => {
  // The two drop scenarios need a pointer; what can be checked here is what the drop code relies on.
  it('is offered in the Blocks section and is a condition, not a statement', () => {
    expect(libraryBlocks).toContain(notBlock);
    expect(isCondition('not')).toBe(true);
    expect(notBlock.kind).toBe('condition');
  });

  it('starts with an empty slot of its own', () => {
    expect(createNode(defs.not)).toMatchObject({ type: 'not', cond: null });
  });
});

describe('block-not: Nested Not', () => {
  it('Double negation', () => {
    expect(evaluate(not(not(canGo())), defs, { world: free() })).toBe(true);
    expect(evaluate(not(not(canGo())), defs, { world: blocked() })).toBe(false);
  });

  it('works as the condition of a running program at any depth', () => {
    loadMap('WWWWWW', 'WK   W', 'WWWWWW');
    run(loopWhile(not(not(canGo())), move()));
    expect(robotAt()).toBe('4,1');
    expect(useExecutionStore().err).toEqual({});
  });
});

describe('block-not: Empty inner slot', () => {
  it('Not without a sensor', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const block = when(not(), move());
    const said = run(block);
    const execution = useExecutionStore();
    expect(said.at(-1)).toBe(t('ms.nocond'));
    expect(execution.err).toEqual({ [block.id]: true });
    expect(execution.active).toBe(false);
    expect(robotAt()).toBe('1,1');
  });

  it('counts as empty at any depth', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const loop = loopWhile(not(not()), move());
    expect(run(loop).at(-1)).toBe(t('ms.nocond'));
    expect(useExecutionStore().err).toEqual({ [loop.id]: true });
  });
});

describe('block-not: Not label', () => {
  it('Slovak label', () => {
    expect(label('not')).toBe('🚫 Not');
    useSettingsStore().setLanguage('sk');
    expect(label('not')).toBe('🚫 Nie');
  });
});
