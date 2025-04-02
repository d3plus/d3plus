import {scaleOrdinal} from "d3-scale";
import {theme as openColor} from "open-color/open-color.js";

/**
    @namespace {Object} colorDefaults
    @desc A set of default color values used when assigning colors based on data.
      *
      * | Name | Default | Description |
      * |---|---|---|
      * | dark | gray-7 | Used in the [contrast](#contrast) function when the color given is very light. |
      * | light | gray-0 | Used in the [contrast](#contrast) function when the color given is very dark. |
      * | missing | gray-4 | Used in the [assign](#assign) function when the value passed is `null` or `undefined`. |
      * | off | red-9 | Used in the [assign](#assign) function when the value passed is `false`. |
      * | on | green-9 | Used in the [assign](#assign) function when the value passed is `true`. |
      * | scale | [indigo-900, yellow-600, red-900, green-900, orange-600, grape-900, cyan-600, pink-600, lime-600, blue-300, pink-300, lime-300, violet-300, cyan-100, orange-100, green-100, grape-100, red-100] | An ordinal scale used in the [assign](#assign) function for non-valid color strings and numbers. |
*/
const defaults = {
  dark: openColor.colors.gray[700],
  light: openColor.colors.gray[50],
  missing: openColor.colors.gray[400],
  off: openColor.colors.red[900],
  on: openColor.colors.green[900],
  scale: scaleOrdinal().range([
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
  ])
};

/**
    Returns a color based on a key, whether it is present in a user supplied object or in the default object.
    @returns {String}
    @private
*/
export function getColor(k, u = {}) {
  return k in u ? u[k] : k in defaults ? defaults[k] : defaults.missing;
}

export default defaults;
