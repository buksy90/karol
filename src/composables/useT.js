import { useSettingsStore } from '../stores/settings.js';

// t('key', ...args) in the current language; templates using it follow a language switch.
export function useT() {
  const settings = useSettingsStore();
  return (key, ...args) => settings.t(key, ...args);
}
