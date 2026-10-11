# Proposal

## Why

The whole game is one 500-line `index.html` with every function and variable global, and the program the player builds exists only as page elements. The specs now describe 16 capabilities, but nothing in the code corresponds to them, so a change to one capability means editing a file that holds all of them. Before the specs and the code start evolving together, the code needs the same shape as the specs, and its state needs to be data that can be inspected, stored and tested.

## What Changes

- Rebuild the user interface as Vue 3 components over Pinia stores that hold the runtime state: the world, the inventory, the program, custom blocks, execution, levels, settings and interface state.
- Move the game logic (world rules, interpreter, level validation, block definitions) into plain modules that depend on neither Vue nor Pinia, one area of code per capability.
- The program becomes data in a store instead of living in the page elements. Every block gets a stable id.
- Add a bundler (Vite) that builds components, modules, styles and data files into the application. The build output is still one self-contained HTML file, with Vue and Pinia included in it.
- Move data out of code: one `.json` file per built-in level in a `levels` directory, and one `.json` file per language in a `locales` directory. The bundler combines them into the application.
- Expose the stores on `globalThis` for debugging. This is temporary.
- Add a `## Code` section to each of the 16 capability specs listing the stores, modules and components that implement it, and a script that checks every listed path exists.
- Keep the original artifact as a reference copy so the built game can be compared with it side by side. It is deleted in a later change, after unit tests exist.
- **Behaviour does not change.** The built game must do exactly what the specs in `openspec/specs/` describe today. The only spec-level difference is how the game is delivered: the playable file is produced by the build instead of being the source file itself. **BREAKING** for anyone opening the source `index.html` straight from disk.

Not in this change:

- Any fix or feature, including everything in the parked `editing-and-session-fixes` change. That change was written against the single file and will need its design and tasks refreshed once this one lands.
- Unit tests. They are the next change; the logic modules are kept free of Vue, Pinia and the DOM so that tests can be added without restructuring.
- Deleting the legacy copy. That follows the unit tests.
- TypeScript, a drag-and-drop library, a translation library.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: the "Self-contained delivery" requirement changes from "the game is a single HTML file" to "the build produces a single HTML file".
- `program-editor`: the "Drop outside a list" requirement is corrected to what the original game does. Comparing the two in a browser showed that a block released outside a list lands at the last previewed position; the baseline spec said it always returns home or is discarded. The behaviour is unchanged, only its description.

All 16 capability specs also gain a `## Code` section. That is documentation, not a requirement change, so it is done by editing the main specs directly and is listed in the tasks, not as deltas.

## Impact

- `index.html` becomes a mount point; the interface moves to `.vue` components, state to stores and logic to modules under `src/`, built-in levels to `levels/`, translations to `locales/`.
- New runtime dependencies, bundled into the built file: Vue 3 and Pinia. New development dependencies: Vite, its Vue plugin and a plugin that inlines the build into one file. Node.js is required to build; it is not required to play the built file.
- The built file grows from about 50 KB to a few hundred KB because it now contains Vue.
- New commands: start a development server, build, preview the build, check spec code references.
- `package.json`, `.gitignore` and a new Vite configuration file.
- `openspec/specs/*/spec.md`: a `## Code` section in each.
- Risk: the editor and the execution feedback are rewritten, not moved, and there are no automated tests, so equivalence with the original is checked by hand against the spec scenarios.
