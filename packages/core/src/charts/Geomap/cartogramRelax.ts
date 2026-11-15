/**
    Places Dorling and Demers cartogram shapes: each set at its region's
    home and nudged apart until none overlap, with a pull back toward home.
    The layout is deterministic: the same homes and sizes always land in
    the same spots.

    @module
*/

import type {
  CartogramNode,
  CartogramPlacement,
  RelaxOptions,
} from "./cartogram.js";

/** The golden angle, which spreads coincident shapes evenly around their home. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** The overlap, in pixels, left between two shapes once they count as apart. */
const TOLERANCE = 0.05;

/** How much each shape shrinks when a fitted cartogram is too crowded to part. */
const SHRINK = 0.95;

/** The passes that pull shapes home, by default. */
const DEFAULT_ITERATIONS = 120;

/** The shapes of one size level, binned by the grid cell their center falls in. */
interface Level {
  /** The largest radius at this level. */
  max: number;
  /** The shapes at this level. */
  shapes: Int32Array;
  size: number;
  nx: number;
  ny: number;
  /** Each cell's first index into `items`; `start[c + 1]` ends it. */
  start: Int32Array;
  /** The level's shapes, cell by cell. */
  items: Int32Array;
}

/**
    Shapes sorted into size levels, each level's radii at most double the
    level below's, and binned by center into a grid whose cells are as wide
    as the level's largest shape: a shape's overlaps at a level all sit in
    the cells within its reach, so the search stays near-linear however
    much the sizes differ.
*/
class LevelGrid {
  levels: Level[] = [];
  /** Each shape's level. */
  levelOf: Int32Array;
  x0 = 0;
  y0 = 0;

  constructor(rs: Float64Array) {
    const n = rs.length;
    this.levelOf = new Int32Array(n);
    const sorted = Array.from(rs).sort((a, b) => a - b);
    const base = Math.max(sorted[n >> 1] ?? 0, 1e-3);
    let top = 0;
    for (let i = 0; i < n; i++) {
      const level =
        rs[i] > base ? Math.ceil(Math.log2(rs[i] / base) - 1e-9) : 0;
      this.levelOf[i] = level;
      top = Math.max(top, level);
    }
    const counts = new Array<number>(top + 1).fill(0);
    for (let i = 0; i < n; i++) counts[this.levelOf[i]]++;
    const filled = counts.map(() => 0);
    const members = counts.map(c => new Int32Array(c));
    for (let i = 0; i < n; i++) {
      const level = this.levelOf[i];
      members[level][filled[level]++] = i;
    }
    this.levels = members.map((shapes, level) => ({
      max: base * 2 ** level,
      shapes,
      size: 1,
      nx: 1,
      ny: 1,
      start: new Int32Array(2),
      items: new Int32Array(shapes.length),
    }));
  }

  /** Bins every level's shapes by the current centers. */
  fill(xs: Float64Array, ys: Float64Array, padding: number) {
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (let i = 0; i < xs.length; i++) {
      if (xs[i] < x0) x0 = xs[i];
      if (xs[i] > x1) x1 = xs[i];
      if (ys[i] < y0) y0 = ys[i];
      if (ys[i] > y1) y1 = ys[i];
    }
    this.x0 = x0;
    this.y0 = y0;
    for (const level of this.levels) {
      const m = level.shapes.length;
      let size = 2 * level.max + padding;
      // A few cells per shape at most.
      while (((x1 - x0) / size + 1) * ((y1 - y0) / size + 1) > 4 * m + 16)
        size *= 2;
      level.size = size;
      level.nx = Math.floor((x1 - x0) / size) + 1;
      level.ny = Math.floor((y1 - y0) / size) + 1;
      const cells = level.nx * level.ny;
      if (level.start.length !== cells + 1)
        level.start = new Int32Array(cells + 1);
      else level.start.fill(0);
      const cellOf = new Int32Array(m);
      for (let k = 0; k < m; k++) {
        const i = level.shapes[k];
        const c =
          Math.floor((xs[i] - x0) / size) * level.ny +
          Math.floor((ys[i] - y0) / size);
        cellOf[k] = c;
        level.start[c + 1]++;
      }
      for (let c = 0; c < cells; c++) level.start[c + 1] += level.start[c];
      const next = level.start.slice(0, cells);
      for (let k = 0; k < m; k++)
        level.items[next[cellOf[k]]++] = level.shapes[k];
    }
  }
}

/**
    Pushes shapes `i` and `j` apart along the line between their centers
    when they overlap, the smaller one moving more; returns the overlap.
    Circles part until their centers are as far apart as their radii (plus
    `padding`); squares until the larger of the two offsets is as long as
    their half sides, which spreads a crowd of squares out in every
    direction rather than only along the axes.
*/
function resolve(
  i: number,
  j: number,
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
  square: boolean,
  padding: number,
): number {
  const reach = rs[i] + rs[j] + padding;
  const ox = xs[j] - xs[i],
    oy = ys[j] - ys[i];
  const ax = Math.abs(ox),
    ay = Math.abs(oy);
  if (ax >= reach || ay >= reach) return 0;
  const dist = Math.hypot(ox, oy);
  if (!square && dist >= reach) return 0;
  let ux: number, uy: number;
  if (dist) {
    ux = ox / dist;
    uy = oy / dist;
  } else {
    // Shapes sharing a home part along an angle set by their indices.
    const angle = (i + j) * GOLDEN;
    ux = Math.cos(angle);
    uy = Math.sin(angle);
  }
  const overlap = square ? reach - Math.max(ax, ay) : reach - dist;
  const move = square
    ? overlap / Math.max(Math.abs(ux), Math.abs(uy))
    : overlap;
  const wi = rs[i] + rs[j] ? rs[j] / (rs[i] + rs[j]) : 0.5,
    wj = 1 - wi;
  xs[i] -= ux * move * wi;
  ys[i] -= uy * move * wi;
  xs[j] += ux * move * wj;
  ys[j] += uy * move * wj;
  return overlap;
}

/**
    One pass pushing every overlapping pair apart, each pair met once: from
    the shape at the higher level, or from the lower index at the same
    level. Returns the largest overlap the pass found.
*/
function separate(
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
  grid: LevelGrid,
  square: boolean,
  padding: number,
): number {
  grid.fill(xs, ys, padding);
  const {levels, x0, y0} = grid;
  let worst = 0;
  for (let li = 0; li < levels.length; li++) {
    const shapes = levels[li].shapes;
    for (let k = 0; k < shapes.length; k++) {
      const i = shapes[k];
      for (let lj = 0; lj <= li; lj++) {
        const {max, size, nx, ny, start, items} = levels[lj];
        const reach = rs[i] + max + padding;
        const gx0 = Math.max(0, Math.floor((xs[i] - reach - x0) / size)),
          gx1 = Math.min(nx - 1, Math.floor((xs[i] + reach - x0) / size)),
          gy0 = Math.max(0, Math.floor((ys[i] - reach - y0) / size)),
          gy1 = Math.min(ny - 1, Math.floor((ys[i] + reach - y0) / size));
        for (let gx = gx0; gx <= gx1; gx++)
          for (let gy = gy0; gy <= gy1; gy++) {
            const cell = gx * ny + gy;
            for (let m = start[cell]; m < start[cell + 1]; m++) {
              const j = items[m];
              if (lj === li && j <= i) continue;
              const r = rs[i] + rs[j] + padding;
              if (Math.abs(xs[j] - xs[i]) >= r || Math.abs(ys[j] - ys[i]) >= r)
                continue;
              const overlap = resolve(i, j, xs, ys, rs, square, padding);
              if (overlap > worst) worst = overlap;
            }
          }
      }
    }
  }
  return worst;
}

/** Moves every shape inside `bounds`, centering one too large to fit. */
function contain(
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
  bounds: [number, number, number, number],
): void {
  const [x0, y0, x1, y1] = bounds;
  for (let i = 0; i < xs.length; i++) {
    const r = rs[i];
    xs[i] =
      x1 - x0 < 2 * r
        ? (x0 + x1) / 2
        : Math.min(x1 - r, Math.max(x0 + r, xs[i]));
    ys[i] =
      y1 - y0 < 2 * r
        ? (y0 + y1) / 2
        : Math.min(y1 - r, Math.max(y0 + r, ys[i]));
  }
}

/**
    Runs the passes of `relaxCartogram` over shapes already at `xs`/`ys`:
    `iterations` passes pulling every shape toward home, with a pull that
    fades, while overlapping pairs are pushed apart (and, given `bounds`,
    kept inside them); then up to half as many pushing alone, until no two
    overlap. Returns the largest overlap the last pass found.
*/
function relaxFrom(
  nodes: CartogramNode[],
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
  options: Required<RelaxOptions>,
  bounds?: [number, number, number, number],
): number {
  const {square, padding, iterations} = options;
  const n = nodes.length;
  const grid = new LevelGrid(rs);
  for (let k = 0; k < iterations; k++) {
    const pull = 0.1 * (1 - k / iterations);
    for (let i = 0; i < n; i++) {
      xs[i] += (nodes[i].x - xs[i]) * pull;
      ys[i] += (nodes[i].y - ys[i]) * pull;
    }
    separate(xs, ys, rs, grid, square, padding);
    if (bounds) contain(xs, ys, rs, bounds);
  }
  // Shapes closer than `padding` by less than half of it still don't touch.
  const done = TOLERANCE + padding / 2;
  let worst = 0;
  for (let k = 0; k < Math.ceil(iterations / 2); k++) {
    worst = separate(xs, ys, rs, grid, square, padding);
    if (bounds) contain(xs, ys, rs, bounds);
    if (worst <= done) break;
  }
  return worst;
}

/** The arrays `relaxFrom` works on, from each node's home and size. */
function nodeArrays(nodes: CartogramNode[]) {
  const n = nodes.length;
  const xs = new Float64Array(n),
    ys = new Float64Array(n),
    rs = new Float64Array(n);
  nodes.forEach((d, i) => {
    xs[i] = d.x;
    ys[i] = d.y;
    rs[i] = Math.max(0, d.r);
  });
  return {xs, ys, rs};
}

/** Each shape's placement, from the arrays `relaxFrom` worked on. */
function placements(
  xs: Float64Array,
  ys: Float64Array,
  rs: Float64Array,
): CartogramPlacement[] {
  return Array.from(xs, (x, i) => ({x, y: ys[i], r: rs[i]}));
}

/**
    Places each shape as near its home as it can without overlapping
    another: passes pull every shape toward home, with a pull that fades,
    while overlapping pairs are pushed apart; then pushing alone runs until
    no two overlap (or a pass limit is reached). The same nodes always land
    in the same places.
    @param nodes Each shape's home and size.
    @param options Circles or squares, the gap between them, and the passes.
*/
export function relaxCartogram(
  nodes: CartogramNode[],
  options: RelaxOptions = {},
): CartogramPlacement[] {
  const {xs, ys, rs} = nodeArrays(nodes);
  relaxFrom(nodes, xs, ys, rs, relaxOptions(options));
  return placements(xs, ys, rs);
}

/** `options` with their defaults. */
function relaxOptions(options: RelaxOptions): Required<RelaxOptions> {
  return {
    square: options.square ?? false,
    padding: options.padding ?? 0,
    iterations: options.iterations ?? DEFAULT_ITERATIONS,
  };
}

/**
    `relaxCartogram` inside `bounds`: shapes pushed against an edge stay
    inside it. While they still overlap (a crowd too large for the space
    around it), every shape shrinks a little and they relax again from
    where they stand, three times at most.
    @param nodes Each shape's home and size.
    @param bounds The box the shapes must fit, `[x0, y0, x1, y1]`.
    @param options As for `relaxCartogram`.
*/
export function fitCartogram(
  nodes: CartogramNode[],
  bounds: [number, number, number, number],
  options: RelaxOptions = {},
): CartogramPlacement[] {
  const settings = relaxOptions(options);
  const {xs, ys, rs} = nodeArrays(nodes);
  contain(xs, ys, rs, bounds);
  let worst = relaxFrom(nodes, xs, ys, rs, settings, bounds);
  const again = {...settings, iterations: Math.ceil(settings.iterations / 3)};
  for (let round = 0; round < 3 && worst > settings.padding; round++) {
    for (let i = 0; i < rs.length; i++) rs[i] *= SHRINK;
    worst = relaxFrom(nodes, xs, ys, rs, again, bounds);
  }
  return placements(xs, ys, rs);
}
