# block-not Specification

## Purpose
Not is the operator block that turns a condition into its opposite. It lets the player ask "is the way blocked?" using the same sensors that ask "is the way free?", so one loop block covers both "while" and "until".

## Code

- `src/blocks/not.ts` - the operator definition
- `src/logic/conditions.ts` - how operators are evaluated

## Requirements

### Requirement: Negation
The Not block SHALL hold one condition in a slot of its own and SHALL be true when that condition is false, and false when it is true.

#### Scenario: Way is blocked
- **GIVEN** a wall ahead of the robot
- **WHEN** Not(Can go forward) is checked
- **THEN** the result is true

#### Scenario: Way is free
- **GIVEN** free floor ahead of the robot
- **WHEN** Not(Can go forward) is checked
- **THEN** the result is false

### Requirement: Placement
The Not block SHALL be offered in the Blocks section of the library and SHALL fit only into condition slots: of If, of Repeat while and of another Not. It SHALL NOT be droppable into a program list as a statement.

#### Scenario: Dropped on a program list
- **GIVEN** a Not block dragged from the library
- **WHEN** it is dropped between two blocks of the program
- **THEN** it is not added to the program

#### Scenario: Dropped on a condition slot
- **GIVEN** a Not block dragged from the library
- **WHEN** it is dropped on the condition slot of an If block
- **THEN** it sits in that slot with an empty slot of its own

### Requirement: Nested Not
Not blocks SHALL be nestable to any depth, each one inverting the result of the one inside it.

#### Scenario: Double negation
- **GIVEN** free floor ahead of the robot
- **WHEN** Not(Not(Can go forward)) is checked
- **THEN** the result is true

### Requirement: Empty inner slot
When a Not block with an empty slot is part of a condition that is checked, the whole condition SHALL count as empty and the owning block SHALL fail as described in the `conditions` capability.

#### Scenario: Not without a sensor
- **GIVEN** an If block whose condition is a Not block with an empty slot
- **WHEN** the If block executes
- **THEN** the status line shows "Put a sensor into the condition slot!"
- **AND** the If block gets a red dot and the program stops

### Requirement: Not label
The block SHALL be labelled "🚫 Not ( … )" in English and "🚫 Nie ( … )" in Slovak, with its condition slot between the brackets.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "🚫 Nie" followed by a bracketed condition slot
