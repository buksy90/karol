import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import sk from '../../locales/sk.json';

const english: Record<string, string> = en, slovak: Record<string, string> = sk;
/** The placeholders of a text, e.g. ["{0}", "{1}"]. */
const placeholders = (text: string): string[] => (text.match(/\{\d+\}/g) || []).sort();

describe('the translations', () => {
  it('Slovak has exactly the keys of English', () => {
    expect(Object.keys(slovak).sort()).toEqual(Object.keys(english).sort());
  });

  it('no text is empty', () => {
    for (const dictionary of [english, slovak]) {
      expect(Object.keys(dictionary).filter(key => !dictionary[key].trim())).toEqual([]);
    }
  });

  it.each(Object.keys(english))('%s has the same placeholders in both languages', key => {
    expect(placeholders(slovak[key] ?? '')).toEqual(placeholders(english[key]));
  });
});
