# block-use-item Specification

## Purpose
Use item is the action block that applies something from the robot's inventory to the cell in front of it. Today its one use is opening a locked door with a key, which is how the player gets through locked rooms.

## Code

- `src/blocks/use-item.ts` - the block definition, its action and messages
- `src/logic/world.ts` - using an item on the cell ahead
- `src/components/BlockItem.vue` - the number field
- `tests/blocks/use-item.test.ts` - tests
- `tests/components/BlockItem.test.ts` - test of the number field

## Requirements

### Requirement: Slot number
The Use item block SHALL carry a slot number that the player edits directly on the block. A new block SHALL start at slot 1. The number SHALL always be a whole number from 1 to 8; other values are rejected as described in the `program-editor` capability.

#### Scenario: New block
- **WHEN** a Use item block is dragged from the library
- **THEN** its slot number is 1

#### Scenario: Value typed outside the range
- **GIVEN** a Use item 2 block
- **WHEN** the player types 12 into the slot number and clicks elsewhere
- **THEN** the block reads Use item 2

### Requirement: Unlock a door with a key
When the chosen slot holds a key and a locked door is in the cell ahead, the block SHALL open the door, remove the key from the slot and show "Click! The door is open 🔓" in the status line. The robot SHALL NOT move.

#### Scenario: Key used on a locked door
- **GIVEN** a key in slot 1 and a locked door ahead
- **WHEN** a Use item 1 block executes
- **THEN** the door is open and slot 1 is empty
- **AND** the status line shows "Click! The door is open 🔓"
- **AND** the robot is still on the same cell

### Requirement: Chosen slot is empty
When the chosen slot is empty, the block SHALL show "Slot N is empty." in the status line and get a red dot, and SHALL NOT use any item. The program SHALL continue with the next block.

#### Scenario: Empty slot
- **GIVEN** slot 3 is empty
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "Slot 3 is empty."
- **AND** the block gets a red dot and the next block executes

### Requirement: Nothing to use the item on
When the chosen slot holds a key and the cell ahead is not a locked door, the block SHALL show "Nothing happens here…" in the status line and get a red dot. The key SHALL stay in its slot and the program SHALL continue.

#### Scenario: Key used on a wall
- **GIVEN** a key in slot 1 and a wall ahead
- **WHEN** a Use item 1 block executes
- **THEN** the status line shows "Nothing happens here…"
- **AND** slot 1 still holds the key
- **AND** the block gets a red dot and the next block executes

### Requirement: Use item label
The block SHALL be labelled "🔑 Use item" in English and "🔑 Použi" in Slovak, followed by the slot number.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "🔑 Použi" followed by the slot number
