import {colorToOklch, contrastRatio, linearRGB} from "./oklab.js";

/**
    Validates a categorical chart palette against the checks that can be
    computed from color alone — no eyeballing. Feed it any palette's colors
    plus the mode and surface and it measures:

      - **Lightness band** — OKLCH L within the mode's band.
      - **Chroma floor** — OKLCH C ≥ floor (below it a hue reads as gray and
        stops encoding identity).
      - **CVD separation** — Machado-2009 ΔE between slots under protanopia,
        deuteranopia, and tritanopia. Adjacent pairs by default (stacks, bars,
        lines — only neighbors touch); pass `pairs: "all"` for
        scatter/bubble/choropleth/small-multiples, where any two marks can sit
        side by side.
      - **Contrast vs surface** — WCAG ratio of each mark against the chart
        surface.

    For **ordinal** ramps (funnel stages, size tiers — ordered discrete marks)
    pass `ordinal: true` to switch to the ramp checks (monotone lightness,
    visible step gaps, a light end that still clears the surface, single hue)
    instead of the categorical ones — the categorical checks fail a correct
    ramp by design.
*/

/** OKLCH lightness band per surface mode. */
const BAND = {light: [0.43, 0.77], dark: [0.48, 0.67]} as const;
/** OKLCH chroma floor — below it a hue reads as gray. */
const CHROMA_FLOOR = 0.1;
/** CIE76 ΔE targets on CVD-simulated pairs. */
const CVD_TARGET = 12,
  CVD_FLOOR = 8;
/** WCAG contrast floor of a mark against its surface. */
const CONTRAST_MIN = 3;
const DEFAULT_SURFACE = {light: "#ffffff", dark: "#1a1a19"} as const;
/** Ordinal ramp: minimum OKLCH ΔL between adjacent steps. */
const ORDINAL_MIN_DL = 0.06;
/** Ordinal ramp: lightest step's minimum WCAG contrast vs surface. */
const ORDINAL_LIGHT_FLOOR = 2;

// Machado, Oliveira & Fernandes (2009) CVD transforms at severity 1.0 (linear RGB).
const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
} as const;

type CVDKind = keyof typeof MACHADO;

/** CIELAB (D65) from linear-light sRGB. */
function lin2lab([r, g, b]: [number, number, number]): [number, number, number] {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Simulates a color under a given color-vision deficiency, in linear RGB. */
function simulate(c: string, kind: CVDKind): [number, number, number] {
  const [r, g, b] = linearRGB(c);
  const M = MACHADO[kind];
  const clamp = (x: number): number => Math.max(0, Math.min(1, x));
  return [
    clamp(M[0][0] * r + M[0][1] * g + M[0][2] * b),
    clamp(M[1][0] * r + M[1][1] * g + M[1][2] * b),
    clamp(M[2][0] * r + M[2][1] * g + M[2][2] * b),
  ];
}

/** CIE76 ΔE between two colors, optionally under a CVD simulation. */
function deltaE(a: string, b: string, kind?: CVDKind): number {
  const la = lin2lab(kind ? simulate(a, kind) : linearRGB(a));
  const lb = lin2lab(kind ? simulate(b, kind) : linearRGB(b));
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** The state of a single check. `warn` passes but obligates secondary encoding. */
export type CheckState = "pass" | "warn" | "fail";

/** One computed check in a palette validation report. */
export interface ColorCheck {
  name: string;
  state: CheckState;
  detail: string;
}

/** The result of validating a palette. `ok` is true when no check hard-fails. */
export interface ColorValidation {
  ok: boolean;
  checks: ColorCheck[];
}

/** Options for {@link colorValidate}. */
export interface ColorValidateOptions {
  /** Surface mode — sets the lightness band and default surface. */
  mode?: "light" | "dark";
  /** Chart surface color the marks are drawn on. */
  surface?: string;
  /** `adjacent` (bars/lines/stacks) or `all` (scatter/bubble/maps). */
  pairs?: "adjacent" | "all";
  /** Validate as an ordered one-hue ramp instead of a categorical palette. */
  ordinal?: boolean;
}

function validateCategorical(
  palette: string[],
  mode: "light" | "dark",
  surface: string,
  pairs: "adjacent" | "all",
): ColorValidation {
  const [lo, hi] = BAND[mode];
  const checks: ColorCheck[] = [];
  let ok = true;

  const offband = palette.filter(c => {
    const {l} = colorToOklch(c);
    return l < lo || l > hi;
  });
  if (offband.length) ok = false;
  checks.push({
    name: "Lightness band",
    state: offband.length ? "fail" : "pass",
    detail: offband.length
      ? `outside L ${lo}–${hi}: ${offband.join(", ")}`
      : `all ${palette.length} inside L ${lo}–${hi}`,
  });

  const lowChroma = palette.filter(c => colorToOklch(c).c < CHROMA_FLOOR);
  if (lowChroma.length) ok = false;
  checks.push({
    name: "Chroma floor",
    state: lowChroma.length ? "fail" : "pass",
    detail: lowChroma.length
      ? `reads gray (C < ${CHROMA_FLOOR}): ${lowChroma.join(", ")}`
      : `all ${palette.length} ≥ ${CHROMA_FLOOR}`,
  });

  const pairlist: [number, number][] =
    pairs === "all"
      ? palette.flatMap((_, i) =>
          palette.slice(i + 1).map((_2, k): [number, number] => [i, i + 1 + k]),
        )
      : palette.slice(1).map((_, i): [number, number] => [i, i + 1]);
  // Gate on protanopia + deuteranopia (the common, well-calibrated cases);
  // tritanopia is far rarer, so it's measured and reported but not failed on.
  let worst: {d: number; kind: CVDKind; a: string; b: string} | null = null;
  for (const kind of ["protan", "deutan"] as CVDKind[]) {
    for (const [i, j] of pairlist) {
      const d = deltaE(palette[i], palette[j], kind);
      if (!worst || d < worst.d)
        worst = {d, kind, a: palette[i], b: palette[j]};
    }
  }
  const tritan = pairlist.length
    ? Math.min(...pairlist.map(([i, j]) => deltaE(palette[i], palette[j], "tritan")))
    : 99;
  const wd = worst ? worst.d : 99;
  const cvdState: CheckState =
    wd >= CVD_TARGET ? "pass" : wd >= CVD_FLOOR ? "warn" : "fail";
  if (cvdState === "fail") ok = false;
  checks.push({
    name: "CVD separation",
    state: cvdState,
    detail: worst
      ? `worst ${pairs} pair ${worst.a}↔${worst.b} ΔE ${wd.toFixed(1)} (${worst.kind}) · tritan ${tritan.toFixed(1)}`
      : "n/a",
  });

  const lowContrast = palette.filter(c => contrastRatio(c, surface) < CONTRAST_MIN);
  checks.push({
    name: "Contrast vs surface",
    state: lowContrast.length ? "warn" : "pass",
    detail: lowContrast.length
      ? `below ${CONTRAST_MIN}:1 — needs direct labels or a table view: ${lowContrast.join(", ")}`
      : `all ${palette.length} ≥ ${CONTRAST_MIN}:1`,
  });

  return {ok, checks};
}

function validateOrdinal(
  palette: string[],
  mode: "light" | "dark",
  surface: string,
): ColorValidation {
  const checks: ColorCheck[] = [];
  let ok = true;
  const Ls = palette.map(c => colorToOklch(c).l);

  const order = [...Ls.keys()].sort((a, b) => Ls[a] - Ls[b]);
  const mono =
    order.every((v, i) => v === i) ||
    order.every((v, i) => v === Ls.length - 1 - i);
  if (!mono) ok = false;
  checks.push({
    name: "Lightness monotone",
    state: mono ? "pass" : "fail",
    detail: mono ? "steps read light→dark" : "lightness is not ordered",
  });

  const thin = Ls.slice(1)
    .map((l, i) => Math.abs(l - Ls[i]))
    .filter(g => g < ORDINAL_MIN_DL);
  if (thin.length) ok = false;
  checks.push({
    name: "Adjacent ΔL",
    state: thin.length ? "fail" : "pass",
    detail: thin.length
      ? `${thin.length} step gap(s) < ${ORDINAL_MIN_DL}`
      : `all gaps ≥ ${ORDINAL_MIN_DL}`,
  });

  const sorted = [...palette].sort((a, b) => colorToOklch(a).l - colorToOklch(b).l);
  const lightest = mode === "light" ? sorted[sorted.length - 1] : sorted[0];
  const cr = contrastRatio(lightest, surface);
  if (cr < ORDINAL_LIGHT_FLOOR) ok = false;
  checks.push({
    name: "Light-end contrast",
    state: cr >= ORDINAL_LIGHT_FLOOR ? "pass" : "fail",
    detail: `${lightest} at ${cr.toFixed(2)}:1 vs surface`,
  });

  const hues = palette.map(c => colorToOklch(c).h);
  let spread = hues.length ? Math.max(...hues) - Math.min(...hues) : 0;
  if (spread > 180) spread = 360 - spread;
  const oneHue = spread <= 40;
  if (!oneHue) ok = false;
  checks.push({
    name: "Single hue",
    state: oneHue ? "pass" : "fail",
    detail: `hue spread ${spread.toFixed(0)}°`,
  });

  return {ok, checks};
}

/**
    Validates a chart color palette against the computable accessibility checks.
    @param palette An array of CSS color strings, in slot order.
    @param options Mode, surface, pair scope, and ordinal toggle.
*/
export default function colorValidate(
  palette: string[],
  options: ColorValidateOptions = {},
): ColorValidation {
  const mode = options.mode || "light";
  const surface = options.surface || DEFAULT_SURFACE[mode];
  return options.ordinal
    ? validateOrdinal(palette, mode, surface)
    : validateCategorical(palette, mode, surface, options.pairs || "adjacent");
}
