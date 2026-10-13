// The shapes shared by logic, stores and components. Types only, no run-time code.
import type en from '../../locales/en.json';

/** A translation key. The English dictionary defines which keys exist. */
export type MessageKey = keyof typeof en;

/** `t('key', ...args)`: the text for a key in the current language. */
export type Translate = (key: MessageKey, ...args: (string | number)[]) => string;

/**
 * One block of a program. Which optional fields a block has depends on its definition:
 * `n` for blocks with a number, `cond` for blocks with a condition slot (a sensor, or a
 * Not holding its own `cond`), `children` for containers, `ref` for a use of a custom block.
 */
export interface ProgramNode {
  id: string;
  type: string;
  /** Always a whole number in the range of the block's definition. */
  n?: number;
  cond?: ProgramNode | null;
  children?: ProgramNode[];
  ref?: string;
}

/** A custom block: a named list of blocks. */
export interface CustomBlock {
  name: string;
  body: ProgramNode[];
}
export type CustomBlocks = Record<string, CustomBlock>;

/** Where a block sits: in a list, or in the condition slot of another block. */
export interface ListLocation {
  kind: 'list';
  /** Key of the list: the root key, or the id of the container block. */
  owner: string;
  list: ProgramNode[];
  index: number;
  node: ProgramNode;
}
export interface CondLocation {
  kind: 'cond';
  owner: ProgramNode;
  node: ProgramNode;
}
export type Located = ListLocation | CondLocation;

// ---- the world ----

export interface Robot {
  x: number;
  y: number;
  /** 0 north, 1 east, 2 south, 3 west */
  d: number;
}

export interface World {
  rows: number;
  cols: number;
  /** grid[y][x]: 'W' wall, ' ' floor, 'k' key, 'D' door, 'L' locked, 'O' unlocked, 'e' exit; anything else is floor */
  grid: string[][];
  /** crates as "x,y" */
  boxes: Set<string>;
  robot: Robot;
  /** room number per cell, -1 for walls and doors */
  roomMap: number[][];
  /** cumulative heading in degrees, for smooth turning */
  angle: number;
}

/** The inventory: each slot is empty (null) or holds an item. */
export type Slots = (string | null)[];

/** Why the robot cannot move forward. */
export type Blocked = 'wall' | 'locked' | 'stuck';

export interface Probe {
  nx: number;
  ny: number;
  cell: string;
  blocked: Blocked | null;
  /** The crate that a move would push, as "x,y" keys. */
  push: { from: string; to: string } | null;
}

export type MoveResult =
  | { moved: false; blocked: Blocked; key: null; won: false }
  /** `key` is the 1-based slot filled, 'full', or null when no key was there. */
  | { moved: true; blocked: null; key: number | 'full' | null; won: boolean };

export type UseResult = 'empty' | 'opened' | 'nothing';

export interface Level {
  id: string;
  name: string;
  map: string[];
}

// ---- block and sensor definitions ----

interface DefBase {
  type: string;
  /** CSS classes of the block */
  classes: string;
  icon?: string;
  labelKey?: MessageKey;
  /** Text after the number field */
  suffixKey?: MessageKey;
  number?: { default: number; min: number; max: number };
  hasCond?: boolean;
  hasBody?: boolean;
  /** Shows a rounds-left badge */
  hasCounter?: boolean;
}

export interface ActionContext {
  world: World;
  slots: Slots;
  node: ProgramNode;
  say: (key: MessageKey, ...args: (string | number)[]) => void;
}

/** `ok: false` ends the run; `bad` marks the block as failed; `won` means the exit was reached. */
export interface ActionResult {
  ok: boolean;
  bad?: boolean;
  won?: boolean;
}

export interface ActionDef extends DefBase {
  kind: 'action';
  labelKey: MessageKey;
  execute(ctx: ActionContext): ActionResult;
}

export interface ContainerDef extends DefBase {
  kind: 'container';
  labelKey: MessageKey;
  hasBody: true;
  run(ctx: RunContext): StepGenerator;
}

export interface CallDef extends DefBase {
  kind: 'call';
  run(ctx: RunContext): StepGenerator;
}

export interface SensorContext {
  world: World;
}

export interface SensorDef extends DefBase {
  kind: 'condition';
  labelKey: MessageKey;
  operator?: false;
  evaluate(ctx: SensorContext): boolean;
}

export interface OperatorDef extends DefBase {
  kind: 'condition';
  labelKey: MessageKey;
  operator: true;
  hasCond: true;
  apply(value: boolean): boolean;
}

export type ConditionDef = SensorDef | OperatorDef;
export type BlockDef = ActionDef | ContainerDef | CallDef | ConditionDef;
export type BlockDefs = Record<string, BlockDef>;

// ---- the interpreter ----

/** One step of a run. `id` is the block to mark in the program; inside a custom block it is the call block. */
export type Step =
  /** a robot action to execute */
  | { t: 'action'; id: string; node: ProgramNode; def: ActionDef }
  /** a condition check; the result is sent back into the generator */
  | { t: 'cond'; id: string; cond: ProgramNode | null | undefined }
  /** a Repeat round starting (cnt rounds left; 0 = ended) */
  | { t: 'loop'; id: string; cnt: number }
  /** a Repeat while round that did nothing */
  | { t: 'stuck'; id: string }
  /** a custom block call nested too deep */
  | { t: 'deep'; id: string };

export type StepGenerator = Generator<Step, void, boolean | undefined>;

export interface Env {
  defs: BlockDefs;
  customs: CustomBlocks;
  counters: { ops: number; actions: number };
}

/** What a container or call definition gets to run itself. */
export interface RunContext {
  node: ProgramNode;
  /** true while executing blocks the player can see */
  own: boolean;
  /** id of the block to mark */
  target: string;
  depth: number;
  env: Env;
  runBody: () => StepGenerator;
  runList: (list: ProgramNode[], hl: string | null, depth: number) => StepGenerator;
}
