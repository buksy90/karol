import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProgramNode } from '../../src/logic/types.ts';
import { CUSTOMS_KEY, useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { PROGRAMS_KEY, useProgramStore } from '../../src/stores/program.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { call, canGo, move, not, repeat, turn, use, when } from '../helpers/program.ts';
import { addCustom, blockStorage, build, inSession, loadMap, newTab, reloadPage, run, setProgram, setupStores, startGame, step, t, teardownStores } from '../helpers/stores.ts';

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
    const id = addCustom('Corner', turn());
    const execution = useExecutionStore(), customs = useCustomBlocksStore();
    execution.toggleRun();
    customs.openEditor(null);
    expect(customs.draft).toBeNull();
    expect(execution.running).toBe(true);
    execution.pause();
    customs.openEditor(id);
    expect(customs.draft).toBeNull();
    expect([execution.running, execution.active]).toEqual([false, true]);
    expect(useUiStore().status).toBe(t('ms.paused'));
    // also during a stepped run, and for Make block
    execution.stop();
    step();
    customs.openEditor(null, [move()], ['x']);
    expect(customs.draft).toBeNull();
    expect(execution.active).toBe(true);
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
    expect(customs.blocks[third].name).toBe('Block 1');
    expect(customs.blocks[second].name).toBe('Block 2');
  });

  it('Number already taken by a named block', () => {
    const customs = useCustomBlocksStore();
    addCustom('Block 1');
    const second = addCustom('');
    expect(customs.blocks[second].name).toBe('Block 2');
    // however it was typed
    addCustom(' block 3 ');
    expect(customs.blocks[addCustom('')].name).toBe('Block 4');
  });

  it('is "Blok N" in Slovak', () => {
    useSettingsStore().setLanguage('sk');
    const id = addCustom('   ');
    expect(useCustomBlocksStore().blocks[id].name).toBe('Blok 1');
  });

  it('is used for an existing block saved with its name emptied, and may be the name it had', () => {
    const customs = useCustomBlocksStore();
    addCustom('A');
    const id = addCustom('B');
    customs.openEditor(id);
    customs.draft!.name = '';
    customs.save();
    expect(customs.blocks[id].name).toBe('Block 1');
    customs.openEditor(id);
    customs.draft!.name = '';
    customs.save();
    expect(customs.blocks[id].name).toBe('Block 1');
    expect(customs.draft).toBeNull();
  });
});

describe('custom-blocks: Unique names', () => {
  it('Duplicate name on a new block', () => {
    const customs = useCustomBlocksStore();
    addCustom('Corner', move());
    customs.openEditor(null);
    customs.draft!.name = 'corner';
    customs.draft!.body.push(turn());
    customs.save();
    expect(Object.keys(customs.blocks)).toEqual(['c1']);
    expect(customs.draft).toMatchObject({ id: null, name: 'corner' });
    expect(types(customs.draft!.body)).toEqual(['rot']);
    expect(useUiStore().status).toBe('A block named "corner" already exists. Choose another name.');
    // no id was used up by the refused save
    customs.draft!.name = 'Bend';
    customs.save();
    expect(Object.keys(customs.blocks)).toEqual(['c1', 'c2']);
  });

  it('Keeping its own name', () => {
    const customs = useCustomBlocksStore();
    const id = addCustom('Corner', move());
    customs.openEditor(id);
    customs.draft!.body.push(turn());
    customs.save();
    expect(customs.draft).toBeNull();
    expect(customs.blocks[id].name).toBe('Corner');
    expect(types(customs.blocks[id].body)).toEqual(['move', 'rot']);
  });

  it('Renaming to a taken name', () => {
    const customs = useCustomBlocksStore();
    addCustom('Corner', move());
    const spin = addCustom('Spin', turn());
    customs.openEditor(spin);
    customs.draft!.name = 'Corner';
    customs.draft!.body.push(move());
    customs.save();
    expect(customs.blocks[spin].name).toBe('Spin');
    expect(types(customs.blocks[spin].body)).toEqual(['rot']);
    expect(customs.draft).toMatchObject({ id: spin, name: 'Corner' });
    expect(useUiStore().status).toBe(t('ms.dupname', 'Corner'));
  });

  it('ignores spaces at the ends and the case of letters, and says so in Slovak too', () => {
    useSettingsStore().setLanguage('sk');
    const customs = useCustomBlocksStore();
    addCustom('Corner');
    customs.openEditor(null);
    customs.draft!.name = '  CORNER ';
    customs.save();
    expect(Object.keys(customs.blocks)).toEqual(['c1']);
    expect(useUiStore().status).toBe('Blok s názvom „CORNER“ už existuje. Vyber iný názov.');
  });

  it('does not replace the selection when the save is refused', () => {
    const customs = useCustomBlocksStore();
    addCustom('Corner');
    const a = move(), b = turn();
    setProgram(a, b);
    customs.openEditor(null, [a], [a.id]);
    customs.draft!.name = 'Corner';
    customs.save();
    expect(useProgramStore().blocks.map(node => node.id)).toEqual([a.id, b.id]);
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

  it('Used on another level', () => {
    startGame();
    const levels = useLevelsStore(), customs = useCustomBlocksStore();
    const corner = addCustom('Corner', move()), other = addCustom('Other', turn());
    build(move(), call(corner), repeat(2, call(corner), turn()), call(other));
    levels.load('two');
    build(call(corner), turn());
    customs.remove(corner);
    expect(types(useProgramStore().blocks)).toEqual(['rot']);
    levels.load('one');
    const program = useProgramStore().blocks;
    expect(types(program)).toEqual(['move', 'for', 'call']);
    expect(types(program[1].children!)).toEqual(['rot']);
    expect(program[2].ref).toBe(other);
    // and it stays gone after a reload
    reloadPage();
    startGame();
    expect(types(useProgramStore().blocks)).toEqual(['move', 'for', 'call']);
    expect(Object.keys(useCustomBlocksStore().blocks)).toEqual([other]);
  });

  it('Delete during a run', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const customs = useCustomBlocksStore(), execution = useExecutionStore();
    const corner = addCustom('Corner', move());
    setProgram(call(corner), move());
    execution.toggleRun();
    execution.pause();
    customs.remove(corner);
    expect(Object.keys(customs.blocks)).toEqual([corner]);
    expect(types(useProgramStore().blocks)).toEqual(['call', 'move']);
    expect([execution.running, execution.active]).toEqual([false, true]);
    // possible again once the run has ended
    execution.stop();
    customs.remove(corner);
    expect(customs.blocks).toEqual({});
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

  it('saves the program in which the selection was replaced', () => {
    startGame();
    const a = move(), b = turn();
    build(a, b);
    const customs = useCustomBlocksStore();
    customs.openEditor(null, [a], [a.id]);
    customs.save();
    const saved = inSession(PROGRAMS_KEY) as Record<string, { type: string; ref?: string }[]>;
    expect(saved.one).toMatchObject([{ type: 'call', ref: 'c1' }, { type: 'rot' }]);
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

describe('custom-blocks: Custom blocks kept for the session', () => {
  it('Reload in the same tab', () => {
    startGame();
    const corner = addCustom('Corner', move(), turn());
    addCustom('Twice', repeat(2, call(corner)));
    build(move(), call(corner));
    reloadPage();
    startGame();
    const customs = useCustomBlocksStore();
    expect(customs.offered).toEqual(['c1', 'c2']);
    expect([customs.blocks.c1.name, customs.blocks.c2.name]).toEqual(['Corner', 'Twice']);
    expect(types(customs.blocks.c1.body)).toEqual(['move', 'rot']);
    expect(customs.blocks.c2.body[0].children![0]).toMatchObject({ type: 'call', ref: 'c1' });
    // the program of level 1 still uses the custom block
    expect(useLevelsStore().current).toBe('one');
    expect(useProgramStore().blocks[1]).toMatchObject({ type: 'call', ref: 'c1' });
  });

  it('Shared between levels', () => {
    startGame();
    const corner = addCustom('Corner', move());
    useLevelsStore().load('two');
    expect(useCustomBlocksStore().offered).toEqual([corner]);
  });

  it('New tab', () => {
    startGame();
    addCustom('Corner', move());
    newTab();
    startGame();
    const customs = useCustomBlocksStore();
    expect(customs.blocks).toEqual({});
    expect(customs.offered).toEqual([]);
  });

  it('a block created after a reload gets an id that was never used', () => {
    startGame();
    addCustom('A');
    addCustom('B');
    useCustomBlocksStore().remove('c2');
    reloadPage();
    startGame();
    expect(addCustom('C')).toBe('c3');
    expect(Object.keys(useCustomBlocksStore().blocks)).toEqual(['c1', 'c3']);
  });

  it('saves on create, edit and delete, under karol.customs', () => {
    const customs = useCustomBlocksStore();
    const saved = () => inSession(CUSTOMS_KEY) as { blocks: Record<string, { name: string; body: unknown[] }>; counter: number };
    expect(inSession(CUSTOMS_KEY)).toBeUndefined();
    const id = addCustom('Corner', move());
    expect(saved().counter).toBe(1);
    expect(saved().blocks[id]).toMatchObject({ name: 'Corner', body: [{ type: 'move' }] });
    customs.openEditor(id);
    customs.draft!.name = 'Bend';
    customs.draft!.body.push(turn());
    expect(saved().blocks[id].name).toBe('Corner');
    customs.save();
    expect(saved().blocks[id]).toMatchObject({ name: 'Bend', body: [{ type: 'move' }, { type: 'rot' }] });
    customs.remove(id);
    expect(saved()).toEqual({ blocks: {}, counter: 1 });
  });

  it('are kept until the page is reloaded when storage is blocked', () => {
    blockStorage();
    startGame();
    const corner = addCustom('Corner', move());
    useLevelsStore().load('two');
    expect(useCustomBlocksStore().offered).toEqual([corner]);
    reloadPage();
    startGame();
    expect(useCustomBlocksStore().blocks).toEqual({});
  });

  it('the editor draft is not saved', () => {
    startGame();
    const customs = useCustomBlocksStore();
    customs.openEditor(null, [move()]);
    reloadPage();
    startGame();
    expect(useCustomBlocksStore().draft).toBeNull();
    expect(useCustomBlocksStore().blocks).toEqual({});
  });
});
