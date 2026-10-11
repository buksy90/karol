import { describe, expect, it } from 'vitest';
import { ancestors, cloneList, cloneNode, createNode, findNode, isContiguous, locate, newId, snapshot, stripCalls } from '../../src/logic/program.ts';
import { defs } from '../../src/blocks/index.ts';
import type { ProgramNode } from '../../src/logic/types.ts';
import { call, canGo, loopWhile, move, not, repeat, turn, use, when } from '../helpers/program.ts';

/** Every id in a tree, conditions included. */
function ids(list: ProgramNode[]): string[] {
  const out: string[] = [];
  const visit = (node: ProgramNode) => {
    out.push(node.id);
    if (node.cond) visit(node.cond);
    (node.children || []).forEach(visit);
  };
  list.forEach(visit);
  return out;
}

describe('newId', () => {
  it('never repeats', () => {
    const seen = new Set(Array.from({ length: 50 }, newId));
    expect(seen.size).toBe(50);
  });
});

describe('createNode', () => {
  it('gives an action only an id and a type', () => {
    const node = createNode(defs.move);
    expect(Object.keys(node).sort()).toEqual(['id', 'type']);
    expect(node.type).toBe('move');
  });

  it('starts a number at the default of its definition', () => {
    expect(createNode(defs.use).n).toBe(1);
    expect(createNode(defs.for).n).toBe(2);
  });

  it('gives a container an empty body and a condition block an empty slot', () => {
    expect(createNode(defs.for)).toMatchObject({ children: [] });
    expect(createNode(defs.for)).not.toHaveProperty('cond');
    expect(createNode(defs.if)).toMatchObject({ cond: null, children: [] });
    expect(createNode(defs.while)).toMatchObject({ cond: null, children: [] });
    expect(createNode(defs.not)).toMatchObject({ cond: null });
    expect(createNode(defs.not)).not.toHaveProperty('children');
    expect(createNode(defs.canfwd)).not.toHaveProperty('cond');
  });

  it('points a call at its custom block', () => {
    expect(createNode(defs.call, 'c7')).toMatchObject({ type: 'call', ref: 'c7' });
    expect(createNode(defs.call)).not.toHaveProperty('ref');
  });
});

describe('cloneNode', () => {
  it('copies the whole tree with fresh ids', () => {
    const original = when(not(canGo()), repeat(3, move(), use(4)), call('c1'));
    const copy = cloneNode(original);
    const strip = (node: ProgramNode): unknown => ({
      ...node, id: 0,
      cond: node.cond ? strip(node.cond) : node.cond,
      children: node.children ? node.children.map(strip) : node.children,
    });
    expect(strip(copy)).toEqual(strip(original));
    const before = ids([original]), after = ids([copy]);
    expect(after).toHaveLength(before.length);
    expect(after.filter(id => before.includes(id))).toEqual([]);
  });

  it('shares nothing with the original', () => {
    const original = repeat(2, move());
    const copy = cloneNode(original);
    copy.children!.push(turn());
    copy.n = 9;
    expect(original.children).toHaveLength(1);
    expect(original.n).toBe(2);
  });

  it('cloneList copies every block of a list', () => {
    const list = [move(), turn()];
    const copy = cloneList(list);
    expect(copy.map(n => n.type)).toEqual(['move', 'rot']);
    expect(copy[0].id).not.toBe(list[0].id);
  });
});

describe('snapshot', () => {
  it('keeps the ids and is not reached by later edits', () => {
    const list = [repeat(2, move()), when(canGo())];
    const copy = snapshot(list);
    expect(copy).toEqual(list);
    expect(ids(copy)).toEqual(ids(list));
    list[0].children!.push(turn());
    list[1].cond = null;
    expect(copy[0].children).toHaveLength(1);
    expect(copy[1].cond).not.toBeNull();
  });
});

describe('locate', () => {
  it('finds a block in the top list and names the list by the root key', () => {
    const a = move(), b = turn();
    const root = [a, b];
    expect(locate(root, b.id, 'main')).toEqual({ kind: 'list', owner: 'main', list: root, index: 1, node: b });
  });

  it('finds a block in the body of a container, at any depth', () => {
    const target = move();
    const inner = when(canGo(), turn(), target);
    const outer = repeat(2, inner);
    const hit = locate([move(), outer], target.id, 'main');
    expect(hit).toMatchObject({ kind: 'list', owner: inner.id, index: 1 });
    expect(hit!.node).toBe(target);
    expect(locate([outer], inner.id, 'main')).toMatchObject({ kind: 'list', owner: outer.id, index: 0 });
  });

  it('finds a condition in a slot, also inside Not', () => {
    const sensor = canGo(), inverted = not(sensor);
    const owner = loopWhile(inverted, move());
    expect(locate([owner], inverted.id, 'main')).toEqual({ kind: 'cond', owner, node: inverted });
    expect(locate([owner], sensor.id, 'main')).toEqual({ kind: 'cond', owner: inverted, node: sensor });
  });

  it('finds a condition of a nested container', () => {
    const sensor = canGo();
    const inner = when(sensor);
    expect(locate([repeat(2, move(), inner)], sensor.id)).toEqual({ kind: 'cond', owner: inner, node: sensor });
  });

  it('returns null for an unknown id', () => {
    expect(locate([repeat(2, move())], 'nope', 'main')).toBeNull();
    expect(locate([], 'nope')).toBeNull();
  });
});

describe('findNode', () => {
  it('returns the block itself, or null', () => {
    const sensor = canGo(), target = move();
    const root = [when(sensor, target)];
    expect(findNode(root, target.id)).toBe(target);
    expect(findNode(root, sensor.id)).toBe(sensor);
    expect(findNode(root, 'nope')).toBeNull();
  });
});

describe('ancestors', () => {
  it('lists the containers around a block, innermost first', () => {
    const target = move();
    const inner = when(canGo(), target);
    const outer = repeat(2, turn(), inner);
    const root = [move(), outer];
    expect(ancestors(root, target.id)).toEqual([inner.id, outer.id]);
    expect(ancestors(root, inner.id)).toEqual([outer.id]);
    expect(ancestors(root, outer.id)).toEqual([]);
  });

  it('is empty for an unknown id and for a condition', () => {
    const sensor = canGo();
    const root = [when(sensor, move())];
    expect(ancestors(root, 'nope')).toEqual([]);
    expect(ancestors(root, sensor.id)).toEqual([]);
  });
});

describe('stripCalls', () => {
  it('removes every call to one custom block, at any depth, and nothing else', () => {
    const keepMove = move(), keepCall = call('c2');
    const loop = repeat(2, call('c1'), keepMove, when(canGo(), call('c1'), call('c1')));
    const root = [call('c1'), loop, keepCall, call('c1')];
    stripCalls(root, 'c1');
    expect(root).toEqual([loop, keepCall]);
    expect(loop.children![0]).toBe(keepMove);
    expect(loop.children![1].children).toEqual([]);
  });

  it('leaves a list without such calls alone', () => {
    const root = [move(), call('c2')];
    const before = snapshot(root);
    stripCalls(root, 'c1');
    expect(root).toEqual(before);
  });
});

describe('isContiguous', () => {
  it('accepts nothing, one index and an unbroken run in any order', () => {
    expect(isContiguous([])).toBe(true);
    expect(isContiguous([4])).toBe(true);
    expect(isContiguous([2, 3, 4])).toBe(true);
    expect(isContiguous([4, 2, 3])).toBe(true);
  });

  it('rejects a run with a gap', () => {
    expect(isContiguous([1, 3])).toBe(false);
    expect(isContiguous([0, 1, 3, 4])).toBe(false);
  });

  it('does not reorder the caller\'s array', () => {
    const indexes = [3, 1, 2];
    isContiguous(indexes);
    expect(indexes).toEqual([3, 1, 2]);
  });
});
