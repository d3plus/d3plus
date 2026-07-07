import {scaleOrdinal} from "d3-scale";

import {colorDefaults, colorRamp} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "./vizTypes.js";

/**
    Stamps `viz._ordinalColorScale` for ordinal color mode.

    When `colorOrdinal` is on (and no continuous `colorScale` is set), a discrete
    color field is treated as *ordered*: its distinct values take a single-hue
    light→dark ramp so the color encodes the order. This walks the drawn data to
    collect the distinct values in a stable order — numeric values sort
    ascending; everything else keeps the order it first appears in the data
    (pre-sort your data, or drive it with the existing ordering config, to
    control non-numeric ramps) — then maps them onto an OKLab ramp of the
    default sequential hue. Clears the scale when the mode is off.
*/
export function configureOrdinalColor(viz: VizInstance): void {
  if (!viz.schema.colorOrdinal || viz.schema.colorScale) {
    viz._ordinalColorScale = undefined;
    return;
  }

  const data = (viz._filteredData ?? []) as DataPoint[];
  const color = viz.schema.color as (d: DataPoint, i: number) => unknown;

  const seen = new Set<string>();
  const values: unknown[] = [];
  data.forEach((d, i) => {
    const v = color(d, i);
    const key = typeof v === "string" ? v : JSON.stringify(v);
    if (!seen.has(key)) {
      seen.add(key);
      values.push(v);
    }
  });

  const ordered = values.every(v => typeof v === "number")
    ? [...values].sort((a, b) => (a as number) - (b as number))
    : values;
  const keys = ordered.map(v => (typeof v === "string" ? v : JSON.stringify(v)));

  const range = colorRamp(colorDefaults.sequential, keys.length || 1, {ordinal: true});
  viz._ordinalColorScale = scaleOrdinal<string, string>().domain(keys).range(range);
}
