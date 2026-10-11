# conditions Specification

## Purpose
Conditions are the yes/no questions that If, Repeat while and Not ask about the world. This capability covers what is shared by all of them: the slot a condition sits in, how a check runs as a visible step, and the sonar animation that shows the robot sensing.

## Code

- `src/logic/conditions.js` - evaluation, status text, innermost sensor
- `src/components/ConditionSlot.vue` - the condition slot
- `src/composables/useDragDrop.js` - dropping, replacing and removing condition blocks
- `src/stores/execution.js` - the condition-check step and the sonar state
- `src/components/MapCanvas.vue` - draws the sonar animation

## Requirements

### Requirement: Condition slot
If, Repeat while and Not SHALL each have one condition slot, shown as "?" while empty. A slot SHALL accept one condition block: a sensor or a Not block.

#### Scenario: Empty slot
- **WHEN** an If block is dragged from the library
- **THEN** its condition slot shows "?"

#### Scenario: Filling a slot
- **GIVEN** an If block with an empty slot
- **WHEN** a sensor is dropped on the slot
- **THEN** the sensor is shown inside the slot

### Requirement: Slot highlighting while dragging
While a condition block is being dragged, all condition slots in the visible program or custom block editor SHALL be highlighted, and the slot under the pointer SHALL be highlighted more strongly.

#### Scenario: Dragging a sensor
- **GIVEN** a program with two If blocks
- **WHEN** the player starts dragging a sensor
- **THEN** both condition slots are highlighted

### Requirement: Replacing and removing a condition
Dropping a condition block on a filled slot SHALL replace what was there. A condition block SHALL be removable by dragging it out of its slot onto the remove area. A condition block dragged out and dropped anywhere else SHALL return to its slot.

#### Scenario: Replacing
- **GIVEN** a slot holding Not(Can go forward)
- **WHEN** a Can go forward sensor is dropped on that slot
- **THEN** the slot holds only Can go forward

#### Scenario: Removing
- **GIVEN** a slot holding a sensor
- **WHEN** the sensor is dragged onto the remove area
- **THEN** the slot is empty again

#### Scenario: Dropped outside any slot
- **GIVEN** a sensor dragged out of its slot
- **WHEN** it is dropped on the block library
- **THEN** it returns to the slot it came from

#### Scenario: Library copy dropped outside any slot
- **GIVEN** a sensor dragged from the library
- **WHEN** it is dropped anywhere that is not a condition slot
- **THEN** it is discarded

### Requirement: A check is a step
Every condition check SHALL be an execution step of its own. During that step the block that owns the condition SHALL be the current block. While the program runs automatically, the status line SHALL show the condition followed by "? yes" or "? no" in the interface language.

#### Scenario: Status text for a sensor
- **GIVEN** a running program with an If Can go forward block and free floor ahead
- **WHEN** the check executes
- **THEN** the If block is the current block
- **AND** the status line shows "Can go forward? yes"

#### Scenario: Status text with Not
- **GIVEN** a running program with a Repeat while Not(Can go forward) block and free floor ahead
- **WHEN** the check executes
- **THEN** the status line shows "Not(Can go forward)? no"

#### Scenario: Check in single-step mode
- **GIVEN** a program being stepped
- **WHEN** a condition check is the step
- **THEN** the owning block is the current block and the status line shows "Step N" instead of the condition text

#### Scenario: Check inside a custom block
- **GIVEN** a custom block containing an If block
- **WHEN** the check executes during a call from the program
- **THEN** the custom block call in the program is the current block

### Requirement: Live state
A condition SHALL be evaluated against the world as it is at the moment of the check.

#### Scenario: Loop re-checks every round
- **GIVEN** a Repeat while Can go forward loop that moves the robot
- **WHEN** the robot reaches a wall
- **THEN** the next check is false even though earlier checks were true

### Requirement: Empty condition is an error
When a check executes on an empty slot, or on a Not whose own slot is empty, the status line SHALL show "Put a sensor into the condition slot!", the owning block SHALL get a red dot and the program SHALL stop.

#### Scenario: Empty slot at run time
- **GIVEN** a Repeat while block with an empty condition slot
- **WHEN** it executes
- **THEN** the status line shows "Put a sensor into the condition slot!"
- **AND** the block gets a red dot and the program stops

### Requirement: Sonar animation
Whenever a condition is checked, the robot SHALL emit a short sonar animation in the direction it faces: a fan-shaped beam with expanding arcs that ends in a ring on the cell ahead. It SHALL be green when the sensor itself is true and red when it is false, regardless of any Not around it.

#### Scenario: Free cell
- **GIVEN** free floor ahead
- **WHEN** Can go forward is checked
- **THEN** a green sonar plays toward the cell ahead

#### Scenario: Colour inside Not
- **GIVEN** free floor ahead
- **WHEN** Not(Can go forward) is checked
- **THEN** the sonar is green although the condition is false

### Requirement: Sonar duration
While the program runs, the sonar SHALL last about 380 ms divided by the speed setting, never less than 60 ms, and SHALL be removed when the next step executes if it is still playing. In single-step mode it SHALL last about 700 ms.

#### Scenario: Running at 1x
- **GIVEN** the speed is 1x
- **WHEN** a condition is checked while running
- **THEN** the sonar plays for about 380 ms and has finished before the next block executes

#### Scenario: Running at 15x
- **GIVEN** the speed is 15x
- **WHEN** a condition is checked while running
- **THEN** the sonar is cut off when the next block executes

#### Scenario: Single step
- **GIVEN** the program is being stepped
- **WHEN** a condition check is the step
- **THEN** the sonar plays for about 700 ms
