# Tasks

Groups 1 to 9 change no file under `src/`; group 10 was added after the first review and holds the one source change. Test names follow design decision 5: `describe('<capability>: <Requirement name>')` and `it('<Scenario name>')`. A scenario the code does not satisfy becomes `it.todo` with a one-line comment and an entry in the findings list (design decision 8). Scenarios that are only about rendering, dragging, sounds or keyboard shortcuts are skipped.

## 1. Tooling

- [x] 1.1 Add `vitest` as a development dependency; verify `npm install` succeeds without peer dependency warnings for Vite 8 and `npx vitest --version` prints a version on the local Node
- [x] 1.2 Add the `test` section to `vite.config.ts` (`defineConfig` from `vitest/config`, `environment: 'node'`, `include: ['tests/**/*.test.ts']`, globals off) and the scripts `test` (`vitest run`) and `test:watch` (`vitest`); verify `npm run typecheck` still passes for `tsconfig.node.json`
- [x] 1.3 Add `tests/**/*.ts` to the `include` of `tsconfig.json` and add `tests/logic/storage.test.ts` covering `storage.get` and `storage.set` with no `localStorage` (returns null, does not throw) and with a stubbed one; verify `npm test` runs and passes it, `npm run typecheck` passes, and `npm run build` still writes one `dist/index.html` of the same size as before the change
- [x] 1.4 If the Vue or single-file plugin disturbs the test run in 1.3, move the test settings to a `vitest.config.ts` without those plugins and include it in `tsconfig.node.json`; verify the same three commands pass (skip when 1.3 passed as it is)

## 2. Helpers

- [x] 2.1 Add `tests/helpers/world.ts` (a world from map rows, empty slots) and `tests/helpers/program.ts` (builders for each block type on top of `createNode` and the real `defs`, returning the nodes so tests can read their ids); verify with `npm run typecheck`
- [x] 2.2 Add `tests/helpers/stores.ts`: setup (fresh active Pinia, in-memory `localStorage` stub, fake timers), teardown (`execution.end()`, real timers, unstub globals), `loadMap(rows)`, and `play(program)` that steps to the end and returns the status text after each step; verify with a first test in `tests/stores/world.test.ts` that loads a map, plays one Move forward and finds the robot one cell further

## 3. Logic tests

- [x] 3.1 Add `tests/logic/world.test.ts` for the `world` spec requirements Map symbols, Robot start, Enterable cells, Crates, Keys, Doors, Exit and Inventory, through `parseMap`, `probeForward`, `canMoveForward`, `turnLeft`, `moveForward` and `useItem`, plus room numbering in `roomMap`; verify `npm test` passes and every scenario of those requirements has an `it` or `it.todo`
- [x] 3.2 Add `tests/logic/program.test.ts` for `createNode`, `cloneNode` (fresh ids, deep), `snapshot` (same ids, independent copy), `locate` in a list, in a body and in a condition slot including inside Not, `findNode`, `ancestors`, `stripCalls` at depth, and `isContiguous`; verify `npm test` passes
- [x] 3.3 Add `tests/logic/interpreter.test.ts`: the step sequence `runList` yields for actions, If, Repeat N times, Repeat while and a custom block call with scripted condition answers; steps inside a call carry the call block's id; `countRound` throws after `LOOP_LIMIT`; verify `npm test` passes
- [x] 3.4 Add `tests/logic/conditions.test.ts` for `evaluate` (sensor, Not, nested Not, empty slot, empty inner slot gives null), `conditionText` and `innermostSensor`; verify `npm test` passes
- [x] 3.5 Add `tests/logic/custom-blocks.test.ts` for `uses` (direct, indirect, through a container, a cycle in the data does not loop forever) and `offeredIds`, named after the `custom-blocks` scenarios Block cannot contain itself, Indirect cycle and Unrelated block; verify `npm test` passes
- [x] 3.6 Add `tests/logic/levels.test.ts` for `normLevel` (the Level format and Level validation scenarios, generated id and name), `initialLevels` (the Built-in level versioning scenarios, bad stored JSON), `mergeImported` (the import scenarios, nothing merged when one level is invalid), `levelSize` and `orderByFileName` (level-10 after level-9); verify `npm test` passes
- [x] 3.7 Add `tests/logic/i18n.test.ts` for `translate` (the Missing translations scenario, unknown key returns the key, placeholders) and `defaultLanguage` (the Default language scenarios, stored choice wins); verify `npm test` passes

## 4. Block and sensor tests

- [x] 4.1 Add `tests/blocks/index.test.ts`: the library order, every definition reachable by its `type`, `isCondition`, and every `labelKey` and `suffixKey` present in `locales/en.json`; verify `npm test` passes
- [x] 4.2 Add `tests/blocks/turn-left.test.ts`, `move-forward.test.ts` and `use-item.test.ts`, covering the scenarios of `block-turn-left`, `block-move-forward` and `block-use-item` through `execute` with a recording `say` and through `play`; verify `npm test` passes and each scenario has an `it` or `it.todo`
- [x] 4.3 Add `tests/blocks/repeat-times.test.ts`, `if.test.ts` and `repeat-while.test.ts`, covering `block-repeat-times` (rounds, run-time clamp, round start as a step, the `counts` badge values, silent inside a custom block), `block-if` and `block-repeat-while` (loop that does nothing, empty condition) through `play`; verify `npm test` passes and each scenario has an `it` or `it.todo`
- [x] 4.4 Add `tests/blocks/not.test.ts` and `tests/sensors/can-go-forward.test.ts`, covering `block-not` and `sensor-can-go-forward` (true exactly when a move would succeed, crates count only if pushable); verify `npm test` passes and each scenario has an `it` or `it.todo`
- [x] 4.5 Add `tests/blocks/custom-call.test.ts` for the `custom-blocks` requirements Executing a custom block and Nesting depth limit (a call deeper than `MAX_DEPTH` and a call to a missing block are skipped); verify `npm test` passes

## 5. Store tests

- [x] 5.1 Extend `tests/stores/world.test.ts` for the `world` requirement Level reset: `load`, `reset` restores grid, crates, robot and an empty inventory, and bumps `resets`; verify `npm test` passes
- [x] 5.2 Add `tests/stores/execution.test.ts` for `program-execution`: Execution order and steps, Run (with fake timers), Pause and resume, Step, Stop, Reset and finishing, Stopping on a failed block, Speed (interval per speed, change during a run), Execution pointer, Status dots, Clearing marks, Safety limits (`STEP_LIMIT`), `cancelSession`, and the win dialog after `WIN_DELAY`; verify `npm test` passes and each scenario of those requirements has an `it` or `it.todo`
- [x] 5.3 Add to `tests/stores/execution.test.ts` the `conditions` requirements A check is a step, Live state, Empty condition is an error, and the `sonar` state for Sonar animation and Sonar duration (`ok` and `dur` at 1x, 15x and single step); verify `npm test` passes
- [x] 5.4 Add `tests/stores/levels.test.ts` for `levels`: `init` on first start, `load` by id and with an unknown id, `next` (including the last level), Remembering levels with the storage stub and with storage blocked, Console export and import; verify `npm test` passes
- [x] 5.5 Add `tests/stores/customBlocks.test.ts` for `custom-blocks`: Editor view (opening ends a run), Save and cancel, Default name, Renaming, Deleting (uses removed from the program, other custom blocks and the draft), `offered` while editing, and Make a block from a selection; verify `npm test` passes
- [x] 5.6 Add `tests/stores/program.test.ts` (`clear`, `visibleRoot`, `visibleRootKey`, `listFor`) and `tests/stores/ui.test.ts` (status line, dialogs, section collapse, and the `program-editor` requirements Select mode and Selection is one contiguous run); verify `npm test` passes
- [x] 5.7 Add `tests/stores/settings.test.ts` for `language-support` (Default language with a stubbed `navigator`, Switching language and the status line rule, Remembering the language) and `app-shell` Sound setting; verify `npm test` passes

## 6. Data tests

- [x] 6.1 Add `tests/data/levels.test.ts`: every `levels/*.json` passes `normLevel`, ids are unique and match the file name; verify `npm test` passes and that temporarily removing the `K` from a level file makes it fail, then restore the file
- [x] 6.2 Add `tests/data/locales.test.ts`: `sk.json` has exactly the keys of `en.json` and the same placeholders per key; verify `npm test` passes

## 7. Documentation and specs

- [x] 7.1 Add the test files to the `## Code` sections of the 16 specs as listed in design decision 11; verify `npm run check:specs` passes and `npx openspec validate --specs --strict` passes
- [x] 7.2 Update `README.md`: the `test` and `test:watch` commands, `tests/` in the structure, a short "Tests" section (naming after scenarios, where helpers are, tests pin behaviour), and the `legacy/` line now that tests exist; verify every path and command the README names exists

## 8. Continuous integration

- [x] 8.1 Add `.github/workflows/ci.yml` running on pushes to `main` and on pull requests: checkout, Node 24 with npm cache, `npm ci`, `npm test`, `npm run check:specs`, `npm run build`; verify the file parses as YAML and that the same four commands pass locally from a clean `npm ci`

## 9. Integration checks

- [x] 9.1 Verify `git status` shows no change under `src/`, `levels/` or `locales/`
- [x] 9.2 Verify `npm run typecheck`, `npm test`, `npm run check:specs` and `npm run build` all pass, and `dist/index.html` opens from disk and level 1 can be won
- [x] 9.3 Run `npm test` three times in a row and once with `npx vitest run --sequence.shuffle`; verify the same result every time (no leaked state between tests)
- [x] 9.4 Write the findings list: every `it.todo` with its scenario, spec and what the code does instead, plus the scenarios left untested because they need a browser; verify the count of `it.todo` in `tests/` equals the number of mismatch entries

## 10. After review: slot numbers and page-level tests

- [x] 10.1 Reinstall on Node 24 and add `happy-dom` as a development dependency; verify `npm install` runs without `--legacy-peer-deps` and without an engine warning
- [x] 10.2 Make `useItem` in `src/logic/world.ts` take only a whole number as a slot, add the `block-use-item` spec delta and remove `skip_specs`; verify with the scenario test "Slot number with a fraction" in `tests/blocks/use-item.test.ts`, the `useItem` tests in `tests/logic/world.test.ts`, and `npx openspec validate add-unit-tests --strict`
- [x] 10.3 Add `tests/helpers/dom.ts` and `tests/composables/useShortcuts.test.ts` for the three `program-execution` Keyboard shortcuts scenarios and the `app-shell` scenario "Esc with a dialog open during a run"; verify `npm test` passes and breaking the dialog check in `useShortcuts.ts` turns a test red
- [x] 10.4 Add `tests/components/WinDialog.test.ts` for the `levels` Win dialog scenarios Next level, Stay, Restart, Last level and Closing the dialog, on the mounted dialog; verify `npm test` passes and removing the reset from Stay turns a test red
- [x] 10.5 Add `tests/composables/useDragDrop.test.ts` for the `sensor-can-go-forward` scenario "Dragging the sensor", with real pointer events; verify `npm test` passes and removing the drop into a slot turns a test red
- [x] 10.6 Add the three files to the `## Code` sections of `sensor-can-go-forward`, `program-execution`, `levels` and `app-shell`, and update `README.md`, `design.md`, `proposal.md` and `findings.md`; verify `npm run check:specs`, `npm run typecheck`, `npm test` and `npm run build` pass

## Workflow follow-up

- After the first push, check that the CI run on GitHub is green.
- Next change: delete `legacy/`. Then un-park `editing-and-session-fixes`, which updates the tests of the behaviour it changes and rebases its `block-use-item` delta on the requirement text changed here.
