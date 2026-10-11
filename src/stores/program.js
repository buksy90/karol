import { defineStore } from 'pinia';
import { findNode } from '../logic/program.js';
import { useCustomBlocksStore } from './customBlocks.js';

// The program the player builds.
export const useProgramStore = defineStore('program', {
  state: () => ({
    blocks: [],
  }),
  actions: {
    clear() { this.blocks = []; },

    // The list being edited on screen: the program, or the custom block in the editor.
    visibleRoot() {
      const draft = useCustomBlocksStore().draft;
      return draft ? draft.body : this.blocks;
    },
    visibleRootKey() {
      return useCustomBlocksStore().draft ? 'draft' : 'main';
    },
    // Resolve a list key ('main', 'draft' or the id of a container block) to its array.
    listFor(key) {
      if (key === 'main') return this.blocks;
      if (key === 'draft') { const draft = useCustomBlocksStore().draft; return draft ? draft.body : null; }
      const node = findNode(this.visibleRoot(), key);
      return node && node.children ? node.children : null;
    },
  },
});
