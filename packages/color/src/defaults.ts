import {ScaleOrdinal, scaleOrdinal} from "d3-scale";
import colorGray from "./gray.js";

export interface ColorDefaults {
  dark: string;
  light: string;
  missing: string;
  off: string;
  on: string;
  scale: ScaleOrdinal<string, string>;
  sequential: string;
}

/**
 * A set of default color values used when assigning colors based on data.
 *
 * The categorical `scale` is CVD-checked: its first eight slots (the identity
 * tier) are [open-color](https://yeun.github.io/open-color/) steps chosen to sit inside the OKLCH lightness band,
 * clear the chroma floor, and stay distinguishable under protanopia and
 * deuteranopia — validate them with `colorValidate`. The slot order is the
 * colorblind-safety mechanism and should not be reshuffled. Slots nine and up
 * are a lighter second ring of the same hues, for high-cardinality fallback
 * (past ~8 series, prefer grouping the tail into "Other").
 *
 * `sequential` is the default single-hue anchor for magnitude ramps (blue).
 *
 * @defaultValue
 * ```
 * {
 *   dark: "#495057",
 *   light: "#f8f9fa",
 *   missing: "#ced4da",
 *   off: "#c92a2a",
 *   on: "#2b8a3e",
 *   sequential: "#1c7ed6",
 *   scale: d3.scaleOrdinal().range([
 *     "#4c6ef5", "#e67700", "#e03131",
 *     "#2f9e44", "#d9480f", "#ae3ec9",
 *     "#1098ad", "#d6336c", "#748ffc",
 *     "#ffd43b", "#ff8787", "#69db7c",
 *     "#ffa94d", "#da77f2", "#3bc9db",
 *     "#f783ac"
 *   ])
 * }
 * ```
 */
const defaults: ColorDefaults = {
  dark: colorGray[700],
  light: colorGray[50],
  missing: colorGray[400],
  off: "#c92a2a", // red 900
  on: "#2b8a3e", // green 900
  sequential: "#1c7ed6", // blue 700
  scale: scaleOrdinal<string>().range([
    // identity tier — CVD-checked, fixed order (see colorValidate)
    "#4c6ef5", // indigo 600
    "#e67700", // yellow 900
    "#e03131", // red 800
    "#2f9e44", // green 800
    "#d9480f", // orange 900
    "#ae3ec9", // grape 700
    "#1098ad", // cyan 700
    "#d6336c", // pink 700
    // second ring — same hues, lighter, for high-cardinality fallback
    "#748ffc", // indigo 400
    "#ffd43b", // yellow 400
    "#ff8787", // red 400
    "#69db7c", // green 400
    "#ffa94d", // orange 400
    "#da77f2", // grape 400
    "#3bc9db", // cyan 400
    "#f783ac", // pink 400
  ]),
};

export default defaults;
