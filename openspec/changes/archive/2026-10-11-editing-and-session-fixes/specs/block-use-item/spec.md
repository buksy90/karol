# Spec Delta

## ADDED Requirements

### Requirement: Chosen slot is empty
When the chosen slot is empty, the block SHALL show "Slot N is empty." in the status line and get a red dot, and SHALL NOT use any item. The program SHALL continue with the next block.

#### Scenario: Empty slot
- **GIVEN** slot 3 is empty
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "Slot 3 is empty."
- **AND** the block gets a red dot and the next block executes

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

## REMOVED Requirements

### Requirement: Empty slot
**Reason**: Replaced by "Chosen slot is empty". The old requirement also said what happens when a block runs with a number outside 1 to 8, with a fraction or with none. The number field now only keeps whole numbers from 1 to 8, so a program can no longer hold such a number and those scenarios describe nothing the player can reach.
**Migration**: None. Programs were not stored before this change, so no saved program can hold such a number.
