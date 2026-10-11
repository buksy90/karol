import { describe, expect, it } from 'vitest';
import { defaultLanguage, translate } from '../../src/logic/i18n.ts';

const dicts = {
  en: { hello: 'Hello', onlyEnglish: 'Only English', slot: 'Slot {0} is empty.', two: '{0} and {1}' },
  sk: { hello: 'Ahoj', slot: 'Pozícia {0} je prázdna.', two: '{1} a {0}' },
};

describe('language-support: Missing translations', () => {
  it('Missing Slovak text', () => {
    expect(translate(dicts, 'sk', 'hello')).toBe('Ahoj');
    expect(translate(dicts, 'sk', 'onlyEnglish')).toBe('Only English');
  });
});

describe('language-support: Default language', () => {
  it('Slovak browser', () => {
    expect(defaultLanguage(null, 'sk')).toBe('sk');
    expect(defaultLanguage(null, 'sk-SK')).toBe('sk');
  });

  it('Other browser language', () => {
    expect(defaultLanguage(null, 'de-DE')).toBe('en');
    expect(defaultLanguage(null, 'en-US')).toBe('en');
    expect(defaultLanguage(null, 'cs')).toBe('en');
  });

  it('a language chosen earlier takes precedence', () => {
    expect(defaultLanguage('en', 'sk-SK')).toBe('en');
    expect(defaultLanguage('sk', 'en-US')).toBe('sk');
  });

  it('is English when the browser does not tell its language', () => {
    expect(defaultLanguage(null)).toBe('en');
    expect(defaultLanguage(null, null)).toBe('en');
    expect(defaultLanguage(null, '')).toBe('en');
  });
});

describe('translate', () => {
  it('returns the key itself when no language has the text', () => {
    expect(translate(dicts, 'sk', 'no.such.key')).toBe('no.such.key');
    expect(translate(dicts, 'en', 'no.such.key')).toBe('no.such.key');
  });

  it('falls back to English for a language that does not exist', () => {
    expect(translate(dicts, 'de', 'hello')).toBe('Hello');
  });

  it('fills the placeholders with the arguments', () => {
    expect(translate(dicts, 'en', 'slot', [3])).toBe('Slot 3 is empty.');
    expect(translate(dicts, 'sk', 'slot', [3])).toBe('Pozícia 3 je prázdna.');
    expect(translate(dicts, 'en', 'two', ['a', 2])).toBe('a and 2');
    expect(translate(dicts, 'sk', 'two', ['a', 2])).toBe('2 a a');
  });

  it('leaves a placeholder that has no argument', () => {
    expect(translate(dicts, 'en', 'slot')).toBe('Slot {0} is empty.');
  });
});
