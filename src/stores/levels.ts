import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { BUILTIN_VERSION, initialLevels, mergeImported } from '../logic/levels.ts';
import { storage } from '../logic/storage.ts';
import type { Level } from '../logic/types.ts';
import { useSettingsStore } from './settings.ts';
import { useUiStore } from './ui.ts';
import { useWorldStore } from './world.ts';
import { useExecutionStore } from './execution.ts';
import { useProgramStore } from './program.ts';

interface LevelsState {
  levels: Level[];
  /** id of the loaded level */
  current: string | null;
}

/** The list of levels and which one is loaded. Persisted in local storage. */
export const useLevelsStore = defineStore('levels', {
  state: (): LevelsState => ({
    levels: [],
    current: null,   // id of the loaded level
  }),
  getters: {
    /** The level after the current one, if any. */
    next: (state): Level | null => state.levels[state.levels.findIndex(l => l.id === state.current) + 1] || null,
  },
  actions: {
    /** @param builtIns the level objects shipped with the game, in order */
    init(builtIns: unknown[]) {
      const { levels, versionChanged } = initialLevels(storage.get('karol.levels'), storage.get('karol.ver'), builtIns);
      this.levels = levels;
      if (versionChanged) storage.set('karol.ver', BUILTIN_VERSION);
      this.load(storage.get('karol.level'));
      useUiStore().say(useSettingsStore().t('ms.ready'));
    },
    /** Load a level by id, or the first level when the id is unknown, together with its own program. */
    load(id: string | null) {
      const level = this.levels.find(l => l.id === id) || this.levels[0];
      this.current = level.id;
      useExecutionStore().end();
      useWorldStore().load(level);
      // every level has its own program
      useProgramStore().load(level.id);
      useExecutionStore().clearMarks();
      useUiStore().clearSelection();
      this.save();
      useUiStore().say(useSettingsStore().t('ms.loaded', level.name));
    },
    save() {
      storage.set('karol.levels', JSON.stringify(this.levels));
      storage.set('karol.level', this.current as string);
    },
    /** Console function: print the levels as JSON and return them. */
    exportLevels(): Level[] {
      console.log(JSON.stringify(this.levels, null, 2));
      return toRaw(this.levels);
    },
    /**
     * Console function: validate, merge by id, save.
     * @returns the number imported
     */
    importLevels(arg: unknown): number {
      const count = mergeImported(this.levels, arg);
      this.save();
      console.log('Imported ' + count + ' level(s)');
      return count;
    },
  },
});
