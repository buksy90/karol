<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useT } from '../composables/useT.ts';
import { useUiStore } from '../stores/ui.ts';
import { useWorldStore } from '../stores/world.ts';
import { useExecutionStore } from '../stores/execution.ts';

// The live map: tiles, paint, flag targets, sprays, crates, the robot and the sonar, redrawn every frame.
// While a block is dragged, the remove area covers it.
const t = useT();
const ui = useUiStore(), world = useWorldStore(), exec = useExecutionStore();

const canvas = ref<HTMLCanvasElement | null>(null);

// Two floor shades per room, cycled over the rooms.
const PALETTE = [['#d6ecff', '#c4e2ff'], ['#fff1c9', '#ffe8a8'], ['#d9f7e2', '#c6f0d3'], ['#ffe3f0', '#ffd0e6'], ['#eadfff', '#dccbff']];

// Where the robot is drawn; eases toward the world state so moves and turns glide.
let rx = 1, ry = 1, ra = 90;
let frameId = 0;

// A reset puts the robot at its start at once, without gliding there.
watch(() => world.resets, () => { rx = world.robot.x; ry = world.robot.y; ra = world.angle; }, { immediate: true });

function floorColor(x: number, y: number) {
  const id = world.roomMap[y][x];
  return id < 0 ? '#e9e4d6' : PALETTE[id % 5][(x + y) % 2];
}

// A spray can in its colour, centred on cx,cy in a cell of size s.
function drawSpray(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  const w = s * .34, h = s * .46, top = cy - h / 2 + s * .08;
  ctx.fillStyle = '#9aa0b5'; ctx.fillRect(cx - w * .22, top - s * .12, w * .44, s * .13);
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(cx - w / 2, top, w, h, s * .06); ctx.fill();
  ctx.strokeStyle = '#33364d'; ctx.lineWidth = Math.max(1, s * .03); ctx.stroke();
}

function frame() {
  frameId = requestAnimationFrame(frame);
  const cv = canvas.value;
  if (!cv || !world.rows) return;
  const ctx = cv.getContext('2d')!;
  const COLS = world.cols, ROWS = world.rows, grid = world.grid, R = world.robot;
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#4a4e8a'; ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / COLS, h / ROWS), ox = (w - s * COLS) / 2, oy0 = (h - s * ROWS) / 2;
  ctx.translate(ox, oy0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = (s * .7) + 'px serif';
  // the colour each flag cell has to get
  const targets = new Map<string, string>();
  for (const flag of world.flags) flag.colors.forEach((row, j) => row.forEach((color, i) => targets.set((flag.position[0] + i) + ',' + (flag.position[1] + j), color)));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const c = grid[y][x], px = x * s, py = y * s, here = x + ',' + y;
    if (c === 'W') {
      ctx.fillStyle = '#7a5c9e'; ctx.fillRect(px, py, s, s); ctx.fillStyle = '#9a7cc0'; ctx.fillRect(px, py, s, s * .45);
      ctx.strokeStyle = '#5e4580'; ctx.lineWidth = 1; ctx.strokeRect(px + .5, py + .5, s - 1, s - 1); continue;
    }
    const paint = world.paint.get(here);
    ctx.fillStyle = paint || floorColor(x, y); ctx.fillRect(px, py, s, s);
    // an outline keeps white and yellow paint apart from the pale floors
    if (paint) { ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.strokeRect(px + .5, py + .5, s - 1, s - 1); }
    if (c === 'D' || c === 'O') { ctx.fillStyle = '#c98f4f'; ctx.fillRect(px + s * .1, py, s * .8, s); ctx.fillStyle = '#e8b57a'; ctx.fillRect(px + s * .2, py + s * .1, s * .6, s * .8); }
    if (c === 'L') { ctx.fillStyle = '#d94b4b'; ctx.fillRect(px, py, s, s); ctx.fillStyle = '#fff'; ctx.fillText(world.flagDoors.has(here) ? '🎨' : '🔒', px + s / 2, py + s / 2); }
    if (c === 'k') ctx.fillText('🔑', px + s / 2, py + s / 2);
    if (c === 'e') { ctx.fillStyle = '#7ee0a0'; ctx.fillRect(px, py, s, s); ctx.fillText('🏁', px + s / 2, py + s / 2); }
    // a flag cell that does not have its colour yet shows a dot in that colour
    const target = targets.get(here);
    if (target && target !== paint) {
      ctx.fillStyle = target; ctx.beginPath(); ctx.arc(px + s / 2, py + s / 2, s * .17, 0, 7); ctx.fill();
      ctx.strokeStyle = '#33364d'; ctx.lineWidth = Math.max(1, s * .03); ctx.stroke();
    }
    const spray = world.sprays.get(here);
    if (spray) drawSpray(ctx, px + s / 2, py + s / 2, s, spray.color);
  }
  world.boxes.forEach(b => {
    const [x, y] = b.split(',').map(Number), p = s * .1;
    ctx.fillStyle = '#b9772f'; ctx.fillRect(x * s + p, y * s + p, s - 2 * p, s - 2 * p); ctx.strokeStyle = '#7a4a16'; ctx.lineWidth = Math.max(2, s * .08);
    ctx.strokeRect(x * s + p, y * s + p, s - 2 * p, s - 2 * p); ctx.beginPath(); ctx.moveTo(x * s + p, y * s + p); ctx.lineTo(x * s + s - p, y * s + s - p); ctx.moveTo(x * s + s - p, y * s + p); ctx.lineTo(x * s + p, y * s + s - p); ctx.stroke();
  });
  const k = 1 - Math.pow(.75, exec.speed); rx += (R.x - rx) * k; ry += (R.y - ry) * k; ra += (world.angle - ra) * k;
  ctx.save(); ctx.translate((rx + .5) * s, (ry + .5) * s); ctx.rotate(ra * Math.PI / 180);
  const u = s / 10; ctx.fillStyle = '#1d6fe0'; ctx.beginPath(); ctx.roundRect(-3.6 * u, -3.6 * u, 7.2 * u, 7.2 * u, 2 * u); ctx.fill();
  ctx.fillStyle = '#8fc1ff'; ctx.beginPath(); ctx.roundRect(-2.6 * u, -3 * u, 5.2 * u, 3.4 * u, u); ctx.fill();
  ctx.fillStyle = '#fff'; [-1.2, 1.2].forEach(e => { ctx.beginPath(); ctx.arc(e * u, -1.5 * u, .8 * u, 0, 7); ctx.fill(); });
  ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(0, -4.9 * u); ctx.lineTo(1.4 * u, -3.6 * u); ctx.lineTo(-1.4 * u, -3.6 * u); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(-2 * u, 1 * u, 4 * u, 1.2 * u);
  const sonar = exec.sonar;
  if (sonar) {
    const time = performance.now() - sonar.t0, tot = sonar.dur;
    if (time <= tot) {
      // drawn in the robot's rotated frame: a fading fan, three expanding arcs, a ring on the cell ahead
      const col = sonar.ok ? '80,220,120' : '255,90,90', oy = -3.6 * u, L = s * 1.15, half = .62, fade = 1 - time / tot;
      ctx.save(); ctx.lineCap = 'round';
      const g = ctx.createRadialGradient(0, oy, 0, 0, oy, L); g.addColorStop(0, 'rgba(' + col + ',.35)'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.globalAlpha = fade; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, oy); ctx.arc(0, oy, L, -Math.PI / 2 - half, -Math.PI / 2 + half); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const p = (time - i * .18 * sonar.dur) / (.6 * sonar.dur); if (p <= 0 || p >= 1) continue;
        ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.lineWidth = Math.max(2, s * .06);
        ctx.beginPath(); ctx.arc(0, oy, p * L, -Math.PI / 2 - half, -Math.PI / 2 + half); ctx.stroke();
      }
      const q = (time - .45 * sonar.dur) / (.55 * sonar.dur);
      if (q > 0 && q < 1) {
        ctx.globalAlpha = 1 - q; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.lineWidth = Math.max(2, s * .07);
        ctx.beginPath(); ctx.arc(0, -s, s * (.15 + .35 * q), 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(' + col + ',.4)'; ctx.beginPath(); ctx.arc(0, -s, s * .05 + s * .15 * (1 - q), 0, 7); ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

onMounted(() => { frame(); });
onUnmounted(() => cancelAnimationFrame(frameId));
</script>

<template>
  <div id="stage">
    <canvas id="cv" ref="canvas"></canvas>
    <div id="trash" :class="{ hot: ui.drag && ui.drag.trash }"><span>{{ t('ui.trash') }}</span></div>
  </div>
</template>
