// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import BlockLibrary from '../../src/components/BlockLibrary.vue';
import ProgramPanel from '../../src/components/ProgramPanel.vue';
import { useDragDrop } from '../../src/composables/useDragDrop.ts';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
import { PROGRAMS_KEY, useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { mount, rendered, unmount } from '../helpers/dom.ts';
import { loopWhile, move } from '../helpers/program.ts';
import { build, inSession, loadMap, robotAt, run, setProgram, setupStores, startGame, t, teardownStores } from '../helpers/stores.ts';

// The library and the program panel on one page with drag and drop switched on, as in App.vue.
const Page = defineComponent({ setup() { useDragDrop(); return () => [h(BlockLibrary), h(ProgramPanel)]; } });

// happy-dom lays nothing out, so the test says which element is under the pointer.
let under: Element | null = null;

let page: HTMLElement;
beforeEach(() => {
  setupStores();
  under = null;
  document.elementFromPoint = () => under;
});
afterEach(() => { unmount(); teardownStores(); });

function pointer(type: string, target: EventTarget): void {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: 10, clientY: 10 }));
}
/** Press on an element, move over another one and let go. */
function drag(from: Element, to: Element | null): void {
  under = from;
  pointer('pointerdown', from);
  under = to;
  pointer('pointermove', document);
}
const drop = (): void => pointer('pointerup', document);
const one = (selector: string): HTMLElement => {
  const found = page.querySelector<HTMLElement>(selector);
  if (!found) throw Error('nothing matches ' + selector);
  return found;
};

describe('sensor-can-go-forward: Placement in the library', () => {
  it('Dragging the sensor', async () => {
    const loop = loopWhile(null, move());
    setProgram(loop);
    page = mount(Page);
    const ui = useUiStore();

    drag(one('#slib .block[data-type="canfwd"]'), one(`#prog .cond[data-owner="${loop.id}"]`));
    expect(ui.drag).toMatchObject({ fromLib: true, isCond: true, cond: loop.id });
    await rendered();
    expect(one(`#prog .cond[data-owner="${loop.id}"]`).classList.contains('hot')).toBe(true);

    drop();
    const inSlot = useProgramStore().blocks[0].cond!;
    expect(inSlot.type).toBe('canfwd');
    expect(inSlot.id).not.toBe('lib-canfwd');
    expect(ui.drag).toBeNull();
    await rendered();
    expect(one(`#prog .cond[data-owner="${loop.id}"] .block`).dataset.type).toBe('canfwd');
    // the library still offers it
    expect(one('#slib .block[data-type="canfwd"]')).toBeTruthy();
  });

  it('is offered in the Sensors section, which sits above the Blocks section', () => {
    page = mount(Page);
    const sections = [...page.querySelectorAll('#slib, #lib')].map(section => section.id);
    expect(sections).toEqual(['slib', 'lib']);
    expect(page.querySelectorAll('#slib .block')).toHaveLength(1);
    expect(page.querySelector('#lib .block[data-type="canfwd"]')).toBeNull();
  });

  it('does not fit into a program list', () => {
    const loop = loopWhile(null, move());
    setProgram(loop);
    page = mount(Page);

    drag(one('#slib .block[data-type="canfwd"]'), one('#prog #main'));
    expect(useUiStore().drag).toMatchObject({ target: null, cond: null });
    drop();
    const program = useProgramStore().blocks;
    expect(program).toHaveLength(1);
    expect(program[0].cond).toBeNull();
    expect(program[0].children).toHaveLength(1);
  });

  it('is discarded when dropped anywhere else', () => {
    const loop = loopWhile(null);
    setProgram(loop);
    page = mount(Page);

    drag(one('#slib .block[data-type="canfwd"]'), null);
    drop();
    expect(useProgramStore().blocks[0].cond).toBeNull();
    expect(useUiStore().drag).toBeNull();
  });

  it('does not fit the slot shown on a block in the library', () => {
    setProgram(loopWhile(null));
    page = mount(Page);

    drag(one('#slib .block[data-type="canfwd"]'), one('#lib .block[data-type="while"] .cond'));
    expect(useUiStore().drag).toMatchObject({ cond: null });
    drop();
    expect(useProgramStore().blocks[0].cond).toBeNull();
  });
});

describe('program-execution: Editing during a run', () => {
  const tick = (): void => { vi.advanceTimersByTime(BASE_INTERVAL); };
  /** A corridor and three Move forward blocks, on the page. @returns the ids of the blocks */
  function threeMoves(): string[] {
    loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
    const blocks = [move(), move(), move()];
    setProgram(...blocks);
    page = mount(Page);
    return blocks.map(block => block.id);
  }
  const programIds = (): string[] => useProgramStore().blocks.map(block => block.id);
  const inProgram = (id: string): HTMLElement => one(`#prog .block[data-id="${id}"]`);

  it('Drag while running', () => {
    const ids = threeMoves();
    const execution = useExecutionStore(), ui = useUiStore();
    execution.toggleRun();
    drag(inProgram(ids[0]), one('#prog #main'));
    expect(ui.drag).toBeNull();
    expect(ui.status).toBe(t('ms.editlock'));
    drop();
    expect(programIds()).toEqual(ids);
    expect(execution.running).toBe(true);
    // a block from the library is not picked up either
    drag(one('#lib .block[data-type="move"]'), one('#prog #main'));
    expect(ui.drag).toBeNull();
    drop();
    expect(programIds()).toEqual(ids);
  });

  it('Drag while paused', () => {
    const ids = threeMoves();
    const execution = useExecutionStore(), ui = useUiStore();
    execution.toggleRun();
    tick();
    execution.pause();
    drag(inProgram(ids[2]), one('#prog #main'));
    drop();
    expect(ui.drag).toBeNull();
    expect(programIds()).toEqual(ids);
    expect([execution.active, execution.current]).toEqual([true, ids[0]]);
    expect(ui.status).toBe(t('ms.editlock'));
    // the run goes on from where it was, not from the start
    execution.toggleRun();
    tick();
    expect(execution.current).toBe(ids[1]);
    expect(robotAt()).toBe('3,1');
  });

  it('Unlocked after Stop', () => {
    const ids = threeMoves();
    const execution = useExecutionStore(), ui = useUiStore();
    execution.toggleRun();
    tick();
    execution.pause();
    execution.stop();
    drag(inProgram(ids[0]), one('#prog #main'));
    expect(ui.drag).toMatchObject({ fromLib: false, node: { id: ids[0] } });
    drop();
    expect(programIds().sort()).toEqual([...ids].sort());
  });

  it('Unlocked after a failure', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const first = move(), second = move();
    setProgram(first, second);
    page = mount(Page);
    const execution = useExecutionStore(), ui = useUiStore();
    run();
    expect(execution.err).toEqual({ [second.id]: true });
    drag(inProgram(first.id), one('#prog #main'));
    expect(ui.drag).not.toBeNull();
    // the dots of the failed run stay until the drop
    expect(execution.err).toEqual({ [second.id]: true });
    drop();
    expect([execution.ok, execution.err]).toEqual([{}, {}]);
  });
});
describe('saving the program after a drag', () => {
  /** The types of the blocks saved for the level the tests run on. */
  const saved = (): { type: string; cond?: { type: string } | null }[] =>
    (inSession(PROGRAMS_KEY) as Record<string, { type: string }[]>).one;

  it('saves a block dropped in from the library', () => {
    startGame();
    build(move());
    page = mount(Page);
    drag(one('#lib .block[data-type="rot"]'), one('#prog #main'));
    drop();
    expect(saved().map(block => block.type)).toEqual(['move', 'rot']);
  });

  it('saves a condition change', () => {
    startGame();
    const loop = loopWhile(null, move());
    build(loop);
    page = mount(Page);
    expect(saved()[0].cond).toBeNull();
    drag(one('#slib .block[data-type="canfwd"]'), one(`#prog .cond[data-owner="${loop.id}"]`));
    drop();
    expect(saved()[0].cond).toMatchObject({ type: 'canfwd' });
  });

  it('saves nothing while the block is in the air, and the removal once it is dropped on the remove area', () => {
    startGame();
    const first = move(), second = move();
    build(first, second);
    page = mount(Page);
    const trash = document.createElement('div');
    trash.id = 'trash';
    document.body.appendChild(trash);
    drag(one(`#prog .block[data-id="${first.id}"]`), trash);
    expect(useProgramStore().blocks).toHaveLength(1);
    expect(saved()).toHaveLength(2);
    drop();
    expect(saved()).toHaveLength(1);
  });

  it('keeps the saved program whole when a lifted block is dropped nowhere and goes back', () => {
    startGame();
    const first = move(), second = move();
    build(first, second);
    page = mount(Page);
    drag(one(`#prog .block[data-id="${first.id}"]`), null);
    useUiStore().drag!.target = null;
    drop();
    expect(useProgramStore().blocks.map(block => block.id)).toEqual([first.id, second.id]);
    expect(saved()).toHaveLength(2);
  });
});