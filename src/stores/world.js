import { defineStore } from 'pinia';
import { parseMap } from '../logic/world.js';
import { useInventoryStore } from './inventory.js';

// The tile world of the loaded level. The rules that change it are in logic/world.js.
export const useWorldStore = defineStore('world', {
  state: () => ({
    map: [],                       // the level map as loaded, kept for reset
    rows: 0,
    cols: 0,
    grid: [],                      // grid[y][x]: 'W' wall, ' ' floor, 'k' key, 'D' door, 'L' locked, 'O' unlocked, 'e' exit
    boxes: new Set(),              // crates as "x,y"
    robot: { x: 1, y: 1, d: 1 },   // d: 0 north, 1 east, 2 south, 3 west
    angle: 90,                     // cumulative heading in degrees, for smooth turning
    roomMap: [],                   // room number per cell, -1 for walls and doors
    resets: 0,                     // bumped on every reset so the view can snap the robot
  }),
  actions: {
    load(map) {
      this.map = map;
      this.reset();
    },
    // Back to the level's initial state, with an empty inventory.
    reset() {
      Object.assign(this, parseMap(this.map));
      useInventoryStore().reset();
      this.resets++;
    },
  },
});
