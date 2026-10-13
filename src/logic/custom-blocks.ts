// Custom blocks: {[id]: {name, body}} where body is a program list.
import { restoreList } from './program.ts';
import type { BlockDefs, CustomBlocks, ProgramNode } from './types.ts';

/** Does this list call the target custom block, directly or through other custom blocks? */
export function uses(list: ProgramNode[], target: string, customs: CustomBlocks, seen = new Set<string>()): boolean {
  for (const node of list) {
    if (node.type === 'call') {
      if (node.ref === target) return true;
      if (!seen.has(node.ref!)) {
        seen.add(node.ref!);
        if (customs[node.ref!] && uses(customs[node.ref!].body, target, customs, seen)) return true;
      }
    }
    if (node.children && uses(node.children, target, customs, seen)) return true;
  }
  return false;
}

/**
 * The custom blocks that may be offered in the library. While one is being edited,
 * it and everything that contains it are hidden, so no block can end up inside itself.
 */
export function offeredIds(customs: CustomBlocks, editingId: string | null): string[] {
  return Object.keys(customs).filter(id =>
    editingId == null || (id !== editingId && !uses(customs[id].body, editingId, customs)));
}

/** Names are the same when they differ only in upper and lower case or in spaces at the ends. */
const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Does another custom block already have this name?
 * @param exceptId the block being saved, which may keep its own name
 */
export function nameTaken(customs: CustomBlocks, name: string, exceptId: string | null = null): boolean {
  return Object.keys(customs).some(id => id !== exceptId && sameName(customs[id].name, name));
}

/** The default name: "<prefix> N" with the smallest N from 1 that no other custom block has. */
export function firstFreeName(customs: CustomBlocks, prefix: string, exceptId: string | null = null): string {
  for (let n = 1; ; n++) {
    const name = prefix + ' ' + n;
    if (!nameTaken(customs, name, exceptId)) return name;
  }
}
/**
 * Rebuild the custom blocks from stored data `{blocks, counter}`. Entries that are not a
 * named list of blocks are dropped, and so are calls to blocks that are not there.
 * The counter never falls below a number an id already uses, so new ids stay new.
 */
export function restoreCustoms(stored: unknown, defs: BlockDefs): { blocks: CustomBlocks; counter: number } {
  const from = (stored && typeof stored === 'object' ? stored : {}) as { blocks?: unknown; counter?: unknown };
  const entries = (from.blocks && typeof from.blocks === 'object' ? from.blocks : {}) as Record<string, unknown>;
  const blocks: CustomBlocks = {};
  for (const id of Object.keys(entries)) {
    const entry = entries[id] as { name?: unknown; body?: unknown } | null;
    if (entry && typeof entry.name === 'string' && Array.isArray(entry.body)) blocks[id] = { name: entry.name, body: [] };
  }
  // bodies second, when it is known which blocks exist
  for (const id of Object.keys(blocks)) blocks[id].body = restoreList((entries[id] as { body: unknown }).body, defs, blocks);
  const used = Object.keys(blocks).map(id => +id.slice(1)).filter(n => Number.isInteger(n));
  const counter = Math.max(0, Number.isInteger(from.counter) ? from.counter as number : 0, ...used);
  return { blocks, counter };
}