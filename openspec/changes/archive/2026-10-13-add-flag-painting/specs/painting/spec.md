# Spec Delta

## Purpose

Painting lets the robot change the colour of the floor. It covers the sprays the robot finds and carries, how a spray paints and runs out, the flags a level asks the robot to paint, what finishing a flag does, and how all of this is shown to the player.

## ADDED Requirements

### Requirement: Colours
A colour SHALL be given either as one of the names red, orange, yellow, green, blue, purple, black and white, or as a hex value of three or six digits after `#`, in upper or lower case. Each name SHALL stand for one fixed hex value. Two colours SHALL be the same colour when they are the same hex value, however each was written.

#### Scenario: Colour by name
- **GIVEN** a spray whose colour is `"red"`
- **WHEN** it paints a cell
- **THEN** the cell is the game's red

#### Scenario: Colour by hex value
- **GIVEN** a spray whose colour is `"#1e90ff"`
- **WHEN** it paints a cell
- **THEN** the cell is drawn in exactly that colour

#### Scenario: Name and hex value of the same colour
- **GIVEN** a flag cell that expects the hex value the name red stands for
- **WHEN** the robot paints it with a spray whose colour is `"red"`
- **THEN** the cell has its expected colour

#### Scenario: Short and long hex, upper and lower case
- **GIVEN** a flag cell that expects `"#F00"`
- **WHEN** the robot paints it with a spray whose colour is `"#ff0000"`
- **THEN** the cell has its expected colour

#### Scenario: Close but different
- **GIVEN** a flag cell that expects `"#ff0000"`
- **WHEN** the robot paints it with a spray whose colour is `"#fe0000"`
- **THEN** the cell does not have its expected colour and still shows its dot

### Requirement: Picking up a spray
When the robot enters a cell holding a spray, the spray SHALL be picked up into the first free inventory slot with all the uses the level gave it, and removed from the map.

#### Scenario: Picking up a spray
- **GIVEN** an empty inventory and a red spray with 3 uses in the cell ahead
- **WHEN** the robot moves forward
- **THEN** the spray disappears from the map and slot 1 shows a red spray with 3 uses left
- **AND** the status line shows "You found a spray ×3! (slot 1)"

#### Scenario: Two sprays of the same colour
- **GIVEN** a red spray in slot 1
- **WHEN** the robot picks up another red spray
- **THEN** the second spray goes into slot 2 and slot 1 is unchanged

#### Scenario: Inventory full
- **GIVEN** all 8 slots are full and a spray is in the cell ahead
- **WHEN** the robot moves forward
- **THEN** the robot enters the cell and the spray stays on the map
- **AND** the status line shows "Inventory is full!"

### Requirement: Painting a cell
Using a spray SHALL paint the cell the robot stands on in the spray's colour, replacing any colour the cell had. Only plain floor can be painted: a door cell and a cell still holding a key or a spray cannot. Paint SHALL NOT change what can enter the cell.

#### Scenario: Painting plain floor
- **GIVEN** the robot stands on unpainted floor with a red spray in slot 1
- **WHEN** the spray in slot 1 is used
- **THEN** the cell under the robot is red and the robot has not moved

#### Scenario: Painting over
- **GIVEN** the robot stands on a red cell with a blue spray in slot 1
- **WHEN** the spray in slot 1 is used
- **THEN** the cell is blue

#### Scenario: Standing in a doorway
- **GIVEN** the robot stands on an open door with a red spray in slot 1
- **WHEN** the spray in slot 1 is used
- **THEN** the door cell is not painted and the spray keeps its uses

#### Scenario: Crate pushed onto paint
- **GIVEN** a crate ahead of the robot and a painted floor cell behind the crate
- **WHEN** the robot moves forward
- **THEN** the crate moves onto the painted cell and the cell keeps its colour

### Requirement: Spray uses
Each time a spray paints a cell it SHALL lose one use, also when the cell already had that colour. A spray with uses left SHALL stay in its slot. A spray with no uses left SHALL be removed and its slot SHALL become empty.

#### Scenario: Uses left
- **GIVEN** a red spray with 3 uses in slot 2
- **WHEN** it paints a cell
- **THEN** slot 2 shows a red spray with 2 uses left

#### Scenario: Last use
- **GIVEN** a red spray with 1 use in slot 2
- **WHEN** it paints a cell
- **THEN** the cell is red and slot 2 is empty

#### Scenario: Same colour again
- **GIVEN** the robot stands on a red cell with a red spray with 2 uses in slot 1
- **WHEN** the spray is used
- **THEN** the cell is still red and the spray has 1 use left

#### Scenario: Slot freed by an empty spray
- **GIVEN** slot 1 was emptied by a used-up spray and slot 2 holds a spray
- **WHEN** the robot picks up another spray
- **THEN** it goes into slot 1

### Requirement: Flags
A level MAY define flags. A flag SHALL be a rectangle of cells with one expected colour per cell. A flag SHALL be done at the moment every one of its cells is painted its expected colour. Cells outside the rectangle SHALL NOT matter.

#### Scenario: Last cell painted
- **GIVEN** a 3x3 flag in which eight cells have their expected colour and the robot stands on the ninth
- **WHEN** the robot paints that cell its expected colour
- **THEN** the flag is done

#### Scenario: One cell wrong
- **GIVEN** a 3x3 flag in which every cell is painted and one has a colour other than its expected one
- **WHEN** the player looks at the level
- **THEN** the flag is not done and its door is locked

#### Scenario: Wrong cell corrected
- **GIVEN** a flag whose only wrong cell is under the robot
- **WHEN** the robot paints that cell its expected colour
- **THEN** the flag is done

#### Scenario: Paint outside the flag
- **GIVEN** a flag that is done except for one cell, and painted cells outside its rectangle
- **WHEN** the robot paints the last cell its expected colour
- **THEN** the flag is done

### Requirement: Finishing a flag opens its door
When a flag becomes done, the locked door the flag names SHALL open and the status line SHALL show "🎨 The flag is done! A door opened 🔓". The door SHALL then behave as an open door until the level is reset, also when a cell of the flag is painted another colour afterwards.

#### Scenario: Door opens
- **GIVEN** a flag that names the locked door at column 12, row 3, with one cell left to paint
- **WHEN** the robot paints the last cell its expected colour
- **THEN** that door is open and the robot can walk through it
- **AND** the status line shows "🎨 The flag is done! A door opened 🔓"

#### Scenario: Flag spoiled afterwards
- **GIVEN** a flag that is done and its door open
- **WHEN** the robot paints one of the flag's cells another colour
- **THEN** the door stays open

#### Scenario: Reset
- **GIVEN** a flag that is done and its door open
- **WHEN** the level is reset
- **THEN** the floor is unpainted and the door is locked again

#### Scenario: Two flags
- **GIVEN** a level with two flags that name different doors
- **WHEN** the first flag is done
- **THEN** only the first flag's door opens

### Requirement: Flag targets are shown
Each cell of a flag that is not painted its expected colour SHALL show a dot in the expected colour, on top of whatever colour the cell has. A cell painted its expected colour SHALL show no dot.

#### Scenario: Level start
- **GIVEN** a level with a 3x3 flag of three black, three red and three yellow cells
- **WHEN** the level is loaded
- **THEN** each of the nine cells shows a dot in its expected colour on unpainted floor

#### Scenario: Cell painted right
- **WHEN** the robot paints a flag cell its expected colour
- **THEN** the cell is filled with that colour and shows no dot

#### Scenario: Cell painted wrong
- **GIVEN** a flag cell that expects red
- **WHEN** the robot paints it blue
- **THEN** the cell is blue and shows a red dot

### Requirement: Flag doors
A locked door that a flag names SHALL be drawn with 🎨 in place of 🔒. When the robot tries to enter it while it is locked, the status line SHALL show "🎨 The door is locked! Paint the flag." and the program SHALL stop as for any locked door.

#### Scenario: Bumping into a flag door
- **GIVEN** a locked door named by a flag that is not done, in the cell ahead
- **WHEN** the robot tries to move forward
- **THEN** the robot stays where it is and the status line shows "🎨 The door is locked! Paint the flag."
- **AND** the program stops with a red dot on the block

#### Scenario: Ordinary locked door
- **GIVEN** a locked door that no flag names
- **WHEN** the map is drawn
- **THEN** the door shows 🔒
