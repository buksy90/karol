import { MAX_DEPTH } from '../logic/interpreter.ts';
import type { CallDef } from '../logic/types.ts';

/**
 * A use of a custom block. Its body runs with every step marked on this call block.
 * A call to a block that no longer exists is skipped; one nested deeper than MAX_DEPTH is an error step.
 */
export default {
  type: 'call',
  kind: 'call',
  classes: 'call',
  *run({ node, target, depth, env, runList }) {
    const custom = env.customs[node.ref!];
    if (!custom) return;
    if (depth >= MAX_DEPTH) { yield { t: 'deep', id: target }; return; }
    yield* runList(custom.body, target, depth + 1);
  },
} satisfies CallDef;
