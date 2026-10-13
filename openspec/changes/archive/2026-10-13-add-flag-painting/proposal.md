# Proposal

## Why

Every level so far is solved by reaching the exit; the only thing the robot can change in the world is the position of a crate and the state of a door. A level where the robot has to paint a room's floor into a flag gives children a goal that needs planning (which colour, in which order, with how much paint) and a first use for loops that produce a visible pattern.

## What Changes

- **Sprays.** A level can place spray cans on floor cells. Each has a colour and a number of uses. Walking onto one picks it up into the first free inventory slot, exactly like a key.
- **Colours.** A colour is one of eight names (red, orange, yellow, green, blue, purple, black, white) or a hex value such as `#1e90ff`. A name is shorthand for a fixed hex value, so a named spray and a flag cell given as that hex value match.
- **Sprays in the inventory.** A slot holding a spray has the spray's colour as its background, with the uses left written in a corner in a text colour that contrasts with it.
- **Painting.** Use item N with a spray in slot N paints the cell the robot **stands on** in the spray's colour and takes one use. A spray with uses left stays in its slot; an empty one leaves the slot.
- **Flags.** A level can define a flag: a rectangle of floor and the colour each of its cells must have. When every cell has its colour the flag is done and the locked door named by the flag opens. The door then stays open until the level is reset, like a door opened with a key.
- **The player can see the goal.** Every flag cell that does not have its colour yet shows a dot in the colour it needs, and a door that a flag opens shows 🎨 instead of 🔒 and says "Paint the flag" when the robot bumps into it. Without this the player has no way to know what to paint.
- **Level format.** Two optional properties, `items` and `flags`, validated on load and import. Levels without them are unchanged.
- **Level 8**, a built-in level that uses all of this: three sprays in a corridor, a 3x3 room to paint black, red and yellow, and the exit behind the flag's door. The built-in version goes from 5 to 6.
- **Use item's icon** changes from 🔑 to 🎒, because the block no longer only uses keys.

How this differs from the request, and why:

- **`colors` is a list of rows, and `size` is gone.** `[["red","red","red"],["blue","blue","blue"]]` shows the flag as it will look, and its size is the size of the list. A flat list plus a separate `size` can disagree with each other; this cannot.
- **`startPosition` is `position`**, the same word the items use.
- **Sprays are placed with `items`, not a map letter.** A letter cannot carry a colour and a number of uses without a letter per combination. The cost is that the map text no longer shows everything in the level, so positions are validated: a spray must lie on plain floor, a flag on paintable cells, `unlockDoor` on a locked door. A miscounted coordinate is an import error, not a silently broken level.
- **`uses` is a property of each spray** (the request describes limited uses but the example has no place for the number).
- **Paint goes under the robot, not on the cell ahead.** Painting ahead cannot reach a cell without standing outside it, which makes a room whose whole floor is the flag unpaintable from inside.
- **Every use takes one use of the spray**, also when the cell already has that colour, and a painted cell can be painted over. Each run starts from a fresh level, so a wasted spray costs one more press of Run.
- **A finished flag stays finished.** Painting over it afterwards does not lock the door again; a door that could lock behind or under the robot would need rules nobody asked for.

Not in this change:

- A sensor for paint ("is this cell painted?"). The level is solvable without it.
- A map letter or legend for items, level editing in the game, and items other than sprays in `items` (keys stay the map letter `k`).
- CSS colour names beyond the eight, and colours with transparency. Checking them would need the full CSS name list in the logic layer; a hex value says the same thing.
- Naming the colour in status messages. A hex value has no name, so the messages say "a spray" and the inventory shows which.
- Flags that are not rectangles, cells that must stay unpainted, and any `onDrawn` effect other than opening one door.

## Capabilities

### New Capabilities

- `painting`: sprays and their colours, painting floor, flags and what completing one does, and how paint, flag targets and flag doors are shown.

### Modified Capabilities

- `world`: a cell holding a spray is enterable and stops a crate; a locked door can also be opened by a flag; the inventory holds sprays as well as keys and shows a spray as a slot in its colour with the uses left in a corner; reset restores sprays, paint and flags; the map draws sprays, paint, flag targets and flag doors.
- `levels`: the level format gains `items` and `flags`; validation checks them; there are eight built-in levels; the built-in version is 6.
- `block-use-item`: a spray in the chosen slot paints the cell under the robot; the "nothing happens" case covers a spray on a cell that cannot be painted; the icon is 🎒.

## Impact

- Logic (`src/logic`): `types.ts` (level, item, flag and world shapes; inventory slots hold item objects instead of the text `🔑`), `levels.ts` (validation, version), a new `colors.ts` (the eight names, and turning a name or hex value into one form), `world.ts` (parsing, pick-up, crates, painting, flag check).
- Blocks: `use-item.ts` and `move-forward.ts` (new results and messages).
- Stores: `world.ts` loads a level instead of a map; `levels.ts` passes the level.
- Components: `InventoryBar.vue` (sprays with colour and uses left), `MapCanvas.vue` (sprays, paint, targets, flag doors), `styles.css`.
- Data: `levels/level-8.json`; new messages in `locales/en.json` and `locales/sk.json`. The Slovak wording is written by the assistant and needs native review.
- Stored data: levels saved in a browser are replaced by the built-ins on the version change, as on every version change; levels a player imported are kept. Stored programs are untouched.
- Tests: tests that hold an inventory slot as `🔑`, the number of built-in levels or the version 5 are updated; new tests are named after the new scenarios. The `## Code` sections and the README's level description follow.
