import {color} from "d3-color";
import defaults, {ColorDefaults} from "./defaults.js";

/**
    Assigns a color to a value using a predefined set of defaults.
    @param c A valid CSS color string.
    @param u An object containing overrides of the default colors.
*/
export default function (
  c: string | boolean | null | undefined,
  u: Partial<ColorDefaults> = {},
): string {
  // If the value is null or undefined, set to grey.
  if ([null, undefined].indexOf(c as null) >= 0)
    return u["missing"] || defaults["missing"];
  // Else if the value is true, set to green.
  else if (c === true) return u["on"] || defaults["on"];
  // Else if the value is false, set to red.
  else if (c === false) return u["off"] || defaults["off"];
  else {
    const p = color(c as string);
    // If the value is not a valid color string, use the color scale.
    if (!p) return (u["scale"] || defaults["scale"])(c as string);
    return c as string;
  }
}
