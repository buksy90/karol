# Design

## Context

See `proposal.md` for the why. This design was first written for the single-file game and is rewritten here for the code as it is now: Vue components over Pinia stores, strict TypeScript, a Vitest suite named after the spec scenarios.

What matters for this change:

- The program is data: `program.blocks` in `src/stores/program.ts`, a list of `ProgramNode`. Components and `useDragDrop.ts` change it in place.
- A run is a session object in `src/stores/execution.ts`, mirrored by the state flag `active` (a run exists) next to `running` (the timer ticks). `end()` is where a run ends; `cancelSession()` is a second, silent way out used only by the drag handler.
- A block's number field is bound straight to `node.n` with `v-model`, so the program holds whatever is typed, including an empty field (`''`).
- `src/logic/storage.ts` is a guarded wrapper over local storage with no fallback.
- Block ids come from a counter that starts at 0 on every page load.
- Tests pin today's behaviour, including the parts this change replaces.

## Goals / Non-Goals

**Goals:**

- One notion of "a run is active", `execution.active`, drives the whole edit lock.
- One action that is told "the program changed", so saving cannot be forgotten at a call site.
- A program in the store never holds an invalid number.
- Every new or changed scenario that can be tested without layout gets a test named after it; tests of the replaced behaviour do not survive under their old scenario names.

**Non-Goals:**

- Durable storage. Session storage is a stopgap the owner intends to replace.
- Gaps 5, 8, 10 and 11 from the baseline proposal.
- Deleting `legacy/`.

## Decisions

### The lock is `execution.active`

Every edit entry point checks `active` instead of `running`:

- `useDragDrop.ts`, pointer down on a block: when a run is active nothing is picked up and the status line shows `ms.editlock`. The call to `cancelSession()` goes, and so does the action itself: nothing else uses it, and `end()` becomes the only place a run ends and the lock opens.
- `RunControls.vue`, Clear: ignored while active. Its `end()` call becomes dead code and is removed.
- `ProgramPanel.vue`, Select: ignored while active.
- `customBlocks.openEditor()`: returns without opening while active. Today it ends the run instead. This also covers Make block.
- `customBlocks.remove()`: does nothing while active.

The rules for the editor and for deleting sit in the store, not only in the buttons, so they hold for every caller and can be tested without a mounted component.

What the player sees: `App.vue` puts a `locked` class on the app root while `active`, and `styles.css` dims the library and the program under it. The Create, edit and delete buttons and the number fields are bound `disabled`, because styling alone would leave them reachable from the keyboard. A disabled delete button also cannot be put into its "Sure?" state.

*Alternative considered:* checks in the handlers without a visible state. Rejected: a child gets no cue why dragging stopped working. The status-line hint covers the attempt; the dimming covers the glance.

Loading another level still ends the run first, so the level picker stays usable during a run.

### One `program.changed()` action

The program store gets `changed()`: it clears the marks of the last run and saves the current level's program. It is called where an edit completes:

- the drop in `useDragDrop.ts` (this is also how a condition change arrives),
- a committed number in `BlockItem.vue`,
- `program.clear()`, which Clear and the win dialog's Restart both use,
- `customBlocks.save()` when a selection is replaced by a call,
- `customBlocks.remove()`.

Loading a level's program does not call it.

*Alternative considered:* a deep watcher on `program.blocks`. The reason it was rejected for the single-file game (status dots and placeholders in the DOM) is gone, since marks now live in the execution store. It is still rejected: a drag lifts the block out of the list on pointer down, so a watcher would save a program with the block missing until the drop; and a watcher runs after the current tick, which every store test would have to wait for. Five explicit calls are synchronous and each one is covered by a scenario test.

### Session storage: accessor, keys and shape

`src/logic/storage.ts` gains a second accessor, `session`, with the same `get`/`set` shape. A write goes to a module-level map and, guarded, to session storage; a read prefers session storage and falls back to the map. With storage blocked the game therefore keeps per-level programs until reload, as the spec asks. The map can be emptied from tests, which need it for "reload with storage blocked".

- `karol.programs`: an object from level id to that level's `ProgramNode[]`.
- `karol.customs`: `{ blocks, counter }`, the custom blocks by id as `{name, body}` plus the id counter, so a new block after a reload never reuses a stored id.

The stores keep no second copy of all programs: `program.load(levelId)` and `program.changed()` read and write the stored object through the accessor.

*Alternative considered:* a Pinia persistence plugin. Rejected: a dependency for two keys, and it would persist whole stores, including the editor draft.

### Restoring is a logic function that hands out fresh ids

A stored program carries block ids from an earlier page load, and the id counter restarts at 0, so stored ids would collide with new ones. `restoreList` in `src/logic/program.ts` rebuilds a stored list with fresh ids and drops what cannot be shown: a call to a custom block that does not exist, and a block of an unknown type, at any depth. Unreadable JSON restores as an empty program. The same function restores custom block bodies.

Start-up order in `main.ts`: settings, then custom blocks, then levels. `levels.load()` loads the level's program, so the custom blocks must already be there for the missing-call check.

`levels.load()` takes over what the win dialog did by hand: after loading the map it loads that level's program and clears marks and selection. Next level in `WinDialog.vue` is then just `levels.load(next)`; Restart is `program.clear()`.

Deleting a custom block strips its calls from the visible program, from the other custom blocks, and now from every entry of `karol.programs`, with the existing `stripCalls`.

### Numbers are committed, not bound

`BlockItem.vue` stops binding the field to `node.n`. The field is bound to a local value that starts as `node.n` and follows it; on `change` or `blur` the text goes through `parseNumber(text, {min, max})` in `src/logic/program.ts`, which returns a whole number in range or nothing. A number is written to `node.n` and `program.changed()` is called; anything else puts `node.n` back into the field. `node.n` is therefore always valid and its type narrows from `number | ''` to `number`.

Pressing F5 or F6 while typing: `useShortcuts.ts` blurs the focused field before it starts the run, which commits it. Pressing the Run button with the mouse moves the focus and commits by itself.

*Alternative tried:* a one-way `:value="node.n"` binding. It lost what was being typed: typing clears the marks of the last run, that draws the block again, and Vue then writes `node.n` back into the field. Found in the browser pass, now pinned by a test in `tests/components/BlockItem.test.ts`.

Validation per keystroke was rejected: typing "12" passes through "1", and clearing the field to retype passes through empty.

The run-time guards stay as a defensive line and are no longer specified behaviour: the clamp in `repeat-times.ts` and the whole-number check in `useItem`. Each keeps at most one test, in a `describe` named after the function. The scenario tests for an out-of-range or fractional slot in `tests/blocks/use-item.test.ts` are removed; the `useItem` test in `tests/logic/world.test.ts` is the one unhappy-path test that stays.

### Names: two logic functions

`src/logic/custom-blocks.ts` gets `nameTaken(customs, name, exceptId)`, comparing trimmed and case-insensitively, and `firstFreeName(customs, prefix)`, which returns the first "<prefix> N" from 1 that is not taken. `customBlocks.save()` uses the typed name or the first free one; when another block has it, it shows `ms.dupname`, leaves the draft open and saves nothing.

### A call nested too deep is a step

`Step` gets a variant `{ t: 'deep', id }`. `custom-call.ts` yields it when `depth` has reached `MAX_DEPTH`, with the id of the call block the player can see, the same target its other steps use. `execution.tick()` treats it like `stuck`: `ms.toodeep`, red dot, end of run. A call to a custom block that no longer exists is still skipped silently.

### Removing the in-app specs

Deleted: `src/components/SpecsDialog.vue`, `src/components/specs-en.html`, the Specs button in `TopBar.vue`, the import, title and branch in `AppDialog.vue`, `'sp'` in `DialogKind`, and `ui.specs` in both dictionaries. The `?raw` type declaration and any style used only by the specs text go if nothing else uses them.

### Tests and spec references

- Tests follow the README rule: `describe('<capability>: <Requirement name>')`, `it('<Scenario name>')`. Rules that live in logic or stores are tested there; scenarios that need the DOM (dragging, the number field, Clear, Select, the top bar) use the mounted-component pattern of `tests/components/WinDialog.test.ts` and `tests/composables/useDragDrop.test.ts`.
- `tests/helpers/stores.ts` gets a session storage stub beside the local one: a reload keeps it, a new tab empties it, blocked storage blocks both.
- A delta spec cannot carry a `## Code` section, so each task group edits the Code sections of the main specs it touches directly, and `npm run check:specs` must pass at the end of each group.

### New messages

| Key | English | Slovak (needs native review) |
|---|---|---|
| `ms.editlock` | Stop the program first to change it. | Ak chceš program zmeniť, najprv ho zastav. |
| `ms.dupname` | A block named "{0}" already exists. Choose another name. | Blok s názvom „{0}“ už existuje. Vyber iný názov. |
| `ms.toodeep` | Too many custom blocks inside each other! | Príliš veľa vlastných blokov vnorených do seba! |

## Risks / Trade-offs

- [Existing tests pin the replaced behaviour: `cancelSession`, the editor ending a run, the count-based default name, the silently skipped deep call, out-of-range slot numbers] → Each task names the tests it rewrites or removes, so a red test during the work is either listed or a real regression.
- [Narrowing `node.n` to `number` touches every place that reads it] → The compiler finds them; `npm run typecheck` is part of each group's check.
- [`blur` on F5 depends on the browser firing the commit before the run starts] → `blur()` is synchronous and the field commits on `blur` itself, not only on `change`; covered by the scenario test "Run started from the keyboard while typing".
- [A stored program can belong to a level that was replaced through the console import] → It is keyed by level id and simply shown; it may no longer solve the changed map. Acceptable for a stopgap.
- [Session storage quota or blocked storage] → Guarded writes with the in-memory fallback; nothing is shown to the player.
- [The lock makes "fix it while paused" impossible] → Intended by the owner. The drag hint tells the player to press Stop.
- [Dimming, the phone layout and the built file cannot be checked by the test suite] → One manual browser pass in the final group.
- [Slovak wording written by the assistant] → Flagged for native review.

## Open Questions

- Should the win dialog's "Stay" and "Restart" wording change now that every level remembers its program? Not needed for this change.
