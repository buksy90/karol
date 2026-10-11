import { defineStore } from 'pinia';
import { SLOT_COUNT } from '../logic/world.js';

// What the robot carries: 8 slots, each empty (null) or holding an item.
export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    slots: Array(SLOT_COUNT).fill(null),
  }),
  actions: {
    reset() { this.slots = Array(SLOT_COUNT).fill(null); },
  },
});
