/**
    Default "Share" tooltip row for stacked Plot charts (StackedArea, stacked
    BarChart), reading the share that `computePlotInitialDomains` stamps on
    each stacked datum.
*/
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {shareOf} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    A `tooltipConfig` default whose `tbody` resolves per hover, so the Share
    row only appears while the chart is stacked.
*/
export function stackShareTooltipConfig(viz: VizInstance) {
  const row = [
    () => viz.schema.translate("Share"),
    (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
      // A legend swatch aggregates a series across every discrete position,
      // so its merged share is an array with no meaningful total.
      const share = shareOf(x) as number;
      if (!Number.isFinite(share)) return "";
      return `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
    },
  ];
  return {tbody: () => (viz.schema.stacked ? [row] : [])};
}
