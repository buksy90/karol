import { useSettingsStore } from '../stores/settings.ts';

// Short synthesized sounds for adding, moving and deleting a block.
let actx: AudioContext | null = null;

/** Browsers only allow audio after a user gesture, so this is called on pointer down. */
export function ensureAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
  if (actx && actx.state === 'suspended') actx.resume();
}

function tone(f1: number, f2: number, d: number, type: OscillatorType, v: number) {
  const ctx = actx!;
  const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
  o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + d);
}

export function playSound(kind: 'add' | 'move' | 'del') {
  if (!useSettingsStore().sound || !actx) return;
  try {
    if (kind === 'add') tone(520, 880, .14, 'sine', .22);
    else if (kind === 'move') tone(420, 560, .09, 'triangle', .22);
    else tone(420, 60, .3, 'sawtooth', .12);
  } catch (e) { /* ignore */ }
}
