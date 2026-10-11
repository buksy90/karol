import type { OperatorDef } from '../logic/types.ts';

/**
 * Not: an operator that fits a condition slot and inverts the condition in its own slot.
 */
export default {
  type: 'not',
  kind: 'condition',
  classes: 'sensor not',
  icon: '🚫 ',
  labelKey: 'b.not',
  hasCond: true,
  operator: true,
  apply: value => !value,
} satisfies OperatorDef;
