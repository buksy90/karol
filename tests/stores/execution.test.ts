import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STEP_LIMIT } from '../../src/logic/interpreter.ts';
import { BASE_INTERVAL, SPEEDS, useExecutionStore, WIN_DELAY } from '../../src/stores/execution.ts';
import { useSettingsStore } from '../../src/stores/settings.ts';
import { useUiStore } from '../../src/stores/ui.ts';
import { useWorldStore } from '../../src/stores/world.ts';
import { call, canGo, loopWhile, move, not, repeat, turn, use, when } from '../helpers/program.ts';
import { addCustom, loadMap, play, robotAt, run, setProgram, setupStores, step, t, teardownStores } from '../helpers/stores.ts';

beforeEach(() => { setupStores(); });
afterEach(teardownStores);

const corridor = () => loadMap('WWWWWWWW', 'WK     W', 'WWWWWWWW');
/** Let the run timer fire this many times. */
function tick(times = 1): void {
  for (let i = 0; i < times; i++) vi.advanceTimersByTime(BASE_INTERVAL / useExecutionStore().speed);
}
const status = () => useUiStore().status;

describe('program-execution: Execution order and steps', () => {
  it('Top to bottom', () => {
    loadMap('WWW', 'W W', 'WKW', 'WWW');
    play(turn(), move());
    // turning first is what makes the move possible
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 0 });
    expect(useExecutionStore().err).toEqual({});
  });

  it('counts an action, a condition check and a round start as one step each', () => {
    corridor();
    // round start, check, move, round end; then the press that finds the program finished
    const said = play(repeat(1, when(canGo(), move())));
    expect(said).toEqual([t('ms.step', 1), t('ms.step', 2), t('ms.step', 3), t('ms.step', 4), t('ms.fin')]);
  });
});

describe('program-execution: Run', () => {
  it('Run from a previous end state', () => {
    corridor();
    const first = move();
    play(first, move());
    expect(robotAt()).toBe('3,1');
    const execution = useExecutionStore();
    execution.toggleRun();
    expect(robotAt()).toBe('1,1');
    expect(execution.ok).toEqual({});
    expect(status()).toBe(t('ms.run'));
    expect(execution.running).toBe(true);
    expect(execution.active).toBe(true);
    tick();
    expect(robotAt()).toBe('2,1');
    expect(execution.ok).toEqual({ [first.id]: true });
  });

  it('Empty program', () => {
    corridor();
    const execution = useExecutionStore();
    execution.toggleRun();
    expect(status()).toBe(t('ms.empty'));
    expect([execution.running, execution.active]).toEqual([false, false]);
    useUiStore().say('');
    execution.stepOnce();
    expect(status()).toBe(t('ms.empty'));
    expect([execution.running, execution.active]).toEqual([false, false]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('executes one step per interval', () => {
    corridor();
    setProgram(move(), move());
    useExecutionStore().toggleRun();
    vi.advanceTimersByTime(BASE_INTERVAL - 1);
    expect(robotAt()).toBe('1,1');
    vi.advanceTimersByTime(1);
    expect(robotAt()).toBe('2,1');
    vi.advanceTimersByTime(BASE_INTERVAL);
    expect(robotAt()).toBe('3,1');
  });

  it('executes a copy, so the program can change without reaching the run', () => {
    corridor();
    setProgram(move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    setProgram(turn());
    tick(2);
    expect(robotAt()).toBe('3,1');
  });

  it('stops its timer when the program finishes', () => {
    corridor();
    run(move());
    expect(useExecutionStore().running).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('program-execution: Pause and resume', () => {
  it('Pause and resume', () => {
    corridor();
    setProgram(move(), move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    execution.toggleRun();
    expect([execution.running, execution.active]).toEqual([false, true]);
    expect(status()).toBe(t('ms.paused'));
    vi.advanceTimersByTime(10 * BASE_INTERVAL);
    expect(robotAt()).toBe('2,1');
    execution.toggleRun();
    expect(execution.running).toBe(true);
    expect(status()).toBe(t('ms.run'));
    expect(robotAt()).toBe('2,1');
    tick();
    expect(robotAt()).toBe('3,1');
  });
});

describe('program-execution: Step', () => {
  it('First step', () => {
    corridor();
    play(move(), move());
    expect(robotAt()).toBe('3,1');
    expect(step()).toBe(t('ms.step', 1));
    expect(robotAt()).toBe('2,1');
    expect(useExecutionStore().active).toBe(true);
    expect(useExecutionStore().running).toBe(false);
  });

  it('Step message replaces the block\'s message', () => {
    loadMap('WWWWW', 'WKk W', 'WWWWW');
    setProgram(move(), move());
    expect(step()).toBe(t('ms.step', 1));
    expect(useWorldStore().grid[1][2]).not.toBe('k');
  });

  it('Step that ends the run', () => {
    loadMap('WWW', 'WKW', 'WWW');
    setProgram(move());
    expect(step()).toBe(t('ms.wall'));
    expect(useExecutionStore().active).toBe(false);
  });

  it('Step then Run', () => {
    corridor();
    setProgram(move(), move(), move(), move());
    step();
    step();
    const execution = useExecutionStore();
    execution.toggleRun();
    expect(robotAt()).toBe('3,1');
    tick();
    expect(robotAt()).toBe('4,1');
    tick();
    expect(robotAt()).toBe('5,1');
  });

  it('is ignored while the program runs automatically', () => {
    corridor();
    setProgram(move(), move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    execution.stepOnce();
    expect(robotAt()).toBe('2,1');
    expect(status()).toBe(t('ms.run'));
  });

  it('counts the steps of a paused run on from where it was', () => {
    corridor();
    setProgram(move(), move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick(2);
    execution.pause();
    expect(step()).toBe(t('ms.step', 3));
  });
});

describe('program-execution: Stop, Reset and finishing', () => {
  it('Stop', () => {
    corridor();
    const first = move();
    setProgram(first, move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick(2);
    execution.stop();
    expect(status()).toBe(t('ms.stopped'));
    expect(robotAt()).toBe('3,1');
    expect([execution.running, execution.active]).toEqual([false, false]);
    vi.advanceTimersByTime(10 * BASE_INTERVAL);
    expect(robotAt()).toBe('3,1');
    execution.toggleRun();
    expect(robotAt()).toBe('1,1');
    tick();
    expect(execution.current).toBe(first.id);
    expect(robotAt()).toBe('2,1');
  });

  it('Reset', () => {
    loadMap('WWWWWW', 'WKb  W', 'WWWWWW');
    play(move());
    const world = useWorldStore(), execution = useExecutionStore();
    expect([...world.boxes]).toEqual(['3,1']);
    execution.resetLevel();
    expect([...world.boxes]).toEqual(['2,1']);
    expect(robotAt()).toBe('1,1');
    expect(status()).toBe(t('ms.reset'));
  });

  it('Program ends without reaching the exit', () => {
    corridor();
    expect(run(move()).at(-1)).toBe(t('ms.fin'));
    expect(useUiStore().dialog).toBeNull();
  });

  it('Reset ends a run in progress', () => {
    corridor();
    setProgram(move(), move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    execution.resetLevel();
    expect([execution.running, execution.active, execution.current]).toEqual([false, false, null]);
    vi.advanceTimersByTime(10 * BASE_INTERVAL);
    expect(robotAt()).toBe('1,1');
  });
});

describe('program-execution: Stopping on a failed block', () => {
  it('Fatal failure', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const failing = move(), never = turn();
    run(failing, never);
    const execution = useExecutionStore();
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[never.id]).toBeUndefined();
    expect(useWorldStore().robot).toEqual({ x: 1, y: 1, d: 1 });
    expect(execution.active).toBe(false);
  });

  it('Non-fatal failure', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const failing = use(1), after = turn();
    run(failing, after);
    const execution = useExecutionStore();
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[after.id]).toBe(true);
    expect(useWorldStore().robot.d).toBe(0);
  });

  it('leaves the robot where it failed', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    run(move(), move(), move());
    expect(robotAt()).toBe('3,1');
  });
});

describe('program-execution: Speed', () => {
  it('Default speed', () => {
    expect(useExecutionStore().speed).toBe(1);
    expect(SPEEDS).toEqual([1, 3, 5, 15]);
    expect(BASE_INTERVAL).toBe(450);
  });

  it('Changing speed during a run', () => {
    corridor();
    setProgram(move(), move(), move(), move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    expect(robotAt()).toBe('2,1');
    execution.setSpeed(5);
    vi.advanceTimersByTime(89);
    expect(robotAt()).toBe('2,1');
    vi.advanceTimersByTime(1);
    expect(robotAt()).toBe('3,1');
    vi.advanceTimersByTime(90);
    expect(robotAt()).toBe('4,1');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('steps 450 ms divided by the speed apart', () => {
    for (const speed of SPEEDS) {
      corridor();
      setProgram(move(), move());
      const execution = useExecutionStore();
      execution.setSpeed(speed);
      execution.toggleRun();
      vi.advanceTimersByTime(450 / speed - 1);
      expect(robotAt()).toBe('1,1');
      vi.advanceTimersByTime(1);
      expect(robotAt()).toBe('2,1');
      execution.stop();
    }
  });

  it('does not start anything when changed with no program running', () => {
    corridor();
    setProgram(move());
    useExecutionStore().setSpeed(15);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(robotAt()).toBe('1,1');
  });
});

describe('program-execution: Execution pointer', () => {
  it('Pointer inside a loop', () => {
    corridor();
    const a = turn(), b = turn();
    const loop = repeat(2, a, b);
    setProgram(loop);
    const execution = useExecutionStore();
    const seen: (string | null)[] = [];
    for (let i = 0; i < 7; i++) { step(); seen.push(execution.current); }
    expect(seen).toEqual([loop.id, a.id, b.id, loop.id, a.id, b.id, loop.id]);
  });

  it('Pointer while paused', () => {
    corridor();
    const first = move(), second = move();
    setProgram(first, second, move());
    const execution = useExecutionStore();
    execution.toggleRun();
    tick(2);
    execution.pause();
    expect(execution.current).toBe(second.id);
  });

  it('is removed when the run ends', () => {
    corridor();
    const execution = useExecutionStore();
    run(move());
    expect(execution.current).toBeNull();
    setProgram(move(), move());
    step();
    expect(execution.current).not.toBeNull();
    execution.stop();
    expect(execution.current).toBeNull();
    loadMap('WWW', 'WKW', 'WWW');
    run(move());
    expect(execution.current).toBeNull();
  });
});

describe('program-execution: Status dots', () => {
  it('Partly executed program', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    const first = move(), second = move(), third = move();
    run(first, second, third);
    const execution = useExecutionStore();
    expect(execution.ok[first.id]).toBe(true);
    expect(execution.err[first.id]).toBeUndefined();
    expect(execution.err[second.id]).toBe(true);
    expect(execution.ok[third.id]).toBeUndefined();
    expect(execution.err[third.id]).toBeUndefined();
  });

  it('Container marked', () => {
    corridor();
    const inner = move();
    const middle = when(canGo(), inner);
    const outer = repeat(1, middle);
    run(outer);
    expect(useExecutionStore().ok).toEqual({ [outer.id]: true, [middle.id]: true, [inner.id]: true });
  });

  it('stay after the run ends', () => {
    corridor();
    const only = move();
    run(only);
    vi.advanceTimersByTime(60_000);
    expect(useExecutionStore().ok).toEqual({ [only.id]: true });
  });

  it('marks the containers around a failed block as executed, not as failed', () => {
    loadMap('WWW', 'WKW', 'WWW');
    const failing = move();
    const loop = repeat(2, failing);
    run(loop);
    const execution = useExecutionStore();
    expect(execution.err).toEqual({ [failing.id]: true });
    expect(execution.ok[loop.id]).toBe(true);
  });
});

describe('program-execution: Clearing marks', () => {
  // "Editing a number" happens in the editor, which calls clearMarks on every change.
  it('clearMarks removes all dots and badges', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    run(repeat(3, move()));
    const execution = useExecutionStore();
    expect(Object.keys(execution.ok)).not.toHaveLength(0);
    expect(Object.keys(execution.err)).not.toHaveLength(0);
    expect(Object.keys(execution.counts)).not.toHaveLength(0);
    execution.clearMarks();
    expect([execution.ok, execution.err, execution.counts]).toEqual([{}, {}, {}]);
  });

  it('a new run starts without the marks of the previous one', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    run(repeat(3, move()));
    const execution = useExecutionStore();
    execution.toggleRun();
    expect([execution.ok, execution.err, execution.counts]).toEqual([{}, {}, {}]);
    execution.stop();
    execution.stepOnce();
    expect(execution.err).toEqual({});
  });
});

describe('program-execution: Safety limits', () => {
  it('Endless visible loop', () => {
    corridor();
    const said = run(loopWhile(canGo(), turn(), turn(), turn(), turn()));
    expect(said.at(-1)).toBe(t('ms.toolong'));
    // "Running…", then the steps: the run ends on the step that exceeds the limit
    expect(said).toHaveLength(1 + STEP_LIMIT + 1);
    expect(STEP_LIMIT).toBe(5000);
    expect(useExecutionStore().active).toBe(false);
    expect(useExecutionStore().err).toEqual({});
  });

  it('ends a run whose loops start too many rounds, also inside a custom block', () => {
    corridor();
    const busy = call(addCustom('Busy', repeat(99, repeat(99, repeat(99)))));
    expect(run(busy, move())).toEqual([t('ms.run'), t('ms.toolong')]);
    expect(useExecutionStore().active).toBe(false);
    expect(robotAt()).toBe('1,1');
  });
});

describe('the win dialog', () => {
  it('opens about 0.7 seconds after the robot reaches the exit', () => {
    loadMap('WWWW', 'WKeW', 'WWWW');
    run(move());
    const ui = useUiStore();
    expect(WIN_DELAY).toBe(700);
    vi.advanceTimersByTime(WIN_DELAY - 1);
    expect(ui.dialog).toBeNull();
    vi.advanceTimersByTime(1);
    expect(ui.dialog).toBe('win');
  });

  it('does not open for a run that ends any other way', () => {
    loadMap('WWWW', 'WK W', 'WWWW');
    run(move(), move());
    vi.advanceTimersByTime(10 * WIN_DELAY);
    expect(useUiStore().dialog).toBeNull();
  });
});

describe('select mode and a run', () => {
  it('a run that starts ends select mode', () => {
    corridor();
    const first = move();
    setProgram(first);
    const ui = useUiStore();
    ui.setSelMode(true);
    ui.toggleSelected(first.id);
    useExecutionStore().toggleRun();
    expect(ui.selMode).toBe(false);
    expect(ui.selected).toEqual([]);
  });
});

describe('conditions: A check is a step', () => {
  it('Status text for a sensor', () => {
    corridor();
    const block = when(canGo(), move());
    setProgram(block);
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    expect(execution.current).toBe(block.id);
    expect(status()).toBe('Can go forward? yes');
    expect(robotAt()).toBe('1,1');
  });

  it('Status text with Not', () => {
    corridor();
    setProgram(loopWhile(not(canGo()), turn()));
    useExecutionStore().toggleRun();
    tick();
    expect(status()).toBe('Not(Can go forward)? no');
  });

  it('Check in single-step mode', () => {
    corridor();
    const block = when(canGo(), move());
    setProgram(block);
    expect(step()).toBe(t('ms.step', 1));
    expect(useExecutionStore().current).toBe(block.id);
  });

  it('Check inside a custom block', () => {
    corridor();
    const use1 = call(addCustom('Careful step', when(canGo(), move())));
    setProgram(use1);
    const execution = useExecutionStore();
    execution.toggleRun();
    tick();
    expect(execution.current).toBe(use1.id);
    expect(status()).toBe('Can go forward? yes');
  });

  it('shows the check in the interface language', () => {
    loadMap('WWW', 'WKW', 'WWW');
    useSettingsStore().setLanguage('sk');
    setProgram(when(not(canGo()), turn()), when(canGo(), turn()));
    useExecutionStore().toggleRun();
    tick();
    expect(status()).toBe('Nie(Môžem ísť dopredu)? áno');
    tick(2);
    expect(status()).toBe('Môžem ísť dopredu? nie');
  });
});

describe('conditions: Live state', () => {
  it('Loop re-checks every round', () => {
    loadMap('WWWWW', 'WK  W', 'WWWWW');
    const said = run(loopWhile(canGo(), move()));
    const checks = said.filter((text, i) => i % 2 === 1);
    expect(checks).toEqual(['Can go forward? yes', 'Can go forward? yes', 'Can go forward? no']);
    expect(robotAt()).toBe('3,1');
  });
});

describe('conditions: Empty condition is an error', () => {
  it('Empty slot at run time', () => {
    corridor();
    const loop = loopWhile(null, move());
    const said = run(loop);
    const execution = useExecutionStore();
    expect(said).toEqual([t('ms.run'), t('ms.nocond')]);
    expect(execution.err).toEqual({ [loop.id]: true });
    expect(execution.active).toBe(false);
    expect(execution.sonar).toBeNull();
  });

  it('ends a stepped run with the same message', () => {
    corridor();
    setProgram(when(not(), move()));
    expect(step()).toBe(t('ms.nocond'));
    expect(useExecutionStore().active).toBe(false);
  });
});

describe('conditions: Sonar animation', () => {
  it('Free cell', () => {
    corridor();
    setProgram(when(canGo(), move()));
    step();
    expect(useExecutionStore().sonar).toMatchObject({ ok: true });
  });

  it('Colour inside Not', () => {
    corridor();
    const inside = move();
    setProgram(when(not(canGo()), inside), turn());
    const execution = useExecutionStore();
    step();
    expect(execution.sonar).toMatchObject({ ok: true });
    // the condition itself was false: the next step is the block after the If
    step();
    expect(execution.ok[inside.id]).toBeUndefined();
  });

  it('is red when the sensor is false', () => {
    loadMap('WWW', 'WKW', 'WWW');
    setProgram(when(not(canGo()), turn()));
    step();
    expect(useExecutionStore().sonar).toMatchObject({ ok: false });
  });

  it('plays only on a condition check', () => {
    corridor();
    setProgram(move(), repeat(1, turn()));
    const execution = useExecutionStore();
    for (let i = 0; i < 4; i++) { step(); expect(execution.sonar).toBeNull(); }
  });
});

describe('conditions: Sonar duration', () => {
  /** Run an If at this speed up to its check. */
  function checkAt(speed: number) {
    corridor();
    setProgram(when(canGo(), move()), move());
    const execution = useExecutionStore();
    execution.setSpeed(speed);
    execution.toggleRun();
    tick();
    return execution;
  }

  it('Running at 1x', () => {
    const execution = checkAt(1);
    expect(execution.sonar!.dur).toBe(380);
    // over before the next step, which comes 450 ms after the check
    expect(execution.sonar!.dur).toBeLessThan(BASE_INTERVAL / 1);
  });

  it('Running at 15x', () => {
    const execution = checkAt(15);
    // 380 / 15 would be 25 ms; the shortest is 60 ms, longer than the 30 ms to the next step
    expect(execution.sonar!.dur).toBe(60);
    expect(execution.sonar!.dur).toBeGreaterThan(BASE_INTERVAL / 15);
    tick();
    expect(execution.sonar).toBeNull();
  });

  it('Single step', () => {
    corridor();
    setProgram(when(canGo(), move()));
    step();
    expect(useExecutionStore().sonar!.dur).toBe(700);
  });

  it('lasts 380 ms divided by the speed in between', () => {
    expect(checkAt(3).sonar!.dur).toBeCloseTo(380 / 3);
    useExecutionStore().stop();
    expect(checkAt(5).sonar!.dur).toBe(76);
  });

  it('records when it started', () => {
    corridor();
    setProgram(when(canGo(), move()));
    step();
    expect(useExecutionStore().sonar!.t0).toBe(performance.now());
  });
});
