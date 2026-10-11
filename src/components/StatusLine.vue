<script setup>
import { useUiStore } from '../stores/ui.js';

const ui = useUiStore();
</script>

<template>
  <div id="msgc" class="card"><span id="msg" style="font-weight:700">{{ ui.status }}</span></div>
</template>
