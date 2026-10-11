import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { canGo, move, repeat, turn, when } from '../helpers/program.ts';
import { loadMap, play, reloadPage, setProgram, setupStores, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('program-editor: Clear', () => {
  // The Clear button adds the message and the "ignored while running" rule; this is the store's part.
  it('clear empties the program and leaves the robot and the map alone', () => {
    loadMap('WWWWWW', 'WKb  W', 'WWWWWW');
    play(move(), turn(), move(), turn(), turn());
    const program = useProgramStore(), world = useWorldStore();
    const robot = { ...world.robot }, boxes = [...world.boxes];
    program.clear();
    expect(program.blocks).toEqual([]);
    expect(world.robot).toEqual(robot);
    expect([...world.boxes]).toEqual(boxes);
  });
});

describe('program-editor: Program is not persisted', () => {
  it('Reload', () => {
    setProgram(move(), turn(), move(), turn(), move());
    reloadPage();
    expect(useProgramStore().blocks).toEqual([]);
  });
});

describe('the visible list', () => {
  it('is the program while no custom block is being edited', () => {
    setProgram(move());
    const program = useProgramStore();
    expect(program.visibleRoot()).toBe(program.blocks);
    expect(program.visibleRootKey()).toBe('main');
  });

  it('is the custom block in the editor while one is open', () => {
    setProgram(move());
    const program = useProgramStore(), customs = useCustomBlocksStore();
    customs.openEditor(null, [turn()]);
    expect(program.visibleRoot()).toBe(customs.draft!.body);
    expect(program.visibleRootKey()).toBe('draft');
    customs.closeEditor();
    expect(program.visibleRootKey()).toBe('main');
  });
});

describe('listFor', () => {
  it('resolves main to the program', () => {
    setProgram(move());
    const program = useProgramStore();
    expect(program.listFor('main')).toBe(program.blocks);
  });

  it('resolves draft to the custom block in the editor, or nothing when it is closed', () => {
    const program = useProgramStore(), customs = useCustomBlocksStore();
    expect(program.listFor('draft')).toBeNull();
    customs.openEditor(null, [turn()]);
    expect(program.listFor('draft')).toBe(customs.draft!.body);
  });

  it('resolves the id of a container to its body, at any depth', () => {
    const inner = when(canGo(), move());
    const outer = repeat(2, turn(), inner);
    setProgram(move(), outer);
    const program = useProgramStore();
    expect(program.listFor(outer.id)).toBe(program.blocks[1].children);
    expect(program.listFor(inner.id)).toBe(program.blocks[1].children![1].children);
  });

  it('gives nothing for a block without a body or an unknown id', () => {
    const plain = move(), sensor = canGo();
    setProgram(plain, when(sensor));
    const program = useProgramStore();
    expect(program.listFor(plain.id)).toBeNull();
    expect(program.listFor(sensor.id)).toBeNull();
    expect(program.listFor('nope')).toBeNull();
  });

  it('looks in the editor, not in the program, while a custom block is being edited', () => {
    const inProgram = repeat(2, move());
    setProgram(inProgram);
    const program = useProgramStore(), customs = useCustomBlocksStore();
    customs.openEditor(null, [repeat(3, turn())]);
    const inDraft = customs.draft!.body[0];
    expect(program.listFor(inDraft.id)).toBe(inDraft.children);
    expect(program.listFor(inProgram.id)).toBeNull();
  });
});
