<script setup>
import { computed } from 'vue';
import { locate } from '../logic/program.js';
import { useT } from '../composables/useT.js';
import { useUiStore } from '../stores/ui.js';
import { useProgramStore } from '../stores/program.js';
import { useExecutionStore } from '../stores/execution.js';
import { useCustomBlocksStore } from '../stores/customBlocks.js';
import BlockList from './BlockList.vue';

const t = useT();
const ui = useUiStore(), program = useProgramStore(), exec = useExecutionStore(), custom = useCustomBlocksStore();

const selectedCount = computed(() => ui.selected.length);

function toggleSelectMode() {
  if (!exec.running) ui.setSelMode(!ui.selMode);
}

// Open the editor prefilled with the selected blocks; Save replaces them with the new block.
function makeBlock() {
  const hits = ui.selected.map(id => locate(program.blocks, id, 'main')).filter(Boolean).sort((a, b) => a.index - b.index);
  if (hits.length) custom.openEditor(null, hits.map(h => h.node), hits.map(h => h.node.id));
}
</script>

<template>
  <div v-show="!custom.draft" id="prog" class="card sch pc" :class="{ selmode: ui.selMode }">
    <div class="prow">
      <h2>{{ t('ui.prog') }}</h2>
      <button v-show="selectedCount" id="mkcb" class="mini" @click="makeBlock">{{ t('ui.make') }} ({{ selectedCount }})</button>
      <button id="selbtn" class="mini" @click="toggleSelectMode">{{ t(ui.selMode ? 'ui.done' : 'ui.select') }}</button>
    </div>
    <div id="scheme">
      <div class="cap start">{{ t('ui.start') }}</div>
      <BlockList id="main" :list="program.blocks" owner="main" />
      <div class="cap end">{{ t('ui.end') }}</div>
    </div>
  </div>
</template>
