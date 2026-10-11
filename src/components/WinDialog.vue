<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import { useWorldStore } from '../stores/world.ts';
import { useProgramStore } from '../stores/program.ts';
import { useExecutionStore } from '../stores/execution.ts';
import { useLevelsStore } from '../stores/levels.ts';

const t = useT();
const ui = useUiStore(), world = useWorldStore(), program = useProgramStore(), exec = useExecutionStore(), levels = useLevelsStore();

function clearProgram() {
  program.clear();
  exec.clearMarks();
  ui.clearSelection();
}

function nextLevel() {
  const next = levels.next;
  ui.closeDialog();
  levels.load(next!.id);
  clearProgram();
}
function stay() {
  ui.closeDialog();
  world.reset();
  ui.say(t('ms.ready'));
}
function restart() {
  ui.closeDialog();
  world.reset();
  clearProgram();
  ui.say(t('ms.ready'));
}
</script>

<template>
  <p style="font-size:18px;margin:0 0 12px">{{ t('ms.good') }}</p>
  <button v-if="levels.next" class="lv" @click="nextLevel">{{ t('ui.next') }}</button>
  <button class="lv" @click="stay">{{ t('ui.stay') }}</button>
  <button class="lv" @click="restart">{{ t('ui.restart') }}</button>
</template>
