# Spec Delta

## Purpose

Use item is the action block that applies something from the robot's inventory to the cell in front of it. Today its one use is opening a locked door with a key, which is how the player gets through locked rooms.

## ADDED Requirements

### Requirement: Slot number
The Use item block SHALL carry a slot number that the player edits directly on the block. A new block SHALL start at slot 1, and the field SHALL offer the range 1 to 8.

#### Scenario: New block
- **WHEN** a Use item block is dragged from the library
- **THEN** its slot number is 1

#### Scenario: Value typed outside the range
- **GIVEN** a Use item block
- **WHEN** the player types 12 into the slot number
- **THEN** the block keeps the value 12

### Requirement: Unlock a door with a key
When the chosen slot holds a key and a locked door is in the cell ahead, the block SHALL open the door, remove the key from the slot and show "Click! The door is open 🔓" in the status line. The robot SHALL NOT move.

#### Scenario: Key used on a locked door
- **GIVEN** a key in slot 1 and a locked door ahead
- **WHEN** a Use item 1 block executes
- **THEN** the door is open and slot 1 is empty
- **AND** the status line shows "Click! The door is open 🔓"
- **AND** the robot is still on the same cell

### Requirement: Empty slot
When the chosen slot is empty or the number is outside 1 to 8, the block SHALL show "Slot N is empty." in the status line and get a red dot. The program SHALL continue with the next block.

#### Scenario: Empty slot
- **GIVEN** slot 3 is empty
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "Slot 3 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Slot number out of range
- **GIVEN** a Use item block set to 12
- **WHEN** it executes
- **THEN** the status line shows "Slot 12 is empty."
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
