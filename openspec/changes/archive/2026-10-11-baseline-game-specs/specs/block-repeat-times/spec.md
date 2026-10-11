# Spec Delta

## Purpose

Repeat N times is the container block that runs the blocks inside it a fixed number of times. It lets the player replace a long run of identical blocks with a short loop and see how many rounds are left while it runs.

## ADDED Requirements

### Requirement: Fixed number of rounds
The Repeat block SHALL run the blocks inside it, in order, N times, where N is the number on the block. A new block SHALL start at 2 and the field SHALL offer the range 1 to 99.

#### Scenario: Three rounds
- **GIVEN** a Repeat 3 times block containing one Move forward block and free floor ahead
- **WHEN** the program runs
- **THEN** the robot moves three cells

#### Scenario: New block
- **WHEN** a Repeat block is dragged from the library
- **THEN** its number is 2 and it contains no blocks

### Requirement: Round count limits at run time
When the program runs, a number below 1 or an empty field SHALL be treated as 1 and a number above 99 SHALL be treated as 99. The field itself SHALL keep whatever the player typed.

#### Scenario: Zero rounds typed
- **GIVEN** a Repeat block whose number is 0
- **WHEN** the program runs
- **THEN** the blocks inside run once

#### Scenario: Too many rounds typed
- **GIVEN** a Repeat block whose number is 500
- **WHEN** the program runs
- **THEN** the blocks inside run 99 times

### Requirement: Nesting
A Repeat block SHALL accept any blocks inside it, including other Repeat, If, Repeat while and custom blocks, to any depth.

#### Scenario: Loop inside a loop
- **GIVEN** a Repeat 2 times block containing a Repeat 3 times block containing one Move forward block
- **WHEN** the program runs with enough free floor ahead
- **THEN** the robot moves six cells

### Requirement: Round start is a step
The start of every round SHALL be an execution step of its own, in which the Repeat block is the current block. After the last round there SHALL be one more such step before execution moves on.

#### Scenario: Stepping through a loop
- **GIVEN** a Repeat 2 times block containing one Move forward block
- **WHEN** the player presses Step repeatedly
- **THEN** the current block is, in order: the Repeat block, Move forward, the Repeat block, Move forward, the Repeat block
- **AND** the block after the loop becomes current on the next step

#### Scenario: Empty loop
- **GIVEN** a Repeat 3 times block with nothing inside
- **WHEN** the program runs
- **THEN** the loop takes four steps and the robot does nothing

### Requirement: Rounds-left badge
While the loop runs, the block SHALL show a badge "⏳ k" next to its number, where k is the number of rounds left including the one starting. The badge SHALL pop briefly each time it changes, show 0 when the loop has ended, and stay visible until the next run or program change.

#### Scenario: Counting down
- **GIVEN** a Repeat 3 times block
- **WHEN** the program runs
- **THEN** the badge shows ⏳ 3, then ⏳ 2, then ⏳ 1, then ⏳ 0

#### Scenario: Badge after the run
- **GIVEN** a finished run that included a Repeat block
- **WHEN** the player looks at the program
- **THEN** the badge still shows ⏳ 0
- **AND** it disappears when the player changes the program or starts a new run

### Requirement: Repeat inside a custom block
A Repeat block that executes inside a custom block SHALL run its rounds without round-start steps and without a badge.

#### Scenario: Loop hidden inside a custom block
- **GIVEN** a custom block containing a Repeat 2 times block with one Move forward block
- **WHEN** the program calls the custom block and the player steps through it
- **THEN** there are exactly two steps, one per Move forward

### Requirement: Repeat label
The block SHALL be labelled "🔁 Repeat [N] times" in English and "🔁 Zopakuj [N] krát" in Slovak.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "🔁 Zopakuj", the number, "krát"
