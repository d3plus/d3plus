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
}

/**
 * A set of default color values used when assigning colors based on data.
 *
 * @defaultValue
 * ```
 * {
 *   dark: "#495057",
 *   light: "#f8f9fa",
 *   missing: "#ced4da",
 *   off: "#c92a2a",
 *   on: "#2b8a3e",
 *   scale: d3.scaleOrdinal().range([
 *     "#364fc7", "#fab005", "#c92a2a",
 *     "#2b8a3e", "#fd7e14", "#862e9c",
 *     "#15aabf", "#e64980", "#82c91e",
 *     "#74c0fc", "#faa2c1", "#c0eb75",
 *     "#b197fc", "#c5f6fa", "#ffe8cc",
 *     "#d3f9d8", "#f3d9fa", "#ffe3e3"
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
  scale: scaleOrdinal<string>().range([
    openColor.colors.indigo[900],
    openColor.colors.yellow[600],
    openColor.colors.red[900],
    openColor.colors.green[900],
    openColor.colors.orange[600],
    openColor.colors.grape[900],
    openColor.colors.cyan[600],
    openColor.colors.pink[600],
    openColor.colors.lime[600],
    openColor.colors.blue[300],
    openColor.colors.pink[300],
    openColor.colors.lime[300],
    openColor.colors.violet[300],
    openColor.colors.cyan[100],
    openColor.colors.orange[100],
    openColor.colors.green[100],
    openColor.colors.grape[100],
    openColor.colors.red[100],
  ]),
};

export default defaults;
