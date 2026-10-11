<script setup>
import { useUiStore } from '../stores/ui.js';
import BlockItem from './BlockItem.vue';

// The "?" slot of If, Repeat while and Not. Holds one condition block or nothing.
defineProps({
  owner: { type: Object, required: true },   // the block this slot belongs to
  library: Boolean,
});

const ui = useUiStore();
</script>

<template>
  <span class="cond" :class="{ hot: !library && ui.drag && ui.drag.cond === owner.id }" :data-owner="library ? null : owner.id"><BlockItem v-if="owner.cond" :node="owner.cond" :library="library" /></span>
</template>
