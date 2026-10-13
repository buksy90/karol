import { describe, expect, it } from 'vitest';
import { firstFreeName, nameTaken, offeredIds, restoreCustoms, uses } from '../../src/logic/custom-blocks.ts';
import { defs } from '../../src/blocks/index.ts';
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

describe('nameTaken', () => {
  const customs: CustomBlocks = { c1: { name: 'Corner', body: [] }, c2: { name: 'Spin', body: [] } };

  it('finds a name another block has, whatever the case and the spaces at the ends', () => {
    expect(nameTaken(customs, 'Corner')).toBe(true);
    expect(nameTaken(customs, 'corner')).toBe(true);
    expect(nameTaken(customs, '  SPIN ')).toBe(true);
    expect(nameTaken(customs, 'Corner 2')).toBe(false);
    expect(nameTaken(customs, 'Cor ner')).toBe(false);
    expect(nameTaken({}, 'Corner')).toBe(false);
  });

  it('lets a block keep its own name', () => {
    expect(nameTaken(customs, 'Corner', 'c1')).toBe(false);
    expect(nameTaken(customs, 'corner', 'c1')).toBe(false);
    expect(nameTaken(customs, 'Spin', 'c1')).toBe(true);
  });
});

describe('firstFreeName', () => {
  const named = (...names: string[]): CustomBlocks =>
    Object.fromEntries(names.map((name, i) => ['c' + (i + 1), { name, body: [] }]));

  it('starts at 1 and counts on', () => {
    expect(firstFreeName({}, 'Block')).toBe('Block 1');
    expect(firstFreeName(named('Block 1', 'Block 2'), 'Block')).toBe('Block 3');
    expect(firstFreeName(named('Corner'), 'Blok')).toBe('Blok 1');
  });

  it('fills the gap a deleted block left', () => {
    expect(firstFreeName(named('Block 2', 'Block 3'), 'Block')).toBe('Block 1');
    expect(firstFreeName(named('Block 1', 'Block 3'), 'Block')).toBe('Block 2');
  });

  it('skips a number the player typed by hand', () => {
    expect(firstFreeName(named('block 1'), 'Block')).toBe('Block 2');
    expect(firstFreeName(named(' BLOCK 1 ', 'Block 2'), 'Block')).toBe('Block 3');
  });

  it('may give a block the name it already has', () => {
    expect(firstFreeName(named('Block 1'), 'Block', 'c1')).toBe('Block 1');
  });
});
describe('restoreCustoms', () => {
  const stored = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

  it('brings back the blocks with their names, contents and the counter', () => {
    const saved = { blocks: { c1: { name: 'Corner', body: [move(), turn()] }, c3: { name: 'Twice', body: [repeat(2, call('c1'))] } }, counter: 3 };
    const { blocks, counter } = restoreCustoms(stored(saved), defs);
    expect(Object.keys(blocks)).toEqual(['c1', 'c3']);
    expect(blocks.c1.name).toBe('Corner');
    expect(blocks.c1.body.map(node => node.type)).toEqual(['move', 'rot']);
    expect(blocks.c3.body[0].children![0]).toMatchObject({ type: 'call', ref: 'c1' });
    expect(counter).toBe(3);
  });

  it('gives the blocks inside fresh ids', () => {
    const inside = move();
    const { blocks } = restoreCustoms(stored({ blocks: { c1: { name: 'A', body: [inside] } }, counter: 1 }), defs);
    expect(blocks.c1.body[0].id).not.toBe(inside.id);
  });

  it('never lets the counter fall below an id in use', () => {
    const saved = { blocks: { c2: { name: 'A', body: [] }, c7: { name: 'B', body: [] } } };
    expect(restoreCustoms(stored({ ...saved, counter: 3 }), defs).counter).toBe(7);
    expect(restoreCustoms(stored(saved), defs).counter).toBe(7);
    expect(restoreCustoms(stored({ ...saved, counter: 'x' }), defs).counter).toBe(7);
    expect(restoreCustoms(stored({ ...saved, counter: 12 }), defs).counter).toBe(12);
  });

  it('drops what is not a named list of blocks, and calls to what was dropped', () => {
    const saved = { blocks: { c1: { name: 'A', body: [call('c2'), call('c3'), move()] }, c2: { name: 5, body: [] }, c3: { name: 'C', body: [] }, c4: null, c5: { name: 'E' } }, counter: 5 };
    const { blocks } = restoreCustoms(stored(saved), defs);
    expect(Object.keys(blocks)).toEqual(['c1', 'c3']);
    expect(blocks.c1.body.map(node => node.ref ?? node.type)).toEqual(['c3', 'move']);
  });

  it('starts empty when nothing readable was stored', () => {
    for (const data of [null, undefined, 'text', 4, [], { blocks: 'x' }]) {
      expect(restoreCustoms(data, defs)).toEqual({ blocks: {}, counter: 0 });
    }
  });
});