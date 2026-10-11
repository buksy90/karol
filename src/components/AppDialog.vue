<script setup>
import { computed } from 'vue';
import { useT } from '../composables/useT.js';
import { useUiStore } from '../stores/ui.js';
import LevelsDialog from './LevelsDialog.vue';
import OptionsDialog from './OptionsDialog.vue';
import SpecsDialog from './SpecsDialog.vue';
import WinDialog from './WinDialog.vue';

// The one dialog frame; its content depends on which dialog is open.
const TITLES = { lv: 'ui.levels', sp: 'ui.specs', op: 'ui.options', win: 'ui.good' };

const t = useT();
const ui = useUiStore();
const title = computed(() => (ui.dialog ? t(TITLES[ui.dialog]) : ''));
</script>

<template>
  <div id="modal" :style="{ display: ui.dialog ? 'flex' : 'none' }" @click.self="ui.closeDialog()">
    <div id="mbox">
      <div id="mhead"><h2 id="mtitle">{{ title }}</h2><button id="mclose" class="mini" @click="ui.closeDialog()">{{ t('ui.close') }}</button></div>
      <div id="mbody">
        <LevelsDialog v-if="ui.dialog === 'lv'" />
        <SpecsDialog v-else-if="ui.dialog === 'sp'" />
        <OptionsDialog v-else-if="ui.dialog === 'op'" />
        <WinDialog v-else-if="ui.dialog === 'win'" />
      </div>
    </div>
  </div>
</template>
