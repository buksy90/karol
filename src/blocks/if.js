// If: check the condition once and run the body only when it is true. No else branch.
export default {
  type: 'if',
  kind: 'container',
  classes: 'if for',
  icon: '❓ ',
  labelKey: 'b.if',
  hasCond: true,
  hasBody: true,
  *run({ node, target, runBody }) {
    if (yield { t: 'cond', id: target, cond: node.cond }) yield* runBody();
  },
};
