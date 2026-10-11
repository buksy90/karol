<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { isCondition } from './blocks/index.js';
import { useDragDrop } from './composables/useDragDrop.js';
import { useShortcuts } from './composables/useShortcuts.js';
import { useUiStore } from './stores/ui.js';
import { useExecutionStore } from './stores/execution.js';
import { useCustomBlocksStore } from './stores/customBlocks.js';
import BlockLibrary from './components/BlockLibrary.vue';
import ProgramPanel from './components/ProgramPanel.vue';
import SpeedButtons from './components/SpeedButtons.vue';
import CustomBlockEditor from './components/CustomBlockEditor.vue';
import RunControls from './components/RunControls.vue';
import TopBar from './components/TopBar.vue';
import MapCanvas from './components/MapCanvas.vue';
import StatusLine from './components/StatusLine.vue';
import AppDialog from './components/AppDialog.vue';
import BlockItem from './components/BlockItem.vue';

const ui = useUiStore(), exec = useExecutionStore(), custom = useCustomBlocksStore();

useDragDrop();
useShortcuts();

// The styles for the remove area and the condition slots key off classes on <body>.
watch(() => ui.drag, drag => {
  document.body.classList.toggle('dragging', !!drag);
  document.body.classList.toggle('dragging-sensor', !!drag && isCondition(drag.node.type));
}, { flush: 'sync' });

// Typing into any field counts as changing the program: the marks of the last run go.
const onInput = () => exec.clearMarks();
onMounted(() => document.addEventListener('input', onInput));
onUnmounted(() => document.removeEventListener('input', onInput));
</script>

<template>
  <div id="app" :class="{ editing: !!custom.draft }">
    <div id="left">
      <BlockLibrary />
      <ProgramPanel />
      <SpeedButtons />
      <CustomBlockEditor />
      <RunControls />
    </div>
    <div id="right">
      <TopBar />
      <MapCanvas />
      <StatusLine />
    </div>
  </div>
  <AppDialog />
  <BlockItem v-if="ui.drag" :node="ui.drag.node" ghost :style="{ left: ui.drag.x + 'px', top: ui.drag.y + 'px', width: ui.drag.width + 'px' }" />
</template>
