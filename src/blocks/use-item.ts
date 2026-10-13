import { useItem } from '../logic/world.ts';
import type { ActionDef } from '../logic/types.ts';

/**
 * Use item N: use what is in inventory slot N. A key opens a locked door ahead; a spray
 * paints the cell the robot stands on. An empty slot or nothing to use it on is an error
 * the program survives.
 */
export default {
  type: 'use',
  kind: 'action',
  classes: 'use',
  icon: '🎒 ',
  labelKey: 'b.use',
  number: { default: 1, min: 1, max: 8 },
  execute({ world, slots, node, say }) {
    const n = +node.n!;
    const r = useItem(world, slots, n);
    if (r.result === 'opened') { say('ms.open'); return { ok: true }; }
    if (r.result === 'painted') {
      if (r.flagDone) say('ms.flag');
      else if (r.left) say('ms.paint', r.left);
      else say('ms.paintlast');
      return { ok: true };
    }
    say(r.result === 'empty' ? 'ms.slot' : 'ms.nothing', n);
    return { ok: true, bad: true };
  },
} satisfies ActionDef;
