import { defineStore } from 'pinia';
import { runList, createEnv, STEP_LIMIT } from '../logic/interpreter.js';
import { evaluate, conditionText, innermostSensor } from '../logic/conditions.js';
import { snapshot, ancestors } from '../logic/program.js';
import { defs } from '../blocks/index.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';
import { useWorldStore } from './world.js';
import { useInventoryStore } from './inventory.js';
import { useProgramStore } from './program.js';
import { useCustomBlocksStore } from './customBlocks.js';

export const BASE_INTERVAL = 450;   // ms per step at 1x
export const WIN_DELAY = 700;       // ms between reaching the exit and the win dialog
export const SPEEDS = [1, 3, 5, 15];

// The run in progress. Kept outside the store state: a generator is not data.
// {gen, res, n, program, env} from the first Run or Step until the run ends.
let session = null;
let timer = null;
let badgeSeq = 0;

export const useExecutionStore = defineStore('execution', {
  state: () => ({
    running: false,   // the timer is ticking
    active: false,    // a run exists (running, paused or being stepped)
    speed: 1,
    current: null,    // id of the block executing now (the pointer)
    ok: {},           // {[blockId]: true} blocks that executed
    err: {},          // {[blockId]: true} blocks that failed; wins over ok
    counts: {},       // {[blockId]: {text, key, duration}} rounds-left badges
    sonar: null,      // {t0, ok, dur} while the sonar animation plays
  }),
  actions: {
    // Begin a run unless one exists. False when there is nothing to run.
    start() {
      if (session) return true;
      const ui = useUiStore();
      ui.setSelMode(false);
      useWorldStore().reset();
      this.clearMarks();
      const program = snapshot(useProgramStore().blocks);
      if (!program.length) { ui.say(useSettingsStore().t('ms.empty')); return false; }
      const env = createEnv(defs, useCustomBlocksStore().blocks);
      session = { gen: runList(program, env), res: undefined, n: 0, program, env };
      this.active = true;
      return true;
    },

    // Execute one step.
    tick() {
      const ui = useUiStore(), settings = useSettingsStore(), world = useWorldStore();
      this.current = null;
      this.sonar = null;
      let r;
      try { r = session.gen.next(session.res); } catch (e) { this.end(settings.t('ms.toolong')); return; }
      if (r.done) { this.end(settings.t('ms.fin')); return; }
      const step = r.value;
      session.n++;
      session.res = undefined;
      let bad = false, ok = true, won = false;
      this.current = step.id;
      if (step.t === 'cond') {
        const value = evaluate(step.cond, defs, { world });
        if (value === null) { ui.say(settings.t('ms.nocond')); bad = true; ok = false; }
        else {
          session.res = value;
          this.ping(step.cond);
          ui.say(conditionText(step.cond, defs, settings.t) + '? ' + settings.t(value ? 'ui.yes' : 'ui.no'));
        }
      } else if (step.t === 'loop') {
        this.setCount(step.id, step.cnt);
      } else if (step.t === 'stuck') {
        ui.say(settings.t('ms.loopstuck')); bad = true; ok = false;
      } else {
        session.env.counters.actions++;
        const result = step.def.execute({
          world,
          slots: useInventoryStore().slots,
          node: step.node,
          say: (key, ...args) => ui.say(settings.t(key, ...args)),
        });
        ok = result.ok; bad = !!result.bad; won = !!result.won;
      }
      this.ok[step.id] = true;
      for (const id of ancestors(session.program, step.id)) this.ok[id] = true;
      if (bad) this.err[step.id] = true;
      if (!ok) {
        this.end();
        if (won) setTimeout(() => ui.openDialog('win'), WIN_DELAY);
      } else if (session.n > STEP_LIMIT) this.end(settings.t('ms.toolong'));
      else if (!this.running) ui.say(settings.t('ms.step', session.n));
    },

    // The Run / Pause button.
    toggleRun() {
      if (this.running) { this.pause(); return; }
      if (!this.start()) return;
      this.running = true;
      useUiStore().say(useSettingsStore().t('ms.run'));
      this.startTimer();
    },
    pause() {
      clearInterval(timer);
      this.running = false;
      useUiStore().say(useSettingsStore().t('ms.paused'));
    },
    stepOnce() {
      if (!this.running && this.start()) this.tick();
    },
    stop() {
      this.end(useSettingsStore().t('ms.stopped'));
    },
    resetLevel() {
      this.end();
      useWorldStore().reset();
      useUiStore().say(useSettingsStore().t('ms.reset'));
    },
    // End the run, leaving the world as it is.
    end(message) {
      this.running = false;
      clearInterval(timer);
      session = null;
      this.active = false;
      this.current = null;
      if (message) useUiStore().say(message);
    },
    // Drop a paused or stepped run without a message, as happens when a block is dragged.
    cancelSession() {
      if (!session) return;
      session = null;
      this.active = false;
      this.current = null;
    },

    setSpeed(speed) {
      this.speed = speed;
      if (this.running) { clearInterval(timer); this.startTimer(); }
    },
    startTimer() {
      timer = setInterval(() => this.tick(), BASE_INTERVAL / this.speed);
    },

    clearMarks() {
      this.ok = {};
      this.err = {};
      this.counts = {};
    },
    setCount(id, value) {
      this.counts[id] = {
        text: '⏳ ' + value,
        key: ++badgeSeq,   // a new key restarts the pop animation
        duration: Math.max(.1, Math.min(.45, 1.05 / this.speed)) + 's',
      };
    },
    // Start the sonar animation; its colour is what the sensor itself sees.
    ping(cond) {
      const sensor = innermostSensor(cond, defs);
      const def = sensor && defs[sensor.type];
      this.sonar = {
        t0: performance.now(),
        ok: def && def.evaluate ? !!def.evaluate({ world: useWorldStore() }) : false,
        dur: this.running ? Math.max(60, 380 / this.speed) : 700,
      };
    },
  },
});
