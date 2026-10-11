import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProgramNode } from '../../src/logic/types.ts';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { call, canGo, move, not, repeat, turn, use, when } from '../helpers/program.ts';
import { addCustom, loadMap, reloadPage, run, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const types = (list: ProgramNode[]): string[] => list.map(node => node.type);
/** A tree without its ids, for comparing a copy with its original. */
const shape = (list: ProgramNode[]): unknown => JSON.parse(JSON.stringify(list, (key, value) => key === 'id' ? undefined : value));

describe('custom-blocks: Editor view', () => {
  it('Opening the editor', () => {
    const customs = useCustomBlocksStore();
    customs.openEditor(null);
    expect(customs.draft).toEqual({ id: null, name: '', body: [], replace: null });
    expect(useUiStore().status).toBe(t('ms.editing'));
    // the editor is what the program panel now shows
    expect(useProgramStore().visibleRoot()).toBe(customs.draft!.body);
  });

  it('Editing an existing block', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move(), turn());
    customs.openEditor(id);
    expect(customs.draft).toMatchObject({ id, name: 'Corner', replace: null });
    expect(types(customs.draft!.body)).toEqual(['move', 'rot']);
  });

  it('Opening the editor during a run', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    setProgram(move(), move());
    const execution = useExecutionStore(), customs = useCustomBlocksStore();
    execution.toggleRun();
    customs.openEditor(null);
    expect([execution.running, execution.active]).toEqual([false, false]);
    customs.closeEditor();
    step();
    execution.pause();
    customs.openEditor(null);
    expect(execution.active).toBe(false);
    expect(useUiStore().status).toBe(t('ms.editing'));
  });

  it('ends select mode', () => {
    const first = move();
    setProgram(first);
    const ui = useUiStore();
    ui.setSelMode(true);
    ui.toggleSelected(first.id);
    useCustomBlocksStore().openEditor(null);
    expect(ui.selMode).toBe(false);
    expect(ui.selected).toEqual([]);
  });
});

describe('custom-blocks: Save and cancel', () => {
  it('Saving a new block', () => {
    const customs = useCustomBlocksStore();
    customs.openEditor(null);
    customs.draft!.name = 'Corner';
    customs.draft!.body.push(move(), turn());
    customs.save();
    expect(Object.keys(customs.blocks)).toEqual(['c1']);
    expect(customs.blocks.c1.name).toBe('Corner');
    expect(types(customs.blocks.c1.body)).toEqual(['move', 'rot']);
    expect(customs.offered).toEqual(['c1']);
    expect(customs.draft).toBeNull();
    expect(useProgramStore().visibleRootKey()).toBe('main');
    expect(useUiStore().status).toBe(t('ms.ready'));
  });

  it('Cancelling an edit', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move(), turn());
    customs.openEditor(id);
    customs.draft!.body.push(move());
    customs.draft!.name = 'Changed';
    customs.closeEditor();
    expect(customs.blocks[id].name).toBe('Corner');
    expect(types(customs.blocks[id].body)).toEqual(['move', 'rot']);
    expect(customs.draft).toBeNull();
    expect(useUiStore().status).toBe(t('ms.ready'));
  });

  it('saving an edit keeps the id and replaces the contents', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move(), turn());
    customs.openEditor(id);
    customs.draft!.body.pop();
    customs.save();
    expect(Object.keys(customs.blocks)).toEqual([id]);
    expect(types(customs.blocks[id].body)).toEqual(['move']);
  });

  it('numbers new blocks c1, c2, … and never reuses an id', () => {
    const customs = useCustomBlocksStore();
    expect(addCustom('A')).toBe('c1');
    expect(addCustom('B')).toBe('c2');
    customs.remove('c2');
    expect(addCustom('C')).toBe('c3');
    expect(Object.keys(customs.blocks)).toEqual(['c1', 'c3']);
  });

  it('trims the name', () => {
    const id = addCustom('  Corner  ');
    expect(useCustomBlocksStore().blocks[id].name).toBe('Corner');
  });
});

describe('custom-blocks: Default name', () => {
  it('First block without a name', () => {
    const id = addCustom('');
    expect(useCustomBlocksStore().blocks[id].name).toBe('Block 1');
  });

  it('Duplicate default name', () => {
    const customs = useCustomBlocksStore();
    const first = addCustom(''), second = addCustom('');
    expect([customs.blocks[first].name, customs.blocks[second].name]).toEqual(['Block 1', 'Block 2']);
    customs.remove(first);
    const third = addCustom('');
    expect(customs.blocks[third].name).toBe('Block 2');
    expect(customs.blocks[second].name).toBe('Block 2');
  });

  it('is "Blok N" in Slovak', () => {
    useSettingsStore().setLanguage('sk');
    const id = addCustom('   ');
    expect(useCustomBlocksStore().blocks[id].name).toBe('Blok 1');
  });

  it('is used for an existing block saved with its name emptied, N being the number of blocks', () => {
    const customs = useCustomBlocksStore();
    addCustom('A');
    const id = addCustom('B');
    customs.openEditor(id);
    customs.draft!.name = '';
    customs.save();
    expect(customs.blocks[id].name).toBe('Block 2');
  });
});

describe('custom-blocks: Renaming', () => {
  it('Rename', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move());
    const use1 = call(id);
    setProgram(move(), use1);
    customs.openEditor(id);
    customs.draft!.name = 'Turn round';
    customs.save();
    // a use holds the id, not the name, so the block in the program follows
    const inProgram = useProgramStore().blocks[1];
    expect(inProgram.id).toBe(use1.id);
    expect(customs.blocks[inProgram.ref!].name).toBe('Turn round');
  });
});

describe('custom-blocks: Deleting', () => {
  // The "Sure?" confirmation is in the library; this is what the second press does.
  it('Confirmed delete', () => {
    const customs = useCustomBlocksStore();
    const corner = addCustom('Corner', move(), turn());
    const other = addCustom('Other', turn(), repeat(2, call(corner)), move());
    const keep = call(other);
    setProgram(call(corner), move(), repeat(2, turn(), call(corner)), keep);
    customs.remove(corner);
    const program = useProgramStore().blocks;
    expect(Object.keys(customs.blocks)).toEqual([other]);
    expect(types(program)).toEqual(['move', 'for', 'call']);
    expect(types(program[1].children!)).toEqual(['rot']);
    expect(program[2].ref).toBe(other);
    expect(types(customs.blocks[other].body)).toEqual(['rot', 'for', 'move']);
    expect(customs.blocks[other].body[1].children).toEqual([]);
  });

  it('also removes the uses from the block being edited', () => {
    const customs = useCustomBlocksStore();
    const corner = addCustom('Corner', move());
    customs.openEditor(null);
    customs.draft!.body.push(move(), call(corner));
    customs.remove(corner);
    expect(types(customs.draft!.body)).toEqual(['move']);
  });
});

describe('custom-blocks: Contents and cycle prevention', () => {
  it('offers the blocks that cannot create a cycle with the one being edited', () => {
    const customs = useCustomBlocksStore();
    const a = addCustom('A', move());
    const b = addCustom('B', call(a));
    const c = addCustom('C', turn());
    expect(customs.offered).toEqual([a, b, c]);
    customs.openEditor(a);
    expect(customs.offered).toEqual([c]);
    customs.closeEditor();
    customs.openEditor(b);
    expect(customs.offered).toEqual([a, c]);
    customs.closeEditor();
    // a new block can hold any of them
    customs.openEditor(null);
    expect(customs.offered).toEqual([a, b, c]);
  });
});

describe('custom-blocks: Make a block from a selection', () => {
  /** The program a, b, c, d with the first three selected and the editor opened on them, as "Make block" does. */
  function selectThree() {
    const a = move(), b = repeat(4, turn(), use(3)), c = when(not(canGo()), move()), d = turn();
    setProgram(a, b, c, d);
    const customs = useCustomBlocksStore();
    customs.openEditor(null, [a, b, c], [a.id, b.id, c.id]);
    return { customs, originals: [a, b, c], d };
  }

  it('Saving the selection as a block', () => {
    const { customs, originals, d } = selectThree();
    expect(shape(customs.draft!.body)).toEqual(shape(originals));
    customs.draft!.name = 'Corner';
    customs.save();
    const program = useProgramStore().blocks;
    expect(types(program)).toEqual(['call', 'rot']);
    expect(program[0].ref).toBe('c1');
    expect(program[1].id).toBe(d.id);
    expect(customs.blocks.c1.name).toBe('Corner');
    expect(shape(customs.blocks.c1.body)).toEqual(shape(originals));
  });

  it('Cancelling', () => {
    const { customs, originals, d } = selectThree();
    customs.draft!.body.pop();
    customs.closeEditor();
    expect(useProgramStore().blocks.map(node => node.id)).toEqual([...originals.map(node => node.id), d.id]);
    expect(customs.blocks).toEqual({});
  });

  it('puts the new block where the selection was, also inside a container', () => {
    const a = move(), b = turn(), c = move(), d = turn();
    const loop = repeat(2, a, b, c, d);
    setProgram(move(), loop);
    const customs = useCustomBlocksStore();
    customs.openEditor(null, [b, c], [b.id, c.id]);
    customs.save();
    const inside = useProgramStore().blocks[1].children!;
    expect(types(inside)).toEqual(['move', 'call', 'rot']);
    expect([inside[0].id, inside[2].id]).toEqual([a.id, d.id]);
  });

  it('works on copies, so the editor does not change the program before Save', () => {
    const { customs } = selectThree();
    customs.draft!.body[1].n = 9;
    expect(useProgramStore().blocks[1].n).toBe(4);
  });

  it('clears the dots of the previous run when the selection is replaced', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const a = move(), b = move();
    run(a, b);
    const execution = useExecutionStore(), customs = useCustomBlocksStore();
    customs.openEditor(null, [a], [a.id]);
    expect(execution.ok).not.toEqual({});
    customs.save();
    expect(execution.ok).toEqual({});
  });
});

describe('custom-blocks: Not persisted', () => {
  it('Reload', () => {
    addCustom('A', move());
    addCustom('B', turn());
    reloadPage();
    const customs = useCustomBlocksStore();
    expect(customs.blocks).toEqual({});
    expect(customs.offered).toEqual([]);
  });
});
