# Spec Delta

## ADDED Requirements

### Requirement: Paint with a spray
When the chosen slot holds a spray and the robot stands on plain floor, the block SHALL paint the cell under the robot as the `painting` capability describes and show "Painted! ×N left." in the status line, where N is the number of uses the spray has left, or "Painted! The spray is empty." when that was its last use. The robot SHALL NOT move. When the paint finishes a flag, the status line SHALL show the flag message instead.

#### Scenario: Spray with uses left
- **GIVEN** a red spray with 3 uses in slot 1 and the robot on plain floor
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and the robot is still on it
- **AND** the status line shows "Painted! ×2 left."

#### Scenario: Last use of a spray
- **GIVEN** a red spray with 1 use in slot 1 and the robot on plain floor
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and slot 1 is empty
- **AND** the status line shows "Painted! The spray is empty."

#### Scenario: Used again after the spray ran out
- **GIVEN** slot 1 was just emptied by the last use of a spray
- **WHEN** another Use item 1 block executes
- **THEN** the status line shows "Slot 1 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Paint that finishes a flag
- **GIVEN** a flag with one cell left to paint, the robot on that cell and a spray of the expected colour in slot 3
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "🎨 The flag is done! A door opened 🔓"
- **AND** the next block executes

#### Scenario: Spray with a locked door ahead
- **GIVEN** a red spray in slot 1, the robot on plain floor and a locked door ahead
- **WHEN** a Use item 1 block executes
- **THEN** the cell under the robot is red and the door is still locked

## MODIFIED Requirements

### Requirement: Nothing to use the item on
When the chosen slot holds a key and the cell ahead is not a locked door, or holds a spray and the robot stands on a cell that cannot be painted, the block SHALL show "Nothing happens here…" in the status line and get a red dot. The item SHALL stay in its slot unchanged and the program SHALL continue.

#### Scenario: Key used on a wall
- **GIVEN** a key in slot 1 and a wall ahead
- **WHEN** a Use item 1 block executes
- **THEN** the status line shows "Nothing happens here…"
- **AND** slot 1 still holds the key
- **AND** the block gets a red dot and the next block executes

#### Scenario: Spray used in a doorway
- **GIVEN** a red spray with 3 uses in slot 1 and the robot standing on an open door
- **WHEN** a Use item 1 block executes
- **THEN** the status line shows "Nothing happens here…"
- **AND** slot 1 still holds the spray with 3 uses
- **AND** the block gets a red dot and the next block executes

### Requirement: Use item label
The block SHALL be labelled "🎒 Use item" in English and "🎒 Použi" in Slovak, followed by the slot number.

#### Scenario: Slovak label
- **GIVEN** the interface language is Slovak
- **WHEN** the block library is shown
- **THEN** the block reads "🎒 Použi" followed by the slot number
