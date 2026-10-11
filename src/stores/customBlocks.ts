import { defineStore } from 'pinia';
import { cloneList, createNode, locate, stripCalls } from '../logic/program.ts';
import { offeredIds } from '../logic/custom-blocks.ts';
import type { CustomBlocks, ListLocation, ProgramNode } from '../logic/types.ts';
import { defs } from '../blocks/index.ts';
import { useSettingsStore } from './settings.ts';
import { useUiStore } from './ui.ts';
import { useProgramStore } from './program.ts';
import { useExecutionStore } from './execution.ts';

/** The custom block in the editor. */
interface Draft {
  /** null for a new block */
  id: string | null;
  name: string;
  body: ProgramNode[];
  /** ids of the program blocks that Save swaps for a call to the new block */
  replace: string[] | null;
}

interface CustomBlocksState {
  blocks: CustomBlocks;
  /** source of new ids: c1, c2, ... */
  counter: number;
  /** set while the editor is open */
  draft: Draft | null;
}

/** Custom blocks, and the one being created or edited. */
export const useCustomBlocksStore = defineStore('customBlocks', {
  state: (): CustomBlocksState => ({
    blocks: {},     // {[id]: {name, body}}
    counter: 0,     // source of new ids: c1, c2, ...
    draft: null,    // {id, name, body, replace} while the editor is open; id null for a new block
  }),
  getters: {
    /** Ids offered in the library; hides blocks that would create a cycle with the one being edited. */
    offered: (state): string[] => offeredIds(state.blocks, state.draft ? state.draft.id : null),
  },
  actions: {
    /**
     * @param id the custom block to edit, or null for a new one
     * @param prefill a list of blocks to start from
     * @param replace the ids of the program blocks that Save swaps for a call to the new block
     */
    openEditor(id: string | null, prefill?: ProgramNode[], replace?: string[]) {
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
      const draft = this.draft!, isNew = !draft.id;
      const id = draft.id || ('c' + (++this.counter));
      const fallback = useSettingsStore().t('ui.blockN') + ' ' + (Object.keys(this.blocks).length + (isNew ? 1 : 0));
      this.blocks[id] = { name: draft.name.trim() || fallback, body: draft.body };
      if (draft.replace) {
        // selected blocks always sit in a list
        const blocks = useProgramStore().blocks;
        const first = locate(blocks, draft.replace[0], 'main') as ListLocation | null;
        if (first) first.list.splice(first.index, 0, createNode(defs.call, id));
        for (const old of draft.replace) {
          const hit = locate(blocks, old, 'main') as ListLocation | null;
          if (hit) hit.list.splice(hit.index, 1);
        }
        useExecutionStore().clearMarks();
      }
      this.closeEditor();
    },
    /** Delete a custom block and every use of it. */
    remove(id: string) {
      delete this.blocks[id];
      for (const key in this.blocks) stripCalls(this.blocks[key].body, id);
      stripCalls(useProgramStore().blocks, id);
      if (this.draft) stripCalls(this.draft.body, id);
    },
  },
});
