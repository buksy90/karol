import { defineStore } from 'pinia';
import { findNode, restoreList, stripCalls } from '../logic/program.ts';
import { session } from '../logic/storage.ts';
import type { ProgramNode } from '../logic/types.ts';
import { defs } from '../blocks/index.ts';
import { useCustomBlocksStore } from './customBlocks.ts';
import { useExecutionStore } from './execution.ts';
import { useLevelsStore } from './levels.ts';

/** Session storage key: the saved program of each level, by level id. */
export const PROGRAMS_KEY = 'karol.programs';

function savedPrograms(): Record<string, unknown> {
  const all = session.read(PROGRAMS_KEY);
  return all && typeof all === 'object' && !Array.isArray(all) ? all as Record<string, unknown> : {};
}

/** The program the player builds. Each level has its own, kept for the tab session. */
export const useProgramStore = defineStore('program', {
  state: (): { blocks: ProgramNode[] } => ({
    blocks: [],
  }),
  actions: {
    clear() {
      this.blocks = [];
      this.changed();
    },
    /** Call after every edit: the marks of the last run go and the program is saved for the current level. */
    changed() {
      useExecutionStore().clearMarks();
      const level = useLevelsStore().current;
      if (!level) return;
      const all = savedPrograms();
      all[level] = this.blocks;
      session.write(PROGRAMS_KEY, all);
    },
    /** Show a level's own program: the one saved for it, or an empty one. */
    load(levelId: string) {
      this.blocks = restoreList(savedPrograms()[levelId], defs, useCustomBlocksStore().blocks);
    },
    /** Remove every call to a custom block from the program and from the saved programs of all levels. */
    stripCalls(ref: string) {
      const all = savedPrograms();
      for (const level in all) if (Array.isArray(all[level])) stripCalls(all[level] as ProgramNode[], ref);
      session.write(PROGRAMS_KEY, all);
      stripCalls(this.blocks, ref);
      this.changed();
    },

    /** The list being edited on screen: the program, or the custom block in the editor. */
    visibleRoot(): ProgramNode[] {
      const draft = useCustomBlocksStore().draft;
      return draft ? draft.body : this.blocks;
    },
    visibleRootKey(): 'draft' | 'main' {
      return useCustomBlocksStore().draft ? 'draft' : 'main';
    },
    /** Resolve a list key ('main', 'draft' or the id of a container block) to its array. */
    listFor(key: string): ProgramNode[] | null {
      if (key === 'main') return this.blocks;
      if (key === 'draft') { const draft = useCustomBlocksStore().draft; return draft ? draft.body : null; }
      const node = findNode(this.visibleRoot(), key);
      return node && node.children ? node.children : null;
    },
  },
});
