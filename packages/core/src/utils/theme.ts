import {lab, rgb} from "d3-color";

import {
  colorContrast,
  colorDefaults,
  colorGray,
  colorRamp,
  colorRampDark,
} from "@d3plus/color";
import type {ColorDefaults} from "@d3plus/color";

/** The tooltip's colors. */
export interface ThemeTooltipTokens {
  /** Tooltip fill. */
  background: string;
  /** Tooltip text. */
  text: string;
  /** Tooltip border color (drawn 1px solid). */
  border: string;
  /** The tooltip's CSS `box-shadow`. */
  shadow: string;
  /** The line between tooltip table rows. */
  divider: string;
}

/** The colors of the small panels drawn over the chart: the minimap, the search match count, and the attribution. */
export interface ThemeOverlayTokens {
  /** Panel fill (usually translucent). */
  background: string;
  /** Panel text. */
  text: string;
  /** Panel border. */
  border: string;
}

/** The table view's colors. */
export interface ThemeTableTokens {
  /** Table fill. */
  background: string;
  /** Cell text. */
  text: string;
  /** The sticky header row's fill. */
  header: string;
  /** The line under the header row. */
  border: string;
  /** The line between rows and above the pagination. */
  rule: string;
}

/**
    The colors a chart's color scale (`colorScale`) and ordinal ramps
    (`colorOrdinal`) take when `colorScaleConfig` doesn't set them. On a dark
    theme every ramp runs from a dim tint near the background up to its bright
    pole, so low values recede and high values stand out.
*/
export interface ThemeColorScaleTokens {
  /** The high end of single-hue ramps and the positive pole of diverging scales (`colorMax`). Defaults to the theme's `sequential`. */
  max: string;
  /** The midpoint of diverging scales (`colorMid`). Defaults to the theme's `neutral`. */
  mid: string;
  /** The negative pole of diverging scales, and the hue of all-negative ramps (`colorMin`). Defaults to the theme's `off`. */
  min: string;
  /**
      The fill of marks without a value: Geomap regions and Calendar days.
      Unset in both presets, where each chart derives a quiet neutral from
      the background.
  */
  missing?: string;
}

/** Every color a chart theme sets. */
export interface ThemeTokens {
  /** The chart's background, painted behind it when the theme is forced. */
  background: string;
  /** Chrome text: the title, subtitle, total, legend and timeline labels. */
  text: string;
  /** Secondary text and guides: the table view's empty state, the crosshair and axis hover marks. */
  textMuted: string;
  /** Axis lines, ticks, and tick labels. */
  axis: string;
  /** Gridlines. */
  gridline: string;
  /** The timeline's selection and handle. */
  accent: string;
  /** The color of a legend item hidden by a click (`hiddenColor`). */
  hidden: string;
  /**
      Link strokes between nodes: Network, Rings, and Sankey (whose wide bands
      take a dimmer gray in the dark preset unless this is set). Also the
      fill of Alluvial's nodes outside its `colorBy` column.
  */
  link: string;
  /**
      Good news: the green of a traffic light (`colorDefaults.on`), for
      Waterfall increases, Dumbbell gains, KPI deltas, `true` color values,
      and the top band of threshold `valueColors`.
  */
  on: string;
  /** The amber between `off` and `on` (`colorDefaults.caution`): the middle bands of threshold `valueColors`. */
  caution: string;
  /** Bad news: the red of a traffic light (`colorDefaults.off`), the counterpart of `on`. Also the color scale's `min`, unless that is set. */
  off: string;
  /**
      The single hue magnitudes ramp toward (`colorDefaults.sequential`):
      Waterfall totals, Dumbbell bars, KPI tiles, `colorOrdinal` ramps, and
      the color scale's `max`, unless that is set.
  */
  sequential: string;
  /**
      The neutral fill (`colorDefaults.neutral`): the color scale's `mid`
      unless that is set, the tooltip's background on the light preset, and
      the timeline's handles. Not text: text that contrasts with a fill picks between
      `colorDefaults.dark` and `colorDefaults.light`, untouched by the theme.
  */
  neutral: string;
  colorScale: ThemeColorScaleTokens;
  tooltip: ThemeTooltipTokens;
  overlay: ThemeOverlayTokens;
  table: ThemeTableTokens;
}

/**
    A custom theme: any subset of the tokens, on top of the light or dark
    preset named by `base`. Without a `base`, a custom `background` that reads
    as dark selects the dark preset.
*/
export interface ThemeConfig extends Partial<
  Omit<ThemeTokens, "colorScale" | "tooltip" | "overlay" | "table">
> {
  base?: "light" | "dark";
  colorScale?: Partial<ThemeColorScaleTokens>;
  tooltip?: Partial<ThemeTooltipTokens>;
  overlay?: Partial<ThemeOverlayTokens>;
  table?: Partial<ThemeTableTokens>;
}

/** The `theme` config value. */
export type ThemeSetting = "auto" | "light" | "dark" | ThemeConfig;

/** A theme resolved for one draw. */
export interface ResolvedTheme extends ThemeTokens {
  /** Whether the theme is dark. */
  dark: boolean;
  /** Whether the chart paints `background` behind itself (every theme but `"auto"`). */
  painted: boolean;
}

/**
    A theme's `colorScale` tokens: its `min`, `mid`, and `max` are its
    `off`, `neutral`, and `sequential` unless set, so changing those
    recolors the scale.
    @param scale The colorScale tokens set.
    @param poles The theme's `off`, `neutral`, and `sequential`.
*/
function scaleTokens(
  scale: Partial<ThemeColorScaleTokens>,
  poles: {off: string; neutral: string; sequential: string},
): ThemeColorScaleTokens {
  return Object.freeze({
    ...scale,
    max: scale.max ?? poles.sequential,
    mid: scale.mid ?? poles.neutral,
    min: scale.min ?? poles.off,
  });
}

/** A preset's `colorScale` tokens other than the ones it derives (see `scaleTokens`). */
function presetScale(preset: ThemeTokens): Partial<ThemeColorScaleTokens> {
  const rest: Partial<ThemeColorScaleTokens> = {...preset.colorScale};
  delete rest.min;
  delete rest.mid;
  delete rest.max;
  return rest;
}

/**
    The dark theme's traffic light and sequential hue, a step brighter than
    the light theme's so each keeps its contrast, and its neutral fill, a
    dark gray just above the background.
*/
const DARK_SIGNALS = {
  on: "#40c057", // green 600
  caution: "#f59f00", // yellow 700
  off: "#ff6b6b", // red 500
  sequential: "#4dabf7", // blue 400
  neutral: colorGray[800],
};

/** The light theme's tokens. */
export const themeLight: ThemeTokens = Object.freeze({
  background: "#ffffff",
  text: colorDefaults.dark,
  textMuted: "#767676",
  axis: colorDefaults.dark,
  gridline: colorGray[200],
  accent: "#228be6",
  hidden: "#aaa",
  link: colorGray[500],
  on: colorDefaults.on,
  caution: colorDefaults.caution,
  off: colorDefaults.off,
  sequential: colorDefaults.sequential,
  neutral: colorDefaults.neutral,
  colorScale: scaleTokens(
    {},
    {
      off: colorDefaults.off,
      neutral: colorDefaults.neutral,
      sequential: colorDefaults.sequential,
    },
  ),
  tooltip: Object.freeze({
    background: colorDefaults.neutral,
    text: colorDefaults.dark,
    border: "rgba(0, 0, 0, 0.25)",
    shadow: "0 1px 5px rgba(0, 0, 0, 0.25)",
    divider: "rgba(0, 0, 0, 0.1)",
  }),
  overlay: Object.freeze({
    background: "rgba(255, 255, 255, 0.75)",
    text: "rgba(0, 0, 0, 0.75)",
    border: "rgba(0, 0, 0, 0.25)",
  }),
  table: Object.freeze({
    background: "#fff",
    text: colorGray[900],
    header: "#fff",
    border: "#ccc",
    rule: "#e0e0e0",
  }),
});

/** The dark theme's tokens. */
export const themeDark: ThemeTokens = Object.freeze({
  background: colorGray[900],
  text: colorDefaults.light,
  textMuted: colorGray[500],
  axis: colorDefaults.light,
  gridline: colorGray[800],
  accent: "#4dabf7",
  hidden: colorGray[600],
  link: colorGray[700],
  // A step brighter than the light preset's, so each keeps its contrast.
  on: DARK_SIGNALS.on,
  caution: DARK_SIGNALS.caution,
  off: DARK_SIGNALS.off,
  sequential: DARK_SIGNALS.sequential,
  neutral: DARK_SIGNALS.neutral,
  colorScale: scaleTokens({}, DARK_SIGNALS),
  tooltip: Object.freeze({
    background: colorGray[800],
    text: colorDefaults.light,
    border: "rgba(255, 255, 255, 0.2)",
    shadow: "0 1px 5px rgba(0, 0, 0, 0.6)",
    divider: "rgba(255, 255, 255, 0.15)",
  }),
  overlay: Object.freeze({
    background: "rgba(24, 25, 28, 0.75)",
    text: "rgba(255, 255, 255, 0.85)",
    border: "rgba(255, 255, 255, 0.25)",
  }),
  table: Object.freeze({
    background: colorGray[900],
    text: colorDefaults.light,
    header: colorGray[900],
    border: colorGray[700],
    rule: colorGray[800],
  }),
});

/** What the page behind an `"auto"` chart looks like. */
export interface PageTheme {
  /** Whether the page reads as dark. */
  dark: boolean;
  /** The first opaque background behind the chart, when there is one. */
  background?: string;
}

/** Whether a CSS color reads as dark (CIELAB lightness under 50). */
export function isDarkColor(value: string): boolean {
  const l = lab(value).l;
  return Number.isFinite(l) && l < 50;
}

/**
    A CSS color at a given opacity, ignoring its own (`withOpacity("rgba(0, 0,
    0, 0.75)", 0.15)` is `rgba(0, 0, 0, 0.15)`).
*/
export function withOpacity(value: string, opacity: number): string {
  const c = rgb(value);
  c.opacity = opacity;
  return c.formatRgb();
}

/** Whether a value is a custom theme object. */
const isThemeConfig = (value: unknown): value is ThemeConfig =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
    Resolves a `theme` setting into the tokens one draw uses. `"auto"` (and
    anything unrecognized) follows the page: the preset matching its dark
    state, with the page's own background and text that contrasts with it
    (picked from `ink`, the chart's `colorDefaults`). Every other setting
    paints its background, and a custom object layers its tokens over the
    preset its `base` names.
    @param setting The chart's `theme`.
    @param page The page behind the chart.
    @param ink The dark and light text colors auto mode picks between.
*/
export function resolveTheme(
  setting: ThemeSetting | undefined,
  page: PageTheme = {dark: false},
  ink: Partial<Pick<ColorDefaults, "dark" | "light">> = {},
): ResolvedTheme {
  if (setting === "light" || setting === "dark" || isThemeConfig(setting)) {
    const custom: ThemeConfig = isThemeConfig(setting) ? setting : {};
    const dark =
      setting === "dark" ||
      custom.base === "dark" ||
      (!custom.base &&
        typeof custom.background === "string" &&
        isDarkColor(custom.background));
    const preset = dark ? themeDark : themeLight;
    const {colorScale, tooltip, overlay, table, ...flat} = custom;
    delete flat.base;
    return Object.freeze({
      ...preset,
      ...flat,
      colorScale: scaleTokens(
        {...presetScale(preset), ...colorScale},
        {
          off: flat.off ?? preset.off,
          neutral: flat.neutral ?? preset.neutral,
          sequential: flat.sequential ?? preset.sequential,
        },
      ),
      tooltip: {...preset.tooltip, ...tooltip},
      overlay: {...preset.overlay, ...overlay},
      table: {...preset.table, ...table},
      dark,
      painted: true,
    });
  }
  const preset = page.dark ? themeDark : themeLight;
  const background = page.background ?? preset.background;
  const darkInk = ink.dark || colorDefaults.dark;
  const text = colorContrast(background, ink);
  return Object.freeze({
    ...preset,
    background,
    text,
    axis: text,
    gridline: text === darkInk ? colorGray[200] : colorGray[800],
    dark: page.dark,
    painted: false,
  });
}

/**
    A token for a color the chart has its own default for: that default while
    the token matches the light preset, and the token once a dark or custom
    theme changes it. Keeps every light chart looking as it does unthemed.
    @param theme The resolved theme, when the chart has drawn.
    @param pick Reads the token from a token set.
    @param fallback The chart's own default.
*/
export function themed<T>(
  theme: ResolvedTheme | undefined,
  pick: (tokens: ThemeTokens) => T,
  fallback: T,
): T {
  if (!theme) return fallback;
  const value = pick(theme);
  return value === pick(themeLight) ? fallback : value;
}

/**
    The colors that a chart's `colorDefaults` and its theme both set: the
    traffic light, the sequential hue, and the neutral fill. (`dark` and
    `light`, the text colors, are not themed.)
*/
export const SIGNAL_KEYS = [
  "off",
  "caution",
  "on",
  "sequential",
  "neutral",
] as const;

/** One of the colors a chart's `colorDefaults` and its theme both set. */
export type SignalKey = (typeof SIGNAL_KEYS)[number];

/** A chart (or component) whose `off`, `caution`, `on`, `sequential`, and `neutral` follow its theme. */
export interface SignalHost {
  schema: {colorDefaults?: Partial<ColorDefaults>};
  _theme?: ResolvedTheme;
  /** The `colorDefaults` the chart was given, by key (see `BaseClass.colorDefaults`). */
  _ownColorDefaults?: Partial<ColorDefaults>;
}

/**
    A color that a chart's `colorDefaults` and its theme both set (`off`,
    `caution`, `on`, `sequential`, or `neutral`): the chart's own `colorDefaults` entry
    when it was given one, else its theme's token, else the built-in
    `colorDefaults`.
    @param host The chart.
    @param key Which color.
*/
export function signalColor(host: SignalHost, key: SignalKey): string {
  return (
    host._ownColorDefaults?.[key] ??
    host._theme?.[key] ??
    host.schema.colorDefaults?.[key] ??
    colorDefaults[key]
  );
}

/** The last themed copy of each `colorDefaults` object, with the theme it followed. */
const themedCopies = new WeakMap<
  object,
  {theme: ResolvedTheme | undefined; out: object}
>();

/**
    `defaults` with its `off`, `caution`, `on`, `sequential`, and `neutral`
    following the chart's theme (see `signalColor`), or `defaults` itself
    when none of them change. Its `dark` and `light` text colors are left
    as they are.
    @param host The chart.
    @param defaults The color defaults to theme (the chart's, by default).
*/
export function themedColorDefaults<T extends Partial<ColorDefaults>>(
  host: SignalHost,
  defaults: T = (host.schema.colorDefaults ?? colorDefaults) as T,
): T {
  const cached = themedCopies.get(defaults);
  if (cached && cached.theme === host._theme) return cached.out as T;
  let out = defaults;
  for (const key of SIGNAL_KEYS) {
    const c = signalColor(host, key);
    if (c !== defaults[key]) {
      if (out === defaults) out = {...defaults};
      out[key] = c as T[typeof key];
    }
  }
  themedCopies.set(defaults, {theme: host._theme, out});
  return out;
}

/**
    A color scale's low (`min`), middle (`mid`), or high (`max`) color: the
    chart's own `colorDefaults.off`, `neutral`, or `sequential` when it was
    given one, else the theme's `colorScale.min`, `mid`, or `max` (its `off`,
    `neutral`, or `sequential` unless the theme sets that one itself), else the
    built-in `colorDefaults`. `colorScaleConfig.colorMin`, `colorMid`, and
    `colorMax` win over all of these.
    @param host The chart or ColorScale.
    @param pole Which pole.
*/
export function scalePole(
  host: SignalHost,
  pole: "min" | "mid" | "max",
): string {
  const key =
    pole === "min" ? "off" : pole === "mid" ? "neutral" : "sequential";
  return (
    host._ownColorDefaults?.[key] ??
    host._theme?.colorScale[pole] ??
    host.schema.colorDefaults?.[key] ??
    colorDefaults[key]
  );
}

/**
    An `n`-step single-hue ramp toward `base` that reads on the theme's
    background, ordered low→high: pale→dark (`colorRamp`) on a light theme,
    dim→bright (`colorRampDark`) on a dark one.
    @param theme The resolved theme, when the chart has drawn.
    @param base The ramp's high-value color.
    @param n How many steps to produce.
    @param ordinal Whether the steps are discrete marks (see `colorRamp`).
*/
export function themeRamp(
  theme: ResolvedTheme | undefined,
  base: string,
  n: number,
  ordinal = false,
): string[] {
  return theme?.dark
    ? colorRampDark(base, n, {background: theme.background, ordinal})
    : colorRamp(base, n, {ordinal});
}

/**
    Swaps each entry of a style object that is still at its built-in default
    for its themed value, so a user's own entries win.
    @param style The configured style.
    @param defaults The built-in default style.
    @param overrides The themed values, by key (an `undefined` value is skipped).
*/
export function themeStyle<T extends Record<string, unknown>>(
  style: T,
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = {...style};
  for (const key of Object.keys(overrides))
    if (overrides[key] !== undefined && out[key] === defaults[key])
      out[key] = overrides[key];
  return out as T;
}
