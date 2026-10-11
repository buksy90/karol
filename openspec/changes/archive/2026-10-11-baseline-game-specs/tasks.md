# Tasks

This change adds no code. The tasks verify that the specs describe what `index.html` really does. Open `index.html` in a desktop browser for all of them.

## 1. Review the specs

- [ ] 1.1 Read the 16 capability specs and confirm the split and wording match the owner's intent; done when every requested correction is applied to the spec files
- [ ] 1.2 Run `openspec validate baseline-game-specs --strict` and confirm it reports the change as valid

## 2. Check the scenarios against the running game

- [ ] 2.1 Walk through the scenarios of `world`, `block-turn-left`, `block-move-forward` and `block-use-item` on levels 1 to 5; done when each scenario is observed or the spec is corrected to what the game does
- [ ] 2.2 Walk through the scenarios of `block-repeat-times`, `block-if`, `block-repeat-while`, `block-not`, `sensor-can-go-forward` and `conditions`, both with Run and with Step; done when each scenario is observed or the spec is corrected
- [ ] 2.3 Walk through the scenarios of `program-execution` and `custom-blocks`; done when each scenario is observed or the spec is corrected
- [ ] 2.4 Walk through the scenarios of `program-editor` with a mouse and on a touch device; done when each scenario is observed or the spec is corrected
- [ ] 2.5 Walk through the scenarios of `levels`, `language-support` and `app-shell`, including a page reload and the console functions; done when each scenario is observed or the spec is corrected
- [ ] 2.6 Record every behaviour found that no spec covers in the "Known gaps" table of `proposal.md`; done when the table lists them or the walk-through found none

## Workflow follow-up

- Archive the change so the capabilities appear under `openspec/specs/`.
- Start the first follow-up change with the decisions recorded in `proposal.md` under "Known gaps".
