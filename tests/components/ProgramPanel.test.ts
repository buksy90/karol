// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProgramPanel from '../../src/components/ProgramPanel.vue';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { mount, unmount } from '../helpers/dom.ts';
import { move } from '../helpers/program.ts';
import { loadMap, setProgram, setupStores, t, teardownStores } from '../helpers/stores.ts';

let page: HTMLElement;
beforeEach(() => {
  setupStores();
  loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
  setProgram(move(), move(), move());
  page = mount(ProgramPanel);
});
afterEach(() => { unmount(); teardownStores(); });

const pressSelect = (): void => page.querySelector<HTMLElement>('#selbtn')!.click();

describe('program-execution: Editing during a run', () => {
  it('Select mode while paused', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    execution.toggleRun();
    vi.advanceTimersByTime(BASE_INTERVAL);
    execution.pause();
    pressSelect();
    expect(ui.selMode).toBe(false);
    expect(ui.status).toBe(t('ms.paused'));
    expect(execution.active).toBe(true);
  });

  it('select mode stays off while running and during a stepped run, and can be switched on after Stop', () => {
    const execution = useExecutionStore(), ui = useUiStore();
    execution.toggleRun();
    pressSelect();
    expect(ui.selMode).toBe(false);
    execution.stop();
    execution.stepOnce();
    pressSelect();
    expect(ui.selMode).toBe(false);
    execution.stop();
    pressSelect();
    expect(ui.selMode).toBe(true);
  });
});
