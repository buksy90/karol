import { onMounted, onUnmounted, nextTick } from 'vue';
import { createNode, locate, findNode } from '../logic/program.js';
import { defs, isCondition } from '../blocks/index.js';
import { useUiStore } from '../stores/ui.js';
import { useExecutionStore } from '../stores/execution.js';
import { useProgramStore } from '../stores/program.js';
import { ensureAudio, playSound } from './useSounds.js';

// Drag and drop of blocks with pointer events (mouse and touch).
//
// ui.drag while a block is dragged:
//   node      the block being dragged (a new one from the library, or one lifted out of the program)
//   fromLib   true for a library copy
//   isCond    true for condition blocks, which fit only condition slots
//   home      where a lifted block came from: {kind:'list', owner, index} | {kind:'cond', owner}
//   target    {owner, index}: the list position the placeholder shows; kept until it changes
//   cond      id of the block whose condition slot is under the pointer
//   trash     the pointer is over the remove area
//   x, y, width   where the floating copy is drawn
export function useDragDrop() {
  const ui = useUiStore(), exec = useExecutionStore(), program = useProgramStore();

  function onDown(e) {
    ensureAudio();
    const el = e.target.closest('.block');
    if (!el || exec.running || e.target.tagName === 'INPUT' || e.target.classList.contains('list')) return;
    if (ui.selMode && el.closest('#prog')) {
      if (!el.classList.contains('sensor')) ui.toggleSelected(el.dataset.id);
      return;
    }
    const fromLib = !!el.closest('#lib,#clib,#slib');
    let node, home = null;
    if (fromLib) {
      node = createNode(defs[el.dataset.type], el.dataset.ref);
    } else {
      const hit = locate(program.visibleRoot(), el.dataset.id, program.visibleRootKey());
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
    exec.cancelSession();   // editing a paused or stepped run ends it
    e.preventDefault();
    try { e.target.releasePointerCapture(e.pointerId); } catch (_) { /* not captured */ }
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

  function onMove(e) {
    const d = ui.drag;
    if (!d) return;
    d.x = e.clientX - d.ox;
    d.y = e.clientY - d.oy;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    d.trash = !!(under && under.closest('#trash'));
    d.cond = null;
    if (d.trash) { d.target = null; return; }
    if (d.isCond) {
      const slot = under && under.closest('.cond');
      if (slot && slot.dataset.owner && slot.closest('.sch')) d.cond = slot.dataset.owner;
      return;
    }
    let list = under && under.closest('.sch .list');
    if (!list) {
      // over the panel but not over a list (START, END, the space below): the top list
      const scheme = under && under.closest('#scheme,#fscheme');
      if (scheme) list = scheme.querySelector('.list');
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
    exec.clearMarks();
    ui.clearSelection();
    if (d.trash) { playSound('del'); return; }

    const landed = () => {
      nextTick(() => { ui.landed = d.node.id; });
      playSound(d.fromLib ? 'add' : 'move');
    };
    const goHome = () => {
      if (d.fromLib) return;   // a library copy is simply discarded
      if (d.home.kind === 'cond') { const owner = findNode(program.visibleRoot(), d.home.owner); if (owner) owner.cond = d.node; }
      else { const list = program.listFor(d.home.owner); if (list) list.splice(d.home.index, 0, d.node); }
    };

    if (d.isCond) {
      const owner = d.cond && findNode(program.visibleRoot(), d.cond);
      if (owner) { owner.cond = d.node; landed(); } else goHome();
      return;
    }
    const list = d.target && program.listFor(d.target.owner);
    if (list) { list.splice(Math.min(d.target.index, list.length), 0, d.node); landed(); } else goHome();
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
