import type {BaseType} from "d3-selection";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {colorContrast} from "@d3plus/color";
import type {ColorDefaults} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";

/**
    The default gridline color: a faint step off the chart's background, so
    gridlines recede equally on light and dark pages.
    @private
*/
export function gridStroke(
  node: BaseType | null | undefined,
  colorDefaults: ColorDefaults,
): string {
  const bg = node ? backgroundColor(node) : "rgb(255, 255, 255)";
  return colorContrast(bg, colorDefaults) === colorDefaults.dark
    ? openColor.colors.gray[200]
    : openColor.colors.gray[800];
}
