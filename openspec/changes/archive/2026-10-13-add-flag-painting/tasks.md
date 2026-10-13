# Tasks

Test names follow the README: `describe('<capability>: <Requirement name>')` and `it('<Scenario name>')`; a test of something no scenario states sits in a `describe` named after the function. Each group ends green on `npm run typecheck`, `npm test` and `npm run check:specs`. The `## Code` sections are edited in the main specs under `openspec/specs/`, because a delta spec cannot carry them.

## 1. Inventory items as objects

- [x] 1.1 In `src/logic/types.ts` add `Color`, `Position`, `Item` (`{type:'key'}` or `{type:'spray', color, uses}`) and change `Slots` to `(Item | null)[]`. In `src/logic/world.ts` remove `KEY`, make `moveForward` put `{type:'key'}` into the slot and `useItem` test `item.type === 'key'`. Verify `npm run typecheck` reports only the places that still treat a slot as text
- [x] 1.2 Add `key()` and `spray(color, uses)` builders to `tests/helpers/world.ts` and replace every `🔑` slot value and `KEY` import in `tests/` with them. Make `InventoryBar.vue` show 🔑 for a key item. Verify `npm test` and `npm run typecheck` pass and a search of `src/` and `tests/` finds no `KEY` import from `world.ts`

## 2. Level format and validation

- [x] 2.1 Add `SprayItem`, `Flag` and the optional `items` and `flags` to `Level` in `src/logic/types.ts`. Add `src/logic/colors.ts` with `COLOR_NAMES` (the eight names and hex values of design decision 2) and `toHex(color)`. Add `tests/logic/colors.test.ts`: each name gives its hex value, `#F00` and `#ff0000` both give `#ff0000`, and `pink`, `#12`, `#12345g`, `1e90ff`, `#1e90ff80`, an empty text and a number give null. Verify `npm test` and `npm run typecheck` pass
- [x] 2.2 Extend `normLevel` in `src/logic/levels.ts` to validate `items` and `flags` against the padded map as design decision 3 lists, and to return them only when present and non-empty. Add to `tests/logic/levels.test.ts` the `levels` scenarios of "Level items" and "Level flags", and of "Level validation": "Spray in a wall", "Unknown colour", "Malformed hex value", "Colours are kept as written", "Unknown item type", "Spray without uses", "Two sprays on one cell", "Flag rows of different length", "Flag over a wall" (wall, door, key, exit, outside the map), "Flag door that is not a locked door", "Flag without a door"; plus tests that a spray on `K` is rejected, a flag cell on `K` is accepted, a level without the properties comes back with exactly `id`, `name` and `map`, and each error text names the level and the item or flag. Verify `npm test` passes
- [x] 2.3 Add "Items and flags are kept" to `tests/logic/levels.test.ts` (`mergeImported` keeps them; `initialLevels` restores them from stored JSON) and its "Export and import" and "Reload" scenarios to `tests/stores/levels.test.ts`. Verify `npm test` passes

## 3. World rules

- [x] 3.1 Add `sprays`, `paint` and `flags` to `World` and give `parseMap` the parameters `items = []` and `flags = []`, copying sprays and flags into the world with every colour converted by `toHex`. Add `'flagdoor'` to `Blocked`. Add tests to `tests/logic/world.test.ts` that a parsed level has its sprays at their cells, no paint and no flag done, that a spray written `"red"` and a flag cell written `"#F00"` are both held as `#rrggbb`, and that changing a spray in the world leaves the level's `items` untouched. Verify `npm test` and `npm run typecheck` pass
- [x] 3.2 In `moveForward` pick up a spray into the first free slot and replace the result's `key` field with `picked: { slot, item } | 'full' | null`; in `probeForward` stop a crate at a spray cell. Update `src/blocks/move-forward.ts` for the renamed field. Add to `tests/logic/world.test.ts` the `painting` scenarios of "Picking up a spray" (without the status line) and the `world` scenarios "Spray ahead" and "Spray behind the crate". Verify `npm test` passes
- [x] 3.3 Change `useItem` to return an object and paint the robot's own cell with a spray: plain floor only, one use per paint, slot emptied at zero. Update `src/blocks/use-item.ts` for the new result shape, messages unchanged for now. Add to `tests/logic/world.test.ts` the `painting` scenarios of "Painting a cell" and "Spray uses". Verify `npm test` passes
- [x] 3.4 Add the flag check after a paint: a flag whose cells all match becomes done once and its door cell turns from `L` to `O`; `probeForward` reports `'flagdoor'` for a locked door a flag names. Add to `tests/logic/world.test.ts` the `painting` scenarios of "Colours", "Flags" and "Finishing a flag opens its door" (without the status line and "Reset"), the `world` scenario "Door opened by a flag", and a test that a key still opens a flag's door. Verify `npm test` passes

## 4. Stores

- [x] 4.1 Make `useWorldStore.load` take `{ map, items?, flags? }`, keep it for `reset()`, and pass the level from `levels.load()`. Keep `loadMap(...rows)` in `tests/helpers/stores.ts` working and add `loadLevel(level)`. Add to `tests/stores/world.test.ts` the `world` scenario "Reset after painting" and the `painting` scenario "Reset". Verify `npm test` and `npm run typecheck` pass

## 5. Blocks and messages

- [x] 5.1 Add `ms.spray`, `ms.paint`, `ms.paintlast`, `ms.flag` and `ms.flagdoor` to `locales/en.json` and `locales/sk.json` with the English texts of design decision 7. Add a `language-support` test to `tests/data/locales.test.ts` that the new keys have Slovak texts differing from the English ones. Verify `npm test` and `npm run typecheck` pass
- [x] 5.2 In `src/blocks/move-forward.ts` say `ms.spray` on picking up a spray and map `'flagdoor'` to `ms.flagdoor`. Add to `tests/blocks/move-forward.test.ts` the `painting` scenarios "Picking up a spray", "Inventory full" and "Bumping into a flag door". Verify `npm test` passes
- [x] 5.3 In `src/blocks/use-item.ts` say `ms.paint`, `ms.paintlast` or `ms.flag` after a paint, keep `ms.nothing` with a red dot for a spray on a cell that cannot be painted, and change the icon to `🎒 `. Add to `tests/blocks/use-item.test.ts` the `block-use-item` scenarios of "Paint with a spray", "Spray used in a doorway", and update "Slovak label" and any test that expects `🔑` in the label. Verify `npm test` passes and a search of `tests/` finds no `🔑 Use item` or `🔑 Použi`

## 6. Showing it

- [x] 6.1 In `InventoryBar.vue` give a spray slot the class `spray`, the inline `--spray` custom property and a `uses` element holding the number; in `src/styles.css` add the rules of design decision 9 (background from `--spray`, number in the bottom-right corner, `contrast-color()` behind `@supports` with the haloed white text as fallback, the slot number in the same text colour). Add `tests/components/InventoryBar.test.ts` (happy-dom) with the `world` scenarios "Key and sprays together", "Uses left after painting", "Spray given as a hex value" and "Spray used up", checking class, `--spray` value and number. Verify `npm test` passes
- [x] 6.2 In `MapCanvas.vue` draw, per design decision 8: paint in place of the room colour with a thin outline, the target dot on flag cells without their colour, sprays as a can in their colour, and 🎨 on a locked door a flag names. Verify `npm run typecheck` passes and, in `npm run dev` with a level holding a spray and a flag imported through `importLevels`, that each of the four shows and that the dot disappears when the cell is painted right and returns when it is painted over

## 7. Level 8

- [x] 7.1 Add `levels/level-8.json` exactly as in design decision 1 and set `BUILTIN_VERSION` to `'6'`. Update the tests that hold the old numbers: sizes, ids and names in `tests/data/levels.test.ts`; `'5'`, the seven ids and the upgrade scenario in `tests/logic/levels.test.ts` and `tests/stores/levels.test.ts`; the last level in `tests/components/WinDialog.test.ts` and `tests/stores/levels.test.ts` (`level-7` becomes `level-8` where the test means "the last level"). Verify `npm test` passes
- [x] 7.2 Add to `tests/data/levels.test.ts` the `levels` scenarios "Level 8 layout" and "Level 8 can be solved", the second by loading the level through the stores and running the program of the scenario with the block builders of `tests/helpers/program.ts`: the flag is done on the ninth use and not before, the inventory ends empty, and the run ends with the win. Add a test that every built-in flag has at least as many uses of each colour among the level's sprays as it has cells of that colour. Verify `npm test` passes and that changing one spray in the file to 2 uses turns both new tests red

## 8. Documentation

- [x] 8.1 In `openspec/specs/` update the `## Code` sections: `world` gains `tests/components/InventoryBar.test.ts`; `levels` describes `src/logic/levels.ts` as also validating items and flags; `block-use-item` describes `src/logic/world.ts` as using an item on the cell ahead or under the robot. Edit the Purpose of `block-use-item` (a key opens the door ahead, a spray paints the floor under the robot) and of `world` (add sprays and paint). Verify `npm run check:specs` passes
- [x] 8.2 In `README.md` update the opening sentence (the robot also sprays floors), the "A level" line (`items` and `flags`, with a pointer to `levels/level-8.json` as the example and the `[x, y]` convention), and the Tests paragraph's count of files that mount components. Verify every path the README names exists

## 9. Final check

- [x] 9.1 Run `npm run typecheck`, `npm test`, `npm run check:specs` and `npm run build`; verify all pass and the build is still the single `dist/index.html`
- [x] 9.2 Open `dist/index.html` from disk and check what the tests cannot: level 8 appears in the level list as 15x7 after an upgrade from a browser that stored version 5; the three sprays, the nine target dots and the 🎨 door are visible and readable at the smallest map size; the solving program of the `levels` spec wins with Run and with Step, in English and in Slovak; white and yellow paint are distinguishable from the floor; levels 3 and 5 still work with keys
- [x] 9.3 Check the `world` scenarios "Dark spray" and "Light spray" by eye: import a level with a spray of each of the eight names plus `#1e90ff` and `#808080`, pick them up, and confirm the uses number and the slot number are readable on every one, once in a browser where `@supports (color: contrast-color(red))` holds and once with that block disabled in the developer tools. If either looks poor, switch to the script-computed `--spray-text` of design decision 9 and repeat
- [x] 9.4 Run `npx openspec validate add-flag-painting --strict` and confirm the change is valid

## Workflow follow-up

- Have a native speaker review the five new Slovak messages.
- Archive the change after the review.
- After archiving, add a `## Code` section to `openspec/specs/painting/spec.md` (`src/logic/world.ts`, `src/logic/colors.ts`, `tests/logic/colors.test.ts`, `src/logic/types.ts`, `src/blocks/use-item.ts`, `src/blocks/move-forward.ts`, `src/components/MapCanvas.vue`, `src/components/InventoryBar.vue`, `levels/level-8.json`, `tests/logic/world.test.ts`, `tests/blocks/use-item.test.ts`, `tests/blocks/move-forward.test.ts`, `tests/components/InventoryBar.test.ts`) and verify `npm run check:specs` passes; a spec without that section fails the check.
