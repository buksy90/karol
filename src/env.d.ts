/// <reference types="vite/client" />
import type { Stores } from './main.ts';
import type { Level } from './logic/types.ts';

declare global {
  /** DEBUG ONLY (temporary): the stores in the browser console. Nothing in the code may read them. */
  var stores: Stores;

  interface Window {
    /** Console function: print the levels as JSON and return them. */
    exportLevels: () => Level[];
    /** Console function: add or replace levels; takes an array or its JSON text. */
    importLevels: (levels: unknown) => number;
    /** Safari before 14.1 */
    webkitAudioContext?: typeof AudioContext;
  }
}
