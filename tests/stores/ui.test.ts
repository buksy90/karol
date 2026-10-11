import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from '../../src/stores/ui.ts';
import { canGo, move, repeat, turn, when } from '../helpers/program.ts';
import { loadMap, run, setProgram, setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('app-shell: Status line', () => {
  it('Message replaced', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const said = run(move());
    expect(said).toEqual([t('ms.run'), t('ms.wall')]);
    expect(useUiStore().status).toBe('💥 Ouch, a wall!');
  });

  it('shows the ready message when the game starts', () => {
    expect(useUiStore().status).toBe('Build a program and press Run!');
    expect(t('ms.ready')).toBe('Build a program and press Run!');
  });
});

describe('app-shell: Dialogs', () => {
  it('has one dialog open at a time', () => {
    const ui = useUiStore();
    expect(ui.dialog).toBeNull();
    ui.openDialog('lv');
    ui.openDialog('op');
    expect(ui.dialog).toBe('op');
    ui.closeDialog();
    expect(ui.dialog).toBeNull();
  });
});

describe('program-editor: Block library', () => {
  it('Collapsing a section', () => {
    const ui = useUiStore();
    expect(ui.collapsed).toEqual({ sensors: false, blocks: false, custom: false });
    ui.toggleSection('blocks');
    expect(ui.collapsed).toEqual({ sensors: false, blocks: true, custom: false });
    ui.toggleSection('blocks');
    expect(ui.collapsed.blocks).toBe(false);
  });
});

describe('program-editor: Select mode', () => {
  it('Selecting blocks', () => {
    const a = move(), b = turn();
    setProgram(a, b, move());
    const ui = useUiStore();
    ui.setSelMode(true);
    expect(ui.selMode).toBe(true);
    expect(ui.status).toBe(t('ms.selhint'));
    ui.toggleSelected(a.id);
    expect(ui.status).toBe(t('ms.sel', 1));
    ui.toggleSelected(b.id);
    expect(ui.selected).toEqual([a.id, b.id]);
    expect(ui.status).toBe('2 selected. Press "Make block" to turn them into a custom block.');
  });

  it('Leaving select mode', () => {
    const a = move(), b = turn();
    setProgram(a, b);
    const ui = useUiStore();
    ui.setSelMode(true);
    ui.toggleSelected(a.id);
    ui.toggleSelected(b.id);
    ui.setSelMode(false);
    expect(ui.selMode).toBe(false);
    expect(ui.selected).toEqual([]);
  });

  it('unselects a block that is clicked again', () => {
    const a = move();
    setProgram(a, turn());
    const ui = useUiStore();
    ui.setSelMode(true);
    ui.toggleSelected(a.id);
    ui.toggleSelected(a.id);
    expect(ui.selected).toEqual([]);
    expect(ui.status).toBe(t('ms.selhint'));
  });
});

describe('program-editor: Selection is one contiguous run', () => {
  it('Gap in the selection', () => {
    const blocks = [move(), turn(), move(), turn()];
    setProgram(...blocks);
    const ui = useUiStore();
    ui.toggleSelected(blocks[0].id);
    ui.toggleSelected(blocks[2].id);
    expect(ui.selected).toEqual([blocks[0].id]);
    expect(ui.status).toBe(t('ms.adj'));
  });

  it('Unselecting in the middle', () => {
    const blocks = [move(), turn(), move()];
    setProgram(...blocks);
    const ui = useUiStore();
    blocks.forEach(block => ui.toggleSelected(block.id));
    ui.toggleSelected(blocks[1].id);
    expect(ui.selected).toEqual(blocks.map(block => block.id));
    expect(ui.status).toBe(t('ms.unsel'));
  });

  it('Another list', () => {
    const inner = move();
    const blocks = [move(), turn(), repeat(2, turn(), inner)];
    setProgram(...blocks);
    const ui = useUiStore();
    ui.toggleSelected(blocks[0].id);
    ui.toggleSelected(blocks[1].id);
    ui.toggleSelected(inner.id);
    expect(ui.selected).toEqual([inner.id]);
    expect(ui.status).toBe(t('ms.sel', 1));
  });

  it('grows in either direction', () => {
    const blocks = [move(), turn(), move(), turn()];
    setProgram(...blocks);
    const ui = useUiStore();
    ui.toggleSelected(blocks[2].id);
    ui.toggleSelected(blocks[1].id);
    ui.toggleSelected(blocks[3].id);
    expect([...ui.selected].sort()).toEqual(blocks.slice(1).map(block => block.id).sort());
    expect(ui.status).toBe(t('ms.sel', 3));
  });

  it('lets the first and the last block be unselected', () => {
    const blocks = [move(), turn(), move()];
    setProgram(...blocks);
    const ui = useUiStore();
    blocks.forEach(block => ui.toggleSelected(block.id));
    ui.toggleSelected(blocks[0].id);
    expect(ui.selected).toEqual([blocks[1].id, blocks[2].id]);
    ui.toggleSelected(blocks[2].id);
    expect(ui.selected).toEqual([blocks[1].id]);
    expect(ui.status).toBe(t('ms.sel', 1));
  });

  it('does not select a condition block or an unknown block', () => {
    const sensor = canGo();
    setProgram(when(sensor, move()));
    const ui = useUiStore();
    ui.say('before');
    ui.toggleSelected(sensor.id);
    ui.toggleSelected('nope');
    expect(ui.selected).toEqual([]);
    expect(ui.status).toBe('before');
  });

  it('selects a container as one block', () => {
    const loop = repeat(2, move());
    const after = turn();
    setProgram(loop, after);
    const ui = useUiStore();
    ui.toggleSelected(loop.id);
    ui.toggleSelected(after.id);
    expect(ui.selected).toEqual([loop.id, after.id]);
  });
});
