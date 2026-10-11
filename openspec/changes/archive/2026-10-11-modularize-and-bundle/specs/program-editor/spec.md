# Spec Delta

## MODIFIED Requirements

### Requirement: Drop outside a list
While a block is dragged, the drop placeholder SHALL stay at the last list position it showed until the pointer reaches another list position or the remove area. A block released outside any list SHALL land where the placeholder is. With no placeholder showing, a block from the program SHALL return to where it was and a copy from the library SHALL be discarded.

#### Scenario: Clumsy drop of an existing block
- **GIVEN** the second of three blocks is being dragged and has not been over any other list position
- **WHEN** it is released over the block library
- **THEN** it is back in second position

#### Scenario: Released outside after previewing a position
- **GIVEN** a copy from the library was dragged over the end of the program, so the placeholder shows there
- **WHEN** the pointer leaves the program panel without crossing the remove area and the block is released
- **THEN** the block is added at the end of the program

#### Scenario: Library copy that never reached a list
- **GIVEN** a copy from the library that has not been over any list
- **WHEN** it is released over the top bar
- **THEN** it is discarded and the program is unchanged

#### Scenario: Away from the remove area
- **GIVEN** a block from the program dragged over the remove area, so no placeholder shows
- **WHEN** the pointer leaves the remove area without reaching a list and the block is released
- **THEN** the block returns to where it was
