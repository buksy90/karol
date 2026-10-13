// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppDialog from '../../src/components/AppDialog.vue';
import { orderByFileName } from '../../src/logic/levels.ts';
import type { Level } from '../../src/logic/types.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { buttonTexts, click, mount, rendered, unmount } from '../helpers/dom.ts';
import { move, turn } from '../helpers/program.ts';
import { build, play, setupStores, shape, t, teardownStores } from '../helpers/stores.ts';

const builtIns = orderByFileName(import.meta.glob<Level>('../../levels/*.json', { eager: true, import: 'default' }));

let page: HTMLElement;
beforeEach(() => {
  setupStores();
  useLevelsStore().init(builtIns);
  // the win dialog lives in the one dialog frame, which App.vue always shows
  page = mount(AppDialog);
});
afterEach(() => { unmount(); teardownStores(); });

/**
 * Load a level, run a short program that moves the robot away from its start, and open the
 * dialog the way reaching the exit does.
 * @returns where the robot started and the ids of the program's blocks
 */
async function winOn(levelId: string) {
  const world = useWorldStore(), program = useProgramStore();
  useLevelsStore().load(levelId);
  const start = { ...world.robot };
  build(turn(), turn());
  play();
  expect(world.robot).not.toEqual(start);
  useUiStore().openDialog('win');
  await rendered();
  return { start, blocks: program.blocks.map(block => block.id) };
}
const programIds = () => useProgramStore().blocks.map(block => block.id);
const body = () => page.querySelector('#mbody')!;

describe('levels: Win dialog', () => {
  it('Next level', async () => {
    await winOn('level-2');
    click(body(), t('ui.next'));
    const levels = useLevelsStore(), world = useWorldStore();
    expect(levels.current).toBe('level-3');
    expect(world.map).toEqual(builtIns[2].map);
    expect(useProgramStore().blocks).toEqual([]);
    expect(useUiStore().dialog).toBeNull();
    expect(useExecutionStore().ok).toEqual({});
  });

  it('Next level, visited before', async () => {
    const levels = useLevelsStore();
    levels.load('level-3');
    const built = [move(), move(), turn(), move()];
    build(...built);
    await winOn('level-2');
    click(body(), t('ui.next'));
    expect(levels.current).toBe('level-3');
    expect(shape(useProgramStore().blocks)).toEqual(shape(built));
  });

  it('The solved level keeps its program', async () => {
    await winOn('level-2');
    click(body(), t('ui.next'));
    useLevelsStore().load('level-2');
    expect(useProgramStore().blocks.map(block => block.type)).toEqual(['rot', 'rot']);
  });

  it('Stay', async () => {
    const { start, blocks } = await winOn('level-2');
    click(body(), t('ui.stay'));
    expect(useLevelsStore().current).toBe('level-2');
    expect(useWorldStore().robot).toEqual(start);
    expect(programIds()).toEqual(blocks);
    expect(useUiStore().dialog).toBeNull();
    expect(useUiStore().status).toBe(t('ms.ready'));
  });

  it('Restart', async () => {
    const { start } = await winOn('level-2');
    click(body(), t('ui.restart'));
    expect(useLevelsStore().current).toBe('level-2');
    expect(useWorldStore().robot).toEqual(start);
    expect(useProgramStore().blocks).toEqual([]);
    expect(useExecutionStore().ok).toEqual({});
    expect(useUiStore().dialog).toBeNull();
    expect(useUiStore().status).toBe(t('ms.ready'));
    // and it is still empty when the player later returns to this level
    useLevelsStore().load('level-3');
    useLevelsStore().load('level-2');
    expect(useProgramStore().blocks).toEqual([]);
  });

  it('Stay keeps the program for a later return too', async () => {
    await winOn('level-2');
    click(body(), t('ui.stay'));
    useLevelsStore().load('level-3');
    useLevelsStore().load('level-2');
    expect(useProgramStore().blocks.map(block => block.type)).toEqual(['rot', 'rot']);
  });

  it('Last level', async () => {
    await winOn('level-8');
    expect(buttonTexts(body())).toEqual([t('ui.stay'), t('ui.restart')]);
  });

  it('Closing the dialog', async () => {
    const { start, blocks } = await winOn('level-2');
    const robot = { ...useWorldStore().robot };
    click(page, t('ui.close'));
    expect(useUiStore().dialog).toBeNull();
    expect(useWorldStore().robot).toEqual(robot);
    expect(robot).not.toEqual(start);
    expect(programIds()).toEqual(blocks);
    expect(useLevelsStore().current).toBe('level-2');
  });

  it('is titled "Good job! 🎉" and offers Next level, Stay and Restart', async () => {
    await winOn('level-2');
    expect(page.querySelector('#mtitle')!.textContent).toBe('Good job! 🎉');
    expect(buttonTexts(body())).toEqual(['➡ Next level', '✋ Stay', '🔄 Restart']);
    expect(body().textContent).toContain(t('ms.good'));
  });

  it('Next level and Restart also drop the selection', async () => {
    const world = useWorldStore(), ui = useUiStore();
    useLevelsStore().load('level-2');
    const first = move();
    useProgramStore().blocks = [first];
    ui.toggleSelected(first.id);
    ui.openDialog('win');
    await rendered();
    click(body(), t('ui.restart'));
    expect(ui.selected).toEqual([]);
    expect(world.robot.d).toBe(1);
  });
});
