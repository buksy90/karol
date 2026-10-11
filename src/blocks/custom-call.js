import { MAX_DEPTH } from '../logic/interpreter.js';

// A use of a custom block. Its body runs with every step marked on this call block.
// A call nested deeper than MAX_DEPTH, or to a block that no longer exists, is skipped.
export default {
  type: 'call',
  kind: 'call',
  classes: 'call',
  *run({ node, target, depth, env, runList }) {
    const custom = env.customs[node.ref];
    if (depth < MAX_DEPTH && custom) yield* runList(custom.body, target, depth + 1);
  },
};
