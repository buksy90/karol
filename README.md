# Robot Karol

A visual-programming game for kids. The player builds a program from blocks and a robot runs it on a tile map: it walks, pushes crates, picks up keys, unlocks doors and has to reach the exit. English and Slovak.

What the game does is described in `openspec/specs/`, one specification per capability. Each has a `## Code` section listing the files that implement it.

## Commands

```
npm install          # once
npm run dev          # development server with live reload
npm run typecheck    # strict TypeScript check of the application, the tests, the Vite config and the scripts
npm run build        # type-checks, then writes dist/index.html
npm test             # runs the unit tests once
npm run test:watch   # runs them again on every change
npm run preview      # serves the built file
npm run check:specs  # checks that every file listed in a spec's Code section exists
```

The build output is a single self-contained `dist/index.html`. It opens straight from disk and works offline. The source `index.html` does not; use the development server.

## Structure

Three layers. Imports only point downward.

| Layer | Where | What |
|---|---|---|
| Components | `src/App.vue`, `src/components/`, `src/composables/` | Vue. Render the stores and pass user input to them. |
| Stores | `src/stores/` | Pinia. Hold the runtime state and call the logic. |
| Logic | `src/logic/`, `src/blocks/`, `src/sensors/` | Plain functions and data. No Vue, no Pinia, no DOM. |

The code is TypeScript, checked in strict mode. The shapes shared by all layers (program block, block and sensor definitions, interpreter steps, world, level) are in `src/logic/types.ts`. Imports name the file with its `.ts` extension. Translation keys are typed from `locales/en.json`, so a misspelled key fails the type check.

```
index.html            mount point
levels/               built-in levels, one .json file each
locales/              translations, one .json file per language
src/
  main.ts             start-up order; debug access to the stores
  env.d.ts            globals: the debug stores, the console functions
  App.vue             the two-column layout
  styles.css
  logic/              shared types (types.ts), world rules, interpreter, conditions, program tree, levels, i18n, storage
  blocks/             one module per block, and the registry (index.ts)
  sensors/            one module per sensor, and the registry (index.ts)
  stores/             world, inventory, program, customBlocks, execution, levels, settings, ui
  composables/        drag and drop, sounds, keyboard shortcuts, translation
  components/         the interface
tests/                unit tests for the logic and the stores, laid out like src/
scripts/              check-spec-refs.mjs
legacy/               the original single-file game, kept for comparison; to be deleted now that unit tests exist
openspec/             specifications and changes
```

Adding things:

- **A block or sensor**: add a module in `src/blocks/` or `src/sensors/` and list it in that folder's `index.ts`. Type the definition with `satisfies` and the matching type from `src/logic/types.ts` (`ActionDef`, `ContainerDef`, `SensorDef`, `OperatorDef`).
- **A level**: add `levels/<id>.json` with `id`, `name` and `map`. Files are ordered by name, numbers compared as numbers.
- **A text**: add the key to `locales/en.json` first; that is what makes it usable in code.
- **A language**: add `locales/<code>.json` and an entry in `LANGUAGES` in `src/stores/settings.ts`.

## Tests

The unit tests cover the logic layer and the stores. They run in Node with [Vitest](https://vitest.dev), with no browser. Three files go further and mount real components in [happy-dom](https://github.com/capricorn86/happy-dom): the keyboard shortcuts, the win dialog, and dragging the sensor into a slot. Rendering, sounds and the rest of drag and drop are not covered; check those by hand.

```
tests/
  helpers/            worlds from map rows, short builders for program blocks, store setup and "play a program", mounting a component
  logic/              one file per module in src/logic
  blocks/, sensors/   one file per block and sensor, and the registry
  stores/             one file per store (the inventory is covered with the world)
  data/               the level files and the translations
  components/         components mounted on a page
  composables/        composables used by a component mounted on a page
```

- **Names come from the specs.** A `describe` is `<capability>: <Requirement name>` and an `it` is the scenario name, word for word, so a failing test names the scenario it breaks. Tests of something no scenario states sit in a `describe` named after the function.
- **Tests pin what the game does.** A change that alters behaviour changes the spec and the test together.
- **Store tests** call `setupStores()` in `beforeEach` and `teardownStores()` in `afterEach` (`tests/helpers/stores.ts`). That gives fresh stores, local storage in memory and fake timers, and drops the run in progress, which lives outside the store. `play(...)` steps a program to its end; `run(...)` lets the timer run it, which keeps each block's own message in the status line.
- **Page-level tests** start with the line `// @vitest-environment happy-dom` and use `mount`, `unmount`, `rendered` and `click` from `tests/helpers/dom.ts`. happy-dom lays nothing out, so a drag test sets what `document.elementFromPoint` returns to say what is under the pointer; see `tests/composables/useDragDrop.test.ts`. Each such file costs about two seconds to start, so use one only for what lives in a component.
- **A new block or sensor** gets its test file next to the others, and its spec lists it in the `## Code` section. A new level file or text is checked by `tests/data` without any change.
- **CI** (`.github/workflows/ci.yml`) runs the tests, the spec reference check and the build on every push to `main` and every pull request.

Vitest 5 needs Node 22.12+, 24 or 26+. Use Node 24, as CI does.

## Debugging

The stores are available in the browser console as `stores`, for example:

```js
stores.world.robot          // { x, y, d }
stores.inventory.slots
stores.program.blocks       // the program tree
stores.execution.speed
```

This is temporary and for debugging only. Nothing in the code reads the stores from there.

Two console functions are part of the game: `exportLevels()` prints and returns the levels, and `importLevels(levels)` merges levels by id.
