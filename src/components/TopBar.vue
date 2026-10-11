<script setup>
import { useT } from '../composables/useT.js';
import { useUiStore } from '../stores/ui.js';
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
