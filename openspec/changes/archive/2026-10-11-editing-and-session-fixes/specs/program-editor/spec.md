# Spec Delta

## ADDED Requirements

### Requirement: Program kept per level
Each level SHALL have its own program. Every change to the program SHALL be saved for the current level in the browser's session storage, and the saved program SHALL be shown whenever that level is loaded, including after a page reload in the same tab. A level without a saved program SHALL start empty. If session storage is unavailable, programs SHALL be kept until the page is reloaded.

#### Scenario: Reload in the same tab
- **GIVEN** a program of five blocks on level 2, including a Repeat 4 times block with an If block inside
- **WHEN** the page is reloaded
- **THEN** level 2 is shown with the same five blocks, numbers, nesting and conditions

#### Scenario: New tab
- **GIVEN** a program was built in one browser tab
- **WHEN** the game is opened in a new tab
- **THEN** the program is empty

#### Scenario: Two levels, two programs
- **GIVEN** three blocks built on level 1 and one block built on level 2
- **WHEN** the player switches between the two levels
- **THEN** level 1 always shows its three blocks and level 2 its one block

#### Scenario: Storage blocked
- **GIVEN** the browser refuses access to session storage
- **WHEN** the player switches from level 1 to level 2 and back
- **THEN** level 1 still shows its program and no error is shown

## MODIFIED Requirements

### Requirement: Editing numbers on a block
The number on a Use item or Repeat block SHALL be editable in place, and pressing on the number field SHALL NOT start a drag. Only whole numbers in the block's range SHALL be kept: 1 to 8 for Use item, 1 to 99 for Repeat. When the field is left, or a run is started, with an empty, fractional, non-numeric or out-of-range value, the field SHALL return to its last valid value.

#### Scenario: Changing a number
- **GIVEN** a Repeat 2 times block in the program
- **WHEN** the player clicks the number, types 5 and clicks elsewhere
- **THEN** the block reads Repeat 5 times and has not moved

#### Scenario: Out of range
- **GIVEN** a Use item 3 block
- **WHEN** the player types 12 and clicks elsewhere
- **THEN** the block reads Use item 3

#### Scenario: Emptied field
- **GIVEN** a Repeat 4 times block
- **WHEN** the player deletes the number and clicks elsewhere
- **THEN** the block reads Repeat 4 times

#### Scenario: Fraction
- **GIVEN** a Repeat 4 times block
- **WHEN** the player types 2.5 and clicks elsewhere
- **THEN** the block reads Repeat 4 times

#### Scenario: Run started from the keyboard while typing
- **GIVEN** the player typed 500 into a Repeat 4 times block and the field still has focus
- **WHEN** the player presses F5
- **THEN** the block reads Repeat 4 times and the loop runs four rounds

### Requirement: Clear
The Clear button SHALL remove all blocks from the current level's program and show "Program cleared.". It SHALL be ignored from the first Run or Step until the run has ended. It SHALL NOT move the robot or change the map.

#### Scenario: Clearing
- **GIVEN** a program of five blocks and no run active
- **WHEN** the player presses Clear
- **THEN** the program is empty and the status line shows "Program cleared."

#### Scenario: Clear while paused
- **GIVEN** a paused run
- **WHEN** the player presses Clear
- **THEN** the program is unchanged and the run is still paused

#### Scenario: Cleared program stays cleared
- **GIVEN** the player cleared the program of level 2
- **WHEN** the player switches to another level and back
- **THEN** the program of level 2 is empty

## REMOVED Requirements

### Requirement: Program is not persisted
**Reason**: Replaced by "Program kept per level". The program now survives a reload in the same tab.
**Migration**: None. Nothing was stored before, so there is no data to convert.
