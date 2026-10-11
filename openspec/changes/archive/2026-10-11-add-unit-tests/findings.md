# Findings

What writing the tests turned up, and what was done about it.

## Mismatches between spec and code

One was found, and it is fixed in this change.

| Spec | What the code did | Decision | Now |
|---|---|---|---|
| `block-use-item` | With 1.5 in the slot field and a key in slot 1, the door opened and the key stayed in slot 1, so one key opened any number of doors. `useItem` read slot `(n \| 0) - 1` but cleared index `n - 1`, which is 0.5. | Slot numbers are whole numbers only. | A number with a fraction is an empty slot: "Slot 1.5 is empty.", red dot, nothing used. Spec delta `specs/block-use-item/spec.md`; tests "Slot number with a fraction" in `tests/blocks/use-item.test.ts` and the `useItem` tests in `tests/logic/world.test.ts`. |

No test is a `todo` or skipped.

## Behaviour the specs do not state, pinned by a test as it is

- **Step limit.** A run ends on step 5001, the first one that exceeds 5000. The requirement says "exceeds 5000 steps"; its scenario says "after 5000 steps". (`tests/stores/execution.test.ts`, "Endless visible loop")
- **Language switch during a paused or stepped run.** The status line is replaced by the ready message. Only a program running automatically keeps its status line. The spec covers only "no run is active". (`tests/stores/settings.test.ts`)
- **One bad stored level discards all stored levels.** If any entry of `karol.levels` fails validation at start-up, the whole stored list is ignored without a message and the built-in levels are used. (`tests/logic/levels.test.ts`)
- **Level validation errors count from zero.** The second level of an import is reported as "Level 1: …", while a generated name for the same level would be "Level 2".
- **An empty slot field reads as slot 0.** Use item with the number cleared says "Slot 0 is empty." (`tests/blocks/use-item.test.ts`)
- **A crate cannot be pushed onto an unknown map symbol**, although the robot can walk onto one. (`src/logic/world.ts`, not pinned by a test)

## Scenarios covered on a mounted component

Asked for after the first round. All three were possible without much machinery, so none had to be skipped. They run in happy-dom, with the real component mounted by Vue and driven by real events.

| Scenarios | Test file | How |
|---|---|---|
| `program-execution` Keyboard shortcuts: F5 toggles run and pause, Shortcut with a dialog open, Esc with nothing running. Also `app-shell` Dialogs: Esc with a dialog open during a run. | `tests/composables/useShortcuts.test.ts` | A component that calls `useShortcuts()`, and `KeyboardEvent`s on the document. "The page is not reloaded" is checked as the key event being suppressed. |
| `levels` Win dialog: Next level, Stay, Restart, Last level, Closing the dialog. | `tests/components/WinDialog.test.ts` | `AppDialog.vue` mounted with the shipped levels; the buttons are clicked. The dialog is opened directly, not by solving the level. |
| `sensor-can-go-forward` Placement in the library: Dragging the sensor. | `tests/composables/useDragDrop.test.ts` | The library and the program panel mounted with `useDragDrop()`, and pointer down, move and up events. happy-dom lays nothing out, so the test says which element is under the pointer. |

What the drag test cannot show: that a real browser finds the slot under the finger. It tests the decision the drop code makes once it knows what is under the pointer.

## Scenarios without a test

174 of the 222 scenarios have a test of the same name. The other 48 stay manual checks:

| Spec | Scenarios | Why |
|---|---|---|
| `program-editor` | 20: everything about dragging, dropping, the remove area, drop feedback, touch, the number field, the Clear button, Select during a run | Drag and drop and the buttons are in components and `useDragDrop.ts`. Several depend on where exactly the pointer is, which needs layout. The store parts (`clear`, selection rules, collapsing a section) are tested. |
| `app-shell` | 9: layout, top bar, closing a dialog by clicking outside, Options contents, in-app specs, self-contained delivery | Rendering and delivery. |
| `conditions` | 7: slot display, highlighting, replacing and removing by drag | Drag and drop. The sensor drag test is the pattern for these. |
| `custom-blocks` | 3: empty library text, dragging a custom block in, delete not confirmed | Library component. |
| `world` | 3: map and robot rendering | Canvas. Room numbering, which the floor colours come from, is tested. |
| `block-not` | 2: the two drop scenarios | Drag and drop. That Not is a condition with an empty slot is tested. |
| `program-execution` | 2: editing a number clears marks, drag while running | `App.vue` and `useDragDrop.ts`. `clearMarks` and `cancelSession` are tested. |
| `levels` | 1: current level marked in the level list | `LevelsDialog.vue`. |
| `language-support` | 1: the untranslated empty-list hint | The text is in a component template. |

Roughly a dozen of these (the `conditions` and `block-not` drops, drag while running, the level list, the Clear button, Select during a run) could be covered with the helpers that now exist. The ones that depend on geometry, the canvas or the built file could not.

## Tooling

- **Node 24.** Vitest 5 needs Node 22.12+, 24 or 26+. The first round ran on Node 23.5 with an engine warning and an npm crash that needed `--legacy-peer-deps`; on Node 24 a plain `npm install` works and `package-lock.json` was regenerated there.
- **happy-dom** is a new development dependency, used only by the three page-level files. Starting it costs about two seconds per file; the whole suite still runs in a few seconds because files run in parallel.
- **CI has not run yet.** The same four commands pass locally on Node 24 after a clean install.
- **The build.** After the first round `dist/index.html` was byte-identical to a build with the previous config and mounted from disk in headless Edge. It now differs by the slot number fix. Nobody played it in a browser for this change; "level 1 can be won" is covered by a store test on the shipped level file.
