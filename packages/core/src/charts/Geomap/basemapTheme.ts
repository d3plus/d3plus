/**
    Light/dark basemaps. `tileUrl` and `ocean` accept either one value or a
    `{light, dark}` pair; a pair resolves against the chart's theme each
    draw (see `theme`), and an `"auto"` chart redraws when its page flips.

    @module
*/

/** A value, or one per page theme. */
export type Themed<T> = T | {light: T; dark: T};

/** Esri's Canvas basemaps: muted, nearly label-free bases for data overlays. */
export const DEFAULT_TILE_URL: Themed<string> = {
  light:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};

/** The Canvas basemaps' own water colors, so the ocean around the tiles matches. */
export const DEFAULT_OCEAN: Themed<string> = {
  light: "#d0cfd4",
  dark: "#222327",
};

const isPair = <T>(value: Themed<T>): value is {light: T; dark: T} =>
  typeof value === "object" &&
  value !== null &&
  "light" in value &&
  "dark" in value;

/** Picks a themed value's light or dark side. */
export function resolveThemed<T>(value: Themed<T>, dark: boolean): T {
  return isPair(value) ? (dark ? value.dark : value.light) : value;
}
