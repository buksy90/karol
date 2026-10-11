// Store tests: a fresh set of stores per test, storage in memory, time under control.
import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import type { BlockDef, MessageKey, ProgramNode } from '../../src/logic/types.ts';
import { defs } from '../../src/blocks/index.ts';
import { useCustomBlocksStore } from '../../src/stores/customBlocks.ts';
import { BASE_INTERVAL, useExecutionStore } from '../../src/stores/execution.ts';
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
  vi.useFakeTimers();
  return stored;
}

/** Call in afterEach. The run session and its timer live outside the store, so a new Pinia does not drop them. */
export function teardownStores(): void {
  useExecutionStore().end();
  vi.useRealTimers();
  vi.unstubAllGlobals();
}

/** A page reload: every store starts again, and only local storage is kept. */
export function reloadPage(): void {
  useExecutionStore().end();
  setActivePinia(createPinia());
}

/** Local storage that refuses every call, as in a browser with storage blocked. */
export function blockStorage(): void {
  const blocked = () => { throw Error('blocked'); };
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });
}

export function loadMap(...rows: string[]): void {
  useWorldStore().load(rows);
}

export function setProgram(...blocks: ProgramNode[]): void {
  useProgramStore().blocks = blocks;
}

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
