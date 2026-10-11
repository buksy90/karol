import { defineStore } from 'pinia';
import { findNode } from '../logic/program.ts';
import type { ProgramNode } from '../logic/types.ts';
import { useCustomBlocksStore } from './customBlocks.ts';

/** The program the player builds. */
export const useProgramStore = defineStore('program', {
  state: (): { blocks: ProgramNode[] } => ({
    blocks: [],
  }),
  actions: {
    clear() { this.blocks = []; },

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
