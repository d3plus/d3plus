import {ScaleOrdinal, scaleOrdinal} from "d3-scale";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

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
 * tier) are open-color steps chosen to sit inside the OKLCH lightness band,
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
  dark: openColor.colors.gray[700],
  light: openColor.colors.gray[50],
  missing: openColor.colors.gray[400],
  off: openColor.colors.red[900],
  on: openColor.colors.green[900],
  sequential: openColor.colors.blue[700],
  scale: scaleOrdinal<string>().range([
    // identity tier — CVD-checked, fixed order (see colorValidate)
    openColor.colors.indigo[600],
    openColor.colors.yellow[900],
    openColor.colors.red[800],
    openColor.colors.green[800],
    openColor.colors.orange[900],
    openColor.colors.grape[700],
    openColor.colors.cyan[700],
    openColor.colors.pink[700],
    // second ring — same hues, lighter, for high-cardinality fallback
    openColor.colors.indigo[400],
    openColor.colors.yellow[400],
    openColor.colors.red[400],
    openColor.colors.green[400],
    openColor.colors.orange[400],
    openColor.colors.grape[400],
    openColor.colors.cyan[400],
    openColor.colors.pink[400],
  ]),
};

export default defaults;
