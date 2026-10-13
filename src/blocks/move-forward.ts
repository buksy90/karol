import { moveForward } from '../logic/world.ts';
import type { ActionDef, Blocked, MessageKey } from '../logic/types.ts';

const BLOCKED_MESSAGE: Record<Blocked, MessageKey> = { wall: 'ms.wall', locked: 'ms.locked', flagdoor: 'ms.flagdoor', stuck: 'ms.stuck' };

/**
 * Move forward: one cell ahead, pushing a crate if there is one and picking up a key or
 * a spray. Fails on a wall, a locked door or a crate that cannot move, and that failure
 * stops the program.
 */
export default {
  type: 'move',
  kind: 'action',
  classes: 'move',
  labelKey: 'b.move',
  execute({ world, slots, say }) {
    const r = moveForward(world, slots);
    if (!r.moved) { say(BLOCKED_MESSAGE[r.blocked]); return { ok: false, bad: true }; }
    if (r.picked === 'full') say('ms.invfull');
    else if (r.picked && r.picked.item.type === 'spray') say('ms.spray', r.picked.item.uses, r.picked.slot);
    else if (r.picked) say('ms.key', r.picked.slot);
    if (r.won) { say('ms.win'); return { ok: false, won: true }; }
    return { ok: true };
  },
} satisfies ActionDef;
