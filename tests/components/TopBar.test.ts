// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppDialog from '../../src/components/AppDialog.vue';
import TopBar from '../../src/components/TopBar.vue';
import { useUiStore } from '../../src/stores/ui.ts';
import { buttonTexts, click, mount, rendered, unmount } from '../helpers/dom.ts';
import { setupStores, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(() => { unmount(); teardownStores(); });

describe('app-shell: Top bar', () => {
  it('Top bar contents', () => {
    const page = mount(TopBar);
    expect(page.querySelector('#invw span')!.textContent).toBe('Inventory');
    expect(page.querySelectorAll('#inv .slot')).toHaveLength(8);
    // Levels and Options, in this order, and no Specs button
    expect(buttonTexts(page)).toEqual([t('ui.levels'), t('ui.options')]);
    expect(page.textContent).not.toContain('Specs');
  });

  it('the buttons open the Levels and the Options dialog', () => {
    const page = mount(TopBar);
    const ui = useUiStore();
    click(page, t('ui.levels'));
    expect(ui.dialog).toBe('lv');
    click(page, t('ui.options'));
    expect(ui.dialog).toBe('op');
  });
});

describe('app-shell: Dialogs', () => {
  it('Closing by clicking outside', async () => {
    const page = mount(AppDialog);
    const ui = useUiStore();
    ui.openDialog('op');
    await rendered();
    expect(page.querySelector('#mtitle')!.textContent).toBe(t('ui.options'));
    // a click inside the dialog leaves it open
    page.querySelector<HTMLElement>('#mbox')!.click();
    expect(ui.dialog).toBe('op');
    page.querySelector<HTMLElement>('#modal')!.click();
    expect(ui.dialog).toBeNull();
  });

  it('every dialog has its title and closes on the Close button', async () => {
    const page = mount(AppDialog);
    const ui = useUiStore();
    for (const [kind, title] of [['lv', 'ui.levels'], ['op', 'ui.options'], ['win', 'ui.good']] as const) {
      ui.openDialog(kind);
      await rendered();
      expect(page.querySelector('#mtitle')!.textContent).toBe(t(title));
      click(page, t('ui.close'));
      expect(ui.dialog).toBeNull();
    }
  });
});
