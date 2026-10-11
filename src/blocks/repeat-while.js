import { countRound } from '../logic/interpreter.js';

// Repeat while: check the condition before every round. A round in which no action
// block executed would repeat forever, so it ends the run as "stuck".
export default {
  type: 'while',
  kind: 'container',
  classes: 'while for',
  icon: '🔄 ',
  labelKey: 'b.while',
  hasCond: true,
  hasBody: true,
  *run({ node, target, env, runBody }) {
    while (true) {
      countRound(env);
      if (!(yield { t: 'cond', id: target, cond: node.cond })) break;
      const before = env.counters.actions;
      yield* runBody();
      if (env.counters.actions === before) { yield { t: 'stuck', id: target }; return; }
    }
  },
};
