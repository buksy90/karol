import { turnLeft } from '../logic/world.ts';
import type { ActionDef } from '../logic/types.ts';

/**
 * Turn left: rotate 90 degrees counter-clockwise on the spot. Always succeeds.
 */
export default {
  type: 'rot',
  kind: 'action',
  classes: 'rot',
  labelKey: 'b.rot',
  execute({ world }) {
    turnLeft(world);
    return { ok: true };
  },
} satisfies ActionDef;
