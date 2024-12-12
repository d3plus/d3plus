import {color} from "d3-color";
import {getColor} from "./defaults.js";

/**
    @function colorAssign
    @desc Assigns a color to a value using a predefined set of defaults.
    @param {String} c A valid CSS color string.
    @param {Object} [u = defaults] An object containing overrides of the default colors.
    @returns {String}
*/
export default function(c, u = {}) {

  // If the value is null or undefined, set to grey.
  if ([null, void 0].indexOf(c) >= 0) return getColor("missing", u);
  // Else if the value is true, set to green.
  else if (c === true) return getColor("on", u);
  // Else if the value is false, set to red.
  else if (c === false) return getColor("off", u);

  const p = color(c);
  // If the value is not a valid color string, use the color scale.
  if (!p) return getColor("scale", u)(c);

  return c.toString();

}
