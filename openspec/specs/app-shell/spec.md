# app-shell Specification

## Purpose
The app shell is the frame around the game: how the screen is divided between programming and the map, where the player reads what just happened, and how the secondary screens (levels, specs, options) open and close. It also covers how the game is delivered.

## Code

- `index.html` - the page the application mounts into
- `src/main.ts` - start-up order; debug access to the stores
- `src/App.vue` - the two-column layout
- `src/styles.css` - all styles, including the narrow-screen layout
- `src/stores/ui.ts` - status message and open dialog
- `src/stores/settings.ts` - the sound setting
- `src/logic/storage.ts` - guarded local storage
- `src/components/TopBar.vue` - inventory and the Levels, Specs and Options buttons
- `src/components/StatusLine.vue` - the status line
- `src/components/AppDialog.vue` - the dialog frame
- `src/components/OptionsDialog.vue` - the Options menu
- `src/components/SpecsDialog.vue` - the in-app specs view
- `src/components/specs-en.html` - the in-app specs text
- `vite.config.ts` - the build that produces the single HTML file
- `tests/stores/settings.test.ts` - tests of the sound setting
- `tests/stores/ui.test.ts` - tests of the status line and dialogs
- `tests/logic/storage.test.ts` - tests of the guarded local storage
- `tests/composables/useShortcuts.test.ts` - test of Esc closing a dialog without stopping the run

## Requirements

### Requirement: Two-column layout
The screen SHALL have a left column for programming and a right column for the world. The left column SHALL hold, top to bottom, the block library, the program panel, the speed buttons and the run controls. The right column SHALL hold a top bar, the map and the status line.

#### Scenario: Desktop layout
- **GIVEN** a window wider than 820 px
- **WHEN** the game is shown
- **THEN** programming is on the left and the map on the right, and the game fills the window without page scrolling

### Requirement: Narrow screens
On a screen 820 px wide or narrower the two columns SHALL stack vertically, programming first, and the page SHALL scroll.

#### Scenario: Phone layout
- **GIVEN** a window 400 px wide
- **WHEN** the game is shown
- **THEN** the library, program and controls come first, followed by the top bar, the map and the status line

### Requirement: Top bar
The top bar above the map SHALL show the inventory on the left and, on the right, the buttons Levels, Specs and Options in this order.

#### Scenario: Top bar contents
- **WHEN** the game is shown
- **THEN** the top bar shows "Inventory" with 8 slots, then Levels, Specs and Options

### Requirement: Status line
A single status line under the map SHALL show the latest message from the game, replacing the previous one. When the game starts it SHALL show "Build a program and press Run!".

#### Scenario: Message replaced
- **GIVEN** the status line shows "Running…"
- **WHEN** the robot walks into a wall
- **THEN** the status line shows only "💥 Ouch, a wall!"

### Requirement: Dialogs
Levels, Specs, Options and the win message SHALL open as a dialog over a dimmed screen, with a title and a Close button. Only one dialog SHALL be open at a time. A dialog SHALL close on the Close button, on a click on the dimmed area outside it, and on Esc.

#### Scenario: Closing by clicking outside
- **GIVEN** the Options dialog is open
- **WHEN** the player clicks the dimmed area
- **THEN** the dialog closes

#### Scenario: Esc with a dialog open during a run
- **GIVEN** a paused run and the Levels dialog open
- **WHEN** the player presses Esc
- **THEN** the dialog closes and the run is not stopped

### Requirement: Options menu
The Options dialog SHALL offer the language choice and a Sound on/off switch.

#### Scenario: Options contents
- **WHEN** the player opens Options
- **THEN** it shows Language with English and Slovenčina, and Sound with its current state

### Requirement: Sound setting
Sound SHALL be on by default. The Sound switch SHALL toggle it, play a sample sound when turning on, and the setting SHALL be stored in the browser's local storage under `karol.sound` and restored on the next visit.

#### Scenario: Turning sound off
- **GIVEN** sound is on
- **WHEN** the player presses the Sound switch
- **THEN** it reads "Sound: Off" and no editor sounds play

#### Scenario: Remembered setting
- **GIVEN** the player switched sound off
- **WHEN** the page is reloaded
- **THEN** sound is still off

### Requirement: In-app specs
The Specs button SHALL open a dialog with an English description of the game: layout, map, robot rules, inventory, blocks, sensors, custom blocks, execution, levels, options and technical notes. Its text SHALL be selectable for copying.

#### Scenario: Opening the specs
- **GIVEN** the interface is in Slovak
- **WHEN** the player presses the Specs button
- **THEN** the dialog shows the description in English

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
