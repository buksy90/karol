<script setup lang="ts">
import { levelSize } from '../logic/levels.ts';
import { useUiStore } from '../stores/ui.ts';
import { useLevelsStore } from '../stores/levels.ts';

const ui = useUiStore(), levels = useLevelsStore();

function choose(id: string) {
  levels.load(id);
  ui.closeDialog();
}
</script>

<template>
  <button v-for="l in levels.levels" :key="l.id" class="lv" :class="{ cur: l.id === levels.current }" @click="choose(l.id)">{{ (l.id === levels.current ? '✓ ' : '') + l.name + '  (' + levelSize(l) + ')' }}</button>
</template>
