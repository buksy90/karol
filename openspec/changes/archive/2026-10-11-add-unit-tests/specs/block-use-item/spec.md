# Spec Delta

## MODIFIED Requirements

### Requirement: Empty slot
A slot SHALL be named only by a whole number from 1 to 8. When the chosen slot is empty, or the number is outside 1 to 8, has a fraction or is missing, the block SHALL show "Slot N is empty." in the status line and get a red dot, and SHALL NOT use any item. The program SHALL continue with the next block.

#### Scenario: Empty slot
- **GIVEN** slot 3 is empty
- **WHEN** a Use item 3 block executes
- **THEN** the status line shows "Slot 3 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Slot number out of range
- **GIVEN** a Use item block set to 12
- **WHEN** it executes
- **THEN** the status line shows "Slot 12 is empty."
- **AND** the block gets a red dot and the next block executes

#### Scenario: Slot number with a fraction
- **GIVEN** a key in slot 1, a locked door ahead and a Use item block set to 1.5
- **WHEN** it executes
- **THEN** the status line shows "Slot 1.5 is empty."
- **AND** the door stays locked and slot 1 still holds the key
- **AND** the block gets a red dot and the next block executes
