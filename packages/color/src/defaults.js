import {scaleOrdinal} from "d3-scale";
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

/**
    @namespace {Object} colorDefaults
    @desc A set of default color values used when assigning colors based on data.
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
