# program-execution Specification

## Purpose
Program execution is how the player's blocks become robot behaviour: running the whole program, pausing it, stepping through it one instruction at a time, and seeing which block is executing and which blocks succeeded or failed. It is the feedback loop that lets a child find the mistake in their program.

## Code

- `src/logic/interpreter.ts` - the step generator and the safety limits
- `src/stores/execution.ts` - the run session: run, pause, step, stop, reset, speed, pointer, status dots
- `src/components/RunControls.vue` - Run/Pause, Step, Stop, Reset
- `src/components/SpeedButtons.vue` - the speed buttons
- `src/composables/useShortcuts.ts` - F5, F6 and Esc
- `src/components/BlockItem.vue` - shows the pointer and the status dots

## Requirements

### Requirement: Execution order and steps
A program SHALL execute its blocks from START to END, one step at a time. A step is one robot action, one condition check or one round start of a Repeat N times block.

#### Scenario: Top to bottom
- **GIVEN** a program of Turn left followed by Move forward
- **WHEN** it runs
- **THEN** the robot first turns and then moves

### Requirement: Run
Run SHALL reset the level to its start, clear the marks of the previous run and execute the program automatically, one step per interval. The status line SHALL show "Running…".

#### Scenario: Run from a previous end state
- **GIVEN** the robot was left in the middle of the map by an earlier run
- **WHEN** the player presses Run
- **THEN** the robot is back at the start before the first block executes

#### Scenario: Empty program
- **GIVEN** a program with no blocks
- **WHEN** the player presses Run or Step
- **THEN** the status line shows "Drag some blocks into your program first!" and nothing runs

### Requirement: Pause and resume
While a program runs, the Run button SHALL become "⏸ Pause". Pause SHALL halt execution after the current step and show "Paused. Press Run or Step to continue." Run SHALL then continue from the same place.

#### Scenario: Pause and resume
- **GIVEN** a running program
- **WHEN** the player presses Pause and then Run
- **THEN** execution halts and then continues with the next step, without resetting the level

### Requirement: Step
Step SHALL execute exactly one step and then wait. On a program that is not started it SHALL first reset the level and begin a new run. It SHALL be ignored while the program is running automatically. After a step that does not end the run, the status line SHALL show "Step N", replacing any message the step itself produced.

#### Scenario: First step
- **GIVEN** a program that is not running
- **WHEN** the player presses Step
- **THEN** the level is reset, the first step executes and the status line shows "Step 1"

#### Scenario: Step message replaces the block's message
- **GIVEN** a key in the cell ahead and a Move forward block as the next step
- **WHEN** the player presses Step
- **THEN** the key is picked up and the status line shows "Step N", not the key message

#### Scenario: Step that ends the run
- **GIVEN** a wall ahead and a Move forward block as the next step
- **WHEN** the player presses Step
- **THEN** the status line shows "💥 Ouch, a wall!"

#### Scenario: Step then Run
- **GIVEN** a program stepped twice
- **WHEN** the player presses Run
- **THEN** execution continues automatically from the third step

### Requirement: Stop, Reset and finishing
Stop SHALL end the run, leave the robot and the map as they are and show "Stopped." Reset SHALL end the run and reset the level, showing "Robot is back at the start." A program that reaches END SHALL show "Program finished. Did you reach the 🏁?".

#### Scenario: Stop
- **GIVEN** a running program
- **WHEN** the player presses Stop
- **THEN** the robot stays where it is and the next Run starts from the beginning

#### Scenario: Reset
- **GIVEN** a finished run that moved a crate
- **WHEN** the player presses Reset
- **THEN** the map is back in its initial state

#### Scenario: Program ends without reaching the exit
- **GIVEN** a program of one Move forward block
- **WHEN** it runs to the end
- **THEN** the status line shows "Program finished. Did you reach the 🏁?"

### Requirement: Stopping on a failed block
A block that fails fatally, such as walking into a wall, an empty condition or a loop that does nothing, SHALL end the run with the robot left where it is. A non-fatal failure, such as using an empty slot, SHALL let the program continue.

#### Scenario: Fatal failure
- **GIVEN** a program of Move forward, Turn left and a wall directly ahead
- **WHEN** it runs
- **THEN** the run ends at Move forward and Turn left never executes

#### Scenario: Non-fatal failure
- **GIVEN** a program of Use item 1, Turn left and an empty inventory
- **WHEN** it runs
- **THEN** Use item gets a red dot and Turn left executes

### Requirement: Speed
The speed SHALL be selectable as 1x, 3x, 5x or 15x, with 1x the default. The interval between steps SHALL be 450 ms divided by the speed. A change SHALL take effect immediately, also during a run.

#### Scenario: Default speed
- **WHEN** the game starts
- **THEN** 1x is highlighted and steps are 450 ms apart

#### Scenario: Changing speed during a run
- **GIVEN** a program running at 1x
- **WHEN** the player presses 5x
- **THEN** the following steps are 90 ms apart

### Requirement: Execution pointer
During a run or while stepping, the block being executed SHALL be marked with a red ▶ in front of its row and a yellow outline. The pointer SHALL be removed when the run ends.

#### Scenario: Pointer inside a loop
- **GIVEN** a Repeat 2 times block containing two blocks
- **WHEN** the program is stepped
- **THEN** the pointer moves to the Repeat block at the start of each round and to each inner block in turn

#### Scenario: Pointer while paused
- **GIVEN** a run paused after a step
- **WHEN** the player looks at the program
- **THEN** the pointer still marks the block that executed last

### Requirement: Status dots
Every block that executed SHALL keep a green dot, as SHALL every container block around it. A block that failed SHALL get a red dot, which takes precedence over green. Dots SHALL stay after the run ends.

#### Scenario: Partly executed program
- **GIVEN** a program of three Move forward blocks and a wall two cells ahead
- **WHEN** it runs
- **THEN** the first block has a green dot, the second a red dot and the third no dot

#### Scenario: Container marked
- **GIVEN** a Repeat block whose inner block executed
- **WHEN** the run ends
- **THEN** both the inner block and the Repeat block have a green dot

### Requirement: Clearing marks
Status dots and loop badges SHALL be cleared when a new run starts and when the program is changed: a block is dropped after any drag, a number on a block is edited, the program is cleared, or a selection is replaced by a custom block.

#### Scenario: Editing a number
- **GIVEN** a finished run with dots on the blocks
- **WHEN** the player changes the number on a Repeat block
- **THEN** all dots and badges disappear

### Requirement: Editing during a run
Blocks SHALL NOT be draggable while the program runs automatically. Starting a drag while the run is paused or being stepped SHALL end the run, so that the next Run or Step starts from the beginning.

#### Scenario: Drag while running
- **GIVEN** a running program
- **WHEN** the player tries to drag a block
- **THEN** nothing is picked up

#### Scenario: Drag while paused
- **GIVEN** a paused run
- **WHEN** the player drags a block
- **THEN** the run ends and the next Run starts from the first block

### Requirement: Safety limits
A run SHALL be ended with "The program runs too long. Is there a loop that never ends?" when it exceeds 5000 steps, or 200000 loop rounds counted across all loops including those inside custom blocks.

#### Scenario: Endless visible loop
- **GIVEN** a Repeat while Can go forward block containing four Turn left blocks, and free floor ahead
- **WHEN** it runs
- **THEN** the run ends with "The program runs too long. Is there a loop that never ends?" after 5000 steps

### Requirement: Keyboard shortcuts
F5 SHALL act as the Run/Pause button, F6 as Step and Esc as Stop when a run is active. F5 and F6 SHALL be ignored while a dialog or the custom block editor is open, and the browser's own reload on F5 SHALL be suppressed. The buttons SHALL show their keys as tooltips.

#### Scenario: F5 toggles run and pause
- **GIVEN** a program that is not running
- **WHEN** the player presses F5 twice
- **THEN** the program starts and is then paused, and the page is not reloaded

#### Scenario: Shortcut with a dialog open
- **GIVEN** the Levels dialog is open
- **WHEN** the player presses F5
- **THEN** the program does not start

#### Scenario: Esc with nothing running
- **GIVEN** no run is active and no dialog is open
- **WHEN** the player presses Esc
- **THEN** nothing happens
