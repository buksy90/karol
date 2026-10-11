# Proposal

## Why

Robot Karol was built conversationally in the Claude web interface and exists only as a single `index.html` with an embedded prose spec. Before new features are added, the current behaviour needs to be written down as OpenSpec capabilities so that every later change can be expressed as a delta against a known baseline.

## What Changes

- Document the behaviour of the existing `index.html` as 16 capabilities, exactly as the code behaves today.
- No code changes. No behaviour changes.
- Sources: the code in `index.html`, its embedded spec (`<template id="specs-en">`), and the project brief written by the web-interface session. Where they disagree, the code wins.
- Scenarios double as the first manual test checklist: the visual behaviour (drag and drop, animations, sounds) has never been verified in a real browser.

## Capabilities

### New Capabilities

- `world`: the tile map, its symbols, what the robot can enter, crates, keys, doors, the exit, the inventory and how the map is drawn.
- `block-turn-left`: the Turn left block.
- `block-move-forward`: the Move forward block and its failure cases.
- `block-use-item`: the Use item block and unlocking doors with keys.
- `block-repeat-times`: the Repeat N times container block and its round counter.
- `block-if`: the If container block.
- `block-repeat-while`: the Repeat while container block and its does-nothing guard.
- `block-not`: the Not operator for conditions.
- `sensor-can-go-forward`: the Can go forward sensor.
- `conditions`: condition slots, how a condition check runs as a step, and the sonar animation.
- `custom-blocks`: user-defined blocks: library, editor, cycle prevention, make-block-from-selection.
- `program-execution`: Run, Pause, Step, Stop, Reset, speed, the execution pointer, status dots and safety limits.
- `levels`: level format, built-in levels, storage, the level picker, the win dialog and console import/export.
- `language-support`: English and Slovak interface, switching and persistence.
- `program-editor`: the block library and the drag-and-drop program panel, including select mode, the remove area and sounds.
- `app-shell`: page layout, top bar, status line, dialogs, the Options menu and the in-app Specs view.

### Modified Capabilities

None. There are no existing specs.

## Impact

- Adds `openspec/specs/<capability>/spec.md` for each capability once this change is archived.
- `index.html` is not touched.

## Known gaps (out of scope here, decided for follow-up changes)

The baseline records these as they behave today. Decisions already taken by the project owner:

| # | Today | Decision |
|---|---|---|
| 1 | Picking a level from the list keeps the current program; "Next level" clears it | Each level has its own program, empty if never visited (see 9) |
| 2 | Editing is blocked only while running; dragging while paused silently cancels the run | Lock all editing (drag, number fields, Clear, Select, custom block create/edit/delete) from the first Run or Step until the program finishes, fails or is stopped |
| 3 | A custom block call nested deeper than 20 is skipped silently | Stop the program with a red dot and a status-line error |
| 4 | Number fields accept any typed value; Repeat is clamped only at run time, Use item not at all | Validate while editing: snap an out-of-range or empty value back to the last valid one when the field loses focus |
| 5 | The does-nothing guard counts failed actions as progress, so some endless loops run to the 5000-step limit | **Open** - proposed: compare world state before and after each round |
| 6 | Default names "Block N" can repeat; names are not unique | Names are unique; saving a duplicate is refused with a status message |
| 7 | Translations live in the page; a few strings are English only | Move translations to one external `.json` file per language |
| 8 | Levels are only checked for exactly one robot start | Ignore for now |
| 9 | Program and custom blocks are lost on reload | Keep the program per level, and custom blocks, in session storage |
| 10 | Sonar colour follows the raw sensor, not the Not result | Ignore for now |
| 11 | In single-step mode "Step N" overwrites the message of the step just executed (key found, "Can go forward? yes", "Slot 3 is empty.") | **Open** - found while writing the specs |

Further direction, not yet scheduled:

- Each level becomes its own `.json` file in a `levels` directory. The file is an object, so it can later carry a description, constraints, or be generated dynamically.
- Split `index.html` into modules or services, add a bundler, and add code references to the specs.
- Add unit tests.
- **Open**: whether the in-app Specs view is retired once OpenSpec is the source of truth.

Items 7 and the per-level `.json` files load external files, which a single page opened from disk cannot do; they depend on a bundler or a local server.
