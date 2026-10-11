# sensor-can-go-forward Specification

## Purpose
Can go forward is the sensor that tells a program whether the robot could take a step right now. It is the question behind "walk until the wall" and "turn until the way is free".

## Code

- `src/sensors/can-go-forward.ts` - the sensor definition
- `src/logic/world.ts` - the shared "can move forward" rule
- `src/sensors/index.ts` - the Sensors section of the library
- `tests/sensors/can-go-forward.test.ts` - tests
- `tests/composables/useDragDrop.test.ts` - tests of dragging the sensor from the library into a condition slot

## Requirements

### Requirement: True when a move would succeed
The sensor SHALL be true exactly when a Move forward block executed at that moment would succeed, and false otherwise. Checking it SHALL NOT change the world.

#### Scenario: Free floor ahead
- **GIVEN** free floor in the cell ahead
- **WHEN** the sensor is checked
- **THEN** it is true

#### Scenario: Wall ahead
- **GIVEN** a wall in the cell ahead
- **WHEN** the sensor is checked
- **THEN** it is false

#### Scenario: Edge of the map ahead
- **GIVEN** the robot faces the edge of the map with no wall cell there
- **WHEN** the sensor is checked
- **THEN** it is false

#### Scenario: Locked door ahead
- **GIVEN** a locked door in the cell ahead
- **WHEN** the sensor is checked
- **THEN** it is false

#### Scenario: Open door, key or exit ahead
- **GIVEN** an open door, a key or the exit in the cell ahead
- **WHEN** the sensor is checked
- **THEN** it is true

### Requirement: Crates count only if pushable
With a crate ahead, the sensor SHALL be true only when the crate could be pushed under the world rules.

#### Scenario: Pushable crate
- **GIVEN** a crate ahead with free floor behind it
- **WHEN** the sensor is checked
- **THEN** it is true

#### Scenario: Stuck crate
- **GIVEN** a crate ahead with a wall, a locked door, a key, the exit or another crate behind it
- **WHEN** the sensor is checked
- **THEN** it is false

### Requirement: Placement in the library
The sensor SHALL be offered in the Sensors section of the library, which sits above the Blocks section, and SHALL fit only into condition slots.

#### Scenario: Dragging the sensor
- **GIVEN** the sensor dragged from the Sensors section
- **WHEN** it is dropped on the condition slot of a Repeat while block
- **THEN** it sits in that slot

### Requirement: Can go forward label
The sensor SHALL be labelled "👀 Can go forward" in English and "👀 Môžem ísť dopredu" in Slovak.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the Sensors section is shown
- **THEN** the sensor reads "👀 Môžem ísť dopredu"
