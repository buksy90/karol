# Design

## Context

`index.html` holds the markup, about 100 lines of CSS, the English specs template, two translation dictionaries, seven levels and about 370 lines of script. All script state is global: the map, the robot, the inventory, the custom blocks, the run session, the drag state, the current level and language. Functions call each other freely across what the specs treat as separate capabilities.

Two things in the current code cannot survive a move to Vue as they are:

- The program is not a data structure. It is the page elements of the program panel, serialized to a tree only when a run starts. Dragging moves real elements between lists.
- Execution feedback (the pointer, the status dots, the rounds-left badge, the landing glow) is written as CSS classes and text straight onto those elements.

There are no tests. The behaviour was never verified in a browser by its author, and the baseline specs were written from reading the code. Node 23 and npm 10 are available; `package.json` exists and holds only the OpenSpec CLI.

## Goals / Non-Goals

**Goals:**

- The interface is Vue components; all runtime state is in Pinia stores.
- Every capability spec points at the stores, modules and components that implement it, and each block and sensor is one module.
- Adding a block, a sensor, a level or a language later means adding a file, not editing a shared one.
- The game logic can be unit-tested in the next change without Vue, Pinia or a browser.
- The built game behaves exactly as the current file does.

**Non-Goals:**

- Fixing any known gap. Bugs are carried over, not fixed, including the ones recorded in the baseline proposal.
- Unit tests and CI (next change). Deleting the legacy copy (the change after that).
- TypeScript, CSS preprocessing, a router.
- Loading levels or translations at run time. They are combined at build time.
- Persisting the program. The store makes it easy, but it belongs to the parked fixes change.

## Decisions

### Vite, with the build inlined into one file

Vite is the bundler, with its Vue plugin and `vite-plugin-singlefile`, so that `npm run build` writes one `dist/index.html` with script and styles inlined, Vue and Pinia included. Inline module scripts make no requests, so the built file still opens from disk, which keeps the delivery requirement true.

*Alternatives:* a normal multi-file build would need a web server to play and would break "open the file from disk". Loading Vue from a CDN would break "works offline".

Commands: `npm run dev` (development server with reload), `npm run build`, `npm run preview` (serves the built file), `npm run check:specs` (see below). `dist/` is ignored by git.

### Plain JavaScript, single-file components

Components are `.vue` files using `<script setup>`; everything else is JavaScript ES modules. TypeScript is left out: the rebuild is already large and unverified by tests, and it can be introduced later.

### Three layers: logic, stores, components

```
logic      plain functions and data; no Vue, no Pinia, no DOM
stores     Pinia; hold state, call logic, expose actions
components Vue; render stores, send user input to store actions
```

Imports point downward only: components import stores and logic, stores import logic, logic imports nothing from the other two. This replaces the event bus of the earlier draft: a component that needs to react to something watches the store.

The rule that matters for the next change: everything a unit test would want to check (can the robot move, what does a step do, is this level valid, what does the interpreter yield next) is a function in the logic layer that takes state and returns a result.

### Stores

| Store | Holds | Main actions |
|---|---|---|
| `world` | grid, crates, robot position and direction, room map, the loaded map | load a map, reset, apply a turn, a move, a door unlock |
| `inventory` | the 8 slots | add to first free slot, clear a slot, reset |
| `program` | the program tree of the current level | insert, move, remove a block; set a number; set or clear a condition; clear |
| `customBlocks` | custom blocks by id, the id counter | create, update, rename, delete with removal of all uses |
| `execution` | the run session, running or paused, speed, step count, the current block id, per-block status (executed, failed), per-loop rounds left, the active sonar | run, pause, step, stop, reset |
| `levels` | the level list, the current level id | load a level, import, export; persists to local storage |
| `settings` | language, sound on or off | set language, toggle sound; persists to local storage |
| `ui` | the status message, the open dialog, editor mode and the block being edited, select mode and the selection, the drag in progress, collapsed library sections, the block that just landed | say, open and close dialog, open and close editor, selection and drag actions |

`world` and `inventory` are separate stores as requested, although one capability spec covers both; the `world` spec's Code section lists both.

Stores never import components. A store may use another store (execution uses world, inventory, program and customBlocks).

### Stores on `globalThis` for debugging

After the stores are created, `main.js` assigns them to `globalThis.stores` as one object keyed by store name, for example `stores.world.robot` or `stores.program.blocks` in the browser console. It is in one clearly marked block so it can be removed or put behind a development-only check later. It is not relied on by any code.

`exportLevels()` and `importLevels()` stay on the window as the `levels` spec requires; they call the `levels` store.

### The program is a tree of blocks with stable ids

A block is `{ id, type, n?, cond?, children? }`, with `cond` being a condition block of the same shape (`not` holding its own `cond`) and `children` the body of a container. Custom blocks hold a body of the same shape. Ids are generated when a block is created from the library and when a selection is copied into a custom block.

Everything that was a class on an element becomes state keyed by block id in the `execution` or `ui` store: current block, executed, failed, rounds left, selected, just landed. The block component reads them. Clearing marks is clearing those maps.

The interpreter yields steps that carry the id of the block to highlight. For steps inside a custom block it carries the id of the call block in the program, as today's code does with elements.

### A block is a definition module plus one generic component

Each block and sensor module exports one definition:

- its type id, kind (action, container or condition) and library section;
- its label keys, and whether it has a number field (with its default and range), a condition slot or a body;
- what it does: an action function for action blocks, a generator for container blocks, an evaluate function for condition blocks. These are logic-layer functions over state passed in.

`src/blocks/index.js` and `src/sensors/index.js` list the definitions in library order. One component, `BlockItem.vue`, renders any block from its definition and recurses for bodies and conditions. A block needs its own component only if it ever needs a look the definition cannot describe; none does today.

### Drag and drop is rebuilt on pointer events over the store

The current drag code moves page elements, which Vue would fight. It is rebuilt as a composable that tracks the pointer and writes to the `ui` store (what is dragged, where it would land) and, on drop, to the `program` or `customBlocks` store.

No drag library is used. The specs fix the details: the dashed placeholder at the first block whose middle is below the pointer, the padding under END, the remove area over the map, an existing block returning home on a clumsy drop, a library copy being discarded, condition blocks fitting only slots, mouse and touch behaving the same. A library would decide several of these differently.

The dragged block is rendered as a floating copy that follows the pointer; the placeholder is rendered by the list component from the drop target in the store.

### The map stays a canvas

One component owns the canvas and an animation-frame loop that draws from the `world` store and the sonar state in `execution`. The drawing code moves as it is. The interpolated robot position and angle are local to the component, not store state, because they are presentation.

The remove area that covers the map during a drag is a sibling element in the same component.

### Translations stay a small lookup

`locales/en.json` and `locales/sk.json` are flat objects from key to text. A `t(key, ...args)` function reads the language from the `settings` store, so every template that calls it re-renders on a language switch; the explicit relabelling pass disappears. Fallback to English for a missing key is unchanged. `vue-i18n` is not added: the need is one function.

Adding a language means adding a file and one entry in the language list.

### Levels as files

Each built-in level is `levels/<id>.json` holding the level object as it is today (`id`, `name`, `map`). The `levels` store receives them from a build-time glob import, ordered by file name with numeric-aware comparison so `level-10` sorts after `level-9`. The object can later gain fields such as a description or constraints without changing the loader. The built-in level version (`karol.ver`) stays at 5 because the levels do not change.

### Layout

```
index.html                     mount point; loads src/main.js
levels/level-1.json ...        one built-in level per file
locales/en.json, sk.json       one dictionary per language
legacy/karol-artifact.html     the original single file, for comparison
scripts/check-spec-refs.mjs    verifies the paths in the specs' Code sections
vite.config.js
src/
  main.js                      creates the app and stores; debug exposure
  App.vue                      the two-column layout
  styles.css
  logic/
    world.js                   map parsing, room detection, cell rules
    interpreter.js             the step generator
    conditions.js              condition evaluation and text
    levels.js                  validation, versioned merge
    program.js                 tree helpers: find, insert, move, remove, copy
    custom-blocks.js           cycle detection, removing uses
    storage.js                 guarded local storage access
    i18n.js                    key lookup with fallback
  blocks/
    index.js, turn-left.js, move-forward.js, use-item.js,
    repeat-times.js, if.js, repeat-while.js, not.js, custom-call.js
  sensors/
    index.js, can-go-forward.js
  stores/
    world.js, inventory.js, program.js, customBlocks.js,
    execution.js, levels.js, settings.js, ui.js
  composables/
    useDragDrop.js, useSounds.js, useShortcuts.js, useT.js
  components/
    TopBar.vue, InventoryBar.vue, StatusLine.vue, MapCanvas.vue,
    BlockLibrary.vue, CustomBlockLibrary.vue, ProgramPanel.vue,
    BlockList.vue, BlockItem.vue, ConditionSlot.vue,
    CustomBlockEditor.vue, SpeedButtons.vue, RunControls.vue,
    AppDialog.vue, LevelsDialog.vue, OptionsDialog.vue,
    SpecsDialog.vue, WinDialog.vue
    specs-en.html
```

### Capability to code

| Capability | Code |
|---|---|
| `world` | `src/logic/world.js`, `src/stores/world.js`, `src/stores/inventory.js`, `src/components/MapCanvas.vue`, `src/components/InventoryBar.vue` |
| `block-turn-left` | `src/blocks/turn-left.js` |
| `block-move-forward` | `src/blocks/move-forward.js` |
| `block-use-item` | `src/blocks/use-item.js` |
| `block-repeat-times` | `src/blocks/repeat-times.js` |
| `block-if` | `src/blocks/if.js` |
| `block-repeat-while` | `src/blocks/repeat-while.js` |
| `block-not` | `src/blocks/not.js` |
| `sensor-can-go-forward` | `src/sensors/can-go-forward.js` |
| `conditions` | `src/logic/conditions.js`, `src/components/ConditionSlot.vue`, the sonar part of `src/components/MapCanvas.vue` |
| `custom-blocks` | `src/logic/custom-blocks.js`, `src/stores/customBlocks.js`, `src/blocks/custom-call.js`, `src/components/CustomBlockLibrary.vue`, `src/components/CustomBlockEditor.vue` |
| `program-execution` | `src/logic/interpreter.js`, `src/stores/execution.js`, `src/components/RunControls.vue`, `src/components/SpeedButtons.vue`, `src/composables/useShortcuts.js` |
| `levels` | `src/logic/levels.js`, `src/stores/levels.js`, `src/components/LevelsDialog.vue`, `src/components/WinDialog.vue`, `levels/*.json` |
| `language-support` | `src/logic/i18n.js`, `src/composables/useT.js`, `src/stores/settings.js`, `locales/*.json` |
| `program-editor` | `src/logic/program.js`, `src/stores/program.js`, `src/blocks/index.js`, `src/composables/useDragDrop.js`, `src/composables/useSounds.js`, `src/components/BlockLibrary.vue`, `src/components/ProgramPanel.vue`, `src/components/BlockList.vue`, `src/components/BlockItem.vue` |
| `app-shell` | `index.html`, `src/main.js`, `src/App.vue`, `src/styles.css`, `src/stores/ui.js`, `src/stores/settings.js`, `src/components/TopBar.vue`, `StatusLine.vue`, `AppDialog.vue`, `OptionsDialog.vue`, `SpecsDialog.vue`, `vite.config.js` |

### One shared rule for "can the robot move forward"

The rules for entering a cell and pushing a crate exist twice today, once in Move forward and once in the Can go forward sensor. They become one function in `src/logic/world.js` that both call. The two copies are identical in behaviour.

### The original file is kept for comparison

The current `index.html` is copied unchanged to `legacy/karol-artifact.html`. It is not part of the build. With no tests, playing the same level in both files side by side is the main way to confirm nothing changed. It is deleted in a later change, after the unit tests.

### Code references in the specs

Each main spec gets a `## Code` section between Purpose and Requirements listing its files with a few words each, taken from the table above. A spike confirmed that OpenSpec's strict validation accepts this section and that archiving a later change leaves it in place. Delta specs cannot express it, so the main specs are edited directly as a task of this change.

`scripts/check-spec-refs.mjs` reads every `## Code` section and fails if a listed path does not exist, so the references cannot silently rot when files move.

### The in-app specs text

The specs template moves to `src/components/specs-en.html`, imported as text and shown by `SpecsDialog.vue`. Its "Technical notes" paragraph, which says the game is one HTML file with no dependencies and that the program is read from the DOM, is corrected. Nothing else in it changes.

### One defect of the original is not reproduced

In the original, dragging a condition block out of its slot leaves a stray placeholder box behind in that slot, so the slot no longer shows "?" although it is empty. This comes from how the old drag code moved page elements and contradicts the `conditions` spec. The rebuilt drag shows the slot empty, as specified. Every other behaviour, including the known gaps, is carried over as it is.

### Verification by automated side-by-side comparison

Equivalence was checked by driving the original and the built file in two browsers with the same mouse, touch and keyboard input and comparing after every action: the program as rendered, status text, marks, dialogs, world state, layout boxes and the pixels of the map at rest. The comparison scripts were throwaway and are not part of the repository; the unit-test change will add permanent tests.

## Risks / Trade-offs

- [The editor is rewritten, so drag behaviour can differ in details nobody notices] -> The `program-editor` and `conditions` scenarios are walked through with a mouse and on a touch device against the legacy file, as their own task.
- [Execution feedback is rewritten from classes to state] -> Checked with Step on programs covering every block kind, loops inside custom blocks included, comparing the pointer, dots and badges step by step with legacy.
- [Timing differs because Vue batches updates] -> The run interval, the 0.7 s win delay, the 2 s landing glow and the sonar durations are named constants taken from the current code and compared by eye at 1x and 15x.
- [Reactivity cost of the world grid in the draw loop] -> The canvas reads plain values each frame; if profiling shows a cost, the grid is held as a shallow reference. Maps are at most a few hundred cells.
- [The built file is several times larger] -> Accepted; it is still one file that opens from disk.
- [Global store access invites code to depend on it] -> One marked block in `main.js`; nothing imports from `globalThis`.
- [The parked change `editing-and-session-fixes` refers to the single file] -> Its specs stay valid; its design and tasks are refreshed with `/opsx:update` after this change is archived. Several of its items become simpler with the program in a store.
- [The reference copy doubles the code in the repository] -> Temporary and clearly named.

## Migration Plan

1. Tooling first, with an empty Vue app that builds to one file, so the build is proven before any code moves.
2. Logic layer, then stores, then components, building after each group.
3. Editor interactions last, once there is a program panel to drag onto.
4. `## Code` sections and the reference check once the files exist.
5. Rollback at any point is a git revert; the legacy copy remains playable throughout.

## Open Questions

- Whether the debug exposure should later sit behind a development-only check or be removed. Does not affect this change.
