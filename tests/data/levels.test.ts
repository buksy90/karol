import { describe, expect, it } from 'vitest';
import { levelSize, normLevel, orderByFileName } from '../../src/logic/levels.ts';
import type { Level } from '../../src/logic/types.ts';

// the level files, found the way src/main.ts finds them
const files = import.meta.glob<Level>('../../levels/*.json', { eager: true, import: 'default' });
const paths = Object.keys(files);
const inOrder = orderByFileName(files);

describe('levels: Built-in levels', () => {
  it('What each level teaches', () => {
    // the sizes; what a level teaches is for a person to judge
    expect(inOrder.map(levelSize)).toEqual(['15x4', '15x9', '15x9', '15x9', '15x15', '15x16', '15x15']);
  });

  it('ships seven levels, level-1 to level-7, named Level 1 to Level 7, in this order', () => {
    expect(inOrder.map(l => l.id)).toEqual(['level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7']);
    expect(inOrder.map(l => l.name)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7']);
  });
});

describe('the level files', () => {
  it.each(paths)('%s is a valid level', path => {
    const level = files[path];
    expect(normLevel(level, 0)).toEqual(level);
  });

  it.each(paths)('%s is named after its id', path => {
    expect(path.split('/').pop()).toBe(files[path].id + '.json');
  });

  it('have ids that differ', () => {
    const ids = paths.map(path => files[path].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(paths)('%s has an exit', path => {
    expect(files[path].map.join('')).toContain('e');
  });
});
