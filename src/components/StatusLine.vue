<script setup lang="ts">
import { useUiStore } from '../stores/ui.ts';

const ui = useUiStore();
</script>

<template>
  <div id="msgc" class="card"><span id="msg" style="font-weight:700">{{ ui.status }}</span></div>
</template>
