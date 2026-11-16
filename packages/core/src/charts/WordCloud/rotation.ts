/**
    WordCloud's deterministic per-word choices: a seeded string hash and the
    angle each word takes from `rotate`.
*/

import type {DataPoint} from "@d3plus/data";

/**
    A 32-bit FNV-1a hash of `text`, as an unsigned integer. The same text
    and seed always give the same hash, so choices drawn from it repeat
    across draws.
    @param text The string to hash (a word's id).
    @param seed Varies the hash, so separate choices about one word don't
    follow each other.
*/
export function hashString(text: string, seed = 0): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let k = 0; k < text.length; k++) {
    h ^= text.charCodeAt(k);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
    A number in [0, 1) drawn from `text`'s hash.
    @param text The string to hash.
    @param seed Varies the draw.
*/
export function hashUnit(text: string, seed = 0): number {
  return hashString(text, seed) / 0x100000000;
}

/** The seed the rotation pick hashes a word's id with. */
const ROTATE_SEED = 0x9e3779b9;

/**
    The angle, in degrees, a word is drawn at: `rotate` as a number, one of
    an array of angles picked by the hash of the word's id (so a word keeps
    its angle from draw to draw), or an accessor's return value. Anything
    else, or a non-finite angle, draws the word horizontally.
    @param rotate The chart's `rotate` setting.
    @param d The word's row.
    @param i The row's index.
    @param id The word's id, hashed to pick from an array.
*/
export function wordRotation(
  rotate: unknown,
  d: DataPoint,
  i: number,
  id: string,
): number {
  let angle: unknown = rotate;
  if (Array.isArray(rotate)) {
    if (!rotate.length) return 0;
    angle = rotate[hashString(id, ROTATE_SEED) % rotate.length];
  } else if (typeof rotate === "function")
    angle = (rotate as (d: DataPoint, i: number) => unknown)(d, i);
  const n = Number(angle);
  return angle !== null && angle !== "" && Number.isFinite(n) ? n : 0;
}
