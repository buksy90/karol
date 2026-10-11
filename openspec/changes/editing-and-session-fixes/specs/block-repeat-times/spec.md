# Spec Delta

## MODIFIED Requirements

### Requirement: Fixed number of rounds
The Repeat block SHALL run the blocks inside it, in order, N times, where N is the number on the block. A new block SHALL start at 2. The number SHALL always be a whole number from 1 to 99; other values are rejected as described in the `program-editor` capability.

#### Scenario: Three rounds
- **GIVEN** a Repeat 3 times block containing one Move forward block and free floor ahead
- **WHEN** the program runs
- **THEN** the robot moves three cells

#### Scenario: New block
- **WHEN** a Repeat block is dragged from the library
- **THEN** its number is 2 and it contains no blocks

#### Scenario: Value typed outside the range
- **GIVEN** a Repeat 3 times block
- **WHEN** the player types 500 into the number and clicks elsewhere
- **THEN** the block reads Repeat 3 times

## REMOVED Requirements

### Requirement: Round count limits at run time
**Reason**: The number field now only keeps values from 1 to 99, so a program can no longer contain a round count that needs correcting when it runs.
**Migration**: None. Programs were not stored before this change, so no saved program can hold an out-of-range count.
