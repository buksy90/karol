import { defineStore } from 'pinia';
import { cloneList, createNode, locate, stripCalls } from '../logic/program.js';
import { offeredIds } from '../logic/custom-blocks.js';
import { defs } from '../blocks/index.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';
import { useProgramStore } from './program.js';
import { useExecutionStore } from './execution.js';

// Custom blocks, and the one being created or edited.
export const useCustomBlocksStore = defineStore('customBlocks', {
  state: () => ({
    blocks: {},     // {[id]: {name, body}}
    counter: 0,     // source of new ids: c1, c2, ...
    draft: null,    // {id, name, body, replace} while the editor is open; id null for a new block
  }),
  getters: {
    // Ids offered in the library; hides blocks that would create a cycle with the one being edited.
    offered: state => offeredIds(state.blocks, state.draft ? state.draft.id : null),
  },
  actions: {
    // `prefill` is a list of blocks to start from; `replace` the ids of the program
    // blocks that Save swaps for a call to the new block.
    openEditor(id, prefill, replace) {
      useExecutionStore().end();
      const ui = useUiStore();
      ui.setSelMode(false);
      this.draft = {
        id: id || null,
        replace: replace || null,
        name: id ? this.blocks[id].name : '',
        body: cloneList(id ? this.blocks[id].body : (prefill || [])),
      };
      ui.say(useSettingsStore().t('ms.editing'));
    },
    closeEditor() {
      this.draft = null;
      useUiStore().say(useSettingsStore().t('ms.ready'));
    },
    save() {
      const draft = this.draft, isNew = !draft.id;
      const id = draft.id || ('c' + (++this.counter));
      const fallback = useSettingsStore().t('ui.blockN') + ' ' + (Object.keys(this.blocks).length + (isNew ? 1 : 0));
      this.blocks[id] = { name: draft.name.trim() || fallback, body: draft.body };
      if (draft.replace) {
        const blocks = useProgramStore().blocks;
        const first = locate(blocks, draft.replace[0], 'main');
        if (first) first.list.splice(first.index, 0, createNode(defs.call, id));
        for (const old of draft.replace) {
          const hit = locate(blocks, old, 'main');
          if (hit) hit.list.splice(hit.index, 1);
        }
        useExecutionStore().clearMarks();
      }
      this.closeEditor();
    },
    // Delete a custom block and every use of it.
    remove(id) {
      delete this.blocks[id];
      for (const key in this.blocks) stripCalls(this.blocks[key].body, id);
      stripCalls(useProgramStore().blocks, id);
      if (this.draft) stripCalls(this.draft.body, id);
    },
  },
});
