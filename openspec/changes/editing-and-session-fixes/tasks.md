# Tasks

All code changes are in `index.html`. There are no automated tests yet, so each task is verified by hand in a desktop browser; the scenarios in this change's delta specs are the checklist.

## 1. Edit lock during a run

- [ ] 1.1 Switch the drag handler, Clear and Select from the "running" check to "a run session exists", and remove the code that discards the session when a drag starts; verify a drag during pause picks nothing up and the run resumes from the same block
- [ ] 1.2 Add a locked state on the app root, set when a session starts and cleared where a run ends, that dims the library and program, disables number fields and blocks the custom block Create, edit and delete buttons; verify all of them are inert while paused and work again after Stop, Reset, finish, failure and win
- [ ] 1.3 Add the `ms.editlock` message in English and Slovak and show it when a drag is attempted while locked; verify the status line shows it in both languages
- [ ] 1.4 Walk through every scenario of `program-execution` "Editing during a run", `custom-blocks` "Editor view" and "Deleting", and `program-editor` "Clear"; done when each is observed

## 2. Number validation

- [ ] 2.1 Make each number field remember its last valid value and, on commit, restore it unless the new value is a whole number in range (1 to 8 for Use item, 1 to 99 for Repeat); verify 12, 0, empty and 2.5 all snap back and 5 is kept
- [ ] 2.2 Commit a focused number field before a run starts; verify typing 500 into a Repeat 4 block and pressing F5 runs four rounds
- [ ] 2.3 Walk through the scenarios of `program-editor` "Editing numbers on a block", `block-use-item` "Slot number" and `block-repeat-times` "Fixed number of rounds"; done when each is observed

## 3. Custom block names and depth error

- [ ] 3.1 Refuse saving a custom block whose trimmed, case-insensitive name matches another custom block, keep the editor open and show `ms.dupname` in English and Slovak; verify with a new block, a rename to a taken name, and an unchanged own name
- [ ] 3.2 Change the default name to the first free "Block N"; verify that after deleting "Block 1" the next unnamed block is "Block 1" again, and that a hand-named "Block 1" makes the next unnamed block "Block 2"
- [ ] 3.3 Make a call deeper than 20 yield an error step that shows `ms.toodeep` in English and Slovak, marks the call block red and ends the run; verify with 21 nested custom blocks, and that 20 nested blocks still run

## 4. Programs and custom blocks in session storage

- [ ] 4.1 Add a guarded session storage accessor with in-memory fallback, and a single "program changed" function that clears the marks and saves the current level's program under `karol.programs`; call it at every program edit point; verify the stored entry updates after a drop, a number edit, Clear, a condition change and a selection replaced by a custom block
- [ ] 4.2 Load the current level's program whenever a level is loaded, dropping calls to custom blocks that no longer exist; verify two levels keep separate programs and a never-visited level is empty
- [ ] 4.3 Change the win dialog so Next level shows the next level's own program and Restart clears and saves this level's program; verify all `levels` "Win dialog" scenarios
- [ ] 4.4 Save custom blocks and the id counter under `karol.customs` on create, edit and delete, and restore them on start before the program is loaded; verify a reload keeps the custom blocks and the programs that use them, and a new custom block after reload gets a fresh id
- [ ] 4.5 Make deleting a custom block also remove its uses from every stored program; verify the "Used on another level" scenario
- [ ] 4.6 Verify a reload in the same tab restores level, program and custom blocks, a new tab starts empty, and the game still works with session storage blocked

## 5. Remove the in-app specs

- [ ] 5.1 Delete the Specs button, its dialog code, the hidden specs template and its translation entries; verify the top bar shows only Levels and Options, a search of `index.html` finds no remaining reference, and the Levels, Options and win dialogs still open and close

## 6. Final check

- [ ] 6.1 Play levels 1 to 7 once each with Run and once using Step, in English and in Slovak, and confirm nothing outside this change's delta specs behaves differently from the main specs
- [ ] 6.2 Run `openspec validate editing-and-session-fixes --strict` and confirm the change is valid

## Workflow follow-up

- Have a native speaker review the three new Slovak messages.
- Archive the change after the review.
