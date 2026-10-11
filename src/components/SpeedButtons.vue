<script setup lang="ts">
import { useT } from '../composables/useT.ts';
import { useExecutionStore, SPEEDS } from '../stores/execution.ts';

const t = useT();
const exec = useExecutionStore();
</script>

<template>
  <div id="spd"><span>{{ t('ui.speed') }}</span><button v-for="s in SPEEDS" :key="s" :class="{ on: exec.speed === s }" @click="exec.setSpeed(s)">{{ s }}x</button></div>
</template>
