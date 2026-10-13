<script setup lang="ts">
import { reactive } from 'vue';
import type { BlockDef, MessageKey, ProgramNode } from '../logic/types.ts';
import { libraryBlocks } from '../blocks/index.ts';
import { librarySensors } from '../sensors/index.ts';
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import type { LibrarySection } from '../stores/ui.ts';
import { useCustomBlocksStore } from '../stores/customBlocks.ts';
import { useExecutionStore } from '../stores/execution.ts';
import BlockItem from './BlockItem.vue';
import CustomBlockLibrary from './CustomBlockLibrary.vue';

const t = useT();
const ui = useUiStore(), custom = useCustomBlocksStore(), exec = useExecutionStore();

// Template blocks shown in the library. Dragging one creates a fresh block of that type.
const template = (def: BlockDef): ProgramNode => ({ id: 'lib-' + def.type, type: def.type, n: def.number && def.number.default, cond: null, children: [] });
const sensors = reactive(librarySensors.map(template));
const blocks = reactive(libraryBlocks.map(template));

const heading = (section: LibrarySection, key: MessageKey) => (ui.collapsed[section] ? '▶ ' : '▼ ') + t(key);
</script>

<template>
  <div id="libcard" class="card">
    <div class="sec">
      <h2 class="tog" @click="ui.toggleSection('sensors')">{{ heading('sensors', 'ui.sensors') }}</h2>
      <div v-show="!ui.collapsed.sensors" id="slib"><BlockItem v-for="node in sensors" :key="node.id" :node="node" library /></div>
    </div>
    <div class="sec">
      <h2 class="tog" @click="ui.toggleSection('blocks')">{{ heading('blocks', 'ui.blocks') }}</h2>
      <div v-show="!ui.collapsed.blocks" id="lib"><BlockItem v-for="node in blocks" :key="node.id" :node="node" library /></div>
    </div>
    <div class="sec">
      <h2 class="tog" @click="ui.toggleSection('custom')">{{ heading('custom', 'ui.custom') }}</h2>
      <div v-show="!ui.collapsed.custom">
        <button id="create" :disabled="exec.active" @click="custom.openEditor(null)">{{ t('ui.create') }}</button>
        <CustomBlockLibrary />
      </div>
    </div>
  </div>
</template>
