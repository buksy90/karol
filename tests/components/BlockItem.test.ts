// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ProgramPanel from '../../src/components/ProgramPanel.vue';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { PROGRAMS_KEY, useProgramStore } from '../../src/stores/program.ts';
import { mount, rendered, unmount } from '../helpers/dom.ts';
import { move, repeat, use } from '../helpers/program.ts';
import { build, inSession, loadMap, run, setProgram, setupStores, startGame, step, teardownStores } from '../helpers/stores.ts';

// Blocks are shown by the program panel, so that is what these tests put on the page.
let page: HTMLElement;
beforeEach(() => {
  setupStores();
  loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
});
afterEach(() => { unmount(); teardownStores(); });

/** The number field of a block in the program. */
const field = (id: string): HTMLInputElement => page.querySelector<HTMLInputElement>(`.block[data-id="${id}"] input`)!;

/** Type into a number field and click elsewhere. */
function typeAndLeave(input: HTMLInputElement, text: string): void {
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.blur();
}
/** Put one block on the page, type into its number and leave. @returns what the block holds and what its field reads */
async function typed(block: ReturnType<typeof use>, text: string): Promise<{ n: number | undefined; reads: string }> {
  setProgram(block);
  page = mount(ProgramPanel);
  typeAndLeave(field(block.id), text);
  await rendered();
  return { n: useProgramStore().blocks[0].n, reads: field(block.id).value };
}

describe('program-editor: Editing numbers on a block', () => {
  it('Changing a number', async () => {
    const loop = repeat(2), after = move();
    setProgram(loop, after);
    page = mount(ProgramPanel);
    typeAndLeave(field(loop.id), '5');
    await rendered();
    const program = useProgramStore().blocks;
    expect(program[0].n).toBe(5);
    expect(field(loop.id).value).toBe('5');
    expect(program.map(block => block.id)).toEqual([loop.id, after.id]);
  });

  it('Out of range', async () => {
    expect(await typed(use(3), '12')).toEqual({ n: 3, reads: '3' });
  });

  it('Emptied field', async () => {
    expect(await typed(repeat(4), '')).toEqual({ n: 4, reads: '4' });
  });

  it('Fraction', async () => {
    expect(await typed(repeat(4), '2.5')).toEqual({ n: 4, reads: '4' });
  });

  it('keeps what is being typed in the field when the page is drawn again', async () => {
    const loop = repeat(4);
    setProgram(loop);
    page = mount(ProgramPanel);
    const input = field(loop.id);
    input.focus();
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // typing clears the marks of the last run, which draws the block again
    useExecutionStore().ok = { [loop.id]: true };
    await rendered();
    useExecutionStore().clearMarks();
    await rendered();
    expect(input.value).toBe('12');
    expect(useProgramStore().blocks[0].n).toBe(4);
  });

  it('keeps nothing while the player is still typing', () => {
    const loop = repeat(4);
    setProgram(loop);
    page = mount(ProgramPanel);
    const input = field(loop.id);
    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(useProgramStore().blocks[0].n).toBe(4);
    input.value = '12';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(useProgramStore().blocks[0].n).toBe(4);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(useProgramStore().blocks[0].n).toBe(12);
  });
});

describe('a committed number', () => {
  it('is saved with the program, and a rejected one is not', () => {
    startGame();
    const loop = repeat(2);
    build(loop);
    page = mount(ProgramPanel);
    const saved = (): number => (inSession(PROGRAMS_KEY) as Record<string, { n: number }[]>).one[0].n;
    typeAndLeave(field(loop.id), '7');
    expect(saved()).toBe(7);
    typeAndLeave(field(loop.id), '700');
    expect(saved()).toBe(7);
  });

  it('removes the dots of the last run', () => {
    const loop = repeat(2);
    setProgram(loop);
    page = mount(ProgramPanel);
    run();
    const execution = useExecutionStore();
    expect(execution.ok).not.toEqual({});
    typeAndLeave(field(loop.id), '3');
    expect([execution.ok, execution.counts]).toEqual([{}, {}]);
  });
});

describe('block-use-item: Slot number', () => {
  it('Value typed outside the range', async () => {
    expect(await typed(use(2), '12')).toEqual({ n: 2, reads: '2' });
    unmount();
    expect(await typed(use(2), '0')).toEqual({ n: 2, reads: '2' });
    unmount();
    expect(await typed(use(2), '8')).toEqual({ n: 8, reads: '8' });
  });
});

describe('block-repeat-times: Fixed number of rounds', () => {
  it('Value typed outside the range', async () => {
    expect(await typed(repeat(3), '500')).toEqual({ n: 3, reads: '3' });
    unmount();
    expect(await typed(repeat(3), '99')).toEqual({ n: 99, reads: '99' });
  });
});

describe('program-execution: Editing during a run', () => {
  it('Number field while stepping', async () => {
    const loop = repeat(3, move());
    setProgram(loop);
    page = mount(ProgramPanel);
    expect(field(loop.id).disabled).toBe(false);
    step();
    step();
    await rendered();
    expect(field(loop.id).disabled).toBe(true);
    useExecutionStore().stop();
    await rendered();
    expect(field(loop.id).disabled).toBe(false);
  });
});
