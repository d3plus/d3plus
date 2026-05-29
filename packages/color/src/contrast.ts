import defaults, {ColorDefaults} from "./defaults.js";
import {rgb} from "d3-color";

/**
    Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on top of that provided color.
    @param c A valid CSS color string.
    @param u An object containing overrides of the default colors.
*/
export default function (c: string, u: Partial<ColorDefaults> = {}): string {
  const rgbColor = rgb(c);
  const yiq: number =
    (rgbColor.r * 299 + rgbColor.g * 587 + rgbColor.b * 114) / 1000;
  return yiq >= 128
    ? u["dark"] || defaults["dark"]
    : u["light"] || defaults["light"];
}
