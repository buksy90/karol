import { canMoveForward } from '../logic/world.js';

// Can go forward: true exactly when Move forward would succeed right now.
export default {
  type: 'canfwd',
  kind: 'condition',
  classes: 'sensor canfwd',
  icon: '👀 ',
  labelKey: 's.canfwd',
  evaluate: ({ world }) => canMoveForward(world),
};
