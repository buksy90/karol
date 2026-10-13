import { onMounted, onUnmounted, nextTick } from 'vue';
import { createNode, locate, findNode } from '../logic/program.ts';
import type { ProgramNode } from '../logic/types.ts';
import { defs, isCondition } from '../blocks/index.ts';
import { useUiStore } from '../stores/ui.ts';
import { useExecutionStore } from '../stores/execution.ts';
import { useProgramStore } from '../stores/program.ts';
import { useSettingsStore } from '../stores/settings.ts';
import { ensureAudio, playSound } from './useSounds.ts';

/** `ui.drag` while a block is dragged. */
export interface DragState {
  /** the block being dragged (a new one from the library, or one lifted out of the program) */
  node: ProgramNode;
  /** true for a library copy */
  fromLib: boolean;
  /** true for condition blocks, which fit only condition slots */
  isCond: boolean;
  /** where a lifted block came from: a position in a list, or the block whose condition slot held it */
  home: { kind: 'list'; owner: string; index: number } | { kind: 'cond'; owner: string } | null;
  /** the list position the placeholder shows; kept until it changes */
  target: { owner: string; index: number } | null;
  /** id of the block whose condition slot is under the pointer */
  cond: string | null;
  /** the pointer is over the remove area */
  trash: boolean;
  /** where on the block it was grabbed */
  ox: number;
  oy: number;
  /** where the floating copy is drawn */
  x: number;
  y: number;
  width: number;
}

/** Drag and drop of blocks with pointer events (mouse and touch). */
export function useDragDrop() {
  const ui = useUiStore(), exec = useExecutionStore(), program = useProgramStore(), settings = useSettingsStore();

  function onDown(e: PointerEvent) {
    ensureAudio();
    const from = e.target as HTMLElement;
    const el = from.closest<HTMLElement>('.block');
    if (!el || from.tagName === 'INPUT' || from.classList.contains('list')) return;
    // nothing can be edited from the first Run or Step until the run has ended
    if (exec.active) { ui.say(settings.t('ms.editlock')); return; }
    if (ui.selMode && el.closest('#prog')) {
      if (!el.classList.contains('sensor')) ui.toggleSelected(el.dataset.id!);
      return;
    }
    const fromLib = !!el.closest('#lib,#clib,#slib');
    let node: ProgramNode, home: DragState['home'] = null;
    if (fromLib) {
      node = createNode(defs[el.dataset.type!], el.dataset.ref);
    } else {
      const hit = locate(program.visibleRoot(), el.dataset.id!, program.visibleRootKey());
      if (!hit) return;
      node = hit.node;
      if (hit.kind === 'list') {
        hit.list.splice(hit.index, 1);
        home = { kind: 'list', owner: hit.owner, index: hit.index };
      } else {
        hit.owner.cond = null;
        home = { kind: 'cond', owner: hit.owner.id };
      }
    }
    e.preventDefault();
    try { from.releasePointerCapture(e.pointerId); } catch (_) { /* not captured */ }
    const r = el.getBoundingClientRect();
    ui.landed = null;
    ui.drag = {
      node, fromLib, home,
      isCond: isCondition(node.type),
      target: home && home.kind === 'list' ? { owner: home.owner, index: home.index } : null,
      cond: null,
      trash: false,
      ox: e.clientX - r.left, oy: e.clientY - r.top,
      x: 0, y: 0, width: r.width,
    };
    onMove(e);
  }

  function onMove(e: PointerEvent) {
    const d = ui.drag;
    if (!d) return;
    d.x = e.clientX - d.ox;
    d.y = e.clientY - d.oy;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    d.trash = !!(under && under.closest('#trash'));
    d.cond = null;
    if (d.trash) { d.target = null; return; }
    if (d.isCond) {
      const slot = under && under.closest<HTMLElement>('.cond');
      if (slot && slot.dataset.owner && slot.closest('.sch')) d.cond = slot.dataset.owner;
      return;
    }
    let list = under && under.closest<HTMLElement>('.sch .list');
    if (!list) {
      // over the panel but not over a list (START, END, the space below): the top list
      const scheme = under && under.closest('#scheme,#fscheme');
      if (scheme) list = scheme.querySelector<HTMLElement>('.list');
    }
    if (!list || !list.dataset.list) return;
    const kids = [...list.children].filter(c => c.classList.contains('block'));
    const before = kids.findIndex(c => { const q = c.getBoundingClientRect(); return e.clientY < q.top + q.height / 2; });
    const index = before < 0 ? kids.length : before;
    if (!d.target || d.target.owner !== list.dataset.list || d.target.index !== index) d.target = { owner: list.dataset.list, index };
  }

  function onUp() {
    const d = ui.drag;
    if (!d) return;
    ui.drag = null;
    ui.clearSelection();
    if (d.trash) { program.changed(); playSound('del'); return; }

    const landed = () => {
      nextTick(() => { ui.landed = d.node.id; });
      playSound(d.fromLib ? 'add' : 'move');
    };
    const goHome = () => {
      if (d.fromLib) return;   // a library copy is simply discarded
      const home = d.home!;    // a block lifted out of the program always has one
      if (home.kind === 'cond') { const owner = findNode(program.visibleRoot(), home.owner); if (owner) owner.cond = d.node; }
      else { const list = program.listFor(home.owner); if (list) list.splice(home.index, 0, d.node); }
    };

    if (d.isCond) {
      const owner = d.cond && findNode(program.visibleRoot(), d.cond);
      if (owner) { owner.cond = d.node; landed(); } else goHome();
    } else {
      const list = d.target && program.listFor(d.target.owner);
      if (list) { list.splice(Math.min(d.target!.index, list.length), 0, d.node); landed(); } else goHome();
    }
    // only now is the block back in a list, so only now is the program saved
    program.changed();
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
  onUnmounted(() => {
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
  });
}
