# Spec Delta

## MODIFIED Requirements

### Requirement: Top bar
The top bar above the map SHALL show the inventory on the left and, on the right, the buttons Levels and Options in this order.

#### Scenario: Top bar contents
- **WHEN** the game is shown
- **THEN** the top bar shows "Inventory" with 8 slots, then Levels and Options
- **AND** there is no Specs button

### Requirement: Dialogs
Levels, Options and the win message SHALL open as a dialog over a dimmed screen, with a title and a Close button. Only one dialog SHALL be open at a time. A dialog SHALL close on the Close button, on a click on the dimmed area outside it, and on Esc.

#### Scenario: Closing by clicking outside
- **GIVEN** the Options dialog is open
- **WHEN** the player clicks the dimmed area
- **THEN** the dialog closes

#### Scenario: Esc with a dialog open during a run
- **GIVEN** a paused run and the Levels dialog open
- **WHEN** the player presses Esc
- **THEN** the dialog closes and the run is not stopped

## REMOVED Requirements

### Requirement: In-app specs
**Reason**: The OpenSpec specs under `openspec/specs/` are now the single description of the game. The embedded copy duplicated them and had to be updated by hand with every change.
**Migration**: Read the capability specs in `openspec/specs/` instead. The rule "update the in-app specs with every change" no longer applies.
