/** The texts of one language, by key. */
export type Dictionary = Record<string, string>;

/** Key lookup with English fallback and {0} placeholders. */
export function translate(dicts: Record<string, Dictionary>, lang: string, key: string, args: (string | number)[] = []): string {
  let s = (dicts[lang] && dicts[lang][key]) || dicts.en[key] || key;
  args.forEach((v, i) => { s = s.replace('{' + i + '}', String(v)); });
  return s;
}

/** A stored choice wins; otherwise Slovak browsers get Slovak, everyone else English. */
export function defaultLanguage(stored: string | null, browserLanguage?: string | null): string {
  return stored || ((browserLanguage || '').startsWith('sk') ? 'sk' : 'en');
}
