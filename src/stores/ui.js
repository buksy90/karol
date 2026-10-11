import { defineStore } from 'pinia';
import { locate, isContiguous } from '../logic/program.js';
import { useSettingsStore } from './settings.js';
import { useProgramStore } from './program.js';

// Interface state that is not part of the game itself.
export const useUiStore = defineStore('ui', {
  state: () => ({
    status: 'Build a program and press Run!',
    dialog: null,            // null | 'lv' | 'sp' | 'op' | 'win'
    collapsed: { sensors: false, blocks: false, custom: false },
    selMode: false,
    selected: [],            // ids of selected program blocks
    drag: null,              // the drag in progress, see composables/useDragDrop.js
    landed: null,            // id of the block that was just dropped (glows briefly)
  }),
  actions: {
    say(text) { this.status = text; },
    openDialog(kind) { this.dialog = kind; },
    closeDialog() { this.dialog = null; },
    toggleSection(name) { this.collapsed[name] = !this.collapsed[name]; },

    clearSelection() { this.selected = []; },
    setSelMode(on) {
      this.selMode = on;
      if (!on) this.clearSelection();
      else this.say(useSettingsStore().t('ms.selhint'));
    },
    // A selection is an unbroken run of blocks in one list; only its ends can be unselected.
    toggleSelected(id) {
      const settings = useSettingsStore();
      const blocks = useProgramStore().blocks;
      const here = locate(blocks, id, 'main');
      if (!here || here.kind !== 'list') return;
      let current = this.selected.map(s => locate(blocks, s, 'main')).filter(Boolean);
      if (this.selected.includes(id)) {
        if (!isContiguous(current.filter(c => c.node.id !== id).map(c => c.index))) { this.say(settings.t('ms.unsel')); return; }
        this.selected = this.selected.filter(s => s !== id);
      } else {
        if (current.length && current[0].list !== here.list) { this.clearSelection(); current = []; }
        if (!isContiguous([...current.map(c => c.index), here.index])) { this.say(settings.t('ms.adj')); return; }
        this.selected.push(id);
      }
      const n = this.selected.length;
      this.say(n ? settings.t('ms.sel', n) : settings.t('ms.selhint'));
    },
  },
});
