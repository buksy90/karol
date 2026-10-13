<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useInventoryStore } from '../stores/inventory.ts';

// A key shows as 🔑. A spray is the slot itself in the spray's colour, with the uses left in the corner.
const t = useT();
const inventory = useInventoryStore();
</script>

<template>
  <div id="invw">
    <span>{{ t('ui.inv') }}</span>
    <div id="inv">
      <div v-for="(item, i) in inventory.slots" :key="i" class="slot" :class="{ full: item, spray: item && item.type === 'spray' }" :style="item && item.type === 'spray' ? { '--spray': item.color } : undefined">
        <b>{{ i + 1 }}</b><template v-if="item && item.type === 'key'">🔑</template><span v-if="item && item.type === 'spray'" class="uses">{{ item.uses }}</span>
      </div>
    </div>
  </div>
</template>
