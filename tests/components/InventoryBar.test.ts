// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import InventoryBar from '../../src/components/InventoryBar.vue';
import { COLOR_NAMES } from '../../src/logic/colors.ts';
import { useInventoryStore } from '../../src/stores/inventory.ts';
import { mount, rendered, unmount } from '../helpers/dom.ts';
import { move, use } from '../helpers/program.ts';
import { loadLevel, play, setupStores, teardownStores } from '../helpers/stores.ts';

let page: HTMLElement;
beforeEach(() => {
  setupStores();
  page = mount(InventoryBar);
});
afterEach(() => { unmount(); teardownStores(); });

/** What slot `n` (1-based) shows: its classes, its background colour, the uses in its corner and the rest of its text. */
function slot(n: number) {
  const el = page.querySelectorAll<HTMLElement>('.slot')[n - 1];
  const uses = el.querySelector('.uses');
  return {
    full: el.classList.contains('full'),
    spray: el.classList.contains('spray'),
    background: el.style.getPropertyValue('--spray'),
    uses: uses ? uses.textContent : null,
    number: el.querySelector('b')!.textContent,
    text: [...el.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent!.trim()).join(''),
  };
}
const EMPTY = { full: false, spray: false, background: '', uses: null, text: '' };

/** A corridor with a spray on the cell next to the robot. */
const corridor = (color: string, uses: number) =>
  ({ map: ['WWWWW', 'WK  W', 'WWWWW'], items: [{ type: 'spray' as const, position: [2, 1] as [number, number], color, uses }] });

describe('world: Inventory', () => {
  it('Key and sprays together', async () => {
    const inventory = useInventoryStore();
    inventory.slots[0] = { type: 'key' };
    inventory.slots[1] = { type: 'spray', color: COLOR_NAMES.red, uses: 3 };
    inventory.slots[2] = { type: 'spray', color: COLOR_NAMES.blue, uses: 1 };
    await rendered();
    expect(page.querySelectorAll('.slot')).toHaveLength(8);
    expect(slot(1)).toEqual({ ...EMPTY, full: true, text: '🔑', number: '1' });
    expect(slot(2)).toEqual({ full: true, spray: true, background: COLOR_NAMES.red, uses: '3', number: '2', text: '' });
    expect(slot(3)).toEqual({ full: true, spray: true, background: COLOR_NAMES.blue, uses: '1', number: '3', text: '' });
    expect(slot(4)).toEqual({ ...EMPTY, number: '4' });
  });

  it('Uses left after painting', async () => {
    loadLevel(corridor('red', 3));
    play(move());
    await rendered();
    expect(slot(1)).toMatchObject({ spray: true, background: COLOR_NAMES.red, uses: '3' });
    play(move(), use(1));
    await rendered();
    expect(slot(1)).toMatchObject({ spray: true, background: COLOR_NAMES.red, uses: '2' });
  });

  it('Spray given as a hex value', async () => {
    loadLevel(corridor('#1E90FF', 2));
    play(move());
    await rendered();
    expect(slot(1)).toMatchObject({ spray: true, background: '#1e90ff', uses: '2' });
  });

  it('Spray used up', async () => {
    loadLevel(corridor('red', 1));
    play(move(), use(1));
    await rendered();
    expect(slot(1)).toEqual({ ...EMPTY, number: '1' });
  });
});
