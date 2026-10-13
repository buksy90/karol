// Worlds for tests, built from map rows the same way a level is loaded.
import { parseMap, SLOT_COUNT } from '../../src/logic/world.ts';
import type { Item, Slots, World } from '../../src/logic/types.ts';

export const NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;

/** The world a map starts in. The robot stands on `K` and faces east. */
export const worldOf = (...rows: string[]): World => parseMap(rows);

/** A key, as a slot holds it. */
export const key = (): Item => ({ type: 'key' });

/** A spray, as a slot holds it. The colour is #rrggbb. */
export const spray = (color: string, uses: number): Item => ({ type: 'spray', color, uses });

/** An inventory with nothing in it. */
export const emptySlots = (): Slots => Array(SLOT_COUNT).fill(null);

/** "x,y" of the robot, for short position checks. */
export const at = (w: World): string => w.robot.x + ',' + w.robot.y;
