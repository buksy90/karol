import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import turnLeft from '../../src/blocks/turn-left.ts';
import { useExecutionStore } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { turn } from '../helpers/program.ts';
import { label, loadMap, play, robotAt, setupStores, t, teardownStores } from '../helpers/stores.ts';
import { at, emptySlots, NORTH, worldOf } from '../helpers/world.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

describe('block-turn-left: Turn left', () => {
  it('Turning from east', () => {
    const world = worldOf('WWWWW', 'W K W', 'WWWWW');
    const said: string[] = [];
    const result = turnLeft.execute({ world, slots: emptySlots(), node: turn(), say: key => { said.push(key); } });
    expect(world.robot.d).toBe(NORTH);
    expect(at(world)).toBe('2,1');
    expect(result).toEqual({ ok: true });
    expect(said).toEqual([]);
  });

  it('Four turns', () => {
    loadMap('WWWWW', 'W K W', 'WWWWW');
    play(turn(), turn(), turn(), turn());
    expect(useWorldStore().robot).toEqual({ x: 2, y: 1, d: 1 });
  });

  it('Turning next to a wall', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const first = turn(), second = turn();
    const said = play(first, second);
    const execution = useExecutionStore();
    expect(useWorldStore().robot.d).toBe(3);
    expect(robotAt()).toBe('1,1');
    expect(execution.ok).toEqual({ [first.id]: true, [second.id]: true });
    expect(execution.err).toEqual({});
    expect(said.at(-1)).toBe(t('ms.fin'));
  });
});

describe('block-turn-left: Turn left label', () => {
  it('Slovak label', () => {
    expect(label('rot')).toBe('↶ Turn left');
    useSettingsStore().setLanguage('sk');
    expect(label('rot')).toBe('↶ Doľava');
  });
});
