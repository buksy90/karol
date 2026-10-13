import { describe, expect, it } from 'vitest';
import { COLOR_NAMES, toHex } from '../../src/logic/colors.ts';

describe('toHex', () => {
  it('gives each of the eight names its hex value', () => {
    expect(Object.keys(COLOR_NAMES)).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black', 'white']);
    for (const name of Object.keys(COLOR_NAMES)) {
      expect(toHex(name)).toBe(COLOR_NAMES[name]);
      expect(COLOR_NAMES[name]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('gives a hex value as six lower-case digits, whichever way it was written', () => {
    expect(toHex('#ff0000')).toBe('#ff0000');
    expect(toHex('#FF0000')).toBe('#ff0000');
    expect(toHex('#F00')).toBe('#ff0000');
    expect(toHex('#1e9')).toBe('#11ee99');
  });

  it('gives null for anything that is not one of the names or a hex value', () => {
    for (const bad of ['pink', 'Red', '#12', '#12345g', '1e90ff', '#1e90ff80', '#1234', '', ' red', 'toString', 7, null, undefined, ['red']]) {
      expect(toHex(bad)).toBeNull();
    }
  });
});
