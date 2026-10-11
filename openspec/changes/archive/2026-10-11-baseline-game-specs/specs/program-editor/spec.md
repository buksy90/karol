# Spec Delta

## Purpose

The program editor is where the player builds a program without typing: blocks are picked from a library and arranged by dragging, with mouse or finger. It has to be forgiving and obvious enough for a child, so every drag shows where the block will land and nothing is lost by a clumsy drop.

## ADDED Requirements

### Requirement: Block library
The library SHALL have three sections, in this order: Sensors, Blocks and Custom blocks. The Blocks section SHALL offer Turn left, Move forward, Use item, Repeat N times, If, Repeat while and Not. Each section SHALL collapse and expand when its heading is pressed, showing ▼ when open and ▶ when collapsed.

#### Scenario: Collapsing a section
- **GIVEN** the Blocks section is open
- **WHEN** the player presses its heading
- **THEN** its blocks are hidden and the heading shows ▶

#### Scenario: Containers in the library
- **WHEN** the Blocks section is shown
- **THEN** Repeat, If and Repeat while are shown as single rows without a body

### Requirement: Program panel
The program panel SHALL show the program as a vertical list of blocks between a START marker and an END marker. An empty list, including an empty container, SHALL show the hint "drop blocks here".

#### Scenario: Empty program
- **WHEN** the game starts
- **THEN** the panel shows START, the hint "drop blocks here" and END

### Requirement: Adding a block
Dragging a block from the library SHALL create a copy that follows the pointer; the library keeps its block. Dropping the copy on a list SHALL add it at the previewed position.

#### Scenario: Add to an empty program
- **GIVEN** an empty program
- **WHEN** the player drags Move forward from the library onto the program panel and releases
- **THEN** the program contains one Move forward block and the library still offers Move forward

### Requirement: Drop position preview
While a block is dragged over a list, a dashed placeholder SHALL show where it would land and the neighbouring blocks SHALL shift to make room. The placeholder SHALL sit before the first block whose vertical middle is below the pointer, or at the end of the list.

#### Scenario: Between two blocks
- **GIVEN** a program of two blocks
- **WHEN** a block is dragged to the gap between them
- **THEN** the placeholder appears between the two blocks

#### Scenario: Below the last block
- **GIVEN** a program of two blocks
- **WHEN** a block is dragged into the space under END
- **THEN** the placeholder appears after the last block

### Requirement: Moving a block
Dragging a block that is already in a program SHALL move it, together with everything inside it, to the previewed position.

#### Scenario: Reordering
- **GIVEN** a program of Turn left then Move forward
- **WHEN** the player drags Turn left below Move forward
- **THEN** the program is Move forward then Turn left

#### Scenario: Moving a container
- **GIVEN** a Repeat block containing two blocks
- **WHEN** the player drags the Repeat block to another position
- **THEN** it arrives with its two blocks still inside

### Requirement: Nested lists
The body of a Repeat, If or Repeat while block SHALL be a list of its own that accepts drops, shows the placeholder and can be reordered like the program itself.

#### Scenario: Dropping into a container
- **GIVEN** an empty Repeat block in the program
- **WHEN** the player drags Move forward over the body of the Repeat block and releases
- **THEN** Move forward is inside the Repeat block

### Requirement: Remove area
While a block is dragged, a red translucent area reading "🗑 Drop here to remove" SHALL cover the map and intensify when the block is over it. Dropping a block there SHALL delete it together with everything inside it.

#### Scenario: Deleting a block
- **GIVEN** a program of three blocks
- **WHEN** the player drags the second block onto the map and releases
- **THEN** the program has two blocks

#### Scenario: Remove area visibility
- **WHEN** no block is being dragged
- **THEN** the remove area is not shown

### Requirement: Drop outside a list
A block from the program that is dropped neither on a list nor on the remove area SHALL return to where it was. A copy from the library dropped there SHALL be discarded.

#### Scenario: Clumsy drop of an existing block
- **GIVEN** the second of three blocks is being dragged
- **WHEN** it is released over the block library
- **THEN** it is back in second position

### Requirement: Drop feedback
A block that was just added or moved SHALL glow yellow and fade back to normal over 2 seconds. A short sound SHALL play when a block is added, a different one when it is moved and a third when it is deleted, unless sound is switched off.

#### Scenario: Landing glow
- **WHEN** a block is dropped into the program
- **THEN** it glows and returns to its normal look within 2 seconds

#### Scenario: Sound off
- **GIVEN** sound is switched off in Options
- **WHEN** a block is added, moved or deleted
- **THEN** no sound plays

### Requirement: Editing numbers on a block
The number on a Use item or Repeat block SHALL be editable in place, and pressing on the number field SHALL NOT start a drag.

#### Scenario: Changing a number
- **GIVEN** a Repeat 2 times block in the program
- **WHEN** the player clicks the number and types 5
- **THEN** the block reads Repeat 5 times and has not moved

### Requirement: Mouse and touch
All dragging SHALL work the same with a mouse and with a finger on a touch screen.

#### Scenario: Touch drag
- **GIVEN** a tablet
- **WHEN** the player drags a block with a finger
- **THEN** the block follows the finger and the page does not scroll

### Requirement: Clear
The Clear button SHALL remove all blocks from the program and show "Program cleared.". It SHALL be ignored while the program runs automatically. It SHALL NOT move the robot or change the map.

#### Scenario: Clearing
- **GIVEN** a program of five blocks and no run active
- **WHEN** the player presses Clear
- **THEN** the program is empty and the status line shows "Program cleared."

### Requirement: Select mode
The Select button in the program panel SHALL switch select mode on and change to "✓ Done". In select mode, clicking a block in the program SHALL select or unselect it instead of dragging it. Selected blocks SHALL have a yellow outline and the status line SHALL show how many are selected. Select mode SHALL end when Done is pressed, a run starts or the custom block editor opens.

#### Scenario: Selecting blocks
- **GIVEN** select mode is on
- **WHEN** the player clicks two adjacent blocks
- **THEN** both are outlined and the status line shows "2 selected. Press "Make block" to turn them into a custom block."

#### Scenario: Leaving select mode
- **GIVEN** two blocks selected
- **WHEN** the player presses Done
- **THEN** no block is selected and blocks can be dragged again

#### Scenario: Select mode during a run
- **GIVEN** a running program
- **WHEN** the player presses Select
- **THEN** select mode stays off

### Requirement: Selection is one contiguous run
A selection SHALL consist of adjacent blocks of one list. Clicking a block that is not adjacent to the selection SHALL be refused with "Select blocks that are next to each other.". Clicking a block in a different list SHALL start a new selection there. Only the first or last selected block SHALL be unselectable, otherwise "You can only unselect blocks at the ends." is shown. Condition blocks SHALL NOT be selectable.

#### Scenario: Gap in the selection
- **GIVEN** the first of four blocks is selected
- **WHEN** the player clicks the third
- **THEN** it is not selected and the status line shows "Select blocks that are next to each other."

#### Scenario: Unselecting in the middle
- **GIVEN** three adjacent blocks selected
- **WHEN** the player clicks the middle one
- **THEN** it stays selected and the status line shows "You can only unselect blocks at the ends."

#### Scenario: Another list
- **GIVEN** two blocks of the program selected
- **WHEN** the player clicks a block inside a Repeat block
- **THEN** only that inner block is selected

### Requirement: Program is not persisted
The program SHALL exist only until the page is reloaded.

#### Scenario: Reload
- **GIVEN** a program of five blocks
- **WHEN** the page is reloaded
- **THEN** the program is empty
