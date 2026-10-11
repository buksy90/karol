// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import BlockLibrary from '../../src/components/BlockLibrary.vue';
import ProgramPanel from '../../src/components/ProgramPanel.vue';
import { useDragDrop } from '../../src/composables/useDragDrop.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { mount, rendered, unmount } from '../helpers/dom.ts';
import { loopWhile, move } from '../helpers/program.ts';
import { setProgram, setupStores, teardownStores } from '../helpers/stores.ts';

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
