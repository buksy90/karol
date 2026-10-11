import { countRound } from '../logic/interpreter.ts';
import type { ContainerDef } from '../logic/types.ts';

/**
 * Repeat N times. Each round start is a step of its own when the player can see the
 * block, with one more step after the last round; inside a custom block it runs silently.
 */
export default {
  type: 'for',
  kind: 'container',
  classes: 'for',
  icon: '🔁 ',
  labelKey: 'b.rep1',
  suffixKey: 'b.rep2',
  number: { default: 2, min: 1, max: 99 },
  hasBody: true,
  hasCounter: true,
  *run({ node, own, env, runBody }) {
    const n = Math.max(1, Math.min(99, (+node.n!) || 1));
    for (let i = 0; i < n; i++) {
      countRound(env);
      if (own) yield { t: 'loop', id: node.id, cnt: n - i };
      yield* runBody();
    }
    if (own) yield { t: 'loop', id: node.id, cnt: 0 };
  },
} satisfies ContainerDef;
