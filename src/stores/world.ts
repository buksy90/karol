import { defineStore } from 'pinia';
import { parseMap } from '../logic/world.ts';
import type { LevelContent, World } from '../logic/types.ts';
import { useInventoryStore } from './inventory.ts';

interface WorldState extends World {
  /** the level as loaded, kept for reset */
  level: LevelContent;
  /** bumped on every reset so the view can snap the robot */
  resets: number;
}

/** The tile world of the loaded level. The rules that change it are in logic/world.ts. */
export const useWorldStore = defineStore('world', {
  state: (): WorldState => ({
    level: { map: [] },            // the level as loaded, kept for reset
    rows: 0,
    cols: 0,
    grid: [],                      // grid[y][x]: 'W' wall, ' ' floor, 'k' key, 'D' door, 'L' locked, 'O' unlocked, 'e' exit
    boxes: new Set(),              // crates as "x,y"
    robot: { x: 1, y: 1, d: 1 },   // d: 0 north, 1 east, 2 south, 3 west
    angle: 90,                     // cumulative heading in degrees, for smooth turning
    roomMap: [],                   // room number per cell, -1 for walls and doors
    sprays: new Map(),             // sprays on the floor by "x,y"
    paint: new Map(),              // painted cells: "x,y" to #rrggbb
    flags: [],                     // the level's flags and whether each is done
    flagDoors: new Set(),          // the doors that flags open, as "x,y"
    resets: 0,                     // bumped on every reset so the view can snap the robot
  }),
  getters: {
    /** The level map as loaded. */
    map: (state): string[] => state.level.map,
  },
  actions: {
    load(level: LevelContent) {
      this.level = level;
      this.reset();
    },
    /** Back to the level's initial state, with an empty inventory. */
    reset() {
      Object.assign(this, parseMap(this.level.map, this.level.items, this.level.flags));
      useInventoryStore().reset();
      this.resets++;
    },
  },
});
