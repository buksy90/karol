import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './styles.css';
import { orderByFileName } from './logic/levels.ts';
import { useWorldStore } from './stores/world.ts';
import { useInventoryStore } from './stores/inventory.ts';
import { useProgramStore } from './stores/program.ts';
import { useCustomBlocksStore } from './stores/customBlocks.ts';
import { useExecutionStore } from './stores/execution.ts';
import { useLevelsStore } from './stores/levels.ts';
import { useSettingsStore } from './stores/settings.ts';
import { useUiStore } from './stores/ui.ts';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const stores = {
  world: useWorldStore(pinia),
  inventory: useInventoryStore(pinia),
  program: useProgramStore(pinia),
  customBlocks: useCustomBlocksStore(pinia),
  execution: useExecutionStore(pinia),
  levels: useLevelsStore(pinia),
  settings: useSettingsStore(pinia),
  ui: useUiStore(pinia),
};

// Start-up order: language and sound, then the custom blocks kept for this tab, then the
// levels (which loads the current one with its program, and that may use custom blocks).
stores.settings.init();
stores.customBlocks.init();
stores.levels.init(orderByFileName(import.meta.glob('../levels/*.json', { eager: true, import: 'default' })));

// Console functions for exchanging levels. Also tried on the parent and top window,
// for when the game runs inside a frame.
[window, window.parent, window.top].forEach(w => {
  try {
    w!.exportLevels = () => stores.levels.exportLevels();
    w!.importLevels = levels => stores.levels.importLevels(levels);
  } catch (e) { /* cross-origin frame */ }
});

// DEBUG ONLY (temporary): the stores in the browser console, e.g. stores.world.robot.
// Nothing in the code may read them from here.
globalThis.stores = stores;

app.mount('#root');

export type Stores = typeof stores;
