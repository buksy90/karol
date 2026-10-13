# Spec Delta

## ADDED Requirements

### Requirement: Unique names
No two custom blocks SHALL have the same name, compared without regard to upper and lower case and to spaces at either end. Saving under a name that another custom block already has SHALL be refused: the editor stays open with its contents and the status line shows 'A block named "<name>" already exists. Choose another name.'.

#### Scenario: Duplicate name on a new block
- **GIVEN** a custom block named "Corner"
- **WHEN** the player creates a new block, names it "corner" and presses Save
- **THEN** the block is not saved, the editor stays open
- **AND** the status line shows 'A block named "corner" already exists. Choose another name.'

#### Scenario: Keeping its own name
- **GIVEN** the editor opened on "Corner"
- **WHEN** the player adds a block and presses Save without changing the name
- **THEN** the block is saved

#### Scenario: Renaming to a taken name
- **GIVEN** custom blocks "Corner" and "Spin"
- **WHEN** the player edits "Spin", renames it "Corner" and presses Save
- **THEN** the save is refused and "Spin" keeps its name and previous contents

### Requirement: Custom blocks kept for the session
Custom blocks SHALL be shared by all levels and saved in the browser's session storage on every create, edit and delete, so that they are available again after a page reload in the same tab. If session storage is unavailable, they SHALL be kept until the page is reloaded.

#### Scenario: Reload in the same tab
- **GIVEN** two custom blocks, one of them used in the program of level 1
- **WHEN** the page is reloaded
- **THEN** both custom blocks are in the library with their contents
- **AND** the program of level 1 still uses the custom block

#### Scenario: Shared between levels
- **GIVEN** a custom block created while level 1 was loaded
- **WHEN** the player switches to level 4
- **THEN** the custom block is offered in the library

#### Scenario: New tab
- **GIVEN** custom blocks were created in one browser tab
- **WHEN** the game is opened in a new tab
- **THEN** the Custom blocks section shows "No custom blocks yet"

## MODIFIED Requirements

### Requirement: Editor view
Creating or editing a custom block SHALL open an editor in place of the program panel, with a name field of at most 20 characters, a block list between START and END, Save and Cancel. While it is open the map SHALL be faded, the run controls and speed buttons SHALL be disabled and the status line SHALL show "Editing a custom block…". The editor SHALL NOT be openable from the first Run or Step until the run has ended.

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
- **WHEN** the player presses Create or a custom block's edit button
- **THEN** the editor does not open and the run continues unaffected

### Requirement: Default name
When a custom block is saved with an empty name it SHALL be named "Block N" ("Blok N" in Slovak), where N is the smallest number from 1 upward for which no custom block has that name.

#### Scenario: First block without a name
- **GIVEN** no custom blocks
- **WHEN** a new block is saved with an empty name
- **THEN** it is named "Block 1"

#### Scenario: Duplicate default name
- **GIVEN** custom blocks "Block 1" and "Block 2", and "Block 1" is then deleted
- **WHEN** a new block is saved with an empty name
- **THEN** it is named "Block 1"

#### Scenario: Number already taken by a named block
- **GIVEN** the player named a custom block "Block 1" by hand
- **WHEN** a new block is saved with an empty name
- **THEN** it is named "Block 2"

### Requirement: Deleting
The delete button SHALL ask for confirmation by changing to "Sure?" for 2.5 seconds. A second press within that time SHALL delete the custom block and remove every use of it from the programs of all levels and from other custom blocks. Deleting SHALL NOT be possible from the first Run or Step until the run has ended.

#### Scenario: Confirmed delete
- **GIVEN** "⚙ Corner" is used twice in the program and once inside another custom block
- **WHEN** the player presses delete and then "Sure?"
- **THEN** "Corner" is gone from the library, from the program and from the other custom block

#### Scenario: Used on another level
- **GIVEN** "⚙ Corner" is used in the program of level 1 and level 3 is loaded
- **WHEN** the player deletes "Corner" and then switches to level 1
- **THEN** the program of level 1 no longer contains "Corner" and its other blocks are intact

#### Scenario: Delete not confirmed
- **GIVEN** the player pressed delete once
- **WHEN** 2.5 seconds pass without a second press
- **THEN** the button shows the delete icon again and nothing was deleted

#### Scenario: Delete during a run
- **GIVEN** a paused run
- **WHEN** the player presses a custom block's delete button
- **THEN** nothing happens

### Requirement: Nesting depth limit
Custom blocks SHALL be executed up to 20 levels deep. A call that would go deeper SHALL fail: the status line shows "Too many custom blocks inside each other!", the custom block in the program gets a red dot and the program stops.

#### Scenario: Call nested too deep
- **GIVEN** 21 custom blocks each containing the next one
- **WHEN** the outermost is executed
- **THEN** the status line shows "Too many custom blocks inside each other!"
- **AND** the custom block in the program gets a red dot and no further blocks execute

#### Scenario: Exactly at the limit
- **GIVEN** 20 custom blocks each containing the next one, the innermost containing a Turn left block
- **WHEN** the outermost is executed
- **THEN** the robot turns left and no error is shown

## REMOVED Requirements

### Requirement: Not persisted
**Reason**: Replaced by "Custom blocks kept for the session". Custom blocks now survive a reload in the same tab.
**Migration**: None. Nothing was stored before, so there is no data to convert.
