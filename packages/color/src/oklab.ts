import {rgb} from "d3-color";

/**
    OKLab / OKLCH conversions (Björn Ottosson's OKLab, 2020).

    OKLab is a perceptually-uniform color space: equal numeric steps look like
    equal perceptual steps, and lightness (`l`) is decoupled from hue and chroma.
    That makes it the right space for building even single-hue ramps
    (see `colorRamp`) and for measuring a palette's lightness/chroma
    (see `colorValidate`) — both of which read wrong in HSL or sRGB.

    Inputs are any CSS color string (parsed via d3-color, so named colors,
    `rgb()`, and short/long hex all work); outputs are hex strings.
*/

/** An OKLab color: `l` lightness (0–1), `a` green↔red, `b` blue↔yellow. */
export interface OKLab {
  l: number;
  a: number;
  b: number;
}

/** An OKLCH color: `l` lightness (0–1), `c` chroma (≥0), `h` hue (degrees). */
export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

const s2lin = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const lin2s = (c: number): number => {
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};

/** Parses a CSS color string to linear-light sRGB channels in the range 0–1. */
export function linearRGB(c: string): [number, number, number] {
  const {r, g, b} = rgb(c);
  return [s2lin(r / 255), s2lin(g / 255), s2lin(b / 255)];
}

/**
    Converts a CSS color string to OKLab.
    @param c A valid CSS color string.
*/
export function colorToOklab(c: string): OKLab {
  const [r, g, b] = linearRGB(c);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

/**
    Converts an OKLab color back to a hex string (gamut-clamped in sRGB).
    @param lab An OKLab color.
*/
export function oklabToColor({l, a, b}: OKLab): string {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const r = lin2s(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = lin2s(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const b2 = lin2s(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_);
  return rgb(255 * r, 255 * g, 255 * b2).formatHex();
}

/**
    Converts a CSS color string to OKLCH (cylindrical OKLab).
    @param c A valid CSS color string.
*/
export function colorToOklch(c: string): OKLCH {
  const {l, a, b} = colorToOklab(c);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return {l, c: Math.hypot(a, b), h: ((h % 360) + 360) % 360};
}

/**
    Converts an OKLCH color back to a hex string (gamut-clamped in sRGB).
    @param lch An OKLCH color.
*/
export function oklchToColor({l, c, h}: OKLCH): string {
  const rad = (h * Math.PI) / 180;
  return oklabToColor({l, a: c * Math.cos(rad), b: c * Math.sin(rad)});
}

/**
    The WCAG 2.x relative luminance of a color (0 = black, 1 = white).
    @param c A valid CSS color string.
*/
export function relativeLuminance(c: string): number {
  const [r, g, b] = linearRGB(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
    The WCAG 2.x contrast ratio between two colors, from 1:1 to 21:1.
    @param a A valid CSS color string.
    @param b A valid CSS color string.
*/
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}
