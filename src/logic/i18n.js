// Key lookup with English fallback and {0} placeholders.
export function translate(dicts, lang, key, args = []) {
  let s = (dicts[lang] && dicts[lang][key]) || dicts.en[key] || key;
  args.forEach((v, i) => { s = s.replace('{' + i + '}', v); });
  return s;
}

// A stored choice wins; otherwise Slovak browsers get Slovak, everyone else English.
export function defaultLanguage(stored, browserLanguage) {
  return stored || ((browserLanguage || '').startsWith('sk') ? 'sk' : 'en');
}
