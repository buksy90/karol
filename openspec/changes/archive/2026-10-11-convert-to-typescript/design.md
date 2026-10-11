# Design

## Context

See proposal.md for motivation. The code has three layers, and the conversion keeps them:

- **Logic** (`src/logic`, `src/blocks`, `src/sensors`): plain functions and definition objects with no Vue, Pinia or DOM.
- **Stores** (`src/stores`): eight Pinia options stores.
- **View** (`src/components`, `src/composables`, `src/App.vue`, `src/main.js`).

Things observed in the code that shape the typing:

- A program block is one loose object `{id, type, n?, cond?, children?, ref?}`; which optional fields exist depends on the block definition, not on a tag in the data.
- Block definitions are object literals with a `kind` of `action`, `container`, `call` or `condition`. A condition is either a sensor (`evaluate`) or an operator (`operator: true`, `apply`).
- The interpreter is a generator. It yields four kinds of step and receives a boolean back after a condition step.
- `<input type="number" v-model="node.n">` writes a number, or an empty string when the field is cleared. The interpreter already copes with that (`(+node.n) || 1`).
- A map cell may be any character; unknown symbols are legal and behave as floor.
- All imports use explicit file extensions (`./world.js`).
- `main.js` assigns to `globalThis.stores` and to `window.exportLevels` / `window.importLevels`, and uses `import.meta.glob`. `SpecsDialog.vue` imports an HTML file with `?raw`.
- Node is 23.5, which does not run `.ts` files without a flag.

## Goals / Non-Goals

**Goals:**
- `strict` type checking with no errors, over `src/`, the Vite config and the script.
- One home for the shared types, importable by all three layers without breaking the layering.
- The built game behaves exactly as before.

**Non-Goals:**
- Redesigning the data model to make it "more typeable" (for example, tagging program blocks by kind).
- Rewriting stores to setup syntax or changing how components talk to each other.
- Unit tests, linting, formatting.
- Typing `legacy/`.

## Decisions

### 1. TypeScript files for the application, JSDoc types only for the Node script

Everything under `src/` and the Vite config become `.ts`. `scripts/check-spec-refs.mjs` stays JavaScript with `// @ts-check` and JSDoc types, and is included in type checking with `checkJs`.

*Why:* The application goes through Vite, which strips types for free. The script is run directly by Node 23.5, which would need a flag or an extra runner to execute TypeScript; 34 lines do not justify that.

*Alternative considered:* JSDoc types everywhere and no renames. It avoids touching the spec references, but generics, unions and generator types are clumsy in JSDoc, Vue's typed props need `lang="ts"` anyway, and the request is to convert to TypeScript.

### 2. Doc comments describe, signatures type

Existing `//` comments above exported functions, constants, types and store actions become `/** … */` doc comments. They carry no `{type}` annotations; `@param` and `@returns` are used only where the name and type do not already say it (for example the return value of `moveForward`). Comments inside function bodies stay as they are.

### 3. Shared types live in `src/logic/types.ts`

One module with types only, no runtime code:

| Type | Shape |
|---|---|
| `ProgramNode` | `{ id: string; type: string; n?: number \| ''; cond?: ProgramNode \| null; children?: ProgramNode[]; ref?: string }` |
| `BlockDef` | union of `ActionDef`, `ContainerDef`, `CallDef`, `SensorDef`, `OperatorDef`, discriminated by `kind` (and `operator` within conditions) |
| `Step` | `{t:'action', id, node, def: ActionDef}` \| `{t:'cond', id, cond}` \| `{t:'loop', id, cnt}` \| `{t:'stuck', id}` |
| `StepGenerator` | `Generator<Step, void, boolean \| undefined>` |
| `Env`, `RunContext` | what the interpreter passes to a definition's `run` |
| `ActionContext`, `ActionResult`, `SensorContext` | what `execute` and `evaluate` receive and return |
| `World`, `Robot`, `Probe`, `MoveResult`, `UseResult`, `Slots` | world state and the results of the world rules |
| `Level` | `{ id: string; name: string; map: string[] }` |
| `CustomBlock`, `CustomBlocks` | `{ name; body }` and the map by id |
| `Located` | the two results of `locate`: in a list, or in a condition slot |
| `MessageKey`, `Translate` | translation keys and the `t` function |

*Why here:* stores and components may import from logic, never the other way round, so logic is the only place all three layers can reach.

*Why one loose `ProgramNode`:* that is the shape the data has. A union tagged by block type would need every block type listed in the type module, which defeats "add a block by adding a module". Fields are optional and code that needs one checks for it, as it does today.

Closed sets get literal unions (block kind, step kind, why a move is blocked, the result of using an item, dialog kind, list key `'main' | 'draft'`). Map cells stay `string`, and the robot direction stays `number`, because narrowing them would need casts at every arithmetic step for no caught bug.

Types that only one module uses stay in that module: `DragState` with the drag code, each store's state interface in its store file.

### 4. Translation keys are derived from `locales/en.json`

`MessageKey = keyof typeof en`, with `resolveJsonModule` on. `labelKey` and `suffixKey` in block definitions, `say(key, …)` in action contexts and `t(key, …)` everywhere are typed with it. `sk.json` is typed as a partial dictionary, since a missing key falls back to English at run time.

*Why:* it turns the most common silent mistake, a mistyped key that shows up as raw text on screen, into a compile error, at no run-time cost.

`translate` keeps accepting any string for the key internally and keeps its "return the key itself" fallback, so behaviour is unchanged.

### 5. Imports keep explicit extensions, now `.ts`

`import { parseMap } from '../logic/world.ts'`, enabled by `allowImportingTsExtensions` with `noEmit`.

*Why:* it is the style the code already has, it is a mechanical rename, and it works unchanged in Vite, in a test runner and in Node's own type stripping.

*Alternative considered:* extensionless imports. More common in Vue projects, but Node cannot resolve them, which would constrain how the coming tests are run.

### 6. Compiler settings

Two projects, both `noEmit`:

- `tsconfig.json`: `src/**/*.ts`, `src/**/*.vue`, `src/env.d.ts`. `strict`, `target`/`lib` ES2022 plus DOM, `module` ESNext, `moduleResolution` bundler, `resolveJsonModule`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `types: ["vite/client"]`.
- `tsconfig.node.json`: `vite.config.ts`, `scripts/**/*.mjs`. `strict`, `checkJs`, `types: ["node"]`.

`npm run typecheck` = `vue-tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json`. `npm run build` = `npm run typecheck && vite build`.

*Why two projects:* browser code must not see Node globals and the other way round; with both sets loaded, `setInterval` and friends get the wrong types.

*Why the build type-checks:* Vite alone strips types without checking them, so without this a broken build could still be produced.

`noUncheckedIndexedAccess` stays off: the grid code indexes arrays on almost every line and the option would add a guard to each.

### 7. Globals and special imports are declared in `src/env.d.ts`

- `var stores` on `globalThis`, typed from the object built in `main.ts`.
- `exportLevels` and `importLevels` on `Window`.
- `vite/client` covers `import.meta.glob`, `?raw` and `.css` imports; `.vue` modules are understood by `vue-tsc`.

### 8. Stores keep the options syntax, with a typed state

Each store gets a state interface and `state: (): WorldState => ({ … })`. Actions and getters are inferred from that. The run session, timer and badge counter that live outside the execution store get explicit types (`Session | null`, `ReturnType<typeof setInterval> | undefined`).

### 9. Components use type-based props

`defineProps<{ node: ProgramNode; library?: boolean; ghost?: boolean }>()` replaces the runtime object form. Template refs are typed (`ref<HTMLCanvasElement | null>(null)`).

*Trade-off:* in a production build Vue drops the run-time type validation of such props. That validation only ever produced console warnings in development, and the compiler now checks the same thing earlier.

### 10. Where strict checking needs run-time code, pick the form that cannot change behaviour

Expected spots, found while reading the code:

| Place | Issue | Resolution |
|---|---|---|
| `useDragDrop`: `e.target`, `el.dataset.id` | `EventTarget`, `string \| undefined` | cast the target to `HTMLElement`; assert the data attributes, which every rendered block has |
| `execution` store: `session` inside `tick` | possibly null | read it into a local once, asserted non-null: `tick` only runs while a run exists |
| `translate`: `s.replace(…, v)` with a number | wrong argument type | `String(v)`, which is what `replace` did implicitly |
| `MapCanvas`: `getContext('2d')` | possibly null | assert: a canvas that never asked for another context type always has one |
| `program.ts`: `findNode` calls `locate` without a root key | missing argument | make the parameter optional |
| `customBlocks` store: `save` with no draft | possibly null | assert: the Save button exists only while the editor is open |
| `repeat-times`, `use-item`: `+node.n` | possibly undefined | assert: these blocks are created with a number |
| `world.ts`: `q.pop()` in the room fill | possibly undefined | assert: the loop runs only while the queue has entries |
| `levels.ts`: `normLevel` input | untyped JSON | parameter typed `unknown`, narrowed by the checks already there |

Type-only constructs (`as`, `!`, annotations) are preferred where the value is known to exist; a real guard is added only where the existing code would already have thrown. In the end no guard was needed: every case was settled with a type-only construct, so the only run-time differences are `String(v)` in `translate`, `timer` starting as undefined instead of null, and a few local aliases.

### 11. Proving nothing changed

Before the first rename, build once and keep `dist/index.html` as the baseline. After the conversion, build again and compare the two files. Types are erased, so the script inside should differ only at the places listed in decision 10 and in the prop definitions of decision 9. Every difference is read and accounted for; an unexplained one is a bug in the conversion.

On top of that: run the game from the built file and play one level by Run and one by Step in both languages, create and use a custom block, and reload.

## Risks / Trade-offs

- [A guard added for the compiler changes behaviour in an edge case] → decision 10 restricts guards to places that would have thrown anyway; the bundle comparison in decision 11 shows every such line.
- [Types drift from reality because they are too loose (`ProgramNode` with all fields optional)] → accepted for now; it matches the data. Tightening is possible later without touching callers that already check.
- [Pinia options stores infer `this` poorly when an action's return type depends on another action] → annotate the return type of the few actions that are called from other actions (`start(): boolean`).
- [The 45 spec references go stale mid-change] → the rename and the spec update are tasks in the same group, and `npm run check:specs` must pass before the group is done.
- [The parked change `editing-and-session-fixes` names no `.js` files but describes the single-file code] → unchanged by this; it already needs `/opsx:update` before it is applied.
- [`vue-tsc` and `typescript` versions fall out of step] → install both together and commit the lock file. TypeScript is held at 6.x: `vue-tsc` 3.3 cannot load TypeScript 7 yet.

## Migration Plan

1. Baseline build kept aside.
2. Tooling and configuration, with the code still JavaScript and type checking passing trivially.
3. Convert bottom-up: types module, logic, blocks and sensors, stores, composables, components, entry point. Type checking passes after each layer.
4. Update specs, README and `index.html`.
5. Compare bundles and smoke-test.

Rollback is reverting the commits; nothing persisted in the browser changes shape.
