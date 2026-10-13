import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageKey } from '../../src/logic/types.ts';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { LANGUAGES, useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, move, repeat, turn, use } from '../helpers/program.ts';
import { addCustom, blockStorage, label, loadMap, reloadPage, run, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

let stored: Map<string, string>;
beforeEach(() => { stored = setupStores(); });
afterEach(teardownStores);

/** Start the game in a browser set to this language. */
function startIn(browserLanguage: string) {
  vi.stubGlobal('navigator', { language: browserLanguage });
  const settings = useSettingsStore();
  settings.init();
  return settings;
}

describe('language-support: Supported languages', () => {
  it('Slovak interface', () => {
    useSettingsStore().setLanguage('sk');
    expect(t('ui.prog')).toBe('Môj program');
    expect(t('ui.run')).toBe('▶ Spustiť');
    expect(label('move')).toBe('⬆ Choď');
  });

  it('Slovak messages', () => {
    loadMap('WWW', 'WKW', 'WWW');
    useSettingsStore().setLanguage('sk');
    expect(run(move()).at(-1)).toBe('💥 Au, stena!');
  });

  it('offers English and Slovenčina', () => {
    expect(LANGUAGES).toEqual([['en', 'English'], ['sk', 'Slovenčina']]);
  });
});

describe('language-support: Default language', () => {
  it('Slovak browser', () => {
    expect(startIn('sk-SK').lang).toBe('sk');
    expect(t('ui.run')).toBe('▶ Spustiť');
  });

  it('Other browser language', () => {
    expect(startIn('de-DE').lang).toBe('en');
    expect(t('ui.run')).toBe('▶ Run');
  });

  it('a language chosen earlier takes precedence', () => {
    stored.set('karol.lang', 'en');
    expect(startIn('sk-SK').lang).toBe('en');
    reloadPage();
    stored.set('karol.lang', 'sk');
    expect(startIn('en-US').lang).toBe('sk');
  });

  it('is English where there is no browser at all', () => {
    vi.stubGlobal('navigator', undefined);
    const settings = useSettingsStore();
    expect(() => settings.init()).not.toThrow();
    expect(settings.lang).toBe('en');
  });

  it('tells the page its language', () => {
    const page = { documentElement: { lang: '' } };
    vi.stubGlobal('document', page);
    const settings = startIn('sk');
    expect(page.documentElement.lang).toBe('sk');
    settings.setLanguage('en');
    expect(page.documentElement.lang).toBe('en');
  });
});

describe('language-support: Switching language', () => {
  it('Switching with a program built', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    setProgram(move(), turn(), use(3), repeat(7, move()), move());
    const before = JSON.stringify(useProgramStore().blocks);
    const robot = { ...useWorldStore().robot };
    expect(['rot', 'move', 'use', 'for'].map(label)).toEqual(['↶ Turn left', '⬆ Move forward', '🎒 Use item', '🔁 Repeat']);
    useSettingsStore().setLanguage('sk');
    expect(['rot', 'move', 'use', 'for'].map(label)).toEqual(['↶ Doľava', '⬆ Choď', '🎒 Použi', '🔁 Zopakuj']);
    expect(JSON.stringify(useProgramStore().blocks)).toBe(before);
    expect(useWorldStore().robot).toEqual(robot);
  });

  it('Status line after a switch', () => {
    const ui = useUiStore(), settings = useSettingsStore();
    ui.say('something else');
    settings.setLanguage('sk');
    expect(ui.status).toBe('Zostav program a stlač Spustiť!');
    settings.setLanguage('en');
    expect(ui.status).toBe('Build a program and press Run!');
  });

  it('leaves the status line alone while a program runs automatically', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    setProgram(move(), move());
    useExecutionStore().toggleRun();
    useSettingsStore().setLanguage('sk');
    expect(useUiStore().status).toBe('Running…');
  });

  it('leaves the status line alone while the custom block editor is open', () => {
    useCustomBlocksStore().openEditor(null);
    useSettingsStore().setLanguage('sk');
    expect(useUiStore().status).toBe('Editing a custom block…');
  });

  it('shows the ready message over a paused or stepped run', () => {
    // pins what the code does: only an automatically running program keeps its status line
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    setProgram(move(), move());
    step();
    useSettingsStore().setLanguage('sk');
    expect(useUiStore().status).toBe('Zostav program a stlač Spustiť!');
    expect(useExecutionStore().active).toBe(true);
  });
});

describe('language-support: Remembering the language', () => {
  it('Reload', () => {
    startIn('en-US').setLanguage('sk');
    expect(stored.get('karol.lang')).toBe('sk');
    reloadPage();
    expect(startIn('en-US').lang).toBe('sk');
  });

  it('lasts until the reload when storage is unavailable', () => {
    blockStorage();
    const settings = startIn('en-US');
    expect(() => settings.setLanguage('sk')).not.toThrow();
    expect(settings.lang).toBe('sk');
    reloadPage();
    expect(startIn('en-US').lang).toBe('en');
  });
});

describe('language-support: Missing translations', () => {
  it('shows a key no language has as the key itself', () => {
    useSettingsStore().setLanguage('sk');
    expect(t('no.such.key' as MessageKey)).toBe('no.such.key');
  });
});

describe('language-support: Texts that are not translated', () => {
  it('Custom block name', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move());
    setProgram(call(id));
    useSettingsStore().setLanguage('sk');
    expect(customs.blocks[id].name).toBe('Corner');
  });
});

describe('app-shell: Sound setting', () => {
  it('Turning sound off', () => {
    const settings = startIn('en-US');
    expect(settings.sound).toBe(true);
    settings.toggleSound();
    expect(settings.sound).toBe(false);
    expect(stored.get('karol.sound')).toBe('off');
    expect(t('ui.sound') + ': ' + t('ui.off')).toBe('Sound: Off');
  });

  it('Remembered setting', () => {
    startIn('en-US').toggleSound();
    reloadPage();
    const settings = startIn('en-US');
    expect(settings.sound).toBe(false);
    settings.toggleSound();
    expect(stored.get('karol.sound')).toBe('on');
    reloadPage();
    expect(startIn('en-US').sound).toBe(true);
  });

  it('is on when storage is unavailable', () => {
    blockStorage();
    const settings = startIn('en-US');
    expect(settings.sound).toBe(true);
    expect(() => settings.toggleSound()).not.toThrow();
    expect(settings.sound).toBe(false);
  });
});
