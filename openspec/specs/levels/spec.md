# levels Specification

## Purpose
Levels are the puzzles the player solves: each one is a named map with a start and an exit. This capability covers how a level is described, which levels ship with the game, how the player moves between them, what happens after a win, and how levels are stored and exchanged.

## Code

- `src/logic/levels.ts` - validation, versioned start-up list, import merge
- `src/stores/levels.ts` - the level list and current level; load, save, export, import
- `src/components/LevelsDialog.vue` - the level picker
- `src/components/WinDialog.vue` - the win dialog
- `src/main.ts` - loads the built-in level files and exposes the console functions
- `levels/*.json` - the built-in levels, one file each

## Requirements

### Requirement: Level format
A level SHALL be an object with an `id`, a `name` and a `map`, where the map is a list of text rows using the world's map symbols.

#### Scenario: Minimal level
- **GIVEN** the level `{"id":"level-1","name":"Level 1","map":["WWWWW","WK eW","WWWWW"]}`
- **WHEN** it is loaded
- **THEN** the map is 5 by 3 with the robot at the left and the exit at the right

### Requirement: Level validation
A level SHALL be accepted only if its map is a non-empty list of text rows, or one text with line breaks, containing exactly one robot start `K`. A missing id or name SHALL be filled in with a generated value. Nothing else is checked.

#### Scenario: No robot start
- **GIVEN** a level whose map contains no `K`
- **WHEN** it is imported
- **THEN** it is rejected with an error naming the level

#### Scenario: Map given as one text
- **GIVEN** a level whose map is a single text with line breaks
- **WHEN** it is imported
- **THEN** each line becomes a row

#### Scenario: No exit
- **GIVEN** a level whose map has one `K` and no exit
- **WHEN** it is imported
- **THEN** it is accepted

### Requirement: Built-in levels
The game SHALL ship with seven levels, ids `level-1` to `level-7`, named "Level 1" to "Level 7", in this order.

#### Scenario: Level list on first start
- **GIVEN** a browser with no stored data
- **WHEN** the game starts
- **THEN** Level 1 is loaded and the level list shows Level 1 to Level 7

#### Scenario: What each level teaches
- **WHEN** the built-in levels are played in order
- **THEN** level 1 is a straight walk (15x4), level 2 a corridor with turns (15x9), level 3 an open door, a key and a locked door (15x9), level 4 a wall of crates to push through (15x9), level 5 a key, a crate and a locked door (15x15), level 6 a long spiral maze (15x16) and level 7 a diagonal staircase corridor (15x15)

### Requirement: Level picker
The Levels button SHALL open a list of all levels showing each name and its size as width x height, with the current level ticked. Choosing a level SHALL load it, end any run, close the list and show "Loaded <name>". The program SHALL be kept.

#### Scenario: Choosing another level
- **GIVEN** level 1 is loaded and the program has three blocks
- **WHEN** the player opens Levels and chooses Level 3
- **THEN** the map of level 3 is shown with the robot at its start
- **AND** the status line shows "Loaded Level 3"
- **AND** the program still has its three blocks

#### Scenario: Current level marked
- **GIVEN** level 3 is loaded
- **WHEN** the player opens Levels
- **THEN** the entry reads "✓ Level 3  (15x9)" and is highlighted

### Requirement: Win dialog
About 0.7 seconds after the robot reaches the exit, a "Good job! 🎉" dialog SHALL offer Next level, Stay and Restart. Next level SHALL load the following level with an empty program and SHALL be absent on the last level. Stay SHALL reset the level and keep the program. Restart SHALL reset the level and clear the program.

#### Scenario: Next level
- **GIVEN** the robot reached the exit of level 2
- **WHEN** the player chooses Next level
- **THEN** level 3 is loaded and the program is empty

#### Scenario: Stay
- **GIVEN** the win dialog is open
- **WHEN** the player chooses Stay
- **THEN** the robot is back at the start of the same level and the program is unchanged

#### Scenario: Restart
- **GIVEN** the win dialog is open
- **WHEN** the player chooses Restart
- **THEN** the robot is back at the start of the same level and the program is empty

#### Scenario: Last level
- **GIVEN** the robot reached the exit of the last level in the list
- **WHEN** the win dialog opens
- **THEN** it offers only Stay and Restart

#### Scenario: Closing the dialog
- **GIVEN** the win dialog is open
- **WHEN** the player closes it
- **THEN** the robot stays on the exit and the program is unchanged

### Requirement: Remembering levels
The list of levels and the current level SHALL be stored in the browser's local storage under `karol.levels` and `karol.level` and restored when the game is opened again. If storage is unavailable the game SHALL work with the built-in levels for that visit.

#### Scenario: Reload
- **GIVEN** level 4 is loaded
- **WHEN** the page is reloaded
- **THEN** level 4 is loaded again

#### Scenario: Stored level no longer exists
- **GIVEN** the stored current level id is not in the level list
- **WHEN** the game starts
- **THEN** the first level in the list is loaded

#### Scenario: Storage blocked
- **GIVEN** the browser refuses access to local storage
- **WHEN** the game starts
- **THEN** it runs with the built-in levels and shows no error

### Requirement: Built-in level versioning
The built-in levels SHALL carry a version, currently 5, stored as `karol.ver`. When the stored version differs, the built-in levels SHALL replace stored levels with the same ids and come first, followed by any other stored levels. When it matches, the stored list SHALL be used unchanged.

#### Scenario: Upgrade from an older version
- **GIVEN** stored levels containing an old `level-1` and a custom level `my-maze`, and a stored version of 4
- **WHEN** the game starts
- **THEN** the list is the seven built-in levels followed by `my-maze`

#### Scenario: Same version
- **GIVEN** stored levels and a stored version of 5
- **WHEN** the game starts
- **THEN** the stored levels are used as they are

### Requirement: Console export and import
Two functions SHALL be available in the browser console. `exportLevels()` SHALL print all levels as JSON and return them. `importLevels(levels)` SHALL accept a list or its JSON text, validate every level, replace levels with the same id, append the others, save, and return the number imported. There is no button for either.

#### Scenario: Export
- **WHEN** `exportLevels()` is called in the console
- **THEN** the JSON of all levels is printed and the list is returned

#### Scenario: Import a new level
- **GIVEN** a valid level with an id not yet in the list
- **WHEN** it is passed to `importLevels`
- **THEN** it is appended to the list, saved, and 1 is returned

#### Scenario: Import replaces by id
- **GIVEN** a valid level with the id `level-2`
- **WHEN** it is passed to `importLevels`
- **THEN** it replaces the existing `level-2` at the same position

#### Scenario: Import with an invalid level
- **GIVEN** a list in which one level has no `K`
- **WHEN** it is passed to `importLevels`
- **THEN** an error is raised and no level from the list is imported
