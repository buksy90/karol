# Spec Delta

## Purpose

Custom blocks let the player give a name to a sequence of blocks and reuse it as a single block, the way a programmer writes a function. They keep long programs short and introduce the idea of building bigger commands out of smaller ones.

## ADDED Requirements

### Requirement: Custom blocks library
The library SHALL have a Custom blocks section with a Create button and one row per custom block. Each row SHALL show the block as "⚙ name" with an edit button and a delete button. With no custom blocks the section SHALL show "No custom blocks yet".

#### Scenario: No custom blocks
- **GIVEN** no custom block has been created
- **WHEN** the Custom blocks section is shown
- **THEN** it shows the Create button and "No custom blocks yet"

#### Scenario: Using a custom block
- **GIVEN** a custom block named "Corner"
- **WHEN** the player drags "⚙ Corner" from the library into the program
- **THEN** the program contains a "⚙ Corner" block

### Requirement: Editor view
Creating or editing a custom block SHALL open an editor in place of the program panel, with a name field of at most 20 characters, a block list between START and END, Save and Cancel. While it is open the map SHALL be faded, the run controls and speed buttons SHALL be disabled and the status line SHALL show "Editing a custom block…".

#### Scenario: Opening the editor
- **WHEN** the player presses Create
- **THEN** the program panel is replaced by an editor titled "New custom block" with an empty name and an empty list
- **AND** the map is faded and Run, Step, Stop, Reset and Clear cannot be pressed

#### Scenario: Editing an existing block
- **GIVEN** a custom block "Corner" containing two blocks
- **WHEN** the player presses its edit button
- **THEN** the editor is titled "Edit custom block" and shows the name "Corner" and its two blocks

#### Scenario: Opening the editor during a run
- **GIVEN** a program that is running or paused
- **WHEN** the player opens the editor
- **THEN** the run ends

### Requirement: Save and cancel
Save SHALL store the name and the blocks in the editor and return to the program panel. Cancel SHALL return to the program panel and discard what was done in the editor.

#### Scenario: Saving a new block
- **GIVEN** the editor with the name "Corner" and two blocks
- **WHEN** the player presses Save
- **THEN** "⚙ Corner" appears in the library and the program panel is shown again

#### Scenario: Cancelling an edit
- **GIVEN** the editor opened on "Corner" with a block added
- **WHEN** the player presses Cancel
- **THEN** "Corner" still has its previous contents

### Requirement: Default name
When a custom block is saved with an empty name it SHALL be named "Block N" ("Blok N" in Slovak), where N is the number of custom blocks that exist after the save. Names are not required to be unique.

#### Scenario: First block without a name
- **GIVEN** no custom blocks
- **WHEN** a new block is saved with an empty name
- **THEN** it is named "Block 1"

#### Scenario: Duplicate default name
- **GIVEN** custom blocks "Block 1" and "Block 2", and "Block 1" is then deleted
- **WHEN** a new block is saved with an empty name
- **THEN** it is also named "Block 2"

### Requirement: Renaming
Saving a custom block under a new name SHALL update every use of it in the program and in the library.

#### Scenario: Rename
- **GIVEN** the program contains "⚙ Corner"
- **WHEN** the player edits that block, changes the name to "Turn round" and saves
- **THEN** the program shows "⚙ Turn round"

### Requirement: Deleting
The delete button SHALL ask for confirmation by changing to "Sure?" for 2.5 seconds. A second press within that time SHALL delete the custom block and remove every use of it from the program and from other custom blocks.

#### Scenario: Confirmed delete
- **GIVEN** "⚙ Corner" is used twice in the program and once inside another custom block
- **WHEN** the player presses delete and then "Sure?"
- **THEN** "Corner" is gone from the library, from the program and from the other custom block

#### Scenario: Delete not confirmed
- **GIVEN** the player pressed delete once
- **WHEN** 2.5 seconds pass without a second press
- **THEN** the button shows the delete icon again and nothing was deleted

### Requirement: Contents and cycle prevention
A custom block SHALL be able to contain any blocks, including other custom blocks. While a custom block is being edited, the library SHALL hide that block and every custom block that contains it directly or indirectly, so that a block can never end up containing itself.

#### Scenario: Block cannot contain itself
- **GIVEN** the editor opened on "A"
- **WHEN** the player looks at the Custom blocks section
- **THEN** "A" is not offered

#### Scenario: Indirect cycle
- **GIVEN** custom block "B" contains "A"
- **WHEN** the player edits "A"
- **THEN** "B" is not offered in the library

#### Scenario: Unrelated block
- **GIVEN** custom block "C" does not contain "A"
- **WHEN** the player edits "A"
- **THEN** "C" is offered and can be dragged into the editor

### Requirement: Executing a custom block
When a custom block in the program executes, the blocks inside it SHALL run in order. Every step inside SHALL show the custom block in the program as the current block, and the status dots SHALL be placed on that block as a whole.

#### Scenario: Stepping through a call
- **GIVEN** a custom block containing two Move forward blocks, used once in the program
- **WHEN** the player presses Step twice
- **THEN** the robot moves two cells and the custom block is the current block for both steps

#### Scenario: Failure inside a call
- **GIVEN** a custom block containing a Move forward block and a wall ahead
- **WHEN** the custom block executes
- **THEN** the custom block in the program gets a red dot and the program stops

#### Scenario: Empty custom block
- **GIVEN** a custom block with nothing inside
- **WHEN** it executes
- **THEN** it takes no step and the program continues

### Requirement: Nesting depth limit
Custom blocks SHALL be executed up to 20 levels deep. A call that would go deeper SHALL be skipped without any message.

#### Scenario: Call nested too deep
- **GIVEN** 21 custom blocks each containing the next one
- **WHEN** the outermost is executed
- **THEN** the innermost is skipped and no error is shown

### Requirement: Make a block from a selection
With blocks selected in the program, a "⚙ Make block (n)" button SHALL open the editor prefilled with copies of the selection. Save SHALL replace the selected blocks with one use of the new custom block. Cancel SHALL leave the program unchanged.

#### Scenario: Saving the selection as a block
- **GIVEN** three adjacent blocks selected in the program
- **WHEN** the player presses "Make block (3)", enters "Corner" and saves
- **THEN** the three blocks are replaced by one "⚙ Corner" at the same position
- **AND** "Corner" contains the three blocks with their numbers, conditions and nested blocks

#### Scenario: Cancelling
- **GIVEN** the editor opened from a selection
- **WHEN** the player presses Cancel
- **THEN** the program still contains the original three blocks

### Requirement: Not persisted
Custom blocks SHALL exist only until the page is reloaded.

#### Scenario: Reload
- **GIVEN** two custom blocks
- **WHEN** the page is reloaded
- **THEN** the Custom blocks section shows "No custom blocks yet"
