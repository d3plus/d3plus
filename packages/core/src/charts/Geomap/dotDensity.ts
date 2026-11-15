/**
    Dot-density helpers: how many dots each value draws, and where they
    fall inside a region's projected shape, scattered by a random stream
    seeded from the region, so the same region always places its dots the
    same way.

    @module
*/

/** A point in pixels. */
export type DotPoint = [number, number];
/** A closed ring of points. */
export type DotRing = DotPoint[];

/**
    A random number generator seeded by `key`: a 32-bit FNV-1a hash of its
    characters feeding a mulberry32 stream. The same key always gives the
    same sequence of numbers in [0, 1).
    @param key The seed.
*/
export function seededRandom(key: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
    Whether a point falls inside the shape the rings draw, by the even-odd
    rule: inside an odd number of rings, so a hole cuts out of its polygon
    and each part of a multipolygon counts.
    @param x The point's x.
    @param y The point's y.
    @param rings The shape's rings.
*/
export function insideRings(x: number, y: number, rings: DotRing[]): boolean {
  let inside = false;
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
  }
  return inside;
}

/** The box around every ring, `[x0, y0, x1, y1]`, or null without a point. */
export function ringsBounds(
  rings: DotRing[],
): [number, number, number, number] | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return x0 <= x1 && y0 <= y1 ? [x0, y0, x1, y1] : null;
}

/** The candidates tried for each dot before a shape is taken as too thin to fill. */
const TRIES_PER_DOT = 200;

/**
    A seeded stream of dots inside a shape: each candidate is drawn at the
    same share of the way across the shape's box, so a shape that is only
    moved or scaled (as a map resize does) keeps its dots in place, and
    asking for more dots keeps the ones already placed. Candidates outside
    the shape are thrown away.
*/
export class DotScatter {
  readonly rings: DotRing[];
  readonly points: DotPoint[] = [];
  private readonly box: [number, number, number, number] | null;
  private readonly random: () => number;
  private exhausted = false;

  /**
      @param rings The shape's rings, in pixels.
      @param seed The key the shape's random stream is seeded with.
  */
  constructor(rings: DotRing[], seed: string) {
    this.rings = rings;
    this.box = ringsBounds(rings);
    this.random = seededRandom(seed);
  }

  /**
      The first `count` dots of the stream (fewer when the shape is too
      thin to hold them).
      @param count How many dots.
  */
  take(count: number): DotPoint[] {
    const {box, points} = this;
    if (box && !this.exhausted && points.length < count) {
      const [x0, y0, x1, y1] = box;
      let tries = (count - points.length) * TRIES_PER_DOT;
      while (points.length < count && tries-- > 0) {
        const x = x0 + this.random() * (x1 - x0);
        const y = y0 + this.random() * (y1 - y0);
        if (insideRings(x, y, this.rings)) points.push([x, y]);
      }
      if (points.length < count) this.exhausted = true;
    }
    return points.length > count ? points.slice(0, count) : points.slice();
  }
}

/**
    The smallest round number (1, 2, 2.5 or 5 times a power of ten) at
    least `x`.
    @param x A positive number.
*/
export function niceCeil(x: number): number {
  if (!(x > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  for (const m of [1, 2, 2.5, 5, 10])
    if (m * p >= x * (1 - 1e-12)) return m * p;
  return 10 * p;
}

/**
    How many dots each value draws at `per` units a dot (rounded to the
    nearest dot), and the units each dot stands for once the total is held
    to `max` dots: past it, `per` grows to the next round number (see
    `niceCeil`) at which the dots fit.
    @param values Each group's value (anything not a positive number draws none).
    @param per The units each dot stands for.
    @param max The most dots drawn in all.
*/
export function dotCounts(
  values: number[],
  per: number,
  max: number,
): {counts: number[]; per: number} {
  const positive = values.map(v => (Number.isFinite(v) && v > 0 ? v : 0));
  const limit = max > 0 ? Math.floor(max) : Infinity;
  const count = (u: number) => positive.map(v => Math.round(v / u));
  const total = (c: number[]) => c.reduce((a, b) => a + b, 0);
  let unit = per > 0 ? per : 1;
  let counts = count(unit);
  let sum = total(counts);
  while (sum > limit) {
    unit = niceCeil(Math.max(unit * (sum / limit), unit * 1.000001));
    counts = count(unit);
    sum = total(counts);
  }
  return {counts, per: unit};
}

/**
    Dots as one path of `r`-pixel circles, each drawn as two arcs.
    @param points The dots' centers.
    @param r The radius.
*/
export function dotsPathD(points: DotPoint[], r: number): string {
  const round = (n: number) => Math.round(n * 100) / 100;
  const rr = round(r);
  let d = "";
  for (const [x, y] of points)
    d += `M${round(x - r)},${round(y)}a${rr},${rr} 0 1,0 ${round(2 * r)},0a${rr},${rr} 0 1,0 ${round(-2 * r)},0`;
  return d;
}
