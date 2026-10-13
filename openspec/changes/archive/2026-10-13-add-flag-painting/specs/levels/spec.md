# Spec Delta

## ADDED Requirements

### Requirement: Positions in a level
A position in a level SHALL be written `[x, y]`, where x is the column counted from the left and y is the row counted from the top, both starting at 0.

#### Scenario: Position on the map
- **GIVEN** the map `["WWWWW","WK LW","WWWWW"]`
- **WHEN** a level names the position `[3, 1]`
- **THEN** it means the locked door

### Requirement: Level items
A level MAY carry `items`, a list of things lying on the floor. Each item SHALL have `type`, which is `"spray"`, a `position`, a `color` that is a colour name or a hex value as the `painting` capability defines, and `uses`, a whole number from 1 to 99. An item SHALL lie on plain floor, and no two items SHALL share a cell.

#### Scenario: A spray on the floor
- **GIVEN** a level with `"items": [{"type":"spray","position":[3,1],"color":"red","uses":3}]`
- **WHEN** it is loaded
- **THEN** a red spray with 3 uses lies in column 3 of row 1

#### Scenario: A spray with a hex colour
- **GIVEN** a level with `"items": [{"type":"spray","position":[3,1],"color":"#1e90ff","uses":2}]`
- **WHEN** it is loaded
- **THEN** a spray of exactly that colour with 2 uses lies in column 3 of row 1

#### Scenario: Level without items
- **GIVEN** a level with only `id`, `name` and `map`
- **WHEN** it is loaded
- **THEN** it has no sprays and behaves as before

### Requirement: Level flags
A level MAY carry `flags`, a list of flags. Each flag SHALL have a `position`, which is its top-left cell, `colors`, a list of rows of colours (names or hex values) with every row the same length, and `onDrawn.unlockDoor`, the position of the locked door the flag opens. Every cell of the flag SHALL be plain floor or the robot start.

#### Scenario: A three by three flag
- **GIVEN** a flag with `"position":[9,1]`, `"colors":[["black","black","black"],["red","red","red"],["yellow","yellow","yellow"]]` and `"onDrawn":{"unlockDoor":[12,3]}`
- **WHEN** the level is loaded
- **THEN** the flag covers columns 9 to 11 of rows 1 to 3, expects black in row 1, red in row 2 and yellow in row 3, and opens the door in column 12 of row 3

#### Scenario: Flag that is not square
- **GIVEN** a flag whose `colors` has 2 rows of 4 colours
- **WHEN** the level is loaded
- **THEN** the flag is 4 cells wide and 2 cells high

### Requirement: Items and flags are kept
The `items` and `flags` of a level SHALL be stored, exported and imported together with its map, and SHALL be left out of a level that has none.

#### Scenario: Export and import
- **GIVEN** a level with items and flags
- **WHEN** the result of `exportLevels()` is passed to `importLevels` in another browser
- **THEN** the level there has the same sprays and flags

#### Scenario: Reload
- **GIVEN** an imported level with a flag
- **WHEN** the page is reloaded and the level is loaded
- **THEN** the flag is still part of the level

## MODIFIED Requirements

### Requirement: Level format
A level SHALL be an object with an `id`, a `name` and a `map`, where the map is a list of text rows using the world's map symbols. It MAY also have `items` and `flags`.

#### Scenario: Minimal level
- **GIVEN** the level `{"id":"level-1","name":"Level 1","map":["WWWWW","WK eW","WWWWW"]}`
- **WHEN** it is loaded
- **THEN** the map is 5 by 3 with the robot at the left and the exit at the right

### Requirement: Level validation
A level SHALL be accepted only if its map is a non-empty list of text rows, or one text with line breaks, containing exactly one robot start `K`, and its `items` and `flags`, when present, follow their requirements. A missing id or name SHALL be filled in with a generated value. A rejected level SHALL raise an error naming the level and what is wrong. Nothing else is checked.

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

#### Scenario: Spray in a wall
- **GIVEN** a level with a spray whose position is a wall cell
- **WHEN** it is imported
- **THEN** it is rejected with an error naming the level and the item

#### Scenario: Unknown colour
- **GIVEN** a level with a spray or a flag cell of the colour `"pink"`
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Malformed hex value
- **GIVEN** a level with a spray or a flag cell of the colour `"#12"`, `"#12345g"`, `"1e90ff"` or `"#1e90ff80"`
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Colours are kept as written
- **GIVEN** an imported level with a spray of the colour `"red"` and a flag cell of the colour `"#F00"`
- **WHEN** `exportLevels()` is called
- **THEN** the exported level says `"red"` and `"#F00"`

#### Scenario: Unknown item type
- **GIVEN** a level with an item of type `"hammer"`
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Spray without uses
- **GIVEN** a level with a spray whose `uses` is missing, 0 or 2.5
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Two sprays on one cell
- **GIVEN** a level with two sprays at the same position
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Flag rows of different length
- **GIVEN** a level with a flag whose rows hold 3, 2 and 3 colours
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Flag over a wall
- **GIVEN** a level with a flag one of whose cells is a wall, a door, a key, the exit or outside the map
- **WHEN** it is imported
- **THEN** it is rejected with an error naming the level and the flag

#### Scenario: Flag door that is not a locked door
- **GIVEN** a level with a flag whose `unlockDoor` position is floor
- **WHEN** it is imported
- **THEN** it is rejected

#### Scenario: Flag without a door
- **GIVEN** a level with a flag that has no `onDrawn.unlockDoor`
- **WHEN** it is imported
- **THEN** it is rejected

### Requirement: Built-in levels
The game SHALL ship with eight levels, ids `level-1` to `level-8`, named "Level 1" to "Level 8", in this order.

#### Scenario: Level list on first start
- **GIVEN** a browser with no stored data
- **WHEN** the game starts
- **THEN** Level 1 is loaded and the level list shows Level 1 to Level 8

#### Scenario: What each level teaches
- **WHEN** the built-in levels are played in order
- **THEN** level 1 is a straight walk (15x4), level 2 a corridor with turns (15x9), level 3 an open door, a key and a locked door (15x9), level 4 a wall of crates to push through (15x9), level 5 a key, a crate and a locked door (15x15), level 6 a long spiral maze (15x16), level 7 a diagonal staircase corridor (15x15) and level 8 three sprays and a room to paint as a flag (15x7)

#### Scenario: Level 8 layout
- **WHEN** level 8 is loaded
- **THEN** a black, a red and a yellow spray with 3 uses each lie in the start corridor in this order, an open door leads to a 3x3 room whose whole floor is a flag of a black, a red and a yellow row, and the exit is behind the locked door that the flag opens

#### Scenario: Level 8 can be solved
- **GIVEN** level 8 and the program: move 8 times; use item 1, then twice move and use item 1; turn left 3 times, move, turn left 3 times; use item 2, then twice move and use item 2; turn left, move, turn left; use item 3, then twice move and use item 3; move 2 times; turn left 3 times; move 2 times
- **WHEN** the program runs
- **THEN** the flag is done after the ninth use, the inventory is empty, and the robot reaches the exit

### Requirement: Built-in level versioning
The built-in levels SHALL carry a version, currently 6, stored as `karol.ver`. When the stored version differs, the built-in levels SHALL replace stored levels with the same ids and come first, followed by any other stored levels. When it matches, the stored list SHALL be used unchanged.

#### Scenario: Upgrade from an older version
- **GIVEN** stored levels containing an old `level-1` and a custom level `my-maze`, and a stored version of 5
- **WHEN** the game starts
- **THEN** the list is the eight built-in levels followed by `my-maze`

#### Scenario: Same version
- **GIVEN** stored levels and a stored version of 6
- **WHEN** the game starts
- **THEN** the stored levels are used as they are
