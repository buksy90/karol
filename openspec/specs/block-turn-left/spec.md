# block-turn-left Specification

## Purpose
Turn left is the action block that lets the player change the direction the robot faces. It is the only way to turn, so every route with a corner depends on it.

## Code

- `src/blocks/turn-left.js` - the block definition and its action

## Requirements

### Requirement: Turn left
The Turn left block SHALL rotate the robot 90 degrees counter-clockwise without moving it. It SHALL always succeed.

#### Scenario: Turning from east
- **GIVEN** the robot faces east
- **WHEN** a Turn left block executes
- **THEN** the robot faces north and stands on the same cell

#### Scenario: Four turns
- **GIVEN** the robot faces east
- **WHEN** four Turn left blocks execute
- **THEN** the robot faces east again

#### Scenario: Turning next to a wall
- **GIVEN** the robot is surrounded by walls
- **WHEN** a Turn left block executes
- **THEN** the robot turns and the program continues

### Requirement: Turn left label
The block SHALL be labelled "↶ Turn left" in English and "↶ Doľava" in Slovak.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "↶ Doľava"
