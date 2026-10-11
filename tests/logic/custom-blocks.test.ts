import { describe, expect, it } from 'vitest';
import { offeredIds, uses } from '../../src/logic/custom-blocks.ts';
import type { CustomBlocks } from '../../src/logic/types.ts';
import { call, canGo, loopWhile, move, repeat, turn, when } from '../helpers/program.ts';

describe('custom-blocks: Contents and cycle prevention', () => {
  it('Block cannot contain itself', () => {
    const customs: CustomBlocks = { A: { name: 'A', body: [move()] } };
    expect(offeredIds(customs, 'A')).toEqual([]);
  });

  it('Indirect cycle', () => {
    const customs: CustomBlocks = {
      A: { name: 'A', body: [move()] },
      B: { name: 'B', body: [turn(), call('A')] },
      // contains A only through B
      D: { name: 'D', body: [repeat(2, call('B'))] },
    };
    expect(offeredIds(customs, 'A')).toEqual([]);
    // the other way round is fine: A does not contain B
    expect(offeredIds(customs, 'B')).toEqual(['A']);
  });

  it('Unrelated block', () => {
    const customs: CustomBlocks = {
      A: { name: 'A', body: [move()] },
      B: { name: 'B', body: [call('A')] },
      C: { name: 'C', body: [move(), turn()] },
    };
    expect(offeredIds(customs, 'A')).toEqual(['C']);
  });
});

describe('offeredIds', () => {
  const customs: CustomBlocks = {
    A: { name: 'A', body: [] },
    B: { name: 'B', body: [call('A')] },
  };

  it('offers every custom block while none is being edited', () => {
    expect(offeredIds(customs, null)).toEqual(['A', 'B']);
  });

  it('offers every custom block while a new one is being created', () => {
    // a new block has no id yet, so nothing can contain it
    expect(offeredIds(customs, null)).toHaveLength(2);
    expect(offeredIds({}, null)).toEqual([]);
  });
});

describe('uses', () => {
  it('finds a direct call', () => {
    expect(uses([move(), call('A')], 'A', {})).toBe(true);
    expect(uses([move(), call('B')], 'A', {})).toBe(false);
    expect(uses([], 'A', {})).toBe(false);
  });

  it('finds a call inside containers', () => {
    expect(uses([repeat(2, when(canGo(), loopWhile(canGo(), call('A'))))], 'A', {})).toBe(true);
  });

  it('finds a call made through other custom blocks', () => {
    const customs: CustomBlocks = {
      B: { name: 'B', body: [call('C')] },
      C: { name: 'C', body: [repeat(2, call('A'))] },
    };
    expect(uses([call('B')], 'A', customs)).toBe(true);
    expect(uses([call('B')], 'Z', customs)).toBe(false);
  });

  it('ignores a call to a custom block that no longer exists', () => {
    expect(uses([call('gone')], 'A', {})).toBe(false);
  });

  it('ends when the custom blocks already contain each other', () => {
    const customs: CustomBlocks = {
      B: { name: 'B', body: [call('C')] },
      C: { name: 'C', body: [call('B'), call('C')] },
    };
    expect(uses([call('B')], 'A', customs)).toBe(false);
  });
});
