/**
    The contiguous cartogram: every region's outline stretched until its
    area stands for its value, while neighbors keep their shared borders,
    by Dougenik, Chrisman and Niemeyer's iterative distortion (1985). Each
    pass pushes every point of the map away from the centers of regions
    that need to grow and toward those that need to shrink; a point is
    moved by where it lies alone, so the points two regions share move
    together and their border stays shared.

    @module
*/

import type {MorphRing} from "@d3plus/render";

/** A region to distort: its projected rings and its value. */
export interface ContiguousRegion {
  rings: MorphRing[];
  /** The value its area stands for; not a positive number keeps the mean density. */
  value: number;
}

/** How `contiguousCartogram` runs. */
export interface ContiguousOptions {
  /** The most distortion passes. */
  iterations?: number;
  /**
      The passes stop early once every region with a value is within this
      share of its target area (its value's share of the map's area).
  */
  tolerance?: number;
  /**
      The most force sums (points times regions) a pass works out one by
      one; past it, the forces are worked out on a grid laid over the map
      and read between its nodes, which keeps a map of thousands of regions
      responsive.
  */
  budget?: number;
}

/** The most distortion passes, by default. */
export const CONTIGUOUS_ITERATIONS = 12;

/** The area error every region must be within to stop early, by default: 1%. */
export const CONTIGUOUS_TOLERANCE = 0.01;

/** The force sums a pass works out exactly before turning to a grid, by default. */
export const CONTIGUOUS_BUDGET = 1e7;

/**
    The most a region's size error (its area against the area it should
    have, the larger over the smaller) counts toward slowing a pass. Every
    pass moves points by less the larger the regions' mean error, so a few
    regions thousands of times off (a city county) would otherwise hold a
    whole map of counties still.
*/
const SIZE_ERROR_CAP = 10;

/**
    The largest area error among the regions with a value: how far each
    one's share of the map's area is from its value's share, as a share of
    the latter.
*/
export function largestError(
  shapes: {area: number}[],
  values: number[],
  valued: boolean[],
  valueTotal: number,
): number {
  const area = shapes.reduce((s, r) => s + r.area, 0);
  let worst = 0;
  shapes.forEach((s, i) => {
    if (!valued[i]) return;
    const target = values[i] / valueTotal;
    worst = Math.max(worst, Math.abs(s.area / area - target) / target);
  });
  return worst;
}

/** A region's area and its center (signed rings: holes take away). */
function regionCentroid(rings: MorphRing[]): {
  area: number;
  x: number;
  y: number;
} {
  let area = 0,
    cx = 0,
    cy = 0;
  for (const ring of rings) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const [x0, y0] = ring[i],
        [x1, y1] = ring[(i + 1) % n];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
  }
  if (!area) {
    const pts = rings.flat();
    const n = pts.length || 1;
    return {
      area: 0,
      x: pts.reduce((s, p) => s + p[0], 0) / n,
      y: pts.reduce((s, p) => s + p[1], 0) / n,
    };
  }
  return {area: Math.abs(area / 2), x: cx / (3 * area), y: cy / (3 * area)};
}

/** What each region pushes with in a pass: its center, radius, and mass. */
interface Forces {
  x: Float64Array;
  y: Float64Array;
  r: Float64Array;
  mass: Float64Array;
}

/** The push the regions give a point at `(px, py)`, scaled by `reduce`. */
function pushAt(
  forces: Forces,
  px: number,
  py: number,
  reduce: number,
): [number, number] {
  const {x, y, r, mass} = forces;
  let dx = 0,
    dy = 0;
  for (let j = 0; j < x.length; j++) {
    const ox = px - x[j],
      oy = py - y[j];
    const d = Math.sqrt(ox * ox + oy * oy);
    const rj = r[j];
    if (!d || !rj) continue;
    const f =
      d > rj
        ? (mass[j] * rj) / d
        : mass[j] * ((d * d) / (rj * rj)) * (4 - (3 * d) / rj);
    dx += (f * ox) / d;
    dy += (f * oy) / d;
  }
  return [dx * reduce, dy * reduce];
}

/**
    The pushes on a grid of about `nodes` points over the box `[x0, y0,
    x1, y1]`, read at any point between its nodes (bilinearly), so a point
    still moves by where it lies alone.
*/
function pushField(
  forces: Forces,
  box: [number, number, number, number],
  nodes: number,
  reduce: number,
): (px: number, py: number) => [number, number] {
  const [x0, y0, x1, y1] = box;
  const w = Math.max(x1 - x0, 1e-9),
    h = Math.max(y1 - y0, 1e-9);
  const step = Math.sqrt((w * h) / Math.max(nodes, 4));
  const nx = Math.max(2, Math.ceil(w / step) + 1),
    ny = Math.max(2, Math.ceil(h / step) + 1);
  const sx = w / (nx - 1),
    sy = h / (ny - 1);
  const gx = new Float64Array(nx * ny),
    gy = new Float64Array(nx * ny);
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const [dx, dy] = pushAt(forces, x0 + i * sx, y0 + j * sy, reduce);
      gx[i * ny + j] = dx;
      gy[i * ny + j] = dy;
    }
  return (px, py) => {
    const fx = Math.min(nx - 1, Math.max(0, (px - x0) / sx)),
      fy = Math.min(ny - 1, Math.max(0, (py - y0) / sy));
    const i = Math.min(nx - 2, Math.floor(fx)),
      j = Math.min(ny - 2, Math.floor(fy));
    const tx = fx - i,
      ty = fy - j;
    const a = i * ny + j,
      b = (i + 1) * ny + j;
    const lerp = (g: Float64Array) =>
      (g[a] * (1 - tx) + g[b] * tx) * (1 - ty) +
      (g[a + 1] * (1 - tx) + g[b + 1] * tx) * ty;
    return [lerp(gx), lerp(gy)];
  };
}

/**
    Each region's rings, distorted so its area stands for its value and
    shared borders stay shared. The map keeps its total area; a region
    whose value isn't a positive number keeps the mean density, so it
    neither grows nor shrinks against the rest. Each output ring has the
    points of its input ring, so the two morph point by point.
    @param regions Each region's projected rings and value.
    @param options The most passes, the error that stops them early, and the work a pass does exactly.
*/
export function contiguousCartogram(
  regions: ContiguousRegion[],
  options: ContiguousOptions = {},
): MorphRing[][] {
  const iterations = options.iterations ?? CONTIGUOUS_ITERATIONS;
  const tolerance = options.tolerance ?? CONTIGUOUS_TOLERANCE;
  const budget = options.budget ?? CONTIGUOUS_BUDGET;
  // Every distinct point once, so the points regions share move as one.
  const index = new Map<string, number>();
  const xs: number[] = [],
    ys: number[] = [];
  const refs = regions.map(region =>
    region.rings.map(ring =>
      ring.map(([x, y]) => {
        const key = `${x},${y}`;
        let k = index.get(key);
        if (k === undefined) {
          k = xs.length;
          index.set(key, k);
          xs.push(x);
          ys.push(y);
        }
        return k;
      }),
    ),
  );
  const ringsNow = () =>
    refs.map(rings =>
      rings.map(ring => ring.map(k => [xs[k], ys[k]] as [number, number])),
    );

  const start = regions.map(r => regionCentroid(r.rings).area);
  const total = start.reduce((a, b) => a + b, 0);
  const valued = regions.map(r => Number.isFinite(r.value) && r.value > 0);
  const valueSum = regions.reduce(
    (s, r, i) => s + (valued[i] ? r.value : 0),
    0,
  );
  const valuedArea = start.reduce((s, a, i) => s + (valued[i] ? a : 0), 0);
  if (!total || !valueSum) return ringsNow();
  // A region without a value stands for what its area holds at the mean density.
  const values = regions.map((r, i) =>
    valued[i] ? r.value : (start[i] * valueSum) / (valuedArea || total),
  );
  const valueTotal = values.reduce((a, b) => a + b, 0);

  for (let pass = 0; pass < iterations; pass++) {
    const rings = ringsNow();
    const shapes = rings.map(regionCentroid);
    const m = shapes.length;
    const forces: Forces = {
      x: new Float64Array(m),
      y: new Float64Array(m),
      r: new Float64Array(m),
      mass: new Float64Array(m),
    };
    let error = 0;
    shapes.forEach((s, i) => {
      const desired = (values[i] / valueTotal) * total;
      const r = Math.sqrt(s.area / Math.PI);
      forces.x[i] = s.x;
      forces.y[i] = s.y;
      forces.r[i] = r;
      forces.mass[i] = Math.sqrt(desired / Math.PI) - r;
      error += Math.min(
        SIZE_ERROR_CAP,
        Math.max(s.area, desired) / Math.max(Math.min(s.area, desired), 1e-9),
      );
    });
    if (largestError(shapes, values, valued, valueTotal) < tolerance) break;
    const reduce = 1 / (1 + error / shapes.length);
    const n = xs.length;
    if (n * m <= budget) {
      for (let k = 0; k < n; k++) {
        const [dx, dy] = pushAt(forces, xs[k], ys[k], reduce);
        xs[k] += dx;
        ys[k] += dy;
      }
    } else {
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let k = 0; k < n; k++) {
        x0 = Math.min(x0, xs[k]);
        x1 = Math.max(x1, xs[k]);
        y0 = Math.min(y0, ys[k]);
        y1 = Math.max(y1, ys[k]);
      }
      const field = pushField(forces, [x0, y0, x1, y1], budget / m, reduce);
      for (let k = 0; k < n; k++) {
        const [dx, dy] = field(xs[k], ys[k]);
        xs[k] += dx;
        ys[k] += dy;
      }
    }
  }
  return ringsNow();
}
