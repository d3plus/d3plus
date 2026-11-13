/**
    Seeded jitter: a stable offset per key, so a jittered point keeps its
    place across redraws, resizes, and filters (see Plot's `jitter`).
*/

/** The `jitter` setting: off, on (the default width), or a share of the band. */
export type JitterSetting = boolean | number;

/** The share of its band a `jitter: true` spread covers. */
export const DEFAULT_JITTER = 0.6;

/**
    The share of the band a `jitter` setting spreads points across: `true` is
    `DEFAULT_JITTER`, a number is that share (clamped to 0–1), and anything
    else is 0, no jitter.
    @param setting The `jitter` setting.
*/
export function jitterWidth(setting: unknown): number {
  if (setting === true) return DEFAULT_JITTER;
  if (typeof setting === "number" && Number.isFinite(setting))
    return Math.min(1, Math.max(0, setting));
  return 0;
}

/**
    A stable offset in [-0.5, 0.5) for `key`: a 32-bit FNV-1a hash of its
    characters, mixed so that similar keys land far apart. The same key
    always gives the same offset.
    @param key A point's id.
*/
export function jitterOffset(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296 - 0.5;
}
