# Design

## Context

Everything lives in one `index.html` with no build step and no tests. The program is not held as data: it is the DOM of the program panel, read into a tree only when a run starts. Custom blocks are held in memory as `{name, body}` by id. A run is represented by a session object that exists from the first Run or Step until the run ends, plus a separate "running" flag that is true only while the timer ticks.

The split into modules, the bundler and unit tests are later changes, so this one must stay small and local to the existing structure.

## Goals / Non-Goals

**Goals:**

- One clear notion of "a run is active" that drives the edit lock.
- One place that is told "the program changed", so saving cannot be forgotten at a call site.
- Stored data in the same shape the code already uses, so no new format has to be invented and later migrated.

**Non-Goals:**

- Durable storage (local storage, files, accounts). Session storage is a stopgap the owner intends to replace.
- Moving translations or levels out of the page.
- Restructuring the program into a data model. That belongs to the modularization change.
- Gaps 5, 8, 10 and 11 from the baseline proposal.

## Decisions

### The lock follows the run session, not the running flag

The edit lock is on exactly when a run session exists. Today the drag handler, Clear and Select check the running flag, and a drag during pause discards the session. All of those switch to the session check, and the discard is removed.

The page gets a "locked" state (a class on the app root) set when a session starts and cleared in the one function that ends a run. Styling dims the library and program and disables pointer input on the custom block Create, edit and delete buttons. Number fields are also set `disabled`, because styling alone would still let the keyboard reach them.

*Alternative considered:* checking the session in each handler without a visible state. Rejected: a child gets no cue why dragging stopped working. The status-line hint covers the attempt; the dimming covers the glance.

Loading another level still ends the run first, as it does today, so the level picker stays usable during a run.

### A single "program changed" hook

Program edits already funnel through a few points: a drop, a number edit, Clear, replacing a selection with a custom block, and deleting a custom block. Each already clears the status dots. A new function is called at these points; it clears the marks and saves the current level's program. Loading a program for a level does not call it.

*Alternative considered:* a mutation observer on the program panel. Rejected: it also fires for status dots, badges, the drag placeholder and language switches, and would need filtering that is harder to get right than five explicit calls.

### Stored shape and keys

- `karol.programs` in session storage: an object from level id to the program tree in the existing serialized shape (`{t, id?, n?, ch?, cond?}`), without element references.
- `karol.customs` in session storage: the custom blocks by id as `{name, body}`, plus the id counter so new ids never collide with stored ones.

Both go through a guarded accessor like the existing local storage one, falling back to an in-memory object. With the fallback, per-level programs still work until reload.

On load, a program is rebuilt with the existing tree-to-DOM builder. Calls to a custom block id that no longer exists are dropped while building, so a damaged or stale entry cannot produce a "?" block.

Deleting a custom block already strips its uses from the visible program and from other custom blocks. It additionally strips them from every stored program, using the same recursive filter.

*Alternative considered:* storing the program panel's HTML. Rejected: it would freeze labels in one language and carry status classes.

### Number validation on commit, not per keystroke

Each number field remembers its last valid value. On `change` (the field is left or Enter is pressed) the value is checked: a whole number within the field's range is accepted and remembered, anything else restores the remembered value. Starting a run commits any focused field first, which covers F5 pressed while typing.

Per-keystroke validation was rejected: typing "12" passes through "1", and clearing the field to retype passes through empty; rejecting those would fight the player.

The run-time clamp in the interpreter stays as a defensive line but is no longer specified behaviour.

Saving happens on commit, not on every keystroke, so a stored program never holds an invalid number.

### Unique names compare trimmed and case-insensitively

"Corner" and "corner " would be indistinguishable to a child, so they count as the same name. The default name takes the first free "Block N" in the current language; because it goes through the same uniqueness check, it cannot collide with a hand-typed name.

### Depth error is a step of its own

The interpreter yields an error step when a call would exceed depth 20, in the same way it already yields one for a loop that does nothing. The tick handler shows the message, marks the call block in the program red and ends the run.

### Removing the in-app specs

The Specs button, its dialog branch, the hidden template and the two translation entries are deleted. The dialog styling for long text stays only if another dialog still uses it.

### New messages

| Key | English | Slovak (needs native review) |
|---|---|---|
| `ms.editlock` | Stop the program first to change it. | Ak chceš program zmeniť, najprv ho zastav. |
| `ms.dupname` | A block named "{0}" already exists. Choose another name. | Blok s názvom „{0}“ už existuje. Vyber iný názov. |
| `ms.toodeep` | Too many custom blocks inside each other! | Príliš veľa vlastných blokov vnorených do seba! |

## Risks / Trade-offs

- [No automated tests] → Every task carries a manual browser check, and the scenarios in the delta specs are the checklist. Unit tests arrive in a later change.
- [Session storage survives a reload, which the owner described as acceptable to lose] → Kept as specified: it is the natural behaviour of session storage and strictly better for the player. Lost on tab close.
- [A stored program can refer to a level that was replaced through the console import] → The program is keyed by level id and simply shown; it may no longer solve the changed map. Acceptable for a stopgap.
- [Session storage quota or a blocked storage] → Guarded writes with in-memory fallback; nothing is shown to the player.
- [The lock makes "fix it while paused" impossible] → Intended by the owner. The drag hint tells the player to press Stop.
- [Slovak wording written by the assistant] → Flagged for native review, same as earlier assistant-written strings.

## Open Questions

- Should the win dialog's "Stay" and "Restart" wording change now that every level remembers its program? Not needed for this change.
