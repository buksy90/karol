// The interpreter: a generator that walks a program and yields one step at a time,
// so conditions always see the world as it is when they are checked.
// The steps it yields are described by `Step` in types.ts.
import type { BlockDefs, CallDef, ContainerDef, CustomBlocks, Env, ProgramNode, StepGenerator } from './types.ts';

/** A run ends as "too long" after this many steps. */
export const STEP_LIMIT = 5000;
/** Loops may start this many rounds in total before the run ends as "too long". */
export const LOOP_LIMIT = 200000;
/** Custom blocks run nested this deep; a call that would go deeper ends the run. */
export const MAX_DEPTH = 20;

/**
 * Walk a list of blocks.
 * @param hl null while executing blocks the player can see, else the id of the call block.
 */
export function* runList(list: ProgramNode[], env: Env, hl: string | null = null, depth = 0): StepGenerator {
  for (const node of list) {
    const def = env.defs[node.type];
    const own = hl === null;
    const target = own ? node.id : hl;
    if (def.kind === 'action') yield { t: 'action', id: target, node, def };
    else yield* (def as ContainerDef | CallDef).run({
      node, own, target, depth, env,
      runBody: () => runList(node.children!, env, hl, depth),
      runList: (l, h, d) => runList(l, env, h, d),
    });
  }
}

export function createEnv(defs: BlockDefs, customs: CustomBlocks): Env {
  return { defs, customs, counters: { ops: 0, actions: 0 } };
}

/** Loops count their rounds against a shared limit. */
export function countRound(env: Env): void {
  if (++env.counters.ops > LOOP_LIMIT) throw Error('long');
}
