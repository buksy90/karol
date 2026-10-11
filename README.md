# Robot Karol

A visual-programming game for kids. The player builds a program from blocks and a robot runs it on a tile map: it walks, pushes crates, picks up keys, unlocks doors and has to reach the exit. English and Slovak.

What the game does is described in `openspec/specs/`, one specification per capability. Each has a `## Code` section listing the files that implement it.

## Commands

```
npm install          # once
npm run dev          # development server with live reload
npm run build        # writes dist/index.html
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

```
index.html            mount point
levels/               built-in levels, one .json file each
locales/              translations, one .json file per language
src/
  main.js             start-up order; debug access to the stores
  App.vue             the two-column layout
  styles.css
  logic/              world rules, interpreter, conditions, program tree, levels, i18n, storage
  blocks/             one module per block, and the registry (index.js)
  sensors/            one module per sensor, and the registry (index.js)
  stores/             world, inventory, program, customBlocks, execution, levels, settings, ui
  composables/        drag and drop, sounds, keyboard shortcuts, translation
  components/         the interface
scripts/              check-spec-refs.mjs
legacy/               the original single-file game, kept for comparison until unit tests exist
openspec/             specifications and changes
```

Adding things:

- **A block or sensor**: add a module in `src/blocks/` or `src/sensors/` and list it in that folder's `index.js`.
- **A level**: add `levels/<id>.json` with `id`, `name` and `map`. Files are ordered by name, numbers compared as numbers.
- **A language**: add `locales/<code>.json` and an entry in `LANGUAGES` in `src/stores/settings.js`.

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
