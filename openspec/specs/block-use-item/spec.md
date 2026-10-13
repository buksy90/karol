# block-use-item Specification

## Purpose
Use item is the action block that uses something from the robot's inventory. A key opens the locked door in front of the robot, which is how the player gets through locked rooms; a spray paints the floor under the robot.

## Code

- `src/blocks/use-item.ts` - the block definition, its action and messages
- `src/logic/world.ts` - using a key on the cell ahead and a spray on the cell under the robot
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
When the chosen slot holds a key and the cell ahead is not a locked door, or holds a spray and the robot stands on a cell that cannot be painted, the block SHALL show "Nothing happens here…" in the status line and get a red dot. The item SHALL stay in its slot unchanged and the program SHALL continue.

#### Scenario: Key used on a wall
- **GIVEN** a key in slot 1 and a wall ahead
- **WHEN** a Use item 1 block executes
- **THEN** the status line shows "Nothing happens here…"
- **AND** slot 1 still holds the key
- **AND** the block gets a red dot and the next block executes

#### Scenario: Spray used in a doorway
- **GIVEN** a red spray with 3 uses in slot 1 and the robot standing on an open door
- **WHEN** a Use item 1 block executes
- **THEN** the status line shows "Nothing happens here…"
- **AND** slot 1 still holds the spray with 3 uses
- **AND** the block gets a red dot and the next block executes

### Requirement: Use item label
The block SHALL be labelled "🎒 Use item" in English and "🎒 Použi" in Slovak, followed by the slot number.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "🎒 Použi" followed by the slot number

### Requirement: Paint with a spray
When the chosen slot holds a spray and the robot stands on plain floor, the block SHALL paint the cell under the robot as the `painting` capability describes and show "Painted! ×N left." in the status line, where N is the number of uses the spray has left, or "Painted! The spray is empty." when that was its last use. The robot SHALL NOT move. When the paint finishes a flag, the status line SHALL show the flag message instead.

#### Scenario: Spray with uses left
- **GIVEN** a red spray with 3 uses in slot 1 and the robot on plain floor
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and the robot is still on it
- **AND** the status line shows "Painted! ×2 left."

#### Scenario: Last use of a spray
- **GIVEN** a red spray with 1 use in slot 1 and the robot on plain floor
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and slot 1 is empty
- **AND** the status line shows "Painted! The spray is empty."

#### Scenario: Used again after the spray ran out
- **GIVEN** slot 1 was just emptied by the last use of a spray
- **WHEN** another Use item 1 block executes
- **THEN** the status line shows "Slot 1 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Paint that finishes a flag
- **GIVEN** a flag with one cell left to paint, the robot on that cell and a spray of the expected colour in slot 3
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "🎨 The flag is done! A door opened 🔓"
- **AND** the next block executes

#### Scenario: Spray with a locked door ahead
- **GIVEN** a red spray in slot 1, the robot on plain floor and a locked door ahead
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and the door is still locked
