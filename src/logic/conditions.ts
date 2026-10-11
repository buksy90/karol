// Conditions: a sensor, or an operator (Not) wrapping another condition.
import type { BlockDefs, ConditionDef, ProgramNode, SensorContext, Translate } from './types.ts';

/** true/false, or null when the condition (or an operator's inner slot) is empty. */
export function evaluate(cond: ProgramNode | null | undefined, defs: BlockDefs, ctx: SensorContext): boolean | null {
  if (!cond) return null;
  const def = defs[cond.type] as ConditionDef;
  if (!def) return null;
  if (def.operator) {
    const v = evaluate(cond.cond, defs, ctx);
    return v === null ? null : def.apply(v);
  }
  return def.evaluate ? def.evaluate(ctx) : null;
}

/** Status-line text, e.g. "Not(Can go forward)". */
export function conditionText(cond: ProgramNode, defs: BlockDefs, t: Translate): string {
  const def = defs[cond.type] as ConditionDef;
  if (def.operator) return t(def.labelKey) + '(' + (cond.cond ? conditionText(cond.cond, defs, t) : '?') + ')';
  return t(def.labelKey);
}

/** The sensor at the bottom of a chain of operators; the sonar shows what it sees. */
export function innermostSensor(cond: ProgramNode | null | undefined, defs: BlockDefs): ProgramNode | null {
  let c = cond;
  while (c && defs[c.type] && (defs[c.type] as ConditionDef).operator) c = c.cond;
  return c || null;
}
