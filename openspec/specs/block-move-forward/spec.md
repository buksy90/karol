# block-move-forward Specification

## Purpose
Move forward is the action block that walks the robot one cell in the direction it faces. It is how the player reaches keys, pushes crates and gets to the exit, and it is the block that fails when the way is blocked.

## Code

- `src/blocks/move-forward.ts` - the block definition, its action and failure messages
- `src/logic/world.ts` - the movement rules it applies

## Requirements

### Requirement: Move one cell
The Move forward block SHALL move the robot one cell in the direction it faces when that cell can be entered under the world rules.

#### Scenario: Free floor ahead
- **GIVEN** the robot faces east with free floor ahead
- **WHEN** a Move forward block executes
- **THEN** the robot stands one cell further east, still facing east

#### Scenario: Key ahead
- **GIVEN** a key in the cell ahead
- **WHEN** a Move forward block executes
- **THEN** the robot enters the cell and the key is picked up under the world rules

#### Scenario: Exit ahead
- **GIVEN** the exit in the cell ahead
- **WHEN** a Move forward block executes
- **THEN** the robot enters the exit, the level is won and the program stops

### Requirement: Blocked by a wall
When a wall or the edge of the map is ahead, the block SHALL fail: the robot stays in place, the status line shows "💥 Ouch, a wall!", the block gets a red dot and the program stops.

#### Scenario: Wall ahead
- **GIVEN** a wall in the cell ahead
- **WHEN** a Move forward block executes
- **THEN** the robot does not move
- **AND** the status line shows "💥 Ouch, a wall!"
- **AND** the block gets a red dot and no further blocks execute

### Requirement: Blocked by a locked door
When a locked door is ahead, the block SHALL fail: the robot stays in place, the status line shows "🔒 The door is locked! Find the key.", the block gets a red dot and the program stops.

#### Scenario: Locked door ahead
- **GIVEN** a locked door in the cell ahead
- **WHEN** a Move forward block executes
- **THEN** the robot does not move
- **AND** the status line shows "🔒 The door is locked! Find the key."
- **AND** the block gets a red dot and no further blocks execute

### Requirement: Pushing a crate
When a crate is ahead, the block SHALL push it under the world rules. If the crate cannot be pushed, the block SHALL fail: nothing moves, the status line shows "📦 The crate is stuck!", the block gets a red dot and the program stops.

#### Scenario: Crate can be pushed
- **GIVEN** a crate ahead with free floor behind it
- **WHEN** a Move forward block executes
- **THEN** the crate moves one cell and the robot takes its place
- **AND** the program continues

#### Scenario: Crate against a wall
- **GIVEN** a crate ahead with a wall behind it
- **WHEN** a Move forward block executes
- **THEN** neither the crate nor the robot moves
- **AND** the status line shows "📦 The crate is stuck!"
- **AND** the block gets a red dot and no further blocks execute

### Requirement: Move forward label
The block SHALL be labelled "⬆ Move forward" in English and "⬆ Choď" in Slovak.

#### Scenario: English label
- **GIVEN** the interface language is English
- **WHEN** the block library is shown
- **THEN** the block reads "⬆ Move forward"
