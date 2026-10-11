<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useInventoryStore } from '../stores/inventory.ts';

const t = useT();
const inventory = useInventoryStore();
</script>

<template>
  <div id="invw">
    <span>{{ t('ui.inv') }}</span>
    <div id="inv"><div v-for="(item, i) in inventory.slots" :key="i" class="slot" :class="{ full: item }"><b>{{ i + 1 }}</b>{{ item || '' }}</div></div>
  </div>
</template>
