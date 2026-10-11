import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import { defs, isCondition, libraryBlocks } from '../../src/blocks/index.ts';
import { librarySensors } from '../../src/sensors/index.ts';

describe('the block registry', () => {
  it('lists the Blocks section in display order', () => {
    expect(libraryBlocks.map(def => def.type)).toEqual(['rot', 'move', 'use', 'for', 'if', 'while', 'not']);
  });

  it('lists the Sensors section in display order', () => {
    expect(librarySensors.map(def => def.type)).toEqual(['canfwd']);
  });

  it('finds every library block, every sensor and the custom block call by type', () => {
    expect(Object.keys(defs).sort()).toEqual(['call', 'canfwd', 'for', 'if', 'move', 'not', 'rot', 'use', 'while']);
    for (const type in defs) expect(defs[type].type).toBe(type);
    for (const def of [...libraryBlocks, ...librarySensors]) expect(defs[def.type]).toBe(def);
  });

  it('knows which blocks are conditions', () => {
    expect(Object.keys(defs).filter(isCondition).sort()).toEqual(['canfwd', 'not']);
  });

  it('gives every block except the custom block call a label that exists in English', () => {
    for (const def of Object.values(defs)) {
      if (def.kind === 'call') { expect(def.labelKey).toBeUndefined(); continue; }
      expect(en).toHaveProperty([def.labelKey]);
      if (def.suffixKey) expect(en).toHaveProperty([def.suffixKey]);
    }
  });

  it('gives containers a body and condition blocks a slot', () => {
    const having = (flag: 'hasBody' | 'hasCond' | 'hasCounter') => Object.keys(defs).filter(type => defs[type][flag]).sort();
    expect(having('hasBody')).toEqual(['for', 'if', 'while']);
    expect(having('hasCond')).toEqual(['if', 'not', 'while']);
    expect(having('hasCounter')).toEqual(['for']);
  });

  it('gives the number fields their range', () => {
    expect(defs.use.number).toEqual({ default: 1, min: 1, max: 8 });
    expect(defs.for.number).toEqual({ default: 2, min: 1, max: 99 });
    expect(Object.keys(defs).filter(type => defs[type].number).sort()).toEqual(['for', 'use']);
  });
});
