import turnLeft from './turn-left.js';
import moveForward from './move-forward.js';
import useItem from './use-item.js';
import repeatTimes from './repeat-times.js';
import ifBlock from './if.js';
import repeatWhile from './repeat-while.js';
import not from './not.js';
import customCall from './custom-call.js';
import { librarySensors } from '../sensors/index.js';

// The Blocks section of the library, in display order. Add a block by adding it here.
export const libraryBlocks = [turnLeft, moveForward, useItem, repeatTimes, ifBlock, repeatWhile, not];

// Every block and sensor definition by type.
export const defs = Object.fromEntries(
  [...libraryBlocks, customCall, ...librarySensors].map(def => [def.type, def]));

export const isCondition = type => defs[type].kind === 'condition';
