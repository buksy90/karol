// The tile world: map parsing and the rules for what the robot can do.
// Functions take a world state object ({grid, boxes, robot, angle, ...}) and mutate it.
import { toHex } from './colors.ts';
import type { Flag, Item, MoveResult, Picked, Position, Probe, Robot, Slots, Spray, SprayItem, UseResult, World, WorldFlag } from './types.ts';

/** Step per direction: 0 north, 1 east, 2 south, 3 west. */
export const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
export const SLOT_COUNT = 8;

const SEPARATORS = 'WDLO'; // walls and doors split the floor into rooms

const at = ([x, y]: Position): string => x + ',' + y;

/**
 * Build the world a level starts in: the grid, the crates, the robot, the rooms, and the
 * level's sprays and flags. Sprays and flags are copied, with their colours as #rrggbb,
 * so that what happens to them in the world leaves the level as it was.
 */
export function parseMap(map: string[], items: SprayItem[] = [], flags: Flag[] = []): World {
  const rows = map.length, cols = Math.max(...map.map(r => r.length));
  const grid = map.map(r => r.padEnd(cols).split('').map(c => c === 'w' ? 'W' : c === 'd' ? 'D' : c));
  const boxes = new Set<string>();
  let robot: Robot = { x: 1, y: 1, d: 1 };
  grid.forEach((r, y) => r.forEach((c, x) => {
    if (c === 'b') { boxes.add(x + ',' + y); r[x] = ' '; }
    if (c === 'K') { robot = { x, y, d: 1 }; r[x] = ' '; }
  }));
  const roomMap = grid.map(r => r.map(() => -1));
  let n = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (roomMap[y][x] >= 0 || SEPARATORS.includes(grid[y][x])) continue;
    const q = [[x, y]]; roomMap[y][x] = n;
    while (q.length) {
      const [cx, cy] = q.pop()!;
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || roomMap[ny][nx] >= 0 || SEPARATORS.includes(grid[ny][nx])) continue;
        roomMap[ny][nx] = n; q.push([nx, ny]);
      }
    }
    n++;
  }
  const hex = (color: string): string => toHex(color) ?? color;
  const sprays = new Map<string, Spray>(items.map(i => [at(i.position), { color: hex(i.color), uses: i.uses }]));
  const worldFlags: WorldFlag[] = flags.map(f => ({
    position: [...f.position],
    colors: f.colors.map(row => row.map(hex)),
    onDrawn: { unlockDoor: [...f.onDrawn.unlockDoor] },
    done: false,
  }));
  const flagDoors = new Set(worldFlags.map(f => at(f.onDrawn.unlockDoor)));
  return { rows, cols, grid, boxes, robot, roomMap, angle: robot.d * 90, sprays, paint: new Map(), flags: worldFlags, flagDoors };
}

/** What is in front of the robot and whether it can go there. Anything off the map is a wall. */
export function probeForward(w: World): Probe {
  const { x, y, d } = w.robot;
  const nx = x + DX[d], ny = y + DY[d], cell = (w.grid[ny] || [])[nx] || 'W';
  if (cell === 'W') return { nx, ny, cell, blocked: 'wall', push: null };
  const from = nx + ',' + ny;
  if (cell === 'L') return { nx, ny, cell, blocked: w.flagDoors.has(from) ? 'flagdoor' : 'locked', push: null };
  if (w.boxes.has(from)) {
    const bx = nx + DX[d], by = ny + DY[d], t = (w.grid[by] || [])[bx], to = bx + ',' + by;
    if (!(t === ' ' || t === 'D' || t === 'O') || w.boxes.has(to) || w.sprays.has(to)) return { nx, ny, cell, blocked: 'stuck', push: null };
    return { nx, ny, cell, blocked: null, push: { from, to } };
  }
  return { nx, ny, cell, blocked: null, push: null };
}

export function canMoveForward(w: World): boolean {
  return !probeForward(w).blocked;
}

export function turnLeft(w: World): void {
  w.robot.d = (w.robot.d + 3) % 4;
  w.angle -= 90;
}

/** Move one cell ahead, pushing a crate and picking up a key or a spray if they are there. */
export function moveForward(w: World, slots: Slots): MoveResult {
  const p = probeForward(w);
  if (p.blocked) return { moved: false, blocked: p.blocked, picked: null, won: false };
  if (p.push) { w.boxes.delete(p.push.from); w.boxes.add(p.push.to); }
  w.robot.x = p.nx; w.robot.y = p.ny;
  let picked: Picked = null;
  const here = p.nx + ',' + p.ny, spray = w.sprays.get(here);
  if (p.cell === 'k' || spray) {
    const i = slots.indexOf(null);
    if (i < 0) picked = 'full';
    else {
      const item: Item = spray ? { type: 'spray', color: spray.color, uses: spray.uses } : { type: 'key' };
      if (spray) w.sprays.delete(here); else w.grid[p.ny][p.nx] = ' ';
      slots[i] = item;
      picked = { slot: i + 1, item };
    }
  }
  return { moved: true, blocked: null, picked, won: p.cell === 'e' };
}

/**
 * Use the item in slot `n` (1-based). Only a whole number names a slot.
 * A key works on the cell ahead; a spray paints the cell the robot stands on.
 */
export function useItem(w: World, slots: Slots, n: number): UseResult {
  const item = Number.isInteger(n) ? slots[n - 1] : null;
  if (!item) return { result: 'empty' };
  if (item.type === 'key') {
    const p = probeForward(w);
    if (p.cell !== 'L') return { result: 'nothing' };
    w.grid[p.ny][p.nx] = 'O';
    slots[n - 1] = null;
    return { result: 'opened' };
  }
  const { x, y } = w.robot, here = x + ',' + y;
  // only plain floor takes paint: not a doorway, and not a cell with something left lying on it
  if (w.grid[y][x] !== ' ' || w.sprays.has(here)) return { result: 'nothing' };
  w.paint.set(here, item.color);
  item.uses--;
  if (item.uses <= 0) slots[n - 1] = null;
  return { result: 'painted', color: item.color, left: item.uses, flagDone: finishFlags(w, x, y) };
}

/**
 * After the cell x,y was painted: every flag covering it that now has all its colours is
 * done, and its door opens. A flag that is done stays done. True when a flag was finished.
 */
function finishFlags(w: World, x: number, y: number): boolean {
  let finished = false;
  for (const flag of w.flags) {
    const [fx, fy] = flag.position, colors = flag.colors;
    if (flag.done || y < fy || y >= fy + colors.length || x < fx || x >= fx + colors[0].length) continue;
    if (!colors.every((row, j) => row.every((color, i) => w.paint.get((fx + i) + ',' + (fy + j)) === color))) continue;
    flag.done = finished = true;
    const [dx, dy] = flag.onDrawn.unlockDoor;
    if ((w.grid[dy] || [])[dx] === 'L') w.grid[dy][dx] = 'O';
  }
  return finished;
}
