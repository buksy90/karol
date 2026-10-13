<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import { useWorldStore } from '../stores/world.ts';
import { useProgramStore } from '../stores/program.ts';
import { useLevelsStore } from '../stores/levels.ts';

const t = useT();
const ui = useUiStore(), world = useWorldStore(), program = useProgramStore(), levels = useLevelsStore();

// The next level comes with its own program; the one that solved this level stays saved here.
function nextLevel() {
  const next = levels.next;
  ui.closeDialog();
  levels.load(next!.id);
}
function stay() {
  ui.closeDialog();
  world.reset();
  ui.say(t('ms.ready'));
}
function restart() {
  ui.closeDialog();
  world.reset();
  program.clear();
  ui.clearSelection();
  ui.say(t('ms.ready'));
}
</script>

<template>
  <p style="font-size:18px;margin:0 0 12px">{{ t('ms.good') }}</p>
  <button v-if="levels.next" class="lv" @click="nextLevel">{{ t('ui.next') }}</button>
  <button class="lv" @click="stay">{{ t('ui.stay') }}</button>
  <button class="lv" @click="restart">{{ t('ui.restart') }}</button>
</template>
