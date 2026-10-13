// Colours of sprays and flags: a level writes a name or a hex value, the world holds #rrggbb.
import type { Color } from './types.ts';

/** The colours that have a name, with the hex value each stands for. */
export const COLOR_NAMES: Record<string, string> = {
  red: '#e5484d',
  orange: '#f76b15',
  yellow: '#ffd60a',
  green: '#30a46c',
  blue: '#1d6fe0',
  purple: '#8e4ec6',
  black: '#2b2b33',
  white: '#ffffff',
};

/**
 * A colour name, #rgb or #rrggbb as lower-case #rrggbb, so that two colours are the same
 * colour exactly when their results are equal. Null for anything else.
 */
export function toHex(color: unknown): string | null {
  if (typeof color !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(COLOR_NAMES, color)) return COLOR_NAMES[color as Color];
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!m) return null;
  const digits = m[1].toLowerCase();
  return '#' + (digits.length === 3 ? digits.replace(/./g, c => c + c) : digits);
}
