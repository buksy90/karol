# Proposal

## Why

The game is now 32 JavaScript modules and 19 Vue components that pass the same few shapes around (program blocks, block definitions, interpreter steps, the world, levels) with nothing checking that they agree. Those shapes are described only in comments. Unit tests and the parked editing fixes come next, and both are easier and safer to write once the compiler knows the shapes.

## What Changes

- Every module under `src/` becomes TypeScript: `.js` files are renamed to `.ts` and every Vue component uses `<script setup lang="ts">`.
- The shared shapes get named types in one place: program block, block and sensor definitions, interpreter steps, world state, level, custom block, drag state, translation keys.
- Translation keys are checked against `locales/en.json`, so a misspelled key in code is a compile error.
- Type checking is strict and becomes part of the build: `npm run typecheck` checks everything, and `npm run build` fails when it fails.
- The comments that describe exported functions and types become doc comments (`/** … */`), so editors show them on hover. Types live in the TypeScript signatures, not in the comments.
- `vite.config.js` becomes `vite.config.ts`. `scripts/check-spec-refs.mjs` stays JavaScript and is type-checked through `// @ts-check` and JSDoc types.
- The `## Code` sections of the 16 capability specs, `README.md` and `index.html` are updated to the new file names.
- No behaviour changes. The game the player sees is the same before and after.

Not in this change: unit tests, deleting `legacy/`, a linter, and the parked `editing-and-session-fixes` change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No requirement changes; the change sets `skip_specs: true`. Only the file names listed in the specs' `## Code` sections change, and those are updated in the main specs directly as a task.

## Impact

- **Code**: all 32 `.js` files under `src/` are renamed and annotated; all 19 `.vue` files get typed props and a typed script block; `index.html` points at `src/main.ts`.
- **New files**: `src/logic/types.ts`, `src/env.d.ts`, `tsconfig.json`, `tsconfig.node.json`.
- **Dependencies** (development only): `typescript`, `vue-tsc`, `@types/node`.
- **Scripts**: new `typecheck`; `build` runs it first.
- **Specs and docs**: 45 path references across the 16 specs change from `.js` to `.ts`; `README.md` layout and "how to add" notes follow.
- **Delivered game**: still one `dist/index.html`. Types are erased at build time, so its size and behaviour stay the same apart from the few lines where strict checking needs a guard or a conversion.
- **Order of upcoming work**: this now comes before the unit-test change, so the tests are written against TypeScript from the start.
