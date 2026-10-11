# Spec Delta

## MODIFIED Requirements

### Requirement: Slot number
The Use item block SHALL carry a slot number that the player edits directly on the block. A new block SHALL start at slot 1. The number SHALL always be a whole number from 1 to 8; other values are rejected as described in the `program-editor` capability.

#### Scenario: New block
- **WHEN** a Use item block is dragged from the library
- **THEN** its slot number is 1

#### Scenario: Value typed outside the range
- **GIVEN** a Use item 2 block
- **WHEN** the player types 12 into the slot number and clicks elsewhere
- **THEN** the block reads Use item 2

### Requirement: Empty slot
When the chosen slot is empty, the block SHALL show "Slot N is empty." in the status line and get a red dot. The program SHALL continue with the next block.

#### Scenario: Empty slot
- **GIVEN** slot 3 is empty
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "Slot 3 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Slot number out of range
- **GIVEN** a Use item 2 block whose number the player tried to change to 12
- **WHEN** the block executes
- **THEN** it uses slot 2, because the out-of-range value was never kept
