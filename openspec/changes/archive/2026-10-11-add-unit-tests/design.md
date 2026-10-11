# Design

## Context

See proposal.md for motivation. Things observed in the code that shape the tests:

- **The logic layer is pure.** `src/logic`, `src/blocks` and `src/sensors` take state and return results. Nothing there touches Vue, Pinia or the DOM, so it runs in Node as it is.
- **The stores need almost no browser.** They use `setInterval`, `setTimeout`, `performance.now` and `console.log`, which Node has. `logic/storage.ts` wraps `localStorage` in try/catch, and `settings.ts` guards `navigator` and `document` with `globalThis.` checks. The `ui` store imports only a type from `composables/useDragDrop.ts`.
- **Some state lives outside the stores.** `stores/execution.ts` keeps the run `session`, the `timer` and `badgeSeq` in module variables, and `logic/program.ts` keeps the id counter `seq`. A fresh Pinia does not reset them.
- **The interpreter is a generator** that yields `Step` objects and receives a boolean after each condition step. The loop that executes steps (`tick`) is in the `execution` store, not in the logic layer.
- **Time matters in three places:** the run timer (`BASE_INTERVAL / speed`), the delay before the win dialog (`WIN_DELAY`), and the generated level id (`Date.now()`).
- **Specs are scenario lists.** The 16 specs hold 222 scenarios. Many are about rules (moving, crates, keys, loops, level validation); others are about what is drawn or dragged.
- `npm run check:specs` reads every `- \`path\`` line in a spec's `## Code` section and fails when the path does not exist.
- Vite is 8.3, Node is 23.5 locally. Vitest 5.0 lists Vite 8 as a supported peer.
- The repository has a GitHub remote and no workflow yet.

## Goals / Non-Goals

**Goals:**
- Every rule the player can observe through the logic layer and the stores has a test named after its scenario.
- Tests run in a few seconds, with no browser and no network.
- The few scenarios that live in a component or a composable and were asked for (dragging the sensor, the keyboard shortcuts, the win dialog) are tested on a real mounted component.
- Tests are type-checked in strict mode like the rest of the code.
- A push or pull request that breaks a test, the types, a spec reference or the build is reported by CI.

**Non-Goals:**
- Changing any file under `src/` to make it easier to test. The one source change is the slot number fix of decision 12.
- A test for every one of the 222 scenarios. Scenarios about rendering, layout, sounds and most drag gestures are left out.
- A component test library. Components are mounted with Vue itself; no `@vue/test-utils`.
- Coverage measurement or thresholds.

## Decisions

### 1. Vitest

Vitest 5 is the runner, configured in the existing `vite.config.ts` through `defineConfig` from `vitest/config`.

*Why:* It reads the Vite config the project already has, so TypeScript, JSON imports, imports with `.ts` extensions and `import.meta.glob` work in tests exactly as in the app, with no second toolchain. It also brings fake timers and global stubs, which the store tests need.

*Alternatives considered:* Node's built-in test runner needs a flag or a loader to run TypeScript on Node 23.5 and has no answer for `import.meta.glob`. Jest needs its own transform setup for ES modules and TypeScript.

### 2. Node environment; a DOM only for the files that ask for one

`test.environment` is `node`. A test file that mounts a component starts with `// @vitest-environment happy-dom` and runs in happy-dom; those files are in `tests/components` and `tests/composables`. Tests that need storage stub `localStorage` with an in-memory object (`vi.stubGlobal`); tests of the default language stub `navigator`.

*Why:* The logic and store tests need no DOM. A missing `localStorage` is itself a specified case (the game keeps working when storage is blocked), and Node gives it for free. Starting a DOM costs about two seconds per file, so only the three files that need one pay for it.

*Alternative considered:* `happy-dom` for all tests. It would hide the storage-blocked path and slow every file down. `jsdom` would do as well; happy-dom is lighter and has `PointerEvent`.

The page-level tests mount the real component with `createApp` and the test's Pinia (`tests/helpers/dom.ts`) and drive it with real events: `KeyboardEvent` on the document, `click()` on buttons, `PointerEvent` for a drag. happy-dom lays nothing out, so a drag test sets what `document.elementFromPoint` returns to say which element is under the pointer. That covers where a drop goes; it cannot cover positions that depend on geometry, such as "between two blocks".

### 3. Tests live in `tests/`, mirroring `src/`

```
tests/
  helpers/
    world.ts          a world from map rows; empty inventory slots
    program.ts        short builders for program blocks on top of createNode and the real defs
    stores.ts         fresh Pinia, in-memory localStorage, load a map, play a program to its end
  logic/              world, program, interpreter, conditions, custom-blocks, levels, i18n, storage
  blocks/             one file per block, and the registry (index)
  sensors/            can-go-forward
  stores/             execution, world (with inventory), levels, customBlocks, program, settings, ui
  data/               built-in levels and locale files
  components/         the win dialog, mounted in happy-dom
  composables/        keyboard shortcuts and dragging the sensor, mounted in happy-dom
```

`tests/helpers/dom.ts` holds the mount, unmount and click helpers of those two folders.

Every test file is `<module>.test.ts`. `test.include` is `tests/**/*.test.ts`.

*Why:* `src/blocks` and `src/sensors` follow "one module per block"; test files beside them would double those folders and blur that rule. A separate tree also keeps test helpers out of `src/`.

*Alternative considered:* `*.test.ts` beside each module. Shorter imports, but see above.

### 4. Tests are type-checked with the application

`tsconfig.json` includes `tests/**/*.ts` next to `src/`. Tests import `describe`, `it`, `expect`, `vi` and the hooks from `vitest` explicitly; `test.globals` stays off.

*Why:* Explicit imports need no extra `types` entry and keep the "nothing is ambient" habit of the code. One tsconfig keeps `npm run typecheck` a single truth.

### 5. Test names come from the specs

Each `describe` is named `<capability>: <Requirement name>` and each `it` is the scenario name, word for word. A test that covers something no scenario states (an edge of a helper function, for example) sits in a `describe` named after the function.

*Why:* A red test then names the promise that broke, and a reader can search the spec for it. It also shows which scenarios have no test.

### 6. Two levels of test

- **Logic tests** call the functions directly: `parseMap`, `probeForward`, `moveForward`, `useItem`, `locate`, `stripCalls`, `uses`, `normLevel`, `translate` and so on. Interpreter tests collect the `Step`s that `runList` yields for a program, sending scripted answers to condition steps, and check the limits (`STEP_LIMIT` is enforced by the store; `LOOP_LIMIT` and `MAX_DEPTH` by the generator).
- **Scenario tests** go through the stores. The `stores.ts` helper loads a map into the `world` store, puts a program into the `program` store and calls `execution.stepOnce()` until the run ends, recording the status line after each step. Block scenarios such as "Repeat while walks to the wall" or "a failed move stops the program" are checked on the result: robot position, inventory, `ok`/`err` marks, `counts`, the final status text.

Action definitions (`move`, `rot`, `use`) are also tested directly through `execute` with a recording `say`.

*Why:* The loop that turns steps into robot behaviour is `tick` in the `execution` store. Rebuilding it in a logic-only helper would test the helper, not the game.

Status texts are compared with the English dictionary through the `settings` store's `t`, not with literal strings, so rewording a message does not break tests.

### 7. Isolation between tests

The `stores.ts` helper provides a setup used in `beforeEach` and a teardown used in `afterEach`:

- setup: `setActivePinia(createPinia())`, stub `localStorage`, `vi.useFakeTimers()`;
- teardown: `useExecutionStore().end()` to drop the module-level session and timer, `vi.useRealTimers()`, `vi.unstubAllGlobals()`.

Block ids come from a module counter, so tests never expect a literal id such as `b3`; they keep the node the builder returned and use its `id`.

Timed behaviour is driven with fake timers: Run advances by `BASE_INTERVAL / speed` per step, the win dialog opens after `WIN_DELAY`.

### 8. Tests pin today's behaviour

Tests are written against the main specs and must pass on the unchanged code, with the one exception of decision 12. When a scenario does not hold:

- the test is written as `it.todo('<scenario name>')` with a one-line comment saying what the code does instead;
- nothing under `src/` is changed;
- the mismatch goes into a findings list reported at the end of the apply phase, for the owner to decide whether the spec or the code is wrong.

Behaviour that `editing-and-session-fixes` will change (a too-deep custom block is skipped, the Repeat count is clamped at run time, a drag cancels a paused run) is tested as it is now. That change updates those tests.

### 9. Data tests

`tests/data` checks the shipped content, loaded with `import.meta.glob` the same way `src/main.ts` loads it:

- every `levels/*.json` passes `normLevel`, ids are unique, and the id matches the file name;
- `locales/sk.json` has exactly the keys of `locales/en.json`, and placeholders (`{0}`, `{1}`) match per key.

*Why:* A new level or text is the most common future edit, and neither the compiler nor the specs check the content.

### 10. Scripts and CI

- `npm test` is `vitest run`; `npm run test:watch` is `vitest`.
- `npm run build` does not run the tests. The build stays what it is; CI is where everything runs together.
- `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: checkout, Node 24 with the npm cache, `npm ci`, `npm test`, `npm run check:specs`, `npm run build` (which type-checks first).

*Why Node 24:* It is the current LTS line. Node 23, used locally, is past its end of life and not offered as a maintained CI version.

### 11. Specs list their tests

Each spec's `## Code` section gets one line per test file that covers it, in the same `- \`path\` - what` form:

| Spec | Test files |
|---|---|
| `world` | `tests/logic/world.test.ts`, `tests/stores/world.test.ts` |
| `block-turn-left`, `block-move-forward`, `block-use-item`, `block-repeat-times`, `block-if`, `block-repeat-while`, `block-not` | `tests/blocks/<module>.test.ts` |
| `sensor-can-go-forward` | `tests/sensors/can-go-forward.test.ts`, `tests/composables/useDragDrop.test.ts` |
| `conditions` | `tests/logic/conditions.test.ts`, `tests/stores/execution.test.ts` (checks as steps, status text, sonar state) |
| `custom-blocks` | `tests/logic/custom-blocks.test.ts`, `tests/blocks/custom-call.test.ts`, `tests/stores/customBlocks.test.ts` |
| `program-editor` | `tests/logic/program.test.ts`, `tests/stores/program.test.ts`, `tests/stores/ui.test.ts`, `tests/blocks/index.test.ts` |
| `program-execution` | `tests/logic/interpreter.test.ts`, `tests/stores/execution.test.ts`, `tests/composables/useShortcuts.test.ts` |
| `levels` | `tests/logic/levels.test.ts`, `tests/stores/levels.test.ts`, `tests/data/levels.test.ts`, `tests/components/WinDialog.test.ts` |
| `language-support` | `tests/logic/i18n.test.ts`, `tests/stores/settings.test.ts`, `tests/data/locales.test.ts` |
| `app-shell` | `tests/stores/settings.test.ts`, `tests/stores/ui.test.ts`, `tests/logic/storage.test.ts`, `tests/composables/useShortcuts.test.ts` |

*Why:* It is the project's rule for added files, and `check:specs` then fails when a test file is deleted or renamed without the spec following.

### 12. A slot is named by a whole number only

The tests found that Use item with 1.5 opened the door and kept the key: the slot was read at `(n | 0) - 1` and cleared at `n - 1`. The owner decided that only a whole number names a slot. `useItem` now treats any number that is not an integer as an empty slot, the same way it already treats 0 or 12: "Slot 1.5 is empty.", a red dot, nothing used, and the program continues. This is the one behaviour change of this change and has a spec delta for `block-use-item`.

*Alternative considered:* rounding 1.5 down to slot 1. It would hide a typing mistake from the player, and a child should see that 1.5 is not a slot.

The parked `editing-and-session-fixes` change also modifies `block-use-item` (the field will refuse such numbers). Its delta has to be rebased on this requirement text when it is un-parked.

## Risks / Trade-offs

- [A Vite plugin meant for the build (`vite-plugin-singlefile`, `@vitejs/plugin-vue`) interferes with the test run] → Checked in the first task with a trivial test. If it does, the test settings move to a separate `vitest.config.ts` without those plugins.
- [Vitest 5 does not support Node 23] → Development moved to Node 24, which CI uses as well.
- [Scenario tests go through several stores, so one bug can turn many tests red] → Logic tests cover the same rules one level down and show where the fault is.
- [Tests pin behaviour that the parked change will alter] → Intended; that change edits the affected tests, and the diff shows exactly which promises moved.
- [Most scenarios about rendering and dragging stay untested] → They remain manual checks. The mount helper and the drag test show how to add more.
- [A drag test trusts the test about what is under the pointer] → It checks the decision the drop code makes, not the hit testing of a browser. Geometry stays a manual check.
- [Module-level state leaks between tests when a teardown is forgotten] → The setup and teardown live in one helper that every store test uses; Vitest also isolates module state per test file.
- [`tests/` paths in `## Code` sections make the sections longer] → One or two lines per spec.

## Migration Plan

1. Tooling first, proven with one trivial test.
2. Helpers, then logic tests, then block and sensor tests, then store tests, then data tests. `npm test` and `npm run typecheck` pass after every step.
3. Spec `## Code` sections and README.
4. CI workflow last, when everything it runs is green locally.

Rollback is a git revert. The only file under `src/` that changes is `src/logic/world.ts`, for the slot number fix.
