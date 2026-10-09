/** Path names textures.js's `paths()` generator draws itself. */
const builtinPaths = [
  "squares",
  "nylon",
  "waves",
  "woven",
  "crosses",
  "caps",
  "hexagons",
];

/** A textures.js setter, keyed by option name. */
type TextureSetters = Record<string, (...args: unknown[]) => unknown>;

/**
    Applies the options of a `pattern:<json>` token to a textures.js instance.
    A custom `paths` texture arrives as a resolved SVG path string, which
    textures.js only accepts as a function of the tile size, so it is wrapped.
    @private
*/
export function configureTexture(
  t: TextureSetters,
  config: Record<string, unknown>,
): void {
  for (const k in config) {
    // textures.js accessors are setters only — calling one with no args
    // (e.g. `t.size()`) writes `undefined`, so never read through them.
    if (!(k in t)) continue;
    const v = config[k];
    if (k === "d" && typeof v === "string" && !builtinPaths.includes(v))
      t.d(() => v);
    else if (Array.isArray(v)) t[k](...v);
    else t[k](v);
  }
}
