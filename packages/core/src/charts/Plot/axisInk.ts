import {assign} from "@d3plus/dom";

import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    Layers the chart's background ink (the color its title, subtitle, and
    legend labels use) under an axis config. Plot draws its axes without a
    DOM node of their own, so they can't read the page background themselves.
    @private
*/
export function withAxisInk(
  viz: VizInstance,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const ink = () => backgroundInk(viz);
  return assign(
    {
      barConfig: {stroke: ink},
      baselineBreakConfig: {stroke: ink},
      breakConfig: {stroke: ink},
      shapeConfig: {fill: ink, labelConfig: {fontColor: ink}, stroke: ink},
      titleConfig: {fontColor: ink},
    },
    config,
  );
}
