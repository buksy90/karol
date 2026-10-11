<script setup lang="ts">
import type { ProgramNode } from '../logic/types.ts';
import { useUiStore } from '../stores/ui.ts';
import BlockItem from './BlockItem.vue';

// The "?" slot of If, Repeat while and Not. Holds one condition block or nothing.
defineProps<{
  /** the block this slot belongs to */
  owner: ProgramNode;
  library?: boolean;
}>();

const ui = useUiStore();
</script>

<template>
  <span class="cond" :class="{ hot: !library && ui.drag && ui.drag.cond === owner.id }" :data-owner="library ? null : owner.id"><BlockItem v-if="owner.cond" :node="owner.cond" :library="library" /></span>
</template>
