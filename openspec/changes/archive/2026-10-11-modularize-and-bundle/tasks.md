# Tasks

No behaviour changes in this change. "Compare with legacy" means: open `legacy/karol-artifact.html` and the development server side by side and confirm the scenarios of the named specs behave the same in both.

## 1. Tooling

- [x] 1.1 Copy the current `index.html` unchanged to `legacy/karol-artifact.html`; verify it opens from disk and plays level 1
- [x] 1.2 Add Vue and Pinia as dependencies and Vite, the Vite Vue plugin and `vite-plugin-singlefile` as development dependencies; mark the package private and as an ES module package; add the `dev`, `build` and `preview` scripts; verify `npm install` succeeds
- [x] 1.3 Add `vite.config.js` with the Vue and single-file plugins and add `dist` to `.gitignore`; verify `git status` does not list `dist` after a build
- [x] 1.4 Replace `index.html` with a mount point and add `src/main.js`, an empty `src/App.vue` and `src/styles.css` holding the current styles; verify `npm run dev` serves the page and `npm run build` writes exactly one file, `dist/index.html`, that opens from disk

## 2. Data files and logic layer

- [x] 2.1 Move the two dictionaries to `locales/en.json` and `locales/sk.json` and add the key lookup with English fallback in `src/logic/i18n.js`; verify both files hold the same set of keys as the legacy dictionaries
- [x] 2.2 Move each built-in level to `levels/<id>.json`; verify the seven files hold the same ids, names and maps as legacy
- [x] 2.3 Add `src/logic/world.js` with map parsing, room detection and the cell rules (entering, crates, keys, doors, exit), with one shared "can move forward" function; verify by a search that the file imports nothing from Vue or Pinia and references neither `document` nor `window`
- [x] 2.4 Add `src/logic/program.js` (find, insert, move, remove, copy with new ids), `src/logic/conditions.js` (evaluation and status text) and `src/logic/custom-blocks.js` (cycle detection, removing uses); verify the same independence as 2.3
- [x] 2.5 Add the block and sensor definition modules and the registries `src/blocks/index.js` and `src/sensors/index.js`, each definition carrying its labels, number range, slot or body flags and its action, generator or evaluate function; verify the registries list the same blocks in the same order and sections as the legacy library
- [x] 2.6 Add `src/logic/interpreter.js` as a step generator dispatching through the registries and carrying block ids on each step; verify the same independence as 2.3
- [x] 2.7 Add `src/logic/levels.js` (validation, versioned merge of built-in and stored levels) and `src/logic/storage.js` (guarded local storage); verify the same independence as 2.3 for `levels.js`

## 3. Stores

- [x] 3.1 Add the `settings` and `ui` stores; verify in the console that changing the language and the status message through the store updates their values
- [x] 3.2 Add the `world` and `inventory` stores with load, reset and the turn, move and unlock actions calling the logic layer; verify in the console that loading level 3 and applying moves changes robot position, keys and inventory as the `world` spec describes
- [x] 3.3 Add the `program` and `customBlocks` stores; verify in the console that inserting, moving, removing and nesting blocks produces the expected tree and that deleting a custom block removes its uses
- [x] 3.4 Add the `levels` store with the build-time glob import ordered by numeric-aware file name, persistence and versioning, and assign `exportLevels` and `importLevels` to the window; verify the list is Level 1 to Level 7 and both functions work in the console
- [x] 3.5 Add the `execution` store: session, run, pause, step, stop, reset, speed, limits, current block, per-block status, rounds left and sonar state; verify in the console that stepping a small program yields the same sequence of steps as legacy
- [x] 3.6 Assign all stores to `globalThis.stores` in one marked block in `main.js`; verify `stores.world`, `stores.inventory` and `stores.program` are readable in the console of the development server and of the built file

## 4. Components: shell, map and dialogs

- [x] 4.1 Add `App.vue` with the two-column layout, `TopBar.vue`, `InventoryBar.vue` and `StatusLine.vue`, and the `useT` composable; verify the layout at desktop width and below 820 px against legacy
- [x] 4.2 Add `MapCanvas.vue` with the drawing code, robot animation and sonar reading from the stores; verify levels 3 and 5 look the same as legacy, including room colours and animation at 1x and 15x
- [x] 4.3 Add `AppDialog.vue`, `LevelsDialog.vue`, `OptionsDialog.vue`, `SpecsDialog.vue` with `specs-en.html` (its "Technical notes" paragraph corrected) and `WinDialog.vue`; verify opening, closing by Close, outside click and Esc, level switching, language and sound switching, and the three win choices
- [x] 4.4 Compare with legacy for `app-shell`, `language-support`, `levels` and `world`

## 5. Components: program and execution

- [x] 5.1 Add `BlockItem.vue`, `BlockList.vue` and `ConditionSlot.vue` rendering a program tree from the store, with number fields, nested bodies, condition slots, the pointer, status dots and rounds-left badge; verify a program set through the console renders like the same program in legacy, in both languages
- [x] 5.2 Add `ProgramPanel.vue` with START, END, the empty-list hint and Clear, and `BlockLibrary.vue` with the three collapsible sections; verify against legacy
- [x] 5.3 Add `RunControls.vue`, `SpeedButtons.vue` and the `useShortcuts` composable; verify Run, Pause, Step, Stop, Reset, the four speeds and F5, F6 and Esc, including F5 not reloading the page
- [x] 5.4 Compare with legacy for `program-execution`, the seven block specs, `sensor-can-go-forward` and the execution scenarios of `conditions`, using Step on programs that cover every block kind

## 6. Editor interactions and custom blocks

- [x] 6.1 Add the `useDragDrop` composable and wire it into the library, lists and condition slots: floating copy, placeholder position, nested lists, the remove area over the map, return home, discard of library copies; verify adding, moving, deleting and a clumsy drop with a mouse
- [x] 6.2 Add the landing glow and the `useSounds` composable; verify the glow fades over 2 seconds and that the three sounds play and respect the Sound setting
- [x] 6.3 Add select mode with the contiguous-selection rules and the Make block button; verify the selection scenarios
- [x] 6.4 Add `CustomBlockLibrary.vue` and `CustomBlockEditor.vue`: create, edit, rename, delete with confirmation, cycle prevention, make block from selection, the faded map and disabled controls while editing; verify each against legacy, including stepping through a call
- [ ] 6.5 Repeat the checks of 6.1 on a touch device; done when dragging works without the page scrolling
- [x] 6.6 Compare with legacy for `program-editor`, `custom-blocks` and the slot scenarios of `conditions`

## 7. Spec references and documentation

- [x] 7.1 Add a `## Code` section between Purpose and Requirements to each of the 16 specs in `openspec/specs/`, listing its stores, modules and components with a few words each; verify `openspec validate --specs --strict` passes for all 16
- [x] 7.2 Add `scripts/check-spec-refs.mjs` and the `check:specs` script; verify it passes, and that it fails when a listed path is temporarily renamed
- [x] 7.3 Add a short README with the four commands, the three layers, the directory layout and the `globalThis.stores` debugging access; verify each command runs as written

## 8. Final equivalence check

- [x] 8.1 Verify the layering by search: nothing under `src/logic`, `src/blocks` or `src/sensors` imports Vue, Pinia, a store or a component, and no store imports a component
- [x] 8.2 Build, open `dist/index.html` from disk with the network disabled, and play levels 1 to 7 to the exit in English and in Slovak
- [ ] 8.3 Walk through every scenario of all 16 specs on the built file; done when each is observed, or a difference from legacy is fixed, or a spec found wrong against legacy is corrected and the correction listed for the owner
- [x] 8.4 Run `openspec validate modularize-and-bundle --strict` and confirm the change is valid

## Workflow follow-up

- Archive the change.
- Next change: add unit tests for the logic layer and the stores.
- After that: delete `legacy/karol-artifact.html`.
- Refresh the design and tasks of the parked `editing-and-session-fixes` change for the new structure with `/opsx:update`.
