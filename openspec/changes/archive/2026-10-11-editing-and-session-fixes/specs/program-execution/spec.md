# Spec Delta

## MODIFIED Requirements

### Requirement: Editing during a run
From the first Run or Step until the run has ended, the program SHALL be locked: blocks cannot be dragged from the library or within the program, numbers on blocks cannot be changed, and select mode cannot be switched on. A run ends when the program finishes, fails, wins, or is stopped or reset; pausing does not end it. Trying to drag a block while locked SHALL show "Stop the program first to change it." in the status line.

#### Scenario: Drag while running
- **GIVEN** a running program
- **WHEN** the player tries to drag a block
- **THEN** nothing is picked up and the status line shows "Stop the program first to change it."

#### Scenario: Drag while paused
- **GIVEN** a paused run
- **WHEN** the player tries to drag a block
- **THEN** nothing is picked up and the run is still paused at the same block

#### Scenario: Number field while stepping
- **GIVEN** a program stepped twice
- **WHEN** the player clicks the number on a Repeat block
- **THEN** the number cannot be edited

#### Scenario: Select mode while paused
- **GIVEN** a paused run
- **WHEN** the player presses Select
- **THEN** select mode stays off

#### Scenario: Unlocked after Stop
- **GIVEN** a paused run
- **WHEN** the player presses Stop and then drags a block
- **THEN** the block is picked up

#### Scenario: Unlocked after a failure
- **GIVEN** a run that ended because the robot walked into a wall
- **WHEN** the player drags a block
- **THEN** the block is picked up and the status dots of the failed run disappear when it is dropped
