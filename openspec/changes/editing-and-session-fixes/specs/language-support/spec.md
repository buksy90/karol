# Spec Delta

## MODIFIED Requirements

### Requirement: Texts that are not translated
Names entered by people, namely custom block names and level names, SHALL be shown as entered. The edit and delete tooltips of custom blocks, the "drop blocks here" hint of an empty list and level validation errors SHALL be in English in every language.

#### Scenario: Custom block name
- **GIVEN** a custom block named "Corner"
- **WHEN** the language is switched to Slovak
- **THEN** the block is still named "Corner"

#### Scenario: Empty list hint in Slovak
- **GIVEN** the interface is in Slovak and the program is empty
- **WHEN** the player looks at the program panel
- **THEN** the hint reads "drop blocks here"

#### Scenario: New messages are translated
- **GIVEN** the interface is in Slovak
- **WHEN** the player tries to drag a block during a run, saves a custom block under a taken name, or runs custom blocks nested too deep
- **THEN** each message is shown in Slovak
