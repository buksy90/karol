# Design

## Context

See proposal.md for the motivation and for how the level format differs from the request.

What the code looks like today, where it shapes this design:

- A level is `{id, name, map}`. `normLevel` in `src/logic/levels.ts` validates the map and **returns only those three properties**, so anything else on a level is dropped on load and on import.
- `parseMap(map)` in `src/logic/world.ts` builds the `World`: a grid of characters, crates as a `Set` of `"x,y"`, the robot and the rooms. Keys are the grid character `k`.
- The inventory is `Slots = (string | null)[]` and a key is the text `🔑`. `InventoryBar.vue` prints the slot's text.
- `moveForward` returns `key: number | 'full' | null`; `useItem` returns `'empty' | 'opened' | 'nothing'` and acts on the cell ahead. The blocks turn those results into status messages.
- The world store keeps the level's `map` and re-parses it on every reset. `execution.start()` resets the world, so **every run starts from a fresh level**.
- `MapCanvas.vue` redraws the whole map from the store every frame. It has no tests; the README says rendering is checked by hand.
- With a matching `karol.ver` the stored level list is used as it is, so a new built-in level only appears when `BUILTIN_VERSION` changes.

## Goals / Non-Goals

**Goals:**

- Sprays, paint and flags live in the logic layer as plain data and plain functions, tested without a store or a page.
- A level without `items` and `flags` loads, stores and exports exactly as before.
- Level 8 is proven solvable by a test, not by a claim.

**Non-Goals:**

- Moving keys from the map letter `k` into `items`. Two ways to place a key would need a rule for which wins.
- Any abstraction for "things a flag can do". There is one effect, opening one door.
- Tests of canvas drawing.

## Decisions

### 1. Level format

```json
{
  "id": "level-8",
  "name": "Level 8",
  "map": [
    "WWWWWWWWWWWWWWW",
    "WK      d   WWW",
    "WWWWWWWWW   WWW",
    "WWWWWWWWW   L W",
    "WWWWWWWWWWWWW W",
    "WWWWWWWWWWWWWeW",
    "WWWWWWWWWWWWWWW"
  ],
  "items": [
    { "type": "spray", "position": [3, 1], "color": "black", "uses": 3 },
    { "type": "spray", "position": [5, 1], "color": "red", "uses": 3 },
    { "type": "spray", "position": [7, 1], "color": "yellow", "uses": 3 }
  ],
  "flags": [
    {
      "position": [9, 1],
      "colors": [
        ["black", "black", "black"],
        ["red", "red", "red"],
        ["yellow", "yellow", "yellow"]
      ],
      "onDrawn": { "unlockDoor": [12, 3] }
    }
  ]
}
```

This is the level that ships. Positions are `[x, y]`, zero-based, x from the left and y from the top, which is how the grid is already indexed (`grid[y][x]`).

Alternatives considered:

- **A flat `colors` list with `size`** (the request). Rejected: two properties that must agree, and a 9-item list does not look like a flag.
- **Rows as text with one letter per colour** (`["kkk","rrr","yyy"]`). Shorter, but needs a letter table (is `b` blue or black?) that differs from the names the sprays use.
- **A map letter per spray.** Cannot carry colour and uses.
- **A map character plus a legend** (`"1"` in the map, `"legend": {"1": {spray…}}`). Keeps positions visible in the map and is the best alternative, but the flag and its door still need coordinates, so the author counts columns either way. Validation of positions gives most of the safety at less cost. Worth revisiting if levels get an editor.
- **`flag` as one object.** A list costs one loop and allows a level with two rooms to paint.

### 2. Types (`src/logic/types.ts`)

```ts
/** A colour as a level writes it: one of the eight names, or #rgb / #rrggbb. */
export type Color = string;
export type Position = [x: number, y: number];

export interface SprayItem { type: 'spray'; position: Position; color: Color; uses: number }
export interface Flag { position: Position; colors: Color[][]; onDrawn: { unlockDoor: Position } }

export interface Level { id: string; name: string; map: string[]; items?: SprayItem[]; flags?: Flag[] }

/** What a slot holds. */
export type Item = { type: 'key' } | { type: 'spray'; color: Color; uses: number };
export type Slots = (Item | null)[];
```

`World` gains three members:

- `sprays: Map<string, { color: Color; uses: number }>` keyed `"x,y"`, the sprays still on the floor. Keyed like `boxes`, so "is there a spray on this cell" is one lookup.
- `paint: Map<string, Color>` keyed `"x,y"`.
- `flags: (Flag & { done: boolean })[]`.

**Colours.** The eight names and their hex values are one constant, `COLOR_NAMES: Record<string, string>`, in a new `src/logic/colors.ts`: red `#e5484d`, orange `#f76b15`, yellow `#ffd60a`, green `#30a46c`, blue `#1d6fe0`, purple `#8e4ec6`, black `#2b2b33`, white `#ffffff`. Next to it, `toHex(color): string | null` turns a name or a hex value into lower-case `#rrggbb` (a name is looked up, `#abc` becomes `#aabbcc`) and returns null for anything else. That one function is both the validator and the normaliser.

- **The level keeps what the author wrote.** `normLevel` only asks `toHex(color) !== null`; export gives back `"red"` or `"#F00"` unchanged.
- **The world holds only `#rrggbb`.** `parseMap` converts every spray and flag colour, so a slot's `color`, a `paint` entry and a flag cell are compared with `===` and handed to the canvas and to CSS as they are. Nothing downstream of `parseMap` knows that names exist.

Alternatives considered: any CSS colour name (needs the 140-name table in the logic layer, which has no DOM to ask, for no gain over hex); comparing colours "closely enough" (a flag that accepts nearly-red needs a threshold nobody can explain to a child; equality of the hex value is the rule).

**Slots become objects.** A spray has a colour and a count, which a text cannot hold without parsing it back. The `KEY` constant goes; `item.type === 'key'` replaces `item === KEY`. This touches every test that puts `🔑` into a slot; `tests/helpers/world.ts` gets `key()` and `spray(color, uses)` builders so those tests stay one-liners.

Alternative considered: keep the text for keys and add objects for sprays (`string | Spray | null`). Rejected: every reader would handle two shapes for ever.

### 3. Validation (`normLevel`)

`normLevel` keeps returning `{id, name, map}` and adds `items` and `flags` only when the input has them, so `expect(normLevel(level, 0)).toEqual(level)` in `tests/data/levels.test.ts` still holds for the seven old files. An empty list is treated as absent.

Checks run against the map padded to its widest row, the same padding `parseMap` applies:

- `items`: a list; each entry `type === 'spray'`, `position` two whole numbers on a cell that is a space in the map, `color` a text that `toHex` accepts, `uses` a whole number 1 to 99; no two on one cell. The robot start is not allowed: pick-up happens on entering a cell, so a spray under the start would never be picked up.
- `flags`: a list; `position` two whole numbers; `colors` a non-empty list of non-empty rows of equal length holding colours that `toHex` accepts; every covered cell a space or `K`; `onDrawn.unlockDoor` a cell that is `L`.

Errors follow the existing wording, `'Level ' + i + ': …'`, and name the item or flag by its index. They stay English, as the `language-support` spec says of validation errors.

Not checked: overlapping flags, a spray inside a flag, enough paint to finish the flag. The first two are legitimate; the third is the level author's puzzle to get right, and the solvability test covers the built-in level.

### 4. World rules (`src/logic/world.ts`)

- **`parseMap(map, items = [], flags = [])`**. The extra parameters default to nothing, so the many existing `parseMap(rows)` and `worldOf(...rows)` calls stay as they are. Sprays and flags are copied into the world, never referenced: a spray's `uses` goes down in the inventory, and a reset must find the level's own numbers intact.
- **`probeForward`**: a cell with a spray stops a crate, like a key cell does today (`t === ' '` is no longer enough, because a spray cell is a space in the grid). A locked door that some flag names blocks with a new reason `'flagdoor'`, so the Move block can pick the "Paint the flag" message from its `Record<Blocked, MessageKey>` without knowing about flags.
- **`moveForward`**: `key: number | 'full' | null` becomes `picked: { slot: number; item: Item } | 'full' | null`, one field for keys and sprays. The Move block chooses the message by `picked.item.type`.
- **`useItem`**: returns an object instead of a text, `{ result: 'empty' | 'nothing' | 'opened' } | { result: 'painted'; color: Color; left: number; flagDone: boolean }`. A spray acts on the robot's own cell when `grid[y][x] === ' '`; it sets the paint, takes one use, empties the slot at zero, then checks the flags.
- **Flag check**: after each paint, every flag that is not done and whose rectangle contains the painted cell is compared cell by cell with `paint`. A match sets `done` and turns the door's grid cell from `L` to `O`, the same change a key makes. `done` is never cleared, which is the whole of "a finished flag stays finished". A 3x3 comparison per paint needs no caching.

A key opens a flag's door too if a level puts both in; the owner confirmed this. Keys that open one specific door are planned as a later change, and that change is where "which key opens which door" gets decided.

### 5. Why Use item and not a new Paint block

Use item N already means "use what is in slot N", has the number field and its validation, and the request describes sprays as inventory items "same as key". A second block would give two blocks that both take a slot number and each fail on half the items.

The cost is that Use item no longer always acts on the cell ahead: a key reaches forward, a spray points down. That is how the things behave in a child's hand, and the block's icon changes from 🔑 to 🎒 so that it no longer promises a key. The `block-use-item` Purpose sentence in the main spec is edited to match.

### 6. Stores

`useWorldStore.load(level)` takes `{ map, items?, flags? }` and keeps it in place of `map`; `reset()` passes all three to `parseMap`. `levels.load()` passes the level. `tests/helpers/stores.ts` keeps `loadMap(...rows)` and gains `loadLevel(level)`.

`Map` in Pinia state is reactive the same way the existing `boxes` `Set` is. The canvas reads the store every frame anyway; the inventory bar reads `slots`, whose items are now reactive objects, so a falling `uses` re-renders the slot.

### 7. Messages

| key | English |
| --- | --- |
| `ms.spray` | `You found a spray ×{0}! (slot {1})` |
| `ms.paint` | `Painted! ×{0} left.` |
| `ms.paintlast` | `Painted! The spray is empty.` |
| `ms.flag` | `🎨 The flag is done! A door opened 🔓` |
| `ms.flagdoor` | `🎨 The door is locked! Paint the flag.` |

`×3` avoids "1 uses" and the Slovak plural forms. The messages do not name the colour: a hex value has no name, and a sentence that says "red" for one spray and "#1e90ff" for the next is worse than one that says neither. The inventory slot shows the colour. This also means no colour names in the dictionaries and no change to `ActionContext`.

### 8. Drawing

`MapCanvas.vue`, in this order per floor cell: room colour or paint colour; door, lock, key, exit as today; the flag target dot; the spray. Crates and the robot are drawn after all cells, as today, so they sit on top of paint.

- Paint: the whole cell in the colour, with a thin darker outline so white and yellow stay visible on the pastel floors.
- Target dot: a circle about a third of the cell, in the expected colour with a dark outline, on cells where `paint` differs from the flag's colour.
- Spray: a small can (rounded body in the colour, grey cap) drawn with canvas shapes. There is no emoji that can be tinted.
- Flag door: 🎨 in place of 🔒 while the cell is `L` and a flag names it. The lookup "is this cell a flag door" is a small set built when the world is parsed, not a search per frame.

### 9. The spray slot (`InventoryBar.vue`, `styles.css`)

A key slot shows 🔑 as today. A spray slot gets the class `spray` and the inline custom property `--spray: #rrggbb`; everything else is CSS:

```css
.slot.spray { background: var(--spray); border-color: color-mix(in srgb, var(--spray) 70%, #000); }
.slot.spray b, .slot .uses { color: #fff; text-shadow: 0 0 2px #000, 0 0 2px #000; }   /* readable on any colour */
.slot .uses { position: absolute; right: 3px; bottom: 0; font-size: 13px; font-weight: 700; }
@supports (color: contrast-color(red)) {
  .slot.spray b, .slot .uses { color: contrast-color(var(--spray)); text-shadow: none; }
}
```

The CSS property asked for is the `contrast-color()` function: given a background it returns black or white, whichever contrasts more. It is recent, and the game must also run in a browser that lacks it, so it sits behind `@supports`; the fallback is white text with a dark halo, which is readable on every background including white. Whether the build's target browsers have it is checked by hand in the final group, with and without support.

The uses number sits in the bottom-right corner; the slot number keeps its top-left corner and gets the same text colour, because it is drawn over the same background. The slot itself is the item: no can icon inside it, so nothing competes with the number.

Alternative considered: computing black or white in script from the colour's luminance. It works everywhere but puts a presentation rule into the component and duplicates what CSS now does. If `contrast-color()` support turns out too thin and the halo fallback looks poor, this is the fallback to the fallback, as a `--spray-text` custom property next to `--spray`.

happy-dom lays nothing out and resolves no colours, so the component test checks the class, the `--spray` value and the number; the contrast itself is checked by eye.

## Risks / Trade-offs

- [The map text no longer shows everything in a level; a miscounted coordinate puts a spray in the wrong place] → Validation rejects a spray off the floor, a flag over anything but floor and a door position that is not `L`. A spray on the wrong floor cell still passes; the solvability test catches that for the built-in level.
- [The slot type change touches many tests at once] → It is done first and alone (task group 1), with the builders, so the suite is green before any new behaviour arrives.
- [Canvas drawing is untested] → Everything the canvas shows is derived from world state that is tested; the drawing itself is checked by hand in the final group, with a list of what to look at.
- [Red and green flag cells are hard to tell apart for some children] → The built-in flag uses black, red and yellow, which differ strongly in brightness. Nothing stops a level author from using red next to green.
- [With hex values an author can write two colours the eye cannot tell apart, `#ff0000` on a spray and `#fe0000` on the flag, and the flag never finishes] → The target dot stays on the cell, which is the signal that the colour is not the expected one. The built-in level uses names. The test of built-in levels (enough paint of each colour) compares normalised values and would fail on such a pair.
- [`contrast-color()` missing in the player's browser] → The `@supports` fallback above; no script and no network needed either way.
- [Exactly nine uses for nine cells leaves no slack in level 8] → Intended: it shows a spray running out and its slot emptying. A mistake costs one more Run, because a run always starts from a fresh level.
- [A stored `karol.levels` written by this version and opened by an older build] → The older `normLevel` drops `items` and `flags` and the level loads as a plain map with a door nothing can open. Only a rollback meets this; reloading with the new build restores the level from the built-ins.

## Migration Plan

`BUILTIN_VERSION` goes from `'5'` to `'6'`. On the next start the eight built-ins replace stored levels with the same ids and imported levels are kept after them, which is what the version exists for. Programs in session storage are keyed by level id and are not touched; a program containing Use item blocks keeps working, since the block's type and number are unchanged.

## Open Questions

- The exact Slovak wording of the five messages, for a native speaker to settle after implementation.
