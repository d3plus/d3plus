/**
    Default "Share" tooltip row for stacked Plot charts (StackedArea, stacked
    BarChart), reading the share that `computePlotInitialDomains` stamps on
    each stacked datum.
*/
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {shareOf, shareOfRows, unwrapRow} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    A `tooltipConfig` default whose `tbody` resolves per hover, so the Share
    row only appears while the chart is stacked.
*/
export function stackShareTooltipConfig(viz: VizInstance) {
  const row = [
    () => viz.schema.translate("Share"),
    (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
      const row = unwrapRow(x);
      let share = shareOf(row) as number;
      // A legend entry merges a series over every discrete position, so its
      // share is of the whole chart: of every legend row's stacked value.
      if (!Number.isFinite(share)) {
        const value = viz[`_${viz.schema.discrete === "y" ? "x" : "y"}`] as (
          d: Record<string, unknown>,
        ) => unknown;
        share = row ? shareOfRows(row, viz._legendData || [], value) : NaN;
      }
      if (!Number.isFinite(share)) return "";
      return `${formatAbbreviate(share * 100, viz.schema.locale)}%`;
    },
  ];
  return {tbody: () => (viz.schema.stacked ? [row] : [])};
}
