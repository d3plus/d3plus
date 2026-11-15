/**
    The diffusion cartogram (Gastner and Newman, 2004): each region's value
    spread over its area as a density, the sea around the map at the mean
    density, and the density left to diffuse until it is even everywhere;
    every point of the map rides the flow (velocity −∇ρ/ρ) as it does. The
    density is laid on a square grid and evolved exactly in cosine space
    (each mode decays as e^(−k²t)), with a small hand-written FFT. Because
    the flow is smooth, regions keep their shared borders and don't fold.

    @module
*/

import type {MorphRing} from "@d3plus/render";

import type {ContiguousRegion} from "./cartogramContiguous.js";

/** How `diffusionCartogram` runs. */
export interface DiffusionOptions {
  /** The grid's side, in cells: a power of two. */
  grid?: number;
  /** The time the density is blurred for before the map moves, in cells² (smooths needle-sharp peaks). */
  blur?: number;
  /** Receives the steps the flow took. */
  stats?: {steps?: number};
}

/** The blur, by default: about a cell either way. */
export const DIFFUSION_BLUR = 1;

/** The grid side, by default. */
export const DIFFUSION_GRID = 256;

/** The most a cell center moves in one step of the flow, in cells. */
const STEP = 0.5;

/** The share of the grid's width the map spans; the rest is sea. */
const MAP_SHARE = 0.6;

/** An in-place radix-2 FFT of `re`/`im` (length a power of two); `inverse` skips the 1/N. */
export function fft(re: Float64Array, im: Float64Array, inverse = false): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang),
      wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1,
        ci = 0;
      for (let k = 0; k < len >> 1; k++) {
        const a = i + k,
          b = a + (len >> 1);
        const tr = re[b] * cr - im[b] * ci,
          ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/** Scratch arrays and twiddles for one length's cosine transforms. */
class Cosine {
  n: number;
  re: Float64Array;
  im: Float64Array;
  cos: Float64Array;
  sin: Float64Array;
  constructor(n: number) {
    this.n = n;
    this.re = new Float64Array(n);
    this.im = new Float64Array(n);
    this.cos = new Float64Array(n);
    this.sin = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      this.cos[k] = Math.cos((Math.PI * k) / (2 * n));
      this.sin[k] = Math.sin((Math.PI * k) / (2 * n));
    }
  }

  /** DCT-II of `x` (stride `step` from `at`), written back in place. */
  forward(x: Float64Array, at: number, step: number) {
    const {n, re, im} = this;
    for (let k = 0; k < n / 2; k++) {
      re[k] = x[at + 2 * k * step];
      re[n - 1 - k] = x[at + (2 * k + 1) * step];
    }
    im.fill(0);
    fft(re, im);
    for (let k = 0; k < n; k++)
      x[at + k * step] = re[k] * this.cos[k] + im[k] * this.sin[k];
  }

  /** The inverse of `forward` (a DCT-III scaled by 2/N), in place. */
  inverse(x: Float64Array, at: number, step: number) {
    const {n, re, im} = this;
    for (let k = 0; k < n; k++) {
      const a = x[at + k * step],
        b = k ? -x[at + (n - k) * step] : 0;
      // (a + ib) · e^(iπk/2N)
      re[k] = a * this.cos[k] - b * this.sin[k];
      im[k] = a * this.sin[k] + b * this.cos[k];
    }
    fft(re, im, true);
    for (let k = 0; k < n / 2; k++) {
      x[at + 2 * k * step] = re[k] / n;
      x[at + (2 * k + 1) * step] = re[n - 1 - k] / n;
    }
  }
}

/** The 2D DCT-II of an `n`×`n` grid (rows then columns), in place. */
export function dct2d(grid: Float64Array, n: number, inverse = false): void {
  const c = new Cosine(n);
  for (let r = 0; r < n; r++)
    if (inverse) c.inverse(grid, r * n, 1);
    else c.forward(grid, r * n, 1);
  for (let col = 0; col < n; col++)
    if (inverse) c.inverse(grid, col, n);
    else c.forward(grid, col, n);
}

/** A ring's signed area. */
function ringArea(ring: MorphRing): number {
  let s = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x0, y0] = ring[i],
      [x1, y1] = ring[(i + 1) % n];
    s += x0 * y1 - x1 * y0;
  }
  return s / 2;
}

/**
    `ring` with points added along every edge longer than `step`, at even
    spacing. The points are laid from the edge's lesser end, so the two
    regions sharing an edge add the same points.
*/
export function densify(ring: MorphRing, step: number): MorphRing {
  const out: MorphRing = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i],
      q = ring[(i + 1) % ring.length];
    out.push([p[0], p[1]]);
    const m = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / step);
    if (m < 2) continue;
    const flip = p[0] > q[0] || (p[0] === q[0] && p[1] > q[1]);
    const [a, b] = flip ? [q, p] : [p, q];
    for (let k = 1; k < m; k++) {
      const j = flip ? m - k : k;
      out.push([
        a[0] + ((b[0] - a[0]) * j) / m,
        a[1] + ((b[1] - a[1]) * j) / m,
      ]);
    }
  }
  return out;
}

/**
    Each region's index on the cells whose centers it covers (even-odd
    across its rings), else -1, filled row by row.
*/
function rasterize(
  rings: MorphRing[][],
  n: number,
  toGrid: (p: [number, number]) => [number, number],
): Int32Array {
  const owner = new Int32Array(n * n).fill(-1);
  rings.forEach((region, index) => {
    const edges: [number, number, number, number][] = [];
    let y0 = Infinity,
      y1 = -Infinity;
    for (const ring of region)
      for (let i = 0; i < ring.length; i++) {
        const a = toGrid(ring[i]),
          b = toGrid(ring[(i + 1) % ring.length]);
        edges.push([a[0], a[1], b[0], b[1]]);
        y0 = Math.min(y0, a[1]);
        y1 = Math.max(y1, a[1]);
      }
    const rStart = Math.max(0, Math.ceil(y0 - 0.5)),
      rEnd = Math.min(n - 1, Math.floor(y1 - 0.5));
    for (let r = rStart; r <= rEnd; r++) {
      const y = r + 0.5;
      const xs: number[] = [];
      for (const [ax, ay, bx, by] of edges)
        if (ay <= y !== by <= y)
          xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const c0 = Math.max(0, Math.ceil(xs[k] - 0.5)),
          c1 = Math.min(n - 1, Math.floor(xs[k + 1] - 0.5));
        for (let c = c0; c <= c1; c++) owner[r * n + c] = index;
      }
    }
  });
  return owner;
}

/**
    The diffusion's velocity field (−∇ρ/ρ, per cell center) from the
    density's cosine coefficients: `field(t)` writes the field at time `t`
    onto `vx`/`vy` and returns its largest speed.
*/
function velocityField(coef: Float64Array, n: number) {
  const decay = new Float64Array(n);
  const rho = new Float64Array(n * n),
    vx = new Float64Array(n * n),
    vy = new Float64Array(n * n);
  const field = (t: number): number => {
    for (let k = 0; k < n; k++)
      decay[k] = Math.exp(-((Math.PI * Math.PI) / (n * n)) * k * k * t);
    for (let ky = 0; ky < n; ky++)
      for (let kx = 0; kx < n; kx++)
        rho[ky * n + kx] = coef[ky * n + kx] * decay[kx] * decay[ky];
    dct2d(rho, n, true);
    let max = 0;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const k = r * n + c;
        const dx = c === 0 || c === n - 1 ? 0 : (rho[k + 1] - rho[k - 1]) / 2;
        const dy = r === 0 || r === n - 1 ? 0 : (rho[k + n] - rho[k - n]) / 2;
        const p = Math.max(rho[k], 1e-6);
        vx[k] = -dx / p;
        vy[k] = -dy / p;
        max = Math.max(max, Math.hypot(vx[k], vy[k]));
      }
    return max;
  };
  return {vx, vy, field};
}

/** Reads the `n`×`n` grid `f` at grid point `(x, y)`, bilinearly between cell centers. */
function bilinear(f: Float64Array, n: number, x: number, y: number): number {
  const u = Math.min(n - 1.000001, Math.max(0, x - 0.5)),
    v = Math.min(n - 1.000001, Math.max(0, y - 0.5));
  const i = Math.floor(u),
    j = Math.floor(v);
  const tx = u - i,
    ty = v - j;
  const a = j * n + i;
  return (
    (f[a] * (1 - tx) + f[a + 1] * tx) * (1 - ty) +
    (f[a + n] * (1 - tx) + f[a + n + 1] * tx) * ty
  );
}

/**
    Each region's rings, moved by the diffusion flow so its area stands for
    its value. A region whose value isn't a positive number keeps the mean
    density, as the sea does. Each output ring has its input ring's points,
    and more along its long edges (see `densify`).
    @param regions Each region's projected rings and value.
    @param options The grid side.
*/
export function diffusionCartogram(
  regions: ContiguousRegion[],
  options: DiffusionOptions = {},
): MorphRing[][] {
  const n = options.grid ?? DIFFUSION_GRID;
  const pts = regions.flatMap(r => r.rings.flat());
  if (!pts.length) return regions.map(r => r.rings);
  let bx0 = Infinity,
    by0 = Infinity,
    bx1 = -Infinity,
    by1 = -Infinity;
  for (const [x, y] of pts) {
    bx0 = Math.min(bx0, x);
    bx1 = Math.max(bx1, x);
    by0 = Math.min(by0, y);
    by1 = Math.max(by1, y);
  }
  const cell = Math.max(bx1 - bx0, by1 - by0, 1e-9) / (MAP_SHARE * n);
  const ox = (bx0 + bx1) / 2 - (n * cell) / 2,
    oy = (by0 + by1) / 2 - (n * cell) / 2;
  const toGrid = ([x, y]: [number, number]): [number, number] => [
    (x - ox) / cell,
    (y - oy) / cell,
  ];

  // Densities: value over area, the mean for the sea and regions without a value.
  const areas = regions.map(r =>
    Math.abs(r.rings.reduce((s, ring) => s + ringArea(ring), 0)),
  );
  const valued = regions.map(
    (r, i) => Number.isFinite(r.value) && r.value > 0 && areas[i] > 0,
  );
  const valueSum = regions.reduce(
    (s, r, i) => s + (valued[i] ? r.value : 0),
    0,
  );
  const valuedArea = areas.reduce((s, a, i) => s + (valued[i] ? a : 0), 0);
  if (!valueSum || !valuedArea) return regions.map(r => r.rings);
  const mean = valueSum / valuedArea;
  const density = regions.map((r, i) =>
    valued[i] ? r.value / areas[i] / mean : 1,
  );
  const owner = rasterize(
    regions.map(r => r.rings),
    n,
    toGrid,
  );
  const coef = new Float64Array(n * n);
  for (let k = 0; k < n * n; k++)
    coef[k] = owner[k] < 0 ? 1 : density[owner[k]];
  dct2d(coef, n);

  const {vx, vy, field} = velocityField(coef, n);
  const at = (x: number, y: number, f: Float64Array) => bilinear(f, n, x, y);

  // The cell centers ride the flow (Heun's method, each step's end field
  // reused as the next one's start); the map's points follow them.
  const cells = n * n;
  const gx = new Float64Array(cells),
    gy = new Float64Array(cells);
  for (let k = 0; k < cells; k++) {
    gx[k] = (k % n) + 0.5;
    gy[k] = Math.floor(k / n) + 0.5;
  }
  const end = (n * n * Math.log(1e4)) / (Math.PI * Math.PI);
  let t = options.blur ?? DIFFUSION_BLUR;
  let speed = field(t);
  let fx0 = Float64Array.from(vx),
    fy0 = Float64Array.from(vy);
  let dt = STEP / Math.max(speed, 1e-9);
  const px = new Float64Array(cells),
    py = new Float64Array(cells);
  let step = 0;
  for (; step < 4000 && t < end; step++) {
    dt = Math.min(dt, end - t);
    for (let k = 0; k < cells; k++) {
      px[k] = at(gx[k], gy[k], fx0);
      py[k] = at(gx[k], gy[k], fy0);
    }
    speed = field(t + dt);
    for (let k = 0; k < cells; k++) {
      const x = gx[k] + px[k] * dt,
        y = gy[k] + py[k] * dt;
      gx[k] += ((px[k] + at(x, y, vx)) / 2) * dt;
      gy[k] += ((py[k] + at(x, y, vy)) / 2) * dt;
    }
    t += dt;
    fx0 = Float64Array.from(vx);
    fy0 = Float64Array.from(vy);
    // Move at most STEP cells a step, growing the step as the flow calms.
    dt = Math.min(dt * 2, STEP / Math.max(speed, 1e-9));
  }

  if (options.stats) options.stats.steps = step;
  // Each map point lands where the cell centers around it landed, read
  // bilinearly; long edges gain points first, since the flow bends them.
  const place = (p: [number, number]): [number, number] => {
    const [x, y] = toGrid(p);
    return [ox + at(x, y, gx) * cell, oy + at(x, y, gy) * cell];
  };
  return regions.map(r =>
    r.rings.map(ring => densify(ring, cell / 2).map(place)),
  );
}
