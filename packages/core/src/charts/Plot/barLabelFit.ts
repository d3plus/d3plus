/**
    Whether a Plot's in-bar category labels fit their bars. A BarChart whose
    bars are labeled with their own categories hides the category axis's
    tick labels; when the bars are too narrow for those labels, the axis
    keeps its ticks instead (and the bars drop theirs), so every category
    stays named. Decided during the axis measure, before the category axis
    is measured, by fitting each label the way its bar would: the same
    TextBox fitting, in the room the bar will have along the category axis
    and at least half the plot along the value axis.

    @module
*/
import {max} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import TextBox from "../../components/TextBox.js";
import {computeTextBoxDatum} from "../../components/textBoxLayout.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The label config keys that decide whether a label fits. */
const FIT_KEYS = [
  "ellipsis",
  "fontFamily",
  "fontMax",
  "fontMin",
  "fontResize",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "maxLines",
  "overflow",
  "padding",
  "split",
];

/** A formatted Plot row: its source `data`, index, and positions. */
type Row = Record<string, unknown>;

/** The category labels a Plot's bars carry in place of an axis's tick labels. */
export interface BarLabelCheck {
  /** The category axis. */
  axis: "x" | "y";
  /** Each bar's label text. */
  labels: string[];
  /** The rows the labels belong to. */
  rows: Row[];
}

/** The fields of the viz this module reads. */
interface FitViz {
  schema: {discrete?: string; stacked?: unknown; barPadding?: number};
  _groupPadding?: number;
}

/**
    The room each bar has for its label, in pixels: along the category axis,
    the axis length split evenly among its `categories` (less `groupPadding`),
    then among the `perCategory` bars sharing a category (less
    `barPadding`); along the value axis, half the plot, which a bar's label
    always has inside or beyond it.
    @param discrete The category axis.
    @param plot The plot area's size.
    @param categories How many categories the axis holds.
    @param perCategory How many bars share a category.
    @param padding `groupPadding` and `barPadding`.
*/
export function barLabelRoom(
  discrete: "x" | "y",
  plot: {width: number; height: number},
  categories: number,
  perCategory: number,
  padding: {group: number; bar: number},
): {width: number; height: number} {
  const along = discrete === "x" ? plot.width : plot.height;
  const across = (discrete === "x" ? plot.height : plot.width) / 2;
  let band = along / Math.max(1, categories);
  if (padding.group < band) band -= padding.group;
  if (perCategory > 1)
    band = (band - padding.bar * perCategory - 1) / perCategory;
  band = Math.max(0, band);
  return discrete === "x"
    ? {width: band, height: across}
    : {width: across, height: band};
}

/**
    A TextBox configured with the fitting keys of a bar `labelConfig`; each
    function value is read per row, against the row's source data.
*/
function fitBox(labelConfig: Record<string, unknown>, rows: Row[]): TextBox {
  const box = new TextBox();
  for (const key of FIT_KEYS) {
    const value = labelConfig[key];
    if (value === undefined) continue;
    if (key === "split" || typeof value !== "function") box[key](value);
    else {
      const fn = value as (d: unknown, i: unknown) => unknown;
      box[key]((_: DataPoint, i: number) => fn(rows[i].data, rows[i].i));
    }
  }
  return box;
}

/**
    Whether every label in `labels` (one per row in `rows`) fits, whole and
    untruncated, in a `room`-sized box laid out with the bar `labelConfig`.
    @param labels Each row's label text.
    @param rows The rows the labels belong to.
    @param room The box each label has (see `barLabelRoom`).
    @param labelConfig The bars' resolved `labelConfig`.
*/
export function barLabelsFit(
  labels: string[],
  rows: Row[],
  room: {width: number; height: number},
  labelConfig: Record<string, unknown>,
): boolean {
  if (!labels.length) return true;
  const box = fitBox(labelConfig, rows);
  return labels.every((text, i) => {
    const fitted = computeTextBoxDatum(
      box,
      {text, width: room.width, height: room.height},
      i,
    );
    return !!fitted && !fitted.truncated && fitted.lines.join("") !== "";
  });
}

/**
    Whether the bars of `rows` have room for their category `labels` in a
    plot of `plot` size (see `barLabelRoom` and `barLabelsFit`).
    @param viz The chart.
    @param rows The bar rows the labels belong to.
    @param labels Each row's label text.
    @param plot The plot area's size.
    @param labelConfig The bars' resolved `labelConfig`.
*/
export function barCategoryLabelsFit(
  viz: FitViz,
  rows: Row[],
  labels: string[],
  plot: {width: number; height: number},
  labelConfig: Record<string, unknown>,
): boolean {
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[discrete]);
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }
  const perCategory = viz.schema.stacked
    ? 1
    : (max(Array.from(byCategory.values())) ?? 1);
  const room = barLabelRoom(discrete, plot, byCategory.size, perCategory, {
    group: viz._groupPadding ?? 0,
    bar: viz.schema.barPadding ?? 0,
  });
  return barLabelsFit(labels, rows, room, labelConfig);
}

/**
    Whether a category axis keeps the tick labels its bars carry (see
    `BarLabelCheck`): when the bars, in a plot of `plot` size, have no room
    for those labels.
    @param viz The chart.
    @param check The bars' category labels.
    @param plot The plot area's size.
*/
export function barLabelsNeedAxis(
  viz: VizInstance,
  check: BarLabelCheck,
  plot: {width: number; height: number},
): boolean {
  const labelConfig = (shapeConfigFor(viz, "Bar").labelConfig || {}) as Record<
    string,
    unknown
  >;
  return !barCategoryLabelsFit(
    viz,
    check.rows,
    check.labels,
    plot,
    labelConfig,
  );
}
