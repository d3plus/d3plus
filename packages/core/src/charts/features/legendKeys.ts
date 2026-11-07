/**
    How the legend groups rows into entries: by the color each row encodes,
    its opacity and its texture.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/** The functions that read a row's legend paint and key. */
export interface LegendKeys {
  /** A paint attribute (`fill`, `opacity`, …) from the row's shapeConfig; a Line's fill is its stroke. */
  getAttr: (d: DataPoint, i: number, attr: string) => string;
  /** The row's color encoding input, or undefined without a color accessor. */
  colorOf: (d: DataPoint, i: number) => unknown;
  /** The row's entry key, given its color encoding. */
  keyOf: (d: DataPoint, i: number, c: unknown) => string;
}

/**
    The legend's key functions for a chart.
    @param viz The chart.
*/
export function legendKeys(viz: VizInstance): LegendKeys {
  const getAttr = (d: DataPoint, i: number, attr: string): string => {
    const shape = viz.schema.shape(d, i);
    if (attr === "fill" && shape === "Line") attr = "stroke";
    const value =
      viz.schema.shapeConfig[shape] && viz.schema.shapeConfig[shape][attr]
        ? viz.schema.shapeConfig[shape][attr]
        : viz.schema.shapeConfig[attr];
    return typeof value === "function" ? value.bind(viz)(d, i) : value;
  };

  // Legend grouping key: the color *encoding* input, so categories keep their
  // own entry even when two resolve to the same hex (#788), while
  // opacity/texture still split entries that differ on those secondary
  // encodings. Falls back to the resolved fill when there's no color accessor
  // to key on (e.g. `.color(false)` with a custom `shapeConfig.fill`).
  const colorOf = (d: DataPoint, i: number): unknown =>
    typeof viz.schema.color === "function" ? viz.schema.color(d, i) : undefined;
  const keyOf = (d: DataPoint, i: number, c: unknown): string => {
    const colorKey =
      c === undefined || c === null
        ? getAttr(d, i, "fill")
        : typeof c === "string"
          ? c
          : JSON.stringify(c);
    return [colorKey, getAttr(d, i, "opacity"), getAttr(d, i, "texture")].join(
      "_",
    );
  };
  return {getAttr, colorOf, keyOf};
}

/**
    The rows the legend rolls up: `_legendData`, less the rows a colorScale
    colors.
    @param viz The chart.
*/
export function legendRows(viz: VizInstance): DataPoint[] {
  const data: DataPoint[] = viz._legendData || [];
  return viz.schema.colorScale
    ? data.filter(
        (d: DataPoint, i: number) => viz.schema.colorScale(d, i) === undefined,
      )
    : data;
}

/**
    How many entries the legend has (the number `buildLegendData` rolls its
    rows into), counting no further than `limit + 1`: enough to tell whether
    there are more than `limit`.
    @param viz The chart.
    @param limit The count past which to stop.
*/
export function legendEntryCount(viz: VizInstance, limit = Infinity): number {
  const {colorOf, keyOf} = legendKeys(viz);
  const keys = new Set<string>();
  const data: DataPoint[] = viz._legendData || [];
  const scaled = Boolean(viz.schema.colorScale);
  let j = 0;
  for (let i = 0; i < data.length && keys.size <= limit; i++) {
    const d = data[i];
    if (scaled && viz.schema.colorScale(d, i) !== undefined) continue;
    keys.add(keyOf(d, j, colorOf(d, j)));
    j++;
  }
  return keys.size;
}
