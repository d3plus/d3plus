import type {Transform} from "../scene.js";

/**
    @type Mat
    A 2D affine matrix [a, b, c, d, e, f] mapping (x, y) to
    (a·x + c·y + e, b·x + d·y + f) — the same 6-tuple Canvas's setTransform uses.
*/
export type Mat = [number, number, number, number, number, number];

export const identity: Mat = [1, 0, 0, 1, 0, 0];

/** Composes two matrices so that `apply(multiply(m, n), p)` equals `apply(m, apply(n, p))`. */
export function multiply(m: Mat, n: Mat): Mat {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** Maps a point through a matrix. */
export function apply(m: Mat, p: [number, number]): [number, number] {
  return [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
}

/** Inverts an affine matrix (assumes it is invertible). */
export function invert(m: Mat): Mat {
  const det = m[0] * m[3] - m[1] * m[2];
  const id = det === 0 ? 0 : 1 / det;
  return [
    m[3] * id,
    -m[1] * id,
    -m[2] * id,
    m[0] * id,
    (m[2] * m[5] - m[3] * m[4]) * id,
    (m[1] * m[4] - m[0] * m[5]) * id,
  ];
}

/**
    Builds the local matrix for a node's transform, applying translate, then scale,
    then rotate — the same order as the SVG transform string the SVG backend emits,
    so hit-testing on Canvas matches the SVG layout exactly.
    @param tr The node transform, or undefined for identity.
*/
export function nodeMatrix(tr?: Transform): Mat {
  if (!tr) return identity;
  let m: Mat = [1, 0, 0, 1, tr.x ?? 0, tr.y ?? 0];
  if (tr.scale !== undefined && tr.scale !== 1)
    m = multiply(m, [tr.scale, 0, 0, tr.scale, 0, 0]);
  if (tr.rotate) {
    const rad = (tr.rotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rot: Mat = [cos, sin, -sin, cos, 0, 0];
    if (tr.rotateAnchor) {
      const [ax, ay] = tr.rotateAnchor;
      m = multiply(m, multiply([1, 0, 0, 1, ax, ay], multiply(rot, [1, 0, 0, 1, -ax, -ay])));
    } else {
      m = multiply(m, rot);
    }
  }
  return m;
}
