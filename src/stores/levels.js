import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { BUILTIN_VERSION, initialLevels, mergeImported } from '../logic/levels.js';
import { storage } from '../logic/storage.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';
import { useWorldStore } from './world.js';
import { useExecutionStore } from './execution.js';

// The list of levels and which one is loaded. Persisted in local storage.
export const useLevelsStore = defineStore('levels', {
  state: () => ({
    levels: [],
    current: null,   // id of the loaded level
  }),
  getters: {
    // The level after the current one, if any.
    next: state => state.levels[state.levels.findIndex(l => l.id === state.current) + 1] || null,
  },
  actions: {
    // `builtIns` are the level objects shipped with the game, in order.
    init(builtIns) {
      const { levels, versionChanged } = initialLevels(storage.get('karol.levels'), storage.get('karol.ver'), builtIns);
      this.levels = levels;
      if (versionChanged) storage.set('karol.ver', BUILTIN_VERSION);
      this.load(storage.get('karol.level'));
      useUiStore().say(useSettingsStore().t('ms.ready'));
    },
    // Load a level by id, or the first level when the id is unknown.
    load(id) {
      const level = this.levels.find(l => l.id === id) || this.levels[0];
      this.current = level.id;
      useExecutionStore().end();
      useWorldStore().load(level.map);
      this.save();
      useUiStore().say(useSettingsStore().t('ms.loaded', level.name));
    },
    save() {
      storage.set('karol.levels', JSON.stringify(this.levels));
      storage.set('karol.level', this.current);
    },
    // Console function: print the levels as JSON and return them.
    exportLevels() {
      console.log(JSON.stringify(this.levels, null, 2));
      return toRaw(this.levels);
    },
    // Console function: validate, merge by id, save. Returns the number imported.
    importLevels(arg) {
      const count = mergeImported(this.levels, arg);
      this.save();
      console.log('Imported ' + count + ' level(s)');
      return count;
    },
  },
});
