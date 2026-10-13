import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import sk from '../../locales/sk.json';

const english: Record<string, string> = en, slovak: Record<string, string> = sk;
/** The placeholders of a text, e.g. ["{0}", "{1}"]. */
const placeholders = (text: string): string[] => (text.match(/\{\d+\}/g) || []).sort();

describe('language-support: Texts that are not translated', () => {
  it('New messages are translated', () => {
    for (const key of ['ms.editlock', 'ms.dupname', 'ms.toodeep', 'ms.spray', 'ms.paint', 'ms.paintlast', 'ms.flag', 'ms.flagdoor']) {
      expect(slovak[key]).toBeTruthy();
      expect(slovak[key]).not.toBe(english[key]);
    }
  });
});

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
