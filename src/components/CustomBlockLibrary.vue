<script setup lang="ts">
import { reactive } from 'vue';
import { useT } from '../composables/useT.ts';
import { useCustomBlocksStore } from '../stores/customBlocks.ts';
import { useExecutionStore } from '../stores/execution.ts';
import BlockItem from './BlockItem.vue';

const CONFIRM_MS = 2500;

const t = useT();
const custom = useCustomBlocksStore(), exec = useExecutionStore();

// Delete buttons waiting for their second, confirming press.
const sure = reactive<Record<string, boolean>>({});

function remove(id: string) {
  if (!sure[id]) {
    sure[id] = true;
    setTimeout(() => { delete sure[id]; }, CONFIRM_MS);
  } else {
    delete sure[id];
    custom.remove(id);
  }
}
</script>

<template>
  <div id="clib">
    <div v-if="!custom.offered.length" style="color:#9aa3d6;font-size:13px;font-weight:600;margin-top:6px">{{ t('ui.nocustom') }}</div>
    <div v-for="id in custom.offered" :key="id" class="crow">
      <BlockItem :node="{ id: 'lib-call-' + id, type: 'call', ref: id }" library />
      <button class="mini" title="Edit" :disabled="exec.active" @click="custom.openEditor(id)">✏️</button>
      <button class="mini" :class="{ sure: sure[id] }" title="Delete" :disabled="exec.active" @click="remove(id)">{{ sure[id] ? t('ui.sure') : '🗑' }}</button>
    </div>
  </div>
</template>
