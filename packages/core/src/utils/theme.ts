import {lab, rgb} from "d3-color";

import {colorContrast, colorDefaults, colorGray} from "@d3plus/color";
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
      take a dimmer gray in the dark preset unless this is set).
  */
  link: string;
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
  Omit<ThemeTokens, "tooltip" | "overlay" | "table">
> {
  base?: "light" | "dark";
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
  tooltip: Object.freeze({
    background: colorDefaults.light,
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
    const {tooltip, overlay, table, ...flat} = custom;
    delete flat.base;
    return Object.freeze({
      ...preset,
      ...flat,
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
