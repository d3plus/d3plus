/**
    The rows a chart's `colorScale` adds to its shape tooltips: the row's
    colorScale value, named and formatted as the colorScale shows it (two
    rows for a bivariate colorScale, one per variable).
*/
import type {DataPoint} from "@d3plus/data";

import {colorScaleValueFormat} from "../../components/ColorScale/bivariateRender.js";
import {isSetEntry} from "../../fluent.js";
import {fieldNameOf} from "../../utils/fieldAccessor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  addTooltipRows,
  hasTooltipRows,
  type TbodyHost,
  TOOLTIP_ROW_RANK,
} from "./tooltipRows.js";
import {
  bivariateSpec,
  bivariateTooltipRows,
  toNumber,
} from "./colorScaleBivariate.js";

/**
    The name a tooltip gives a single-variable colorScale's value: the
    colorScale's `axisConfig.title`, else the field it reads, else the
    translated "Value".
    @param viz The chart.
*/
export function colorScaleValueLabel(viz: VizInstance): string {
  const title = viz._colorScaleClass?.schema.axisConfig?.title as unknown;
  if (typeof title === "string" && title) return title;
  return (
    fieldNameOf(viz.schema.colorScale) ??
    (viz.schema.translate("Value") as string)
  );
}

/**
    The tooltip rows a chart's `colorScale` adds for a row: its value, named
    (see `colorScaleValueLabel`) and formatted (see `colorScaleValueFormat`)
    as the colorScale shows it, or, for a bivariate colorScale, each
    variable's (see `bivariateTooltipRows`). None for a row without a value,
    a colorScale bucket or key cell, a chart without a colorScale, one
    whose tooltip already shows the value (`ChartDefinition.colorScaleTooltip`),
    or one whose `tooltipConfig.tbody` the user has set.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function colorScaleTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): [string, string][] {
  const cs = viz._colorScaleClass;
  const accessor = viz.schema.colorScale as unknown;
  if (viz._colorScaleTooltip === false || !cs) return [];
  // A `tbody` the user sets is the whole table.
  if (isSetEntry(viz, "tooltipConfig", "tbody")) return [];
  if (typeof accessor !== "function" || !d || typeof d !== "object") return [];
  if ((d as {_isColorScaleBucket?: boolean})._isColorScaleBucket) return [];
  if (bivariateSpec(viz)) return bivariateTooltipRows(viz, d, i);
  const value = toNumber(
    (accessor as (d: DataPoint, i: number) => unknown)(d, i),
  );
  if (value === null) return [];
  const read = cs.schema.value as (d: DataPoint, i: number) => unknown;
  const values = (cs._data ?? [])
    .map((row: DataPoint, k: number) => read(row, k))
    .filter((v: unknown): v is number => typeof v === "number");
  return [
    [colorScaleValueLabel(viz), colorScaleValueFormat(cs, values)(value)],
  ];
}

/**
    Leads `tooltip`'s `tbody` with the colorScale value rows (see
    `colorScaleTooltipRows`) of each row it renders, ahead of the chart's
    own rows. Does nothing until a hovered row has a value.
    @param tooltip The chart's tooltip.
    @param viz The chart.
    @param d The hovered row.
    @param i Its index.
*/
export function leadWithColorScaleRows<T extends TbodyHost>(
  tooltip: T,
  viz: VizInstance,
  d: DataPoint,
  i: number,
): T {
  if (
    !colorScaleTooltipRows(viz, d, i).length &&
    !hasTooltipRows(tooltip, "colorScale")
  )
    return tooltip;
  return addTooltipRows(
    tooltip,
    "colorScale",
    (dd, ii) => colorScaleTooltipRows(viz, dd, ii),
    TOOLTIP_ROW_RANK.colorScale,
  );
}
