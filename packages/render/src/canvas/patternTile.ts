import {select} from "d3-selection";
import textures from "textures";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
    Builds standalone SVG markup for one tile of a `pattern:<json>` texture
    token, plus the tile's pixel dimensions.

    textures.js only knows how to emit SVG `<pattern>`s, which a Canvas 2D
    context cannot consume directly. The Canvas backend rasterizes this markup
    to an offscreen canvas and wraps it in a repeating `CanvasPattern` — the
    pixel-for-pixel equivalent of the SVG backend's `url(#…)` pattern fill.

    The token format matches what `SvgRenderer` materializes (and what
    `Shape.texture()` emits): `{texture: "<class>", …textureConfig}`.

    Returns `null` for a malformed or unknown token. Pure aside from building a
    detached SVG element via the ambient `document` (browser or jsdom); nothing
    is mounted.
*/
export function patternTileSvg(
  token: string,
): {svg: string; width: number; height: number} | null {
  if (!token.startsWith("pattern:")) return null;
  let config: Record<string, unknown> & {texture?: string};
  try {
    config = JSON.parse(token.slice("pattern:".length));
  } catch {
    return null;
  }
  const textureClass = config.texture;
  if (!textureClass || typeof textures[textureClass] !== "function") return null;
  delete config.texture;

  const t = textures[textureClass]();
  for (const k in config) {
    // NB: textures.js accessors are setters only — calling one with no args
    // (e.g. `t.size()`) writes `undefined`, so never read through them. Always
    // pass the configured value.
    if (k in t) {
      const v = config[k];
      if (Array.isArray(v)) t[k](...v);
      else t[k](v);
    }
  }

  const svg = select(document.createElementNS(SVG_NS, "svg"));
  // textures.js appends a `<defs><pattern width height …>` into the selection,
  // sized from its (now-configured) internal size — read the tile dimensions
  // back off that element rather than via the corrupting size getter.
  svg.call(t);
  const patternEl = (svg.node() as Element).querySelector("pattern");
  const width = parseFloat(patternEl?.getAttribute("width") ?? "") || 20;
  const height = parseFloat(patternEl?.getAttribute("height") ?? "") || 20;

  // A tile-sized rect filled with the pattern is the one repeating unit.
  svg.attr("width", width).attr("height", height);
  svg.append("rect").attr("width", width).attr("height", height).attr("fill", t.url());

  // Resolve XMLSerializer from the document's own window so this works under
  // both a real browser and jsdom (where it isn't a bare global).
  const view = document.defaultView as (Window & typeof globalThis) | null;
  const Serializer = view?.XMLSerializer ?? globalThis.XMLSerializer;
  const markup = new Serializer().serializeToString(svg.node() as Node);
  return {svg: markup, width, height};
}
