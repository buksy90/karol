import { onMounted, onUnmounted } from 'vue';
import { useUiStore } from '../stores/ui.ts';
import { useExecutionStore } from '../stores/execution.ts';
import { useCustomBlocksStore } from '../stores/customBlocks.ts';

/** F5 Run/Pause, F6 Step, Esc Stop (or close the open dialog). */
export function useShortcuts() {
  const ui = useUiStore(), exec = useExecutionStore(), custom = useCustomBlocksStore();

  function onKey(e: KeyboardEvent) {
    const open = !!ui.dialog, editing = !!custom.draft;
    if (e.key === 'Escape') {
      if (open) ui.closeDialog();
      else if (!editing && (exec.running || exec.active)) exec.stop();
      return;
    }
    if (e.key === 'F5' || e.key === 'F6') {
      e.preventDefault();   // F5 must not reload the page
      if (!open && !editing) {
        // a number still being typed is committed (or snaps back) before the run reads the program
        const focused = document.activeElement;
        if (focused instanceof HTMLInputElement) focused.blur();
        if (e.key === 'F5') exec.toggleRun(); else exec.stepOnce();
      }
    }
  }

  onMounted(() => document.addEventListener('keydown', onKey));
  onUnmounted(() => document.removeEventListener('keydown', onKey));
}
