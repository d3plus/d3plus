/** Where an image sits along one axis of its box: its start, center, or end. */
export type AspectAlign = "min" | "mid" | "max";

/** A parsed SVG `preserveAspectRatio` value. */
export interface PreserveAspectRatio {
  /** `"none"` stretches the image to its box; otherwise its x/y alignment. */
  align: "none" | {x: AspectAlign; y: AspectAlign};
  /** `meet` fits the whole image inside the box, `slice` covers the box. */
  meetOrSlice: "meet" | "slice";
}

/** An axis-aligned rectangle. */
export interface FitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ALIGN: Record<string, AspectAlign> = {Min: "min", Mid: "mid", Max: "max"};

// SVG whitespace around the keywords, which are case-sensitive.
const PAR =
  /^[ \t\n\r\f]*(?:(none)|x(Min|Mid|Max)Y(Min|Mid|Max))[ \t\n\r\f]*(meet|slice)?[ \t\n\r\f]*$/;

/**
    Parses an SVG `preserveAspectRatio` value the way Chromium does: an
    omitted, empty, or invalid value (including one with SVG 1.1's `defer`
    keyword) is the initial value, `xMidYMid meet`; an alignment alone implies
    `meet`; and `none` ignores `slice`.
    @param value The attribute value.
*/
export function parsePreserveAspectRatio(
  value?: string | null,
): PreserveAspectRatio {
  const m = value ? PAR.exec(value) : null;
  if (!m) return {align: {x: "mid", y: "mid"}, meetOrSlice: "meet"};
  if (m[1]) return {align: "none", meetOrSlice: "meet"};
  return {
    align: {x: ALIGN[m[2]], y: ALIGN[m[3]]},
    meetOrSlice: m[4] === "slice" ? "slice" : "meet",
  };
}

const SHARE: Record<AspectAlign, number> = {min: 0, mid: 0.5, max: 1};

/**
    Places an image of `natural` size in `box` per a parsed
    `preserveAspectRatio`, as the source rectangle (in image pixels) and the
    destination rectangle (in box units) of a 9-argument `drawImage`: `none`
    stretches the whole image over the box, `meet` scales it to fit inside the
    box and aligns it in the leftover space, and `slice` scales it to cover the
    box and crops the overflow on the sides the alignment leaves out. An image
    with no natural size stretches.
    @param box The image node's box.
    @param natural The image's natural width and height.
    @param par The parsed `preserveAspectRatio`.
*/
export function imageFit(
  box: FitRect,
  natural: {width: number; height: number},
  par: PreserveAspectRatio,
): {source: FitRect; dest: FitRect} {
  const {width: iw, height: ih} = natural;
  const whole = {x: 0, y: 0, width: iw, height: ih};
  const dest = {x: box.x, y: box.y, width: box.width, height: box.height};
  if (par.align === "none" || !(iw > 0) || !(ih > 0))
    return {source: whole, dest};
  const ax = SHARE[par.align.x],
    ay = SHARE[par.align.y];
  const sx = box.width / iw,
    sy = box.height / ih;
  if (par.meetOrSlice === "slice") {
    const scale = Math.max(sx, sy);
    const sw = box.width / scale,
      sh = box.height / scale;
    return {
      source: {x: (iw - sw) * ax, y: (ih - sh) * ay, width: sw, height: sh},
      dest,
    };
  }
  const scale = Math.min(sx, sy);
  const dw = iw * scale,
    dh = ih * scale;
  return {
    source: whole,
    dest: {
      x: box.x + (box.width - dw) * ax,
      y: box.y + (box.height - dh) * ay,
      width: dw,
      height: dh,
    },
  };
}
