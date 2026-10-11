// The tile world: map parsing and the rules for what the robot can do.
// Functions take a world state object ({grid, boxes, robot, angle, ...}) and mutate it.
import type { MoveResult, Probe, Robot, Slots, UseResult, World } from './types.ts';

/** Step per direction: 0 north, 1 east, 2 south, 3 west. */
export const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
export const SLOT_COUNT = 8;
export const KEY = '🔑';

const SEPARATORS = 'WDLO'; // walls and doors split the floor into rooms

/** Build the world a level starts in: the grid, the crates, the robot and the rooms. */
export function parseMap(map: string[]): World {
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
  return { rows, cols, grid, boxes, robot, roomMap, angle: robot.d * 90 };
}

/** What is in front of the robot and whether it can go there. Anything off the map is a wall. */
export function probeForward(w: World): Probe {
  const { x, y, d } = w.robot;
  const nx = x + DX[d], ny = y + DY[d], cell = (w.grid[ny] || [])[nx] || 'W';
  if (cell === 'W') return { nx, ny, cell, blocked: 'wall', push: null };
  if (cell === 'L') return { nx, ny, cell, blocked: 'locked', push: null };
  const from = nx + ',' + ny;
  if (w.boxes.has(from)) {
    const bx = nx + DX[d], by = ny + DY[d], t = (w.grid[by] || [])[bx], to = bx + ',' + by;
    if (!(t === ' ' || t === 'D' || t === 'O') || w.boxes.has(to)) return { nx, ny, cell, blocked: 'stuck', push: null };
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

/**
 * Move one cell ahead, pushing a crate and picking up a key if they are there.
 * @returns `key` is the 1-based slot filled, 'full', or null.
 */
export function moveForward(w: World, slots: Slots): MoveResult {
  const p = probeForward(w);
  if (p.blocked) return { moved: false, blocked: p.blocked, key: null, won: false };
  if (p.push) { w.boxes.delete(p.push.from); w.boxes.add(p.push.to); }
  w.robot.x = p.nx; w.robot.y = p.ny;
  let key: number | 'full' | null = null;
  if (p.cell === 'k') {
    const i = slots.indexOf(null);
    if (i < 0) key = 'full';
    else { w.grid[p.ny][p.nx] = ' '; slots[i] = KEY; key = i + 1; }
  }
  return { moved: true, blocked: null, key, won: p.cell === 'e' };
}

/** Use the item in slot `n` (1-based) on the cell ahead. */
export function useItem(w: World, slots: Slots, n: number): UseResult {
  const item = slots[(n | 0) - 1];
  if (!item) return 'empty';
  const p = probeForward(w);
  if (item === KEY && p.cell === 'L') {
    w.grid[p.ny][p.nx] = 'O';
    slots[n - 1] = null;
    return 'opened';
  }
  return 'nothing';
}
