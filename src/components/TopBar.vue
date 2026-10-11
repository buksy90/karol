<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import InventoryBar from './InventoryBar.vue';

const t = useT();
const ui = useUiStore();
</script>

<template>
  <div id="hud" class="card">
    <InventoryBar />
    <div id="hudbtns">
      <button id="lvbtn" class="mini" @click="ui.openDialog('lv')">{{ t('ui.levels') }}</button>
      <button id="spbtn" class="mini" @click="ui.openDialog('sp')">{{ t('ui.specs') }}</button>
      <button id="opbtn" class="mini" @click="ui.openDialog('op')">{{ t('ui.options') }}</button>
    </div>
  </div>
</template>
