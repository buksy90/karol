import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import sk from '../../locales/sk.json';
import { conditionText, evaluate, innermostSensor } from '../../src/logic/conditions.ts';
import { translate } from '../../src/logic/i18n.ts';
import { defs } from '../../src/blocks/index.ts';
import type { Translate } from '../../src/logic/types.ts';
import { canGo, not } from '../helpers/program.ts';
import { worldOf } from '../helpers/world.ts';

const free = () => worldOf('WWWW', 'WK W', 'WWWW');
const blocked = () => worldOf('WWW', 'WKW', 'WWW');
const inLanguage = (lang: string): Translate => (key, ...args) => translate({ en, sk }, lang, key, args);

describe('evaluate', () => {
  it('asks the sensor about the world as it is', () => {
    expect(evaluate(canGo(), defs, { world: free() })).toBe(true);
    expect(evaluate(canGo(), defs, { world: blocked() })).toBe(false);
  });

  it('inverts through Not, to any depth', () => {
    expect(evaluate(not(canGo()), defs, { world: free() })).toBe(false);
    expect(evaluate(not(canGo()), defs, { world: blocked() })).toBe(true);
    expect(evaluate(not(not(canGo())), defs, { world: free() })).toBe(true);
    expect(evaluate(not(not(not(canGo()))), defs, { world: free() })).toBe(false);
  });

  it('is null for an empty slot', () => {
    expect(evaluate(null, defs, { world: free() })).toBeNull();
    expect(evaluate(undefined, defs, { world: free() })).toBeNull();
  });

  it('is null when a Not at any depth has an empty slot', () => {
    expect(evaluate(not(), defs, { world: free() })).toBeNull();
    expect(evaluate(not(not()), defs, { world: free() })).toBeNull();
  });

  it('is null for a block type that does not exist', () => {
    expect(evaluate({ id: 'x', type: 'gone' }, defs, { world: free() })).toBeNull();
  });

  it('does not change the world', () => {
    const world = worldOf('WWWWW', 'WKbkW', 'WWWWW');
    const before = JSON.stringify([world.grid, [...world.boxes], world.robot, world.angle]);
    evaluate(not(canGo()), defs, { world });
    expect(JSON.stringify([world.grid, [...world.boxes], world.robot, world.angle])).toBe(before);
  });
});

describe('conditionText', () => {
  it('names a sensor', () => {
    expect(conditionText(canGo(), defs, inLanguage('en'))).toBe('Can go forward');
  });

  it('wraps what a Not holds in brackets', () => {
    expect(conditionText(not(canGo()), defs, inLanguage('en'))).toBe('Not(Can go forward)');
    expect(conditionText(not(not(canGo())), defs, inLanguage('en'))).toBe('Not(Not(Can go forward))');
  });

  it('shows ? for the empty slot of a Not', () => {
    expect(conditionText(not(), defs, inLanguage('en'))).toBe('Not(?)');
  });

  it('follows the language', () => {
    expect(conditionText(not(canGo()), defs, inLanguage('sk'))).toBe('Nie(Môžem ísť dopredu)');
  });
});

describe('innermostSensor', () => {
  it('is the sensor itself, or the one under any number of Nots', () => {
    const sensor = canGo();
    expect(innermostSensor(sensor, defs)).toBe(sensor);
    expect(innermostSensor(not(sensor), defs)).toBe(sensor);
    expect(innermostSensor(not(not(sensor)), defs)).toBe(sensor);
  });

  it('is null when there is no sensor', () => {
    expect(innermostSensor(null, defs)).toBeNull();
    expect(innermostSensor(undefined, defs)).toBeNull();
    expect(innermostSensor(not(), defs)).toBeNull();
    expect(innermostSensor(not(not()), defs)).toBeNull();
  });
});
