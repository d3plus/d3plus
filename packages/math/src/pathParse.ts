import type {Point} from "./lineIntersection.js";

/**
    A path segment normalized to absolute coordinates. The parser folds away all
    of SVG's shorthand — relative commands, `H`/`V`, the smooth `S`/`T` reflections
    — so downstream consumers only ever see absolute `M`/`L`/`C`/`Q`/`A`/`Z`.
*/
export type PathSegment =
  | {type: "M" | "L"; x: number; y: number}
  | {type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number}
  | {type: "Q"; x1: number; y1: number; x: number; y: number}
  | {
      type: "A";
      rx: number;
      ry: number;
      rot: number;
      large: number;
      sweep: number;
      x: number;
      y: number;
    }
  | {type: "Z"};

const WS = new Set([" ", "\t", "\n", "\r", "\f", ","]);

/**
    A pointer-driven scanner over an SVG path `d` string. Kept command-aware so
    it can read arc flags (`large-arc`/`sweep`) as single `0`/`1` characters even
    when they are glued to the next number (the classic `a5 5 0 0150 0` case a
    plain number regex mis-tokenizes).
    @private
*/
class Scanner {
  s: string;
  i = 0;
  constructor(s: string) {
    this.s = s;
  }
  eof(): boolean {
    return this.i >= this.s.length;
  }
  skipSep(): void {
    while (this.i < this.s.length && WS.has(this.s[this.i])) this.i++;
  }
  /** Reads a number token (handles `.5`, `1.`, `1e3`, signs, exponents). */
  readNumber(): number {
    this.skipSep();
    const start = this.i;
    const s = this.s;
    if (s[this.i] === "+" || s[this.i] === "-") this.i++;
    while (this.i < s.length && s[this.i] >= "0" && s[this.i] <= "9") this.i++;
    if (s[this.i] === ".") {
      this.i++;
      while (this.i < s.length && s[this.i] >= "0" && s[this.i] <= "9") this.i++;
    }
    if (s[this.i] === "e" || s[this.i] === "E") {
      this.i++;
      if (s[this.i] === "+" || s[this.i] === "-") this.i++;
      while (this.i < s.length && s[this.i] >= "0" && s[this.i] <= "9") this.i++;
    }
    return parseFloat(s.slice(start, this.i));
  }
  /** Reads a single `0`/`1` arc flag, which may be glued to the next number. */
  readFlag(): number {
    this.skipSep();
    const c = this.s[this.i];
    this.i++;
    return c === "1" ? 1 : 0;
  }
  /** True when the next non-separator char begins a new number (implicit repeat). */
  moreArgs(): boolean {
    this.skipSep();
    const c = this.s[this.i];
    return (
      c !== undefined &&
      (c === "+" || c === "-" || c === "." || (c >= "0" && c <= "9"))
    );
  }
  nextCommand(): string | null {
    this.skipSep();
    const c = this.s[this.i];
    if (c !== undefined && ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z"))) {
      this.i++;
      return c;
    }
    return null;
  }
}

/**
    Parses an SVG path `d` string into a flat list of absolute {@link PathSegment}s,
    with no DOM involved. Every relative command is resolved against the running
    point, `H`/`V` become `L`, and `S`/`T` expand into `C`/`Q` using the reflected
    previous control point.
    @param d An SVG path string (the `d` attribute of a `<path>`).
*/
export default function parsePath(d: string): PathSegment[] {
  const out: PathSegment[] = [];
  if (!d) return out;
  const sc = new Scanner(d);
  let cmd: string | null = null;
  let cx = 0, cy = 0; // current point
  let sx = 0, sy = 0; // subpath start (for Z)
  // Reflected control point of the previous C/S (cubic) or Q/T (quadratic).
  let px = 0, py = 0;
  let prevType = "";

  while (!sc.eof()) {
    const next = sc.nextCommand();
    if (next) cmd = next;
    else if (cmd === null) break;
    // Implicit repeats: a repeated M/m draws L/l; everything else repeats itself.
    else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";
    const rel = cmd === (cmd as string).toLowerCase();
    const C = (cmd as string).toUpperCase();
    const bx = rel ? cx : 0;
    const by = rel ? cy : 0;

    if (C === "M") {
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      sx = cx;
      sy = cy;
      out.push({type: "M", x: cx, y: cy});
    } else if (C === "L") {
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "L", x: cx, y: cy});
    } else if (C === "H") {
      cx = sc.readNumber() + bx;
      out.push({type: "L", x: cx, y: cy});
    } else if (C === "V") {
      cy = sc.readNumber() + by;
      out.push({type: "L", x: cx, y: cy});
    } else if (C === "C") {
      const x1 = sc.readNumber() + bx, y1 = sc.readNumber() + by;
      const x2 = sc.readNumber() + bx, y2 = sc.readNumber() + by;
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "C", x1, y1, x2, y2, x: cx, y: cy});
      px = x2;
      py = y2;
    } else if (C === "S") {
      const ref = prevType === "C" || prevType === "S";
      const x1 = ref ? 2 * cx - px : cx, y1 = ref ? 2 * cy - py : cy;
      const x2 = sc.readNumber() + bx, y2 = sc.readNumber() + by;
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "C", x1, y1, x2, y2, x: cx, y: cy});
      px = x2;
      py = y2;
    } else if (C === "Q") {
      const x1 = sc.readNumber() + bx, y1 = sc.readNumber() + by;
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "Q", x1, y1, x: cx, y: cy});
      px = x1;
      py = y1;
    } else if (C === "T") {
      const ref = prevType === "Q" || prevType === "T";
      const x1 = ref ? 2 * cx - px : cx, y1 = ref ? 2 * cy - py : cy;
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "Q", x1, y1, x: cx, y: cy});
      px = x1;
      py = y1;
    } else if (C === "A") {
      const rx = sc.readNumber(), ry = sc.readNumber(), rot = sc.readNumber();
      const large = sc.readFlag(), sweep = sc.readFlag();
      cx = sc.readNumber() + bx;
      cy = sc.readNumber() + by;
      out.push({type: "A", rx, ry, rot, large, sweep, x: cx, y: cy});
    } else if (C === "Z") {
      out.push({type: "Z"});
      cx = sx;
      cy = sy;
    } else {
      // Unknown command — bail rather than loop forever.
      break;
    }
    prevType = C;
    // Stop repeating this command once its arguments are exhausted.
    if (C !== "Z" && !sc.moreArgs()) {
      // leave cmd set so an implicit repeat is only taken when numbers follow
    }
  }
  return out;
}

/**
    Converts an SVG endpoint-parameterized arc to its center parameterization
    (SVG spec F.6.5), returning the ellipse center, corrected radii, x-axis
    rotation (radians), start angle and signed sweep. Returns null for a
    degenerate arc (zero radius), which callers treat as a straight line.
    @private
*/
export function arcToCenter(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotDeg: number,
  large: number,
  sweep: number,
  x2: number,
  y2: number,
): {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  phi: number;
  theta1: number;
  dtheta: number;
} | null {
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (rx === 0 || ry === 0) return null;
  const phi = (rotDeg * Math.PI) / 180;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;
  // Scale radii up if they are too small to span the endpoints.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const sign = large !== sweep ? 1 : -1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = ang(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;
  else if (sweep && dtheta < 0) dtheta += 2 * Math.PI;
  return {cx, cy, rx, ry, phi, theta1, dtheta};
}

/** A point on a center-parameterized arc at absolute ellipse angle `theta`. */
export function arcPoint(
  arc: {cx: number; cy: number; rx: number; ry: number; phi: number},
  theta: number,
): Point {
  const cosP = Math.cos(arc.phi), sinP = Math.sin(arc.phi);
  const ct = Math.cos(theta), st = Math.sin(theta);
  return [
    arc.cx + arc.rx * ct * cosP - arc.ry * st * sinP,
    arc.cy + arc.rx * ct * sinP + arc.ry * st * cosP,
  ];
}
