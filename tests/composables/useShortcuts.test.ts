// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import ProgramPanel from '../../src/components/ProgramPanel.vue';
import { useShortcuts } from '../../src/composables/useShortcuts.ts';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { mount, unmount } from '../helpers/dom.ts';
import { move, repeat } from '../helpers/program.ts';
import { loadMap, robotAt, setProgram, setupStores, t, teardownStores } from '../helpers/stores.ts';

// The composable listens for keys while a component that uses it is on the page, as App.vue does.
const Page = defineComponent({ setup() { useShortcuts(); return () => null; } });

beforeEach(() => {
  setupStores();
  loadMap('WWWWWWW', 'WK    W', 'WWWWWWW');
  setProgram(move(), move(), move());
  mount(Page);
});
afterEach(() => { unmount(); teardownStores(); });

/** Press a key. @returns the event, to see whether the browser's own action was suppressed */
function press(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

describe('program-execution: Keyboard shortcuts', () => {
  it('F5 toggles run and pause', () => {
    const execution = useExecutionStore();
    const first = press('F5');
    expect(execution.running).toBe(true);
    expect(useUiStore().status).toBe(t('ms.run'));
    const second = press('F5');
    expect([execution.running, execution.active]).toEqual([false, true]);
    expect(useUiStore().status).toBe(t('ms.paused'));
    // suppressing the key is what keeps the browser from reloading the page
    expect([first.defaultPrevented, second.defaultPrevented]).toEqual([true, true]);
  });

  it('Shortcut with a dialog open', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    ui.openDialog('lv');
    const f5 = press('F5'), f6 = press('F6');
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect(robotAt()).toBe('1,1');
    expect(ui.dialog).toBe('lv');
    expect([f5.defaultPrevented, f6.defaultPrevented]).toEqual([true, true]);
  });

  it('Esc with nothing running', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    ui.say('unchanged');
    const event = press('Escape');
    expect(ui.status).toBe('unchanged');
    expect([execution.running, execution.active, ui.dialog]).toEqual([false, false, null]);
    expect(event.defaultPrevented).toBe(false);
  });

  it('F6 acts as Step', () => {
    const event = press('F6');
    expect(robotAt()).toBe('2,1');
    expect(useUiStore().status).toBe(t('ms.step', 1));
    expect(event.defaultPrevented).toBe(true);
    press('F6');
    expect(robotAt()).toBe('3,1');
  });

  it('Esc acts as Stop when a run is active, running or paused', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    press('F5');
    press('Escape');
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect(ui.status).toBe(t('ms.stopped'));
    press('F6');
    expect(execution.active).toBe(true);
    press('Escape');
    expect(execution.active).toBe(false);
    expect(ui.status).toBe(t('ms.stopped'));
  });

  it('ignores F5 and F6 while the custom block editor is open, and still suppresses the reload', () => {
    const execution = useExecutionStore();
    useCustomBlocksStore().openEditor(null);
    const f5 = press('F5'), f6 = press('F6');
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect([f5.defaultPrevented, f6.defaultPrevented]).toEqual([true, true]);
    expect(useUiStore().status).toBe(t('ms.editing'));
  });

  it('leaves other keys alone', () => {
    const execution = useExecutionStore();
    const events = ['Enter', ' ', 'F4', 'r'].map(press);
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect(events.some(event => event.defaultPrevented)).toBe(false);
  });

  it('stops listening when the page that uses it is gone', () => {
    unmount();
    press('F5');
    expect(useExecutionStore().running).toBe(false);
  });
});

describe('program-editor: Editing numbers on a block', () => {
  /** A Repeat 4 times around one Move forward, on a page with the shortcuts on. @returns its number field */
  function loopOnPage(): HTMLInputElement {
    unmount();
    const loop = repeat(4, move());
    setProgram(loop);
    const page = mount(defineComponent({ setup() { useShortcuts(); return () => h(ProgramPanel); } }));
    return page.querySelector<HTMLInputElement>(`.block[data-id="${loop.id}"] input`)!;
  }

  it('Run started from the keyboard while typing', () => {
    const input = loopOnPage();
    input.focus();
    input.value = '500';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    press('F5');
    expect(useProgramStore().blocks[0].n).toBe(4);
    expect(input.value).toBe('4');
    const execution = useExecutionStore();
    while (execution.running) vi.advanceTimersByTime(BASE_INTERVAL);
    // four rounds of one Move forward
    expect(robotAt()).toBe('5,1');
  });

  it('a valid number still being typed is used by the run', () => {
    const input = loopOnPage();
    input.focus();
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    press('F6');
    expect(useProgramStore().blocks[0].n).toBe(2);
    const execution = useExecutionStore();
    while (execution.active) press('F6');
    expect(robotAt()).toBe('3,1');
  });
});

describe('app-shell: Dialogs', () => {
  it('Esc with a dialog open during a run', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    press('F5');
    press('F5');
    ui.openDialog('lv');
    press('Escape');
    expect(ui.dialog).toBeNull();
    expect([execution.running, execution.active]).toEqual([false, true]);
    expect(ui.status).toBe(t('ms.paused'));
  });
});
