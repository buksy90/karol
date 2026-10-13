# world Specification

## Purpose
The world is the tile map the robot Karol lives on. It defines what each cell is, which cells the robot can enter, how crates, keys, sprays, doors and the exit behave, what the robot carries in its inventory, and how all of this is drawn for the player.

## Code

- `src/logic/world.ts` - map parsing, room detection, and the rules for moving, crates, keys, sprays, doors and the exit
- `src/stores/world.ts` - state of the loaded level; load and reset
- `src/stores/inventory.ts` - the 8 inventory slots
- `src/components/MapCanvas.vue` - draws the map, paint, sprays and the robot
- `src/components/InventoryBar.vue` - shows the inventory slots
- `tests/logic/world.test.ts` - tests of the world rules
- `tests/stores/world.test.ts` - tests of loading and resetting a level
- `tests/components/InventoryBar.test.ts` - tests of what a slot shows for a key and for a spray

## Requirements

### Requirement: Map symbols
A map SHALL be a list of text rows in which each character is one cell: `W` or `w` is a wall, a space is floor, `K` is the robot start, `k` is a key, `b` is a crate, `D` or `d` is an open door, `L` is a locked door and `e` is the exit. Rows shorter than the longest row SHALL be padded with floor.

#### Scenario: Rows of different length
- **GIVEN** a map whose rows are 15, 10 and 15 characters long
- **WHEN** the level is loaded
- **THEN** the map is 15 cells wide and the missing cells of the short row are floor

#### Scenario: Lowercase aliases
- **GIVEN** a map containing `w` and `d`
- **WHEN** the level is loaded
- **THEN** `w` behaves as a wall and `d` as an open door

#### Scenario: Unknown symbol
- **GIVEN** a map containing a character that is not a known symbol
- **WHEN** the level is loaded
- **THEN** the cell is drawn as floor and the robot can walk onto it

### Requirement: Robot start
The robot SHALL start on the cell marked `K`, facing east, and the start cell SHALL otherwise be plain floor.

#### Scenario: Level start
- **GIVEN** a level whose map has `K` in the second row, second column
- **WHEN** the level is loaded or reset
- **THEN** the robot stands on that cell and faces east

### Requirement: Enterable cells
The robot SHALL be able to enter floor, open doors, opened locked doors, cells holding a key or a spray and the exit. It SHALL NOT be able to enter walls, locked doors or anything outside the map.

#### Scenario: Wall ahead
- **GIVEN** a wall in the cell ahead of the robot
- **WHEN** the robot tries to enter it
- **THEN** the robot stays where it is

#### Scenario: Edge of the map
- **GIVEN** the robot stands on the last cell of a row with no wall beyond it
- **WHEN** the robot tries to move off the map
- **THEN** the edge behaves as a wall

#### Scenario: Open door ahead
- **GIVEN** an open door in the cell ahead
- **WHEN** the robot tries to enter it
- **THEN** the robot moves onto the door cell

#### Scenario: Spray ahead
- **GIVEN** a spray in the cell ahead
- **WHEN** the robot tries to enter it
- **THEN** the robot moves onto the cell

### Requirement: Crates
A crate SHALL occupy one cell and SHALL be pushed one cell in the robot's direction when the robot moves into it. The push SHALL succeed only if the cell behind the crate is floor, an open door or an opened locked door, and holds no other crate and no spray.

#### Scenario: Free floor behind the crate
- **GIVEN** a crate ahead of the robot and free floor behind the crate
- **WHEN** the robot moves forward
- **THEN** the crate moves one cell and the robot takes the crate's former cell

#### Scenario: Two crates in a row
- **GIVEN** a crate ahead of the robot and another crate directly behind it
- **WHEN** the robot moves forward
- **THEN** nothing moves

#### Scenario: Key or exit behind the crate
- **GIVEN** a crate ahead of the robot and a key or the exit behind the crate
- **WHEN** the robot moves forward
- **THEN** nothing moves

#### Scenario: Spray behind the crate
- **GIVEN** a crate ahead of the robot and a spray behind the crate
- **WHEN** the robot moves forward
- **THEN** nothing moves

#### Scenario: Crate pushed into a doorway
- **GIVEN** a crate ahead of the robot and an open door behind the crate
- **WHEN** the robot moves forward
- **THEN** the crate moves onto the door cell

### Requirement: Keys
When the robot enters a cell holding a key, the key SHALL be picked up into the first free inventory slot and removed from the map.

#### Scenario: Picking up a key
- **GIVEN** an empty inventory and a key in the cell ahead
- **WHEN** the robot moves forward
- **THEN** the key disappears from the map and appears in slot 1
- **AND** the status line shows "You found a key! 🔑 (slot 1)"

#### Scenario: First free slot
- **GIVEN** slots 1 and 3 hold keys and slot 2 is empty
- **WHEN** the robot picks up another key
- **THEN** the key goes into slot 2

#### Scenario: Inventory full
- **GIVEN** all 8 slots are full and a key is in the cell ahead
- **WHEN** the robot moves forward
- **THEN** the robot enters the cell, the key stays on the map
- **AND** the status line shows "Inventory is full!"

### Requirement: Doors
An open door SHALL always be enterable. A locked door SHALL block the robot and crates until it is unlocked with a key or opened by a finished flag, after which it SHALL behave as an open door until the level is reset.

#### Scenario: Unlocked door stays open
- **GIVEN** a locked door that was unlocked with a key
- **WHEN** the robot later moves into it
- **THEN** the robot enters the door cell

#### Scenario: Reset locks the door again
- **GIVEN** a locked door that was unlocked during a run
- **WHEN** the level is reset
- **THEN** the door is locked again

#### Scenario: Door opened by a flag
- **GIVEN** a locked door that a finished flag opened
- **WHEN** the robot later moves into it
- **THEN** the robot enters the door cell

### Requirement: Exit
The level SHALL be won when the robot enters the exit cell.

#### Scenario: Reaching the exit
- **GIVEN** the exit in the cell ahead
- **WHEN** the robot moves forward
- **THEN** the robot stands on the exit
- **AND** the status line shows "🎉 You made it! Great job!"
- **AND** the program stops

### Requirement: Inventory
The robot SHALL carry up to 8 items in slots numbered 1 to 8. An item is a key or a spray. The inventory SHALL be shown above the map as 8 numbered slots, with filled slots visibly different from empty ones. A slot holding a spray SHALL have the spray's colour as its background and SHALL show the number of uses left in its bottom-right corner, over the background. That number and the slot number SHALL be drawn in a text colour that contrasts with the background, so both are readable on any spray colour.

#### Scenario: Empty inventory at level start
- **WHEN** a level is loaded or reset
- **THEN** all 8 slots are shown empty

#### Scenario: Slot freed by using a key
- **GIVEN** a key in slot 2
- **WHEN** the key is used on a locked door
- **THEN** slot 2 is shown empty

#### Scenario: Key and sprays together
- **GIVEN** a key in slot 1, a red spray with 3 uses in slot 2 and a blue spray with 1 use in slot 3
- **WHEN** the player looks at the inventory
- **THEN** slot 1 shows 🔑, slot 2 has a red background with 3 in its corner and slot 3 has a blue background with 1 in its corner

#### Scenario: Uses left after painting
- **GIVEN** a red spray with 3 in the corner of slot 2
- **WHEN** the spray paints a cell
- **THEN** slot 2 is still red and shows 2 in its corner

#### Scenario: Spray given as a hex value
- **GIVEN** a spray whose colour is `"#1e90ff"` in slot 1
- **WHEN** the player looks at the inventory
- **THEN** the background of slot 1 is exactly that colour

#### Scenario: Dark spray
- **GIVEN** a black spray with 3 uses in slot 1
- **WHEN** the player looks at the inventory
- **THEN** the 3 and the slot number 1 are drawn in a light colour and are readable

#### Scenario: Light spray
- **GIVEN** a white or yellow spray with 3 uses in slot 1
- **WHEN** the player looks at the inventory
- **THEN** the 3 and the slot number 1 are drawn in a dark colour and are readable

#### Scenario: Spray used up
- **GIVEN** a red spray with 1 use in slot 2
- **WHEN** the spray paints a cell
- **THEN** slot 2 looks like any empty slot again

### Requirement: Level reset
Resetting the level SHALL restore the map to its initial state: the robot at its start facing east, all crates, keys and sprays back in place with their full uses, all locked doors locked, the floor unpainted, no flag done and the inventory empty.

#### Scenario: Reset after moving things
- **GIVEN** the robot has pushed a crate, picked up a key and unlocked a door
- **WHEN** the level is reset
- **THEN** the crate, key, door, robot and inventory are as they were when the level was loaded

#### Scenario: Reset after painting
- **GIVEN** the robot has picked up a spray with 3 uses, painted two cells and finished a flag
- **WHEN** the level is reset
- **THEN** the spray is back on its cell with 3 uses, no cell is painted, the flag's door is locked and the inventory is empty

### Requirement: Map rendering
The map SHALL be drawn scaled to fit its area, with walls, doors, a lock on locked doors, a flag on the exit, keys, sprays and crates each visibly distinct. Each room, meaning a region of cells separated from others by walls and doors, SHALL get its own two-tone checkered floor colour. A spray SHALL be drawn in its colour. A painted cell SHALL be filled with its paint colour in place of the room colour, under anything standing on it.

#### Scenario: Two rooms joined by a door
- **GIVEN** a map with two rooms connected by a door
- **WHEN** the map is drawn
- **THEN** the two rooms have different floor colours

#### Scenario: Map of a different size
- **GIVEN** a level 15 cells wide and 4 cells high
- **WHEN** the map is drawn
- **THEN** the whole map is visible and cells are square

#### Scenario: Sprays of two colours
- **GIVEN** a red spray and a blue spray on the map
- **WHEN** the map is drawn
- **THEN** one spray is drawn red and the other blue

#### Scenario: Robot on a painted cell
- **GIVEN** the robot has just painted the cell it stands on yellow
- **WHEN** the map is drawn
- **THEN** the cell is yellow and the robot is drawn on top of it

### Requirement: Robot rendering
The robot SHALL be drawn with a marker showing which way it faces, and its moves and turns SHALL be animated smoothly, faster at higher speed settings.

#### Scenario: Animated move
- **WHEN** the robot moves one cell
- **THEN** it glides from the old cell to the new one instead of jumping
