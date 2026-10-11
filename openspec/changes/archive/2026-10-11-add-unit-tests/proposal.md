# Proposal

## Why

Nothing checks the game's rules automatically. Every change so far was verified by playing the game next to the legacy copy, which is slow and misses details. The two previous changes prepared for this: the rules sit in a logic layer with no Vue, Pinia or DOM, and the shapes are typed. The parked `editing-and-session-fixes` change alters behaviour in the stores and the interpreter, and it should land on code that tests already hold in place.

## What Changes

- Add Vitest as the test runner, with `npm test` (one run) and `npm run test:watch`.
- Add unit tests for the logic layer: world rules, program tree, interpreter, conditions, custom blocks, levels, translations, storage guard, and every block and sensor definition.
- Add unit tests for the Pinia stores: `execution`, `world`, `inventory`, `levels`, `customBlocks`, `program`, `settings`, `ui`. They run in Node, with no browser and no DOM emulation.
- Tests are named after the specs: one `describe` per requirement, one `it` per scenario, so a failing test points at the scenario it breaks.
- Tests pin the behaviour the code has today. Where code and spec disagree, the code is not changed here; the scenario is recorded as a `todo` test and listed as a finding.
- Add tests on mounted components, in happy-dom, for three things asked for after the first round: dragging the sensor from the library into a condition slot, the keyboard shortcuts, and the buttons of the win dialog.
- **Fix found by the tests:** Use item accepts only a whole number as a slot. With 1.5 the door used to open while the key stayed in the inventory; now 1.5 is an empty slot like 0 or 12.
- Add a GitHub Actions workflow that runs the type check, the tests, the spec reference check and the build on every push and pull request.
- The `## Code` section of each spec also lists the test files that cover it, so `npm run check:specs` catches a deleted or renamed test file.
- `README.md` gets the new commands and the `tests/` folder.
- No other behaviour changes.

Not in this change:

- Tests for the other Vue components and composables (rendering, the rest of drag and drop, sounds). Scenarios that are only about what is drawn, or about where exactly a block is dropped, stay manual.
- Browser or end-to-end tests.
- A coverage threshold. Coverage can be measured later, once there is a baseline worth guarding.
- Deleting `legacy/`. That is the change after this one.
- Fixing anything else the tests uncover, and the parked `editing-and-session-fixes` change.
- A linter or formatter.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-use-item`: a slot is named only by a whole number from 1 to 8; a number with a fraction is an empty slot.

No other requirement changes. The `## Code` sections of the main specs gain test file paths, and those are edited in the main specs directly as a task.

## Impact

- **New files**: `tests/` with one test file per logic module, block, sensor and store, three page-level test files, plus a few helpers; `.github/workflows/ci.yml`.
- **Dependencies** (development only): `vitest` and `happy-dom`. `pinia` and `vue` are already present and are what the store and component tests use.
- **Scripts**: new `test` and `test:watch`.
- **Configuration**: `vite.config.ts` gains a `test` section; `tsconfig.json` also includes `tests/`, so the tests are type-checked in strict mode with everything else.
- **Source code**: one line in `src/logic/world.ts` (`useItem`). Nothing else under `src/` changes.
- **Specs and docs**: the `## Code` sections of the 16 specs and `README.md`.
- **Delivered game**: unchanged apart from the slot number fix. Test files are not imported by `src/main.ts`, so nothing from them reaches `dist/index.html`.
- **Node**: Vitest 5 needs Node 22.12+, 24 or 26+. Development and CI use Node 24.
- **Order of upcoming work**: after this, `legacy/` can be deleted, and `editing-and-session-fixes` updates the tests of the behaviour it changes.
