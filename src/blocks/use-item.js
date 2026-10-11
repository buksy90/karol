import { useItem } from '../logic/world.js';

// Use item N: apply inventory slot N to the cell ahead. A key opens a locked door.
// An empty slot or nothing to use it on is an error the program survives.
export default {
  type: 'use',
  kind: 'action',
  classes: 'use',
  icon: '🔑 ',
  labelKey: 'b.use',
  number: { default: 1, min: 1, max: 8 },
  execute({ world, slots, node, say }) {
    const n = +node.n;
    const result = useItem(world, slots, n);
    if (result === 'opened') { say('ms.open'); return { ok: true }; }
    say(result === 'empty' ? 'ms.slot' : 'ms.nothing', n);
    return { ok: true, bad: true };
  },
};
