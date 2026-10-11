<script setup lang="ts">
// The in-app description of the game. English only.
import specs from './specs-en.html?raw';
</script>

<template>
  <div v-html="specs"></div>
</template>
