import turnLeft from './turn-left.ts';
import moveForward from './move-forward.ts';
import useItem from './use-item.ts';
import repeatTimes from './repeat-times.ts';
import ifBlock from './if.ts';
import repeatWhile from './repeat-while.ts';
import not from './not.ts';
import customCall from './custom-call.ts';
import { librarySensors } from '../sensors/index.ts';
import type { BlockDef, BlockDefs } from '../logic/types.ts';

/** The Blocks section of the library, in display order. Add a block by adding it here. */
export const libraryBlocks: BlockDef[] = [turnLeft, moveForward, useItem, repeatTimes, ifBlock, repeatWhile, not];

/** Every block and sensor definition by type. */
export const defs: BlockDefs = Object.fromEntries(
  [...libraryBlocks, customCall, ...librarySensors].map(def => [def.type, def]));

export const isCondition = (type: string): boolean => defs[type].kind === 'condition';
