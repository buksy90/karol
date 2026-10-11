import { useSettingsStore } from '../stores/settings.ts';
import type { Translate } from '../logic/types.ts';

/** t('key', ...args) in the current language; templates using it follow a language switch. */
export function useT(): Translate {
  const settings = useSettingsStore();
  return (key, ...args) => settings.t(key, ...args);
}
