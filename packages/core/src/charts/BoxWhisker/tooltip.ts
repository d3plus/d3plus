/**
    BoxWhisker's tooltip rows: a box lists its whisker ends, quartiles, and
    median, largest first. A precomputed box reads them from its summary row;
    a box computed from observations recomputes them in data units from the
    observations it drew.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {boxStats, whiskerPair} from "../../shapes/boxStats.js";
import type {WhiskerMode} from "../../shapes/boxStats.js";
import {hasBoxStats, readBoxSummary} from "../../shapes/boxSummary.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Each drawn box record, by the source row its tooltip receives. */
const drawnBoxes = new WeakMap<object, DataPoint>();

/** A datum's source row and its index, through Plot's and Box's wrappers. */
export function sourceRow(d: DataPoint, i: number): [DataPoint, number] {
  while (d.__d3plus__ && d.data) {
    i = d.i as number;
    d = d.data as DataPoint;
  }
  return [d, i];
}

/**
    Notes the box record behind each Box part in `nodes`, keyed by the source
    row a tooltip on that box receives, and returns `nodes`.
*/
export function noteDrawnBoxes(nodes: SceneNode[]): SceneNode[] {
  const walk = (list: SceneNode[]) => {
    for (const node of list) {
      if (node.type === "group") walk(node.children);
      for (const owner of node.owners || [])
        if (owner.shapeType === "Box" && owner.datum)
          drawnBoxes.set(sourceRow(owner.datum, owner.index)[0], owner.datum);
    }
  };
  walk(nodes);
  return nodes;
}

/** The `whiskerMode` BoxWhisker's boxes draw with. */
export function chartWhiskerMode(viz: VizInstance): WhiskerMode {
  const config = (viz.schema.shapeConfig || {}) as Record<string, unknown>;
  const box = (config.Box || {}) as Record<string, unknown>;
  const mode = box.whiskerMode ?? config.whiskerMode;
  return mode === undefined ? ["tukey", "tukey"] : whiskerPair(mode);
}

/** One table row per statistic, largest first. */
type Rows = [string, string][];

/**
    A drawn box's statistics in data units, from the observations it
    summarizes; null when `row` isn't a drawn box.
*/
export function drawnBoxStats(viz: VizInstance, row: DataPoint) {
  const box = drawnBoxes.get(row);
  if (!box) return null;
  const vertical = box.orient === "vertical";
  const values = (box.values as unknown as Record<string, unknown>[])
    .map(d => {
      const v = vertical ? (d.y2 ?? d.y) : (d.x2 ?? d.x);
      return typeof v === "number" || v instanceof Date ? +v : NaN;
    })
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return values.length ? boxStats(values, chartWhiskerMode(viz)) : null;
}

/**
    The tooltip rows of a box. A precomputed box lists its given statistics.
    A computed box lists its whisker ends as Maximum and Minimum when its
    `whiskerMode` reaches the extreme values (`"extent"`), and as Upper and
    Lower Whisker otherwise, since a Tukey or quantile whisker can stop short
    of (or past) the data's extremes. Anything else, such as an outlier,
    lists nothing.
*/
export function boxTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): Rows {
  if (!d) return [];
  const fmt = (n: number | undefined) =>
    n === undefined ? "" : formatAbbreviate(n, viz.schema.locale);
  const t = (str: string) => viz.schema.translate(str) as string;
  const [row, index] = sourceRow(d, i);
  if (hasBoxStats(viz.schema)) {
    const s = readBoxSummary(viz.schema, row, index);
    if (!s) return [];
    return [
      [t("Maximum"), fmt(s.max)],
      [t("Upper Quartile"), fmt(s.q3)],
      [t("Median"), fmt(s.median)],
      [t("Lower Quartile"), fmt(s.q1)],
      [t("Minimum"), fmt(s.min)],
    ];
  }
  const s = drawnBoxStats(viz, row);
  if (!s) return [];
  const mode = chartWhiskerMode(viz);
  const rows: [string, number | undefined][] = [
    [mode[1] === "extent" ? "Maximum" : "Upper Whisker", s.upperLimit],
    ["Upper Quartile", s.third],
    ["Median", s.median],
    ["Lower Quartile", s.first],
    [mode[0] === "extent" ? "Minimum" : "Lower Whisker", s.lowerLimit],
  ];
  return rows
    .filter(([, v]) => v !== undefined)
    .map(([label, v]) => [t(label), fmt(v)]);
}
