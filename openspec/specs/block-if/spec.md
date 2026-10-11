# block-if Specification

## Purpose
If is the container block that runs the blocks inside it only when a condition about the world is true. It lets the player write programs that react to what the robot finds instead of following a fixed route.

## Code

- `src/blocks/if.ts` - the block definition and its conditional execution
- `tests/blocks/if.test.ts` - tests

## Requirements

### Requirement: Conditional execution
The If block SHALL check its condition once, as a step of its own, and SHALL run the blocks inside it only when the condition is true. There is no else branch.

#### Scenario: Condition is true
- **GIVEN** an If Can go forward block containing a Move forward block, and free floor ahead
- **WHEN** the program runs
- **THEN** the robot moves one cell

#### Scenario: Condition is false
- **GIVEN** an If Can go forward block containing a Move forward block, and a wall ahead
- **WHEN** the program runs
- **THEN** the robot does not move and the program continues with the block after the If

### Requirement: Condition checked at execution time
The condition SHALL be evaluated against the state of the world at the moment the If block executes, not when the program starts.

#### Scenario: World changed earlier in the run
- **GIVEN** a program that first walks the robot up to a wall and then executes If Can go forward
- **WHEN** the If block executes
- **THEN** the condition is false

### Requirement: Nesting
An If block SHALL accept any blocks inside it, including other If, Repeat, Repeat while and custom blocks, and SHALL itself be usable inside any container or custom block.

#### Scenario: If inside a loop
- **GIVEN** a Repeat 5 times block containing an If Can go forward block with a Move forward block inside
- **WHEN** the program runs with a wall three cells ahead
- **THEN** the robot moves until it reaches the wall and the program finishes without error

### Requirement: Empty condition
When the If block executes with nothing in its condition slot, it SHALL fail as described in the `conditions` capability and the program SHALL stop.

#### Scenario: Missing sensor
- **GIVEN** an If block with an empty condition slot
- **WHEN** it executes
- **THEN** the status line shows "Put a sensor into the condition slot!"
- **AND** the block gets a red dot and the program stops

### Requirement: If label
The block SHALL be labelled "❓ If" in English and "❓ Ak" in Slovak, followed by its condition slot.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "❓ Ak" followed by a condition slot
