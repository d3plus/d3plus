/**
    The paths WordCloud walks outward from a word's start, looking for a
    spot where it fits.
*/

/** The spiral a word walks: `"archimedean"` or `"rectangular"`. */
export type SpiralKind = "archimedean" | "rectangular";

/** A spiral's options. */
export interface SpiralOptions {
  /** The area's width over its height, so the spiral fills it evenly. */
  aspect?: number;
  /** The angle, in radians, the spiral starts out at. */
  phase?: number;
  /** `1` to turn clockwise (on screen), `-1` counterclockwise. */
  direction?: 1 | -1;
}

/** The step, in pixels, between consecutive points along the spiral. */
export const SPIRAL_STEP = 2;

/** The gap, in pixels, between the spiral's turns (along its shorter axis). */
export const SPIRAL_SPACING = 4;

/**
    Coerces a `spiral` setting, falling back to `"archimedean"`.
    @param value The setting.
*/
export function spiralKind(value: unknown): SpiralKind {
  return value === "rectangular" ? "rectangular" : "archimedean";
}

/**
    An Archimedean spiral: `point(n)` is the n-th point's offset from the
    start, `[dx, dy]`, with consecutive points about `SPIRAL_STEP` pixels
    apart (so the walk samples the far turns as finely as the near ones) and
    the turns `SPIRAL_SPACING` pixels apart, stretched along x by `aspect`.
    @param options The spiral's aspect, phase, and direction.
*/
export function archimedeanSpiral(
  options: SpiralOptions = {},
): (n: number) => [number, number] {
  const {aspect = 1, phase = 0, direction = 1} = options;
  const b = SPIRAL_SPACING / (2 * Math.PI);
  return n => {
    // The arc length to angle t is about b·t²/2 for an Archimedean spiral.
    const t = Math.sqrt((2 * n * SPIRAL_STEP) / b);
    const r = b * t;
    const a = phase + direction * t;
    return [aspect * r * Math.cos(a), r * Math.sin(a)];
  };
}

/**
    A rectangular spiral: `point(n)` walks around ever larger rectangles,
    `SPIRAL_SPACING` pixels a step along y (and `aspect` times that along x),
    turning a corner after 1, 1, 2, 2, 3, 3, … steps. Its points come back
    in order, so call it with n = 0, 1, 2, ….
    @param options The spiral's aspect and direction (its phase picks which
    way it heads first, in quarter turns).
*/
export function rectangularSpiral(
  options: SpiralOptions = {},
): (n: number) => [number, number] {
  const {aspect = 1, phase = 0, direction = 1} = options;
  const dy = SPIRAL_SPACING;
  const dx = SPIRAL_SPACING * aspect;
  const first = ((Math.round(phase / (Math.PI / 2)) % 4) + 4) % 4;
  let x = 0;
  let y = 0;
  let at = 0;
  // Run k (from 0) is floor(k / 2) + 1 steps long, heading a quarter turn
  // on from run k - 1.
  let run = 0;
  let left = 1;
  return n => {
    for (; at < n; at++) {
      const side = (((first + direction * run) % 4) + 4) % 4;
      if (side === 0) x += dx;
      else if (side === 1) y += dy;
      else if (side === 2) x -= dx;
      else y -= dy;
      if (--left === 0) left = Math.floor(++run / 2) + 1;
    }
    return [x, y];
  };
}

/**
    The spiral of `kind`.
    @param kind Which spiral.
    @param options Its aspect, phase, and direction.
*/
export function makeSpiral(
  kind: SpiralKind,
  options: SpiralOptions = {},
): (n: number) => [number, number] {
  return kind === "rectangular"
    ? rectangularSpiral(options)
    : archimedeanSpiral(options);
}
