// The interpreter: a generator that walks a program and yields one step at a time,
// so conditions always see the world as it is when they are checked.
//
// Steps:  {t:'action', id, node, def}   a robot action to execute
//         {t:'cond', id, cond}          a condition check; send the result back in
//         {t:'loop', id, cnt}           a Repeat round starting (cnt rounds left; 0 = ended)
//         {t:'stuck', id}               a Repeat while round that did nothing
// `id` is the block to mark in the program. Inside a custom block it is the call block.

export const STEP_LIMIT = 5000;
export const LOOP_LIMIT = 200000;
export const MAX_DEPTH = 20;

// env: {defs, customs, counters: {ops, actions}}
// hl: null while executing blocks the player can see, else the id of the call block.
export function* runList(list, env, hl = null, depth = 0) {
  for (const node of list) {
    const def = env.defs[node.type];
    const own = hl === null;
    const target = own ? node.id : hl;
    if (def.kind === 'action') yield { t: 'action', id: target, node, def };
    else yield* def.run({
      node, own, target, depth, env,
      runBody: () => runList(node.children, env, hl, depth),
      runList: (l, h, d) => runList(l, env, h, d),
    });
  }
}

export function createEnv(defs, customs) {
  return { defs, customs, counters: { ops: 0, actions: 0 } };
}

// Loops count their rounds against a shared limit.
export function countRound(env) {
  if (++env.counters.ops > LOOP_LIMIT) throw Error('long');
}
