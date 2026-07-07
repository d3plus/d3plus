import defaults, {ColorDefaults} from "./defaults.js";
import {contrastRatio} from "./oklab.js";

/**
    Based on the color provided, this function will return a "white" or "black" color that is suitable for text placed on top of that provided color. The choice maximizes the WCAG 2.x contrast ratio against the background, so the more legible of the two text tokens always wins.
    @param c A valid CSS color string.
    @param u An object containing overrides of the default colors.
*/
export default function (c: string, u: Partial<ColorDefaults> = {}): string {
  const dark = u["dark"] || defaults["dark"];
  const light = u["light"] || defaults["light"];
  return contrastRatio(c, dark) >= contrastRatio(c, light) ? dark : light;
}
