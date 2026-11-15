/**
    DotPlot's tooltip: a dot names its row (its label, else its value) and
    lists its value, its category row, and, with `unit`, its row's value and
    what one dot stands for.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import {valueKeyOf} from "../helpers/valueTitle.js";
import {axisName, axisValue} from "../Plot/sharedTooltip.js";
import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Row = (d: DataPoint) => DataPoint;
type AxisAccessor = (d: DataPoint, i: number) => unknown;

const positive = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/** Whether a row has a name: a groupBy id or a `label`. */
export function namedRow(viz: VizInstance, d: DataPoint, i: number): boolean {
  const groupBy = viz.schema.groupBy as AxisAccessor[];
  return (
    viz.schema.label !== undefined || groupBy.some(g => g(d, i) !== undefined)
  );
}

/** A row's formatted value on an axis. */
function axisText(
  viz: VizInstance,
  k: "x" | "y",
  d: DataPoint,
  i: number,
): string {
  const accessor = viz[`_${k}`] as AxisAccessor | undefined;
  return axisValue(viz, k, accessor?.(d, i));
}

/**
    A dot's tooltip title: its row's label, or its formatted value when the
    row has no name.
    @param viz The chart.
    @param row Unwraps a hovered datum to the row the dot came from.
*/
export function dotTooltipTitle(viz: VizInstance, row: Row) {
  return (d: DataPoint, i: number): string => {
    const source = row(d);
    if (namedRow(viz, source, i)) return `${viz._drawLabel(source, i)}`;
    return axisText(viz, viz._swarm?.axis ?? "x", source, i);
  };
}

/**
    A dot's tooltip rows: its value (unless the title shows it) and its
    category row, as `[axis title, value]`, unless a `discrete` axis's
    tooltip lists them already; then, with `unit`, its row's `value` and
    what one dot stands for ("Each Dot", translated).
    @param viz The chart.
    @param row Unwraps a hovered datum to the row the dot came from.
*/
export function dotTooltipRows(viz: VizInstance, row: Row) {
  return (d: DataPoint, i: number): [string, string][] => {
    const source = row(d);
    const rows: [string, string][] = [];
    const swarm = viz._swarm;
    const discrete = vizDiscrete(viz);
    if (swarm && discrete !== "x" && discrete !== "y") {
      if (namedRow(viz, source, i))
        rows.push([
          axisName(viz, swarm.axis),
          axisText(viz, swarm.axis, source, i),
        ]);
      if (swarm.lanes)
        rows.push([
          axisName(viz, swarm.cross),
          axisText(viz, swarm.cross, source, i),
        ]);
    }
    const unit = positive(viz.schema.unit);
    if (unit) {
      const t = viz.schema.translate;
      const fmt = (n: number) => formatAbbreviate(n, viz.schema.locale);
      const value = viz.schema.value as AxisAccessor;
      rows.push(
        [
          valueKeyOf(viz.schema.value) ?? t("Value"),
          fmt(Number(value(source, i))),
        ],
        [t("Each Dot"), fmt(unit)],
      );
    }
    return rows;
  };
}
