<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useCustomBlocksStore } from '../stores/customBlocks.ts';
import BlockList from './BlockList.vue';

// Shown in place of the program panel while a custom block is created or edited.
const t = useT();
const custom = useCustomBlocksStore();
</script>

<template>
  <div v-if="custom.draft" id="editor" class="card sch pc">
    <h2>{{ t(custom.draft.id ? 'ui.editcb' : 'ui.newcb') }}</h2>
    <input id="fname" v-model="custom.draft.name" :placeholder="t('ui.name')" maxlength="20">
    <div id="fscheme">
      <div class="cap start">{{ t('ui.start') }}</div>
      <BlockList id="fn" :list="custom.draft.body" owner="draft" />
      <div class="cap end">{{ t('ui.end') }}</div>
    </div>
    <div id="erow">
      <button id="save" @click="custom.save()">{{ t('ui.save') }}</button>
      <button id="cancel" @click="custom.closeEditor()">{{ t('ui.cancel') }}</button>
    </div>
  </div>
</template>
