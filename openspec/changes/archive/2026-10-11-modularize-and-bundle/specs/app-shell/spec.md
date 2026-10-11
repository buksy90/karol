# Spec Delta

## MODIFIED Requirements

### Requirement: Self-contained delivery
The game SHALL be delivered as a single HTML file produced by the project's build, containing all code, styles, levels and translations, with no external dependencies. The built file SHALL work when opened directly from disk and without a network connection.

#### Scenario: Opened offline
- **GIVEN** a computer with no network connection
- **WHEN** the built file is opened in a browser
- **THEN** the game is fully playable

#### Scenario: Build output
- **WHEN** the project is built
- **THEN** the output is exactly one HTML file that requests no other file when loaded

#### Scenario: Opened from disk
- **GIVEN** the built file copied alone to another folder
- **WHEN** it is opened by double-clicking it
- **THEN** the game starts with all seven built-in levels and both languages available
