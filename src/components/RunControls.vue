<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import { useProgramStore } from '../stores/program.ts';
import { useExecutionStore } from '../stores/execution.ts';

const t = useT();
const ui = useUiStore(), program = useProgramStore(), exec = useExecutionStore();

// Clear empties the program; it does not move the robot. Ignored while running.
function clearProgram() {
  if (exec.running) return;
  exec.end();
  program.clear();
  exec.clearMarks();
  ui.say(t('ms.cleared'));
}
</script>

<template>
  <div id="ctl">
    <button id="run" title="F5" :class="{ pause: exec.running }" @click="exec.toggleRun()">{{ t(exec.running ? 'ui.pause' : 'ui.run') }}</button>
    <button id="step" title="F6" @click="exec.stepOnce()">{{ t('ui.step') }}</button>
    <button id="stop" title="Esc" @click="exec.stop()">■</button>
    <button id="reset" @click="exec.resetLevel()">{{ t('ui.reset') }}</button>
    <button id="clr" @click="clearProgram">🗑</button>
  </div>
</template>
