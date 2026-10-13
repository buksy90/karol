// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RunControls from '../../src/components/RunControls.vue';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
import { PROGRAMS_KEY, useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { mount, unmount } from '../helpers/dom.ts';
import { move, turn } from '../helpers/program.ts';
import { build, inSession, loadMap, robotAt, setProgram, setupStores, startGame, t, teardownStores } from '../helpers/stores.ts';

let page: HTMLElement;
beforeEach(() => {
  setupStores();
  loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
  setProgram(move(), turn(), move(), turn(), move());
  page = mount(RunControls);
});
afterEach(() => { unmount(); teardownStores(); });

const pressClear = (): void => page.querySelector<HTMLElement>('#clr')!.click();

describe('program-editor: Clear', () => {
  it('Clearing', () => {
    pressClear();
    expect(useProgramStore().blocks).toEqual([]);
    expect(useUiStore().status).toBe(t('ms.cleared'));
    expect(robotAt()).toBe('1,1');
  });

  it('Clear while paused', () => {
    const execution = useExecutionStore();
    const ids = useProgramStore().blocks.map(block => block.id);
    execution.toggleRun();
    vi.advanceTimersByTime(BASE_INTERVAL);
    execution.pause();
    pressClear();
    expect(useProgramStore().blocks.map(block => block.id)).toEqual(ids);
    expect([execution.running, execution.active, execution.current]).toEqual([false, true, ids[0]]);
    expect(useUiStore().status).toBe(t('ms.paused'));
  });

  it('is ignored while the program runs and during a stepped run, and works again after Stop', () => {
    const execution = useExecutionStore(), program = useProgramStore();
    execution.toggleRun();
    pressClear();
    expect(program.blocks).toHaveLength(5);
    execution.stop();
    execution.stepOnce();
    pressClear();
    expect(program.blocks).toHaveLength(5);
    execution.stop();
    pressClear();
    expect(program.blocks).toEqual([]);
  });

  it('saves the empty program for the level', () => {
    startGame();
    build(move(), turn());
    pressClear();
    expect(inSession(PROGRAMS_KEY)).toEqual({ one: [] });
  });

  it('removes the dots of the last run', () => {
    const execution = useExecutionStore();
    execution.stepOnce();
    execution.stop();
    expect(execution.ok).not.toEqual({});
    pressClear();
    expect(execution.ok).toEqual({});
  });
});
