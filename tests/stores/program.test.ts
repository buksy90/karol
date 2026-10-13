import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { PROGRAMS_KEY, useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, canGo, move, not, repeat, turn, use, when } from '../helpers/program.ts';
import { addCustom, blockStorage, build, inSession, loadMap, newTab, play, reloadPage, run, setProgram, setupStores, shape, startGame, t, teardownStores, TWO_LEVELS } from '../helpers/stores.ts';

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

describe('program-editor: Clear', () => {
  it('Cleared program stays cleared', () => {
    startGame();
    const levels = useLevelsStore(), program = useProgramStore();
    levels.load('two');
    build(move(), turn());
    program.clear();
    levels.load('one');
    levels.load('two');
    expect(program.blocks).toEqual([]);
    reloadPage();
    startGame();
    expect(useProgramStore().blocks).toEqual([]);
  });
});

describe('program-editor: Program kept per level', () => {
  it('Reload in the same tab', () => {
    startGame();
    useLevelsStore().load('two');
    const built = [move(), turn(), repeat(4, when(not(canGo()), turn(), use(3))), move(), turn()];
    build(...built);
    reloadPage();
    startGame();
    expect(useLevelsStore().current).toBe('two');
    const program = useProgramStore().blocks;
    expect(program).toHaveLength(5);
    expect(shape(program)).toEqual(shape(built));
    expect(program[2]).toMatchObject({ type: 'for', n: 4 });
    expect(program[2].children![0].cond).toMatchObject({ type: 'not', cond: { type: 'canfwd' } });
  });

  it('New tab', () => {
    startGame();
    build(move(), turn());
    newTab();
    startGame();
    expect(useProgramStore().blocks).toEqual([]);
  });

  it('Two levels, two programs', () => {
    startGame();
    const levels = useLevelsStore(), program = useProgramStore();
    const onOne = [move(), move(), turn()], onTwo = [turn()];
    build(...onOne);
    levels.load('two');
    expect(program.blocks).toEqual([]);
    build(...onTwo);
    for (let i = 0; i < 2; i++) {
      levels.load('one');
      expect(shape(program.blocks)).toEqual(shape(onOne));
      levels.load('two');
      expect(shape(program.blocks)).toEqual(shape(onTwo));
    }
  });

  it('Storage blocked', () => {
    blockStorage();
    startGame();
    const levels = useLevelsStore(), program = useProgramStore(), ui = useUiStore();
    const onOne = [move(), repeat(2, turn())];
    build(...onOne);
    expect(() => levels.load('two')).not.toThrow();
    expect(program.blocks).toEqual([]);
    levels.load('one');
    expect(shape(program.blocks)).toEqual(shape(onOne));
    expect(ui.status).toBe(t('ms.loaded', 'One'));
    // until the page is reloaded
    reloadPage();
    startGame();
    expect(useProgramStore().blocks).toEqual([]);
  });

  it('saves under karol.programs, by level id, on every change and not on loading', () => {
    startGame();
    expect(inSession(PROGRAMS_KEY)).toBeUndefined();
    const levels = useLevelsStore();
    build(move());
    levels.load('two');
    expect(Object.keys(inSession(PROGRAMS_KEY) as object)).toEqual(['one']);
    build(turn(), turn());
    const saved = inSession(PROGRAMS_KEY) as Record<string, { type: string }[]>;
    expect(saved.one.map(block => block.type)).toEqual(['move']);
    expect(saved.two.map(block => block.type)).toEqual(['rot', 'rot']);
  });

  it('a program that was not saved is gone after a level switch: only changed() keeps it', () => {
    startGame();
    setProgram(move());
    useLevelsStore().load('two');
    useLevelsStore().load('one');
    expect(useProgramStore().blocks).toEqual([]);
  });

  it('gives the blocks of a loaded program new ids, so nothing of the last run stays marked', () => {
    startGame();
    const first = move();
    build(first);
    run();
    const execution = useExecutionStore();
    expect(execution.ok).not.toEqual({});
    useLevelsStore().load('one');
    expect(execution.ok).toEqual({});
    expect(useProgramStore().blocks[0].id).not.toBe(first.id);
  });

  it('drops calls to custom blocks that no longer exist when a program is loaded', () => {
    startGame();
    const corner = addCustom('Corner', turn());
    build(move(), call(corner), repeat(2, call(corner)));
    reloadPage();
    // the programs survive, the custom blocks are made to be missing
    useLevelsStore().init(TWO_LEVELS);
    const program = useProgramStore().blocks;
    expect(program.map(block => block.type)).toEqual(['move', 'for']);
    expect(program[1].children).toEqual([]);
  });

  it('changed() clears the marks of the last run, also when no level is loaded', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    run(move());
    const execution = useExecutionStore();
    expect(execution.ok).not.toEqual({});
    useProgramStore().changed();
    expect([execution.ok, execution.err, execution.counts]).toEqual([{}, {}, {}]);
    expect(inSession(PROGRAMS_KEY)).toBeUndefined();
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
