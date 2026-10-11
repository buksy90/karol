# block-repeat-while Specification

## Purpose
Repeat while is the container block that keeps running the blocks inside it for as long as a condition is true. It lets the player write "walk until the wall" without knowing the distance in advance.

## Code

- `src/blocks/repeat-while.js` - the block definition, its loop and the does-nothing guard

## Requirements

### Requirement: Loop while the condition is true
The Repeat while block SHALL check its condition before every round, as a step of its own. While the condition is true it SHALL run the blocks inside it and check again. When the condition is false it SHALL end and execution SHALL continue after it.

#### Scenario: Walk up to the wall
- **GIVEN** a Repeat while Can go forward block containing a Move forward block, and a wall four cells ahead
- **WHEN** the program runs
- **THEN** the robot moves three cells, stops in front of the wall and the program continues without error

#### Scenario: Condition false from the start
- **GIVEN** a Repeat while Can go forward block and a wall directly ahead
- **WHEN** the program runs
- **THEN** the blocks inside never run

#### Scenario: Turn until the way is free
- **GIVEN** a Repeat while Not(Can go forward) block containing a Turn left block, and walls ahead and to the left of the robot
- **WHEN** the program runs
- **THEN** the robot turns left twice and the loop ends

### Requirement: Loop that does nothing
When a round finishes without any Turn left, Move forward or Use item block having executed, the block SHALL fail: the status line shows "This loop does nothing, so it would never end!", the block gets a red dot and the program stops. An action that executed but failed SHALL count as executed.

#### Scenario: Empty body
- **GIVEN** a Repeat while Can go forward block with nothing inside, and free floor ahead
- **WHEN** the program runs
- **THEN** the status line shows "This loop does nothing, so it would never end!"
- **AND** the block gets a red dot and the program stops

#### Scenario: Body that only checks a false condition
- **GIVEN** a Repeat while Can go forward block containing only an If Not(Can go forward) block, and free floor ahead
- **WHEN** the program runs
- **THEN** the loop fails as doing nothing after the first round

#### Scenario: Failed action counts as progress
- **GIVEN** a Repeat while Can go forward block containing only Use item 1, an empty inventory and free floor ahead
- **WHEN** the program runs
- **THEN** the loop keeps running until the run is stopped by the step limit

### Requirement: Nesting
A Repeat while block SHALL accept any blocks inside it and SHALL itself be usable inside any container or custom block.

#### Scenario: Loop inside a custom block
- **GIVEN** a custom block containing Repeat while Can go forward with a Move forward block inside
- **WHEN** the program calls the custom block
- **THEN** the robot walks until it is blocked

### Requirement: Empty condition
When the block executes with nothing in its condition slot, it SHALL fail as described in the `conditions` capability and the program SHALL stop.

#### Scenario: Missing sensor
- **GIVEN** a Repeat while block with an empty condition slot
- **WHEN** it executes
- **THEN** the status line shows "Put a sensor into the condition slot!"
- **AND** the block gets a red dot and the program stops

### Requirement: Repeat while label
The block SHALL be labelled "🔄 Repeat while" in English and "🔄 Opakuj, kým platí" in Slovak, followed by its condition slot.

#### Scenario: English label
- **GIVEN** the interface language is English
- **WHEN** the block library is shown
- **THEN** the block reads "🔄 Repeat while" followed by a condition slot
