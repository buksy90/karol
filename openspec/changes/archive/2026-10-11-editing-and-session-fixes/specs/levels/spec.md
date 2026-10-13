# Spec Delta

## MODIFIED Requirements

### Requirement: Level picker
The Levels button SHALL open a list of all levels showing each name and its size as width x height, with the current level ticked. Choosing a level SHALL load it, end any run, close the list and show "Loaded <name>". The program panel SHALL then show that level's own program, which is empty if the player has not built one there.

#### Scenario: Choosing another level
- **GIVEN** level 1 is loaded and its program has three blocks
- **WHEN** the player opens Levels and chooses Level 3 for the first time
- **THEN** the map of level 3 is shown with the robot at its start
- **AND** the status line shows "Loaded Level 3"
- **AND** the program is empty

#### Scenario: Returning to a level
- **GIVEN** the player built three blocks on level 1 and then switched to level 3
- **WHEN** the player opens Levels and chooses Level 1
- **THEN** the program shows the three blocks built on level 1

#### Scenario: Current level marked
- **GIVEN** level 3 is loaded
- **WHEN** the player opens Levels
- **THEN** the entry reads "✓ Level 3  (15x9)" and is highlighted

### Requirement: Win dialog
About 0.7 seconds after the robot reaches the exit, a "Good job! 🎉" dialog SHALL offer Next level, Stay and Restart. Next level SHALL load the following level together with that level's own program and SHALL be absent on the last level. Stay SHALL reset the level and keep the program. Restart SHALL reset the level and clear this level's program.

#### Scenario: Next level
- **GIVEN** the robot reached the exit of level 2 and level 3 was never visited
- **WHEN** the player chooses Next level
- **THEN** level 3 is loaded and the program is empty

#### Scenario: Next level, visited before
- **GIVEN** the robot reached the exit of level 2 and the player earlier built four blocks on level 3
- **WHEN** the player chooses Next level
- **THEN** level 3 is loaded and the program shows those four blocks

#### Scenario: The solved level keeps its program
- **GIVEN** the player solved level 2 and chose Next level
- **WHEN** the player later returns to level 2
- **THEN** the program that solved level 2 is shown

#### Scenario: Stay
- **GIVEN** the win dialog is open
- **WHEN** the player chooses Stay
- **THEN** the robot is back at the start of the same level and the program is unchanged

#### Scenario: Restart
- **GIVEN** the win dialog is open
- **WHEN** the player chooses Restart
- **THEN** the robot is back at the start of the same level and the program is empty
- **AND** the program is still empty when the player later returns to this level

#### Scenario: Last level
- **GIVEN** the robot reached the exit of the last level in the list
- **WHEN** the win dialog opens
- **THEN** it offers only Stay and Restart

#### Scenario: Closing the dialog
- **GIVEN** the win dialog is open
- **WHEN** the player closes it
- **THEN** the robot stays on the exit and the program is unchanged
