<script setup>
import { levelSize } from '../logic/levels.js';
import { useUiStore } from '../stores/ui.js';
import { useLevelsStore } from '../stores/levels.js';

const ui = useUiStore(), levels = useLevelsStore();

function choose(id) {
  levels.load(id);
  ui.closeDialog();
}
</script>

<template>
  <button v-for="l in levels.levels" :key="l.id" class="lv" :class="{ cur: l.id === levels.current }" @click="choose(l.id)">{{ (l.id === levels.current ? '✓ ' : '') + l.name + '  (' + levelSize(l) + ')' }}</button>
</template>
