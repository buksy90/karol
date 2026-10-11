# language-support Specification

## Purpose
Language support lets children play in their own language. The whole interface, including the blocks they program with and the messages the game gives them, is available in English and Slovak and can be switched at any time.

## Code

- `src/logic/i18n.ts` - key lookup with English fallback; default language
- `src/stores/settings.ts` - the current language and the list of languages
- `src/composables/useT.ts` - translation function for components
- `src/components/OptionsDialog.vue` - the language switch
- `locales/*.json` - the dictionaries, one file per language
- `tests/logic/i18n.test.ts` - tests of the lookup and the default language
- `tests/stores/settings.test.ts` - tests of switching and remembering the language
- `tests/data/locales.test.ts` - tests that both dictionaries hold the same keys and placeholders

## Requirements

### Requirement: Supported languages
The interface SHALL be available in English and Slovak. The translation SHALL cover labels, buttons, block and sensor names, status messages and dialogs.

#### Scenario: Slovak interface
- **GIVEN** the language is Slovak
- **WHEN** the player looks at the screen
- **THEN** the program panel is titled "Môj program", the Run button reads "▶ Spustiť" and the Move forward block reads "⬆ Choď"

#### Scenario: Slovak messages
- **GIVEN** the language is Slovak
- **WHEN** the robot walks into a wall
- **THEN** the status line shows "💥 Au, stena!"

### Requirement: Default language
On first use the language SHALL be Slovak when the browser's language is Slovak and English otherwise. A language chosen earlier by the player SHALL take precedence.

#### Scenario: Slovak browser
- **GIVEN** no stored language and a browser set to Slovak
- **WHEN** the game starts
- **THEN** the interface is in Slovak

#### Scenario: Other browser language
- **GIVEN** no stored language and a browser set to German
- **WHEN** the game starts
- **THEN** the interface is in English

### Requirement: Switching language
The Options menu SHALL list English and Slovenčina with the current one ticked. Choosing one SHALL translate the whole interface immediately, including blocks already in the program and the open dialog, without changing the program, the level or the robot.

#### Scenario: Switching with a program built
- **GIVEN** an English interface and a program of five blocks
- **WHEN** the player chooses Slovenčina in Options
- **THEN** all five blocks, the library, the buttons and the Options dialog are shown in Slovak
- **AND** the program still has the same five blocks with the same numbers

#### Scenario: Status line after a switch
- **GIVEN** no run is active and the custom block editor is closed
- **WHEN** the language is switched
- **THEN** the status line shows the ready message in the new language

### Requirement: Remembering the language
The chosen language SHALL be stored in the browser's local storage under `karol.lang` and used the next time the game is opened. If storage is unavailable the choice SHALL last until the page is reloaded.

#### Scenario: Reload
- **GIVEN** the player chose Slovak
- **WHEN** the page is reloaded
- **THEN** the interface is in Slovak

### Requirement: Missing translations
A text that has no translation in the current language SHALL be shown in English.

#### Scenario: Missing Slovak text
- **GIVEN** a text that exists only in English
- **WHEN** the interface is in Slovak
- **THEN** that text is shown in English

### Requirement: Texts that are not translated
Names entered by people, namely custom block names and level names, SHALL be shown as entered. The in-app specs, the edit and delete tooltips of custom blocks, the "drop blocks here" hint of an empty list and level validation errors SHALL be in English in every language.

#### Scenario: Custom block name
- **GIVEN** a custom block named "Corner"
- **WHEN** the language is switched to Slovak
- **THEN** the block is still named "Corner"

#### Scenario: Empty list hint in Slovak
- **GIVEN** the interface is in Slovak and the program is empty
- **WHEN** the player looks at the program panel
- **THEN** the hint reads "drop blocks here"
