import { moveForward } from '../logic/world.js';

const BLOCKED_MESSAGE = { wall: 'ms.wall', locked: 'ms.locked', stuck: 'ms.stuck' };

// Move forward: one cell ahead, pushing a crate if there is one. Fails on a wall,
// a locked door or a crate that cannot move, and that failure stops the program.
export default {
  type: 'move',
  kind: 'action',
  classes: 'move',
  labelKey: 'b.move',
  execute({ world, slots, say }) {
    const r = moveForward(world, slots);
    if (!r.moved) { say(BLOCKED_MESSAGE[r.blocked]); return { ok: false, bad: true }; }
    if (r.key === 'full') say('ms.invfull');
    else if (r.key) say('ms.key', r.key);
    if (r.won) { say('ms.win'); return { ok: false, won: true }; }
    return { ok: true };
  },
};
