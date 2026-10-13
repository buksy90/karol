// Store tests: a fresh set of stores per test, local and session storage in memory, time under control.
import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import type { BlockDef, Level, LevelContent, MessageKey, ProgramNode } from '../../src/logic/types.ts';
import { defs } from '../../src/blocks/index.ts';
import { session } from '../../src/logic/storage.ts';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
import { useLevelsStore } from '../../src/stores/levels.ts';
import { useProgramStore } from '../../src/stores/program.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';

/**
 * Call in beforeEach.
 * @returns what local storage holds; fill it before a store's init to act as an earlier visit
 */
export function setupStores(): Map<string, string> {
  setActivePinia(createPinia());
  const stored = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
  });
  tab = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => tab.get(key) ?? null,
    setItem: (key: string, value: string) => { tab.set(key, value); },
  });
  session.forget();
  vi.useFakeTimers();
  return stored;
}

// What session storage holds: the programs and custom blocks of the browser tab.
let tab = new Map<string, string>();

/** What session storage holds under a key, parsed. */
export function inSession(key: string): unknown {
  const text = tab.get(key);
  return text === undefined ? undefined : JSON.parse(text);
}

/** Call in afterEach. The run session and its timer live outside the store, so a new Pinia does not drop them. */
export function teardownStores(): void {
  useExecutionStore().end();
  session.forget();
  vi.useRealTimers();
  vi.unstubAllGlobals();
}

/** A page reload: every store starts again; local storage and the tab's session storage are kept. */
export function reloadPage(): void {
  useExecutionStore().end();
  session.forget();
  setActivePinia(createPinia());
}

/** The game opened in a new tab: like a reload, but session storage starts empty. */
export function newTab(): void {
  tab.clear();
  reloadPage();
}

/** Local and session storage that refuse every call, as in a browser with storage blocked. */
export function blockStorage(): void {
  const blocked = () => { throw Error('blocked'); };
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
  vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked });
}

export function loadMap(...rows: string[]): void {
  useWorldStore().load({ map: rows });
}

/** Load a map together with its sprays and flags. */
export function loadLevel(level: LevelContent): void {
  useWorldStore().load(level);
}

export function setProgram(...blocks: ProgramNode[]): void {
  useProgramStore().blocks = blocks;
}

/** Two small levels for tests that need a level to be loaded: a corridor each, with the exit at its end. */
export const TWO_LEVELS: Level[] = [
  { id: 'one', name: 'One', map: ['WWWWWWWW', 'WK    eW', 'WWWWWWWW'] },
  { id: 'two', name: 'Two', map: ['WWWWWWWW', 'WK    eW', 'WWWWWWWW'] },
];

/** Start the game the way src/main.ts does: the custom blocks kept for the tab, then the levels. */
export function startGame(levels: Level[] = TWO_LEVELS): void {
  useCustomBlocksStore().init();
  useLevelsStore().init(levels);
}

/** Build a program the way the editor does: the blocks go in and the change is saved for the current level. */
export function build(...blocks: ProgramNode[]): void {
  setProgram(...blocks);
  useProgramStore().changed();
}

/** A tree of blocks without its ids, for comparing a program with one that was saved and loaded again. */
export const shape = (list: ProgramNode[]): unknown =>
  JSON.parse(JSON.stringify(list, (key, value) => key === 'id' ? undefined : value));

/** Save a custom block the way the editor does. @returns its id */
export function addCustom(name: string, ...body: ProgramNode[]): string {
  const customs = useCustomBlocksStore();
  customs.openEditor(null, body);
  customs.draft!.name = name;
  customs.save();
  return 'c' + customs.counter;
}

/** One press of Step. @returns the status line afterwards */
export function step(): string {
  useExecutionStore().stepOnce();
  return useUiStore().status;
}

/**
 * Put the blocks into the program and press Step until the run ends.
 * @returns the status line after each step
 */
export function play(...blocks: ProgramNode[]): string[] {
  if (blocks.length) setProgram(...blocks);
  const execution = useExecutionStore();
  const said: string[] = [];
  do said.push(step()); while (execution.active);
  return said;
}

/**
 * Put the blocks into the program, press Run and let the timer tick until the run ends.
 * Unlike stepping, this leaves each block's own message in the status line.
 * @returns the status line after pressing Run and after each step
 */
export function run(...blocks: ProgramNode[]): string[] {
  if (blocks.length) setProgram(...blocks);
  const execution = useExecutionStore(), ui = useUiStore();
  execution.toggleRun();
  const said = [ui.status];
  while (execution.running) {
    vi.advanceTimersByTime(BASE_INTERVAL / execution.speed);
    said.push(ui.status);
  }
  return said;
}

/** The text for a key in the current language. */
export function t(key: MessageKey, ...args: (string | number)[]): string {
  return useSettingsStore().t(key, ...args);
}

/** A block's label as the library shows it: icon, then text. */
export function label(type: string): string {
  const def: BlockDef = defs[type];
  return (def.icon ?? '') + t(def.labelKey!);
}

/** "x,y" of the robot. */
export function robotAt(): string {
  const { x, y } = useWorldStore().robot;
  return x + ',' + y;
}
