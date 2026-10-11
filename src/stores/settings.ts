import { defineStore } from 'pinia';
import en from '../../locales/en.json';
import sk from '../../locales/sk.json';
import { translate, defaultLanguage } from '../logic/i18n.ts';
import type { Dictionary } from '../logic/i18n.ts';
import { storage } from '../logic/storage.ts';
import type { MessageKey } from '../logic/types.ts';
import { useUiStore } from './ui.ts';
import { useExecutionStore } from './execution.ts';
import { useCustomBlocksStore } from './customBlocks.ts';

const dicts: Record<string, Dictionary> = { en, sk };

/** The languages offered in Options. Add a language by adding its file and an entry here. */
export const LANGUAGES: [code: string, name: string][] = [['en', 'English'], ['sk', 'Slovenčina']];

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    lang: 'en',
    sound: true,
  }),
  actions: {
    init() {
      this.lang = defaultLanguage(storage.get('karol.lang'), globalThis.navigator && navigator.language);
      this.sound = storage.get('karol.sound') !== 'off';
      this.applyDocumentLanguage();
    },
    /** Reads `lang`, so anything rendered with it follows a language switch. */
    t(key: MessageKey, ...args: (string | number)[]): string {
      return translate(dicts, this.lang, key, args);
    },
    setLanguage(code: string) {
      this.lang = code;
      storage.set('karol.lang', code);
      this.applyDocumentLanguage();
      if (!useExecutionStore().running && !useCustomBlocksStore().draft) useUiStore().say(this.t('ms.ready'));
    },
    toggleSound() {
      this.sound = !this.sound;
      storage.set('karol.sound', this.sound ? 'on' : 'off');
    },
    applyDocumentLanguage() {
      if (globalThis.document) document.documentElement.lang = this.lang;
    },
  },
});
