// Short builders for program blocks, on top of createNode and the real definitions.
// Each returns the node, so a test can keep it and read its id.
import { createNode } from '../../src/logic/program.ts';
import { defs } from '../../src/blocks/index.ts';
import type { ProgramNode } from '../../src/logic/types.ts';

export const move = (): ProgramNode => createNode(defs.move);
export const turn = (): ProgramNode => createNode(defs.rot);
export const use = (n = 1): ProgramNode => ({ ...createNode(defs.use), n });

export const canGo = (): ProgramNode => createNode(defs.canfwd);
export const not = (cond: ProgramNode | null = null): ProgramNode => ({ ...createNode(defs.not), cond });

export const repeat = (n: number, ...children: ProgramNode[]): ProgramNode => ({ ...createNode(defs.for), n, children });
export const when = (cond: ProgramNode | null, ...children: ProgramNode[]): ProgramNode => ({ ...createNode(defs.if), cond, children });
export const loopWhile = (cond: ProgramNode | null, ...children: ProgramNode[]): ProgramNode => ({ ...createNode(defs.while), cond, children });

/** A use of the custom block with this id. */
export const call = (ref: string): ProgramNode => createNode(defs.call, ref);
