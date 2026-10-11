# Tasks

## 1. Baseline and tooling

- [x] 1.1 Run `npm run build` on the unchanged code and copy `dist/index.html` to a location outside the repository as the baseline; verify the copy opens from disk and the game starts
- [x] 1.2 Add `typescript`, `vue-tsc` and `@types/node` as development dependencies; verify `npm install` succeeds and `npx tsc --version` and `npx vue-tsc --version` print versions
- [x] 1.3 Add `tsconfig.json` (application) and `tsconfig.node.json` (Vite config and scripts) with the settings in design decision 6; verify both are valid by running `npx tsc --showConfig -p` on each
- [x] 1.4 Add `src/env.d.ts` with the `vite/client` reference; verify the file is picked up (`npx tsc --listFilesOnly -p tsconfig.json` lists it)
- [x] 1.5 Add the `typecheck` script and make `build` run it first; verify `npm run typecheck` runs both projects and `npm run build` still produces `dist/index.html`
- [x] 1.6 Rename `vite.config.js` to `vite.config.ts`, add `// @ts-check` and JSDoc types to `scripts/check-spec-refs.mjs`; verify `npm run typecheck`, `npm run build` and `npm run check:specs` pass (the last one apart from the `vite.config.js` reference, fixed in 6.1)

## 2. Logic layer

- [x] 2.1 Create `src/logic/types.ts` with the shared types from design decision 3 and `MessageKey` from decision 4; verify it contains no run-time code and type-checks on its own
- [x] 2.2 Convert `src/logic/world.js`, `program.js`, `conditions.js`, `custom-blocks.js`, `interpreter.js`, `levels.js`, `i18n.js` and `storage.js` to `.ts` with typed signatures and doc comments on exports; verify no file in `src/logic` imports from Vue, Pinia, stores or components, and `npm run typecheck` reports no errors in `src/logic`
- [x] 2.3 Convert the nine modules in `src/blocks` and the two in `src/sensors` to `.ts`, each definition typed with its `BlockDef` member; verify a deliberately misspelled `labelKey` in one definition is reported by `npm run typecheck`, then restore it

## 3. Stores

- [x] 3.1 Convert `world`, `inventory`, `program`, `settings` and `ui` stores to `.ts` with a state interface each; verify `npm run typecheck` reports no errors in those files
- [x] 3.2 Convert `levels`, `customBlocks` and `execution` stores to `.ts`, typing the run session and timer kept outside the execution store; verify `npm run typecheck` reports no errors in `src/stores`

## 4. View

- [x] 4.1 Convert the four composables to `.ts`, with `DragState` defined beside the drag code and used by the `ui` store; verify `npm run typecheck` reports no errors in `src/composables`
- [x] 4.2 Switch all 18 components and `App.vue` to `<script setup lang="ts">` with type-based props and typed template refs; verify `npm run typecheck` reports no errors in any `.vue` file
- [x] 4.3 Rename `src/main.js` to `src/main.ts`, declare `stores`, `exportLevels` and `importLevels` in `src/env.d.ts`, and point `index.html` at `/src/main.ts`; verify `npm run dev` serves the game and `stores.world.robot`, `exportLevels()` work in the browser console
- [x] 4.4 Verify no `.js` file is left under `src/` and no import in `src/` ends in `.js`

## 5. Strictness

- [x] 5.1 Resolve every remaining type error following design decision 10, without `any`, `@ts-ignore` or `@ts-expect-error`; verify `npm run typecheck` exits with 0 and a search of `src/` for those three finds nothing

## 6. References and documentation

- [x] 6.1 Update the `## Code` sections of the 16 specs in `openspec/specs/` to the new file names; verify `npm run check:specs` passes and `npx openspec validate --specs --strict` passes
- [x] 6.2 Update `README.md`: file names in the layout, the "how to add" notes, the `typecheck` command, and one line on where shared types live; verify every path the README names exists

## 7. Integration checks

- [x] 7.1 Run `npm run build` and compare the script in `dist/index.html` with the baseline from 1.1; verify every difference is one of the cases in design decisions 9 and 10 and list them in the change's notes for review
- [x] 7.2 Open the built `dist/index.html` from disk with the network off; verify the game starts, level 1 is solved with Run, another level with Step, in English and in Slovak
- [x] 7.3 In the built game, create a custom block from a selection, use it, edit it, delete it, switch level and reload; verify behaviour matches the baseline file doing the same steps
