<script setup>
import { useT } from '../composables/useT.js';
import { ensureAudio, playSound } from '../composables/useSounds.js';
import { useSettingsStore, LANGUAGES } from '../stores/settings.js';

const t = useT();
const settings = useSettingsStore();

function toggleSound() {
  settings.toggleSound();
  if (settings.sound) { ensureAudio(); playSound('add'); }   // a sample, so the player hears it is on
}
</script>

<template>
  <h3 style="margin-top:0">{{ t('ui.lang') }}</h3>
  <button v-for="[code, name] in LANGUAGES" :key="code" class="lv" :class="{ cur: code === settings.lang }" @click="settings.setLanguage(code)">{{ (code === settings.lang ? '✓ ' : '') + name }}</button>
  <h3>{{ t('ui.sound') }}</h3>
  <button class="lv" @click="toggleSound">🔊 {{ t('ui.sound') }}: {{ t(settings.sound ? 'ui.on' : 'ui.off') }}</button>
</template>
