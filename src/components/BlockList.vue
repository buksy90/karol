<script setup>
import { computed } from 'vue';
import { useUiStore } from '../stores/ui.js';
import BlockItem from './BlockItem.vue';

// A list of blocks: the program, a custom block body, or the body of a container.
// `owner` is the key drag and drop uses to address it: 'main', 'draft' or a block id.
const props = defineProps({
  list: { type: Array, required: true },
  owner: { type: String, required: true },
});

const ui = useUiStore();

// Where the dashed drop placeholder sits in this list, or -1.
const placeholder = computed(() => {
  const d = ui.drag;
  return d && d.target && d.target.owner === props.owner ? d.target.index : -1;
});
</script>

<template>
  <div class="list" :data-list="owner"><template v-for="(node, i) in list" :key="node.id"><div v-if="placeholder === i" class="ph"></div><BlockItem :node="node" /></template><div v-if="placeholder === list.length" class="ph"></div></div>
</template>
