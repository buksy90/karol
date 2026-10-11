# Proposal

## Why

Writing the baseline specs exposed several places where the game behaves inconsistently or fails silently: a program follows the player to a different level, editing during a paused run quietly cancels it, numbers can be typed that the game then ignores, and a too-deep custom block is skipped without a word. The project owner decided how each should behave; this change applies those decisions before new features are built on top.

## What Changes

- **A program per level.** Each level has its own program, empty until the player first builds one there. Switching level, including "Next level" after a win, shows that level's program. Programs and custom blocks are kept in session storage, so they survive a page reload in the same tab and are lost when the tab closes.
- **Editing is locked during a run.** From the first Run or Step until the program finishes, fails, or is stopped or reset, nothing can be edited: no dragging, no number changes, no Clear, no select mode, no creating, editing or deleting custom blocks. Trying to drag a block shows a hint to stop the program first. **BREAKING** for the old behaviour where a drag during pause cancelled the run.
- **Too-deep custom blocks fail loudly.** A custom block call nested more than 20 deep stops the program with a red dot and a status-line message instead of being skipped.
- **Numbers are validated while editing.** Use item accepts whole numbers 1 to 8, Repeat accepts 1 to 99. An empty, fractional or out-of-range value snaps back to the last valid one when the field is left.
- **Custom block names are unique.** Saving under a name another custom block already has is refused with a status message. The default name is the first free "Block N".
- **The in-app Specs button is removed.** OpenSpec is now the source of truth, so the embedded copy and its "update with every change" rule go away.

Not in this change:

- Translations and levels as external `.json` files. They wait for the change that introduces the bundler.
- The loop-does-nothing guard (gap 5) and "Step N" overwriting the step's message (gap 11). No decision yet.
- Stricter level validation (gap 8) and the sonar colour inside Not (gap 10). Deferred by the owner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `levels`: the level picker and "Next level" show the chosen level's own program instead of keeping or clearing the current one.
- `program-editor`: the program is kept per level for the tab session; number fields are validated; Clear is blocked for the whole run.
- `custom-blocks`: kept for the tab session; unique names and a first-free default name; deleting also cleans the programs of other levels; the editor cannot be opened during a run; a call nested too deep is an error.
- `program-execution`: editing is locked for the whole run, including while paused or stepping.
- `block-use-item`: the slot number can no longer be outside 1 to 8.
- `block-repeat-times`: the round count can no longer be outside 1 to 99, so the run-time clamp is no longer a behaviour.
- `app-shell`: the Specs button and dialog are removed.
- `language-support`: the in-app specs are no longer an untranslated text; three new messages need both languages.

## Impact

- `index.html` only: the drag handlers, run controls, custom block editor, level loading, win dialog, number fields, top bar and the translation dictionary.
- New browser storage: session storage entries for the per-level programs and for custom blocks. Local storage use is unchanged.
- Three new status messages in English and Slovak. The Slovak wording is written by the assistant and needs native review.
- No automated tests exist yet; verification is manual in a browser.
