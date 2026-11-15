/**
    Multi-level category labels (`levels`): an axis whose categories nest
    in outer groups (quarters in years) labels each category with its
    innermost level at its tick, and each outer group once, centered across
    the categories it spans, in a row of its own past the tick labels, with
    a divider between neighboring groups.
*/
import {extent, max} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {dateFormatter} from "@d3plus/format";

import TextBox from "../TextBox.js";
import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";

import type Axis from "./Axis.js";
import {isDiscreteScale} from "./axisLabelKinds.js";
import {
  axisTimeLocale,
  axisUtc,
  defaultTimeFormat,
  isValidDate,
} from "./timeValues.js";

/** Reads a category's labels, outermost level first (see `levels`). */
export type AxisLevels = (d: unknown) => unknown;

/** A run of neighboring categories sharing an outer level's label. */
export interface AxisLevelGroup {
  /** The label the run shares at its level. */
  value: unknown;
  /** The index of the run's first category in the axis's domain. */
  first: number;
  /** The index of the run's last category in the axis's domain. */
  last: number;
}

/** Writes a level's value as its label (see `levelFormat`). */
export type AxisLevelFormat = (value: unknown, level: number) => string;

/** An outer level's label, laid out across the categories it spans. */
export interface AxisLevelBox {
  id: string;
  text: string;
  /** The value it labels. */
  value: unknown;
  /** Its level, counted from the outermost (0). */
  level: number;
  /** The start of its span along the axis, in pixels. */
  lo: number;
  /** The end of its span along the axis, in pixels. */
  hi: number;
}

/** One row of outer level labels. */
export interface AxisLevelRow {
  boxes: AxisLevelBox[];
  /** How deep its labels are across the axis, without the padding after them. */
  text: number;
  /** The room the row takes across the axis, its padding included. */
  depth: number;
}

/** The outer level rows an axis draws, as its layout pass sets them. */
export interface AxisLevelLayout {
  rows: AxisLevelRow[];
  /** Where each divider sits along the axis, and the outermost row it reaches. */
  dividers: {at: number; row: number}[];
  /** The room every row takes together. */
  room: number;
  /** How far past the axis line the first row starts. */
  start: number;
}

/** A category's labels, outermost first: what `levels` reads, as a list. */
export function levelPath(levels: AxisLevels, d: unknown): unknown[] {
  const path = levels(d);
  return Array.isArray(path) ? path : [path];
}

/** The text a level label shows: its value as text, nothing for none. */
export const levelText = (value: unknown): string =>
  value === undefined || value === null ? "" : `${value}`;

/**
    The Dates a level holds across `domain`, in order and without repeats:
    what a Date at that level is labeled against.
    @param domain The axis's categories.
    @param levels Reads a category's labels, outermost first.
    @param level The level, counted from the outermost (0).
*/
export function levelDates(
  domain: unknown[],
  levels: AxisLevels,
  level: number,
): Date[] {
  const seen = new Set<number>();
  return domain
    .map(d => levelPath(levels, d)[level])
    .filter((v): v is Date => isValidDate(v) && !seen.has(+v) && !!seen.add(+v))
    .sort((a, b) => +a - +b);
}

/**
    How an axis writes a level's value by default: a Date as the axis's tick
    labels write dates, against the other Dates at its level, and any other
    value as text.
    @param axis The axis.
*/
export function defaultLevelFormat(axis: Axis): AxisLevelFormat {
  const levels = axis.schema.levels as AxisLevels | undefined;
  const utc = axisUtc(axis);
  const quarter = axisTimeLocale(axis).quarter;
  const formats = new Map<number, (d: Date) => string>();
  return (value, level) => {
    if (!isValidDate(value) || typeof levels !== "function")
      return levelText(value);
    let format = formats.get(level);
    if (!format) {
      // Read once the axis's scale holds its categories.
      const domain = (axis._d3Scale?.domain() ??
        axis.schema.domain ??
        []) as unknown[];
      const dates = levelDates(domain, levels, level);
      const label = dateFormatter(
        dates.length ? dates : [value],
        defaultTimeFormat(utc),
        {utc},
      );
      format = (d: Date) => label(d).replace(/^Q/g, quarter);
      formats.set(level, format);
    }
    return format(value);
  };
}

/**
    How an axis writes its outer level labels: `levelFormat` when set
    (called with the axis as `this`), else `defaultLevelFormat`.
    @param axis The axis.
*/
export function levelFormatter(axis: Axis): AxisLevelFormat {
  const user = axis.schema.levelFormat as
    ((this: Axis, value: unknown, level: number) => unknown) | undefined;
  return typeof user === "function"
    ? (value, level) => levelText(user.call(axis, value, level))
    : defaultLevelFormat(axis);
}

/** A key naming a category's labels up to and including `level`. */
const prefixKey = (path: unknown[], level: number): string =>
  path
    .slice(0, level + 1)
    .map(levelText)
    .join("\u001F");

/**
    The outer level rows of a multi-level category axis: for each level but
    the innermost, from the one nearest the axis outward, the runs of
    neighboring categories that share that level's label and every label
    outside it. A category with fewer levels than the deepest shares an
    empty label at the levels it lacks.
    @param domain The axis's categories, in order.
    @param levels Reads a category's labels, outermost first.
*/
export function levelGroups(
  domain: unknown[],
  levels: AxisLevels,
): AxisLevelGroup[][] {
  const paths = domain.map(d => levelPath(levels, d));
  const depth = max(paths, path => path.length) ?? 0;
  const rows: AxisLevelGroup[][] = [];
  for (let level = depth - 2; level >= 0; level--) {
    const row: AxisLevelGroup[] = [];
    let previous: string | undefined;
    paths.forEach((path, i) => {
      const key = prefixKey(path, level);
      if (row.length && key === previous) row[row.length - 1].last = i;
      else row.push({value: path[level], first: i, last: i});
      previous = key;
    });
    rows.push(row);
  }
  return rows;
}

/**
    The dividers between neighboring groups: keyed by the index of the
    first category after each, the outermost row (an index into `rows`)
    with a group starting there. A group of an outer row starts a group in
    every row inside it too, so its divider reaches out through all of them.
    @param rows The outer level rows (see `levelGroups`).
*/
export function levelDividers(rows: AxisLevelGroup[][]): Map<number, number> {
  const dividers = new Map<number, number>();
  rows.forEach((row, r) =>
    row.forEach(group => {
      if (group.first > 0) dividers.set(group.first, r);
    }),
  );
  return dividers;
}

/**
    The span along the axis a group's label centers in: from half a step
    before its first category to half a step after its last, kept within
    `range`.
    @param group The group.
    @param centers Each category's position along the axis.
    @param step The distance between neighboring categories.
    @param range The axis's range, lowest first.
*/
export function groupSpan(
  group: AxisLevelGroup,
  centers: number[],
  step: number,
  range: [number, number],
): [number, number] {
  const a = centers[group.first],
    b = centers[group.last];
  return [
    Math.max(range[0], Math.min(a, b) - step / 2),
    Math.min(range[1], Math.max(a, b) + step / 2),
  ];
}

/** Whether an axis labels outer levels: a category axis given `levels`. */
export function hasLevels(axis: Axis): boolean {
  return (
    typeof axis.schema.levels === "function" &&
    isDiscreteScale(axis.schema.scale)
  );
}

/**
    The innermost label of a category on an axis with `levels`, which its
    tick label shows; the category itself otherwise.
    @param axis The axis.
    @param d The category.
*/
export function innerLevel(axis: Axis, d: unknown): unknown {
  if (!hasLevels(axis)) return d;
  const path = levelPath(axis.schema.levels as AxisLevels, d);
  return path[path.length - 1];
}

/**
    The innermost level of a category on an axis with `levels`, and that
    level's index counted from the outermost.
    @param axis The axis, given `levels`.
    @param d The category.
*/
export function innerLevelOf(
  axis: Axis,
  d: unknown,
): {value: unknown; level: number} {
  const path = levelPath(axis.schema.levels as AxisLevels, d);
  return {value: path[path.length - 1], level: path.length - 1};
}

/** The tick label font settings the outer level labels start from. */
const FONT_KEYS = ["fontColor", "fontFamily", "fontSize", "fontWeight"];

/**
    Configures `box` to draw an axis's outer level labels: in its tick
    labels' font, centered across their spans, overridden by `levelConfig`.
    A horizontal axis's labels wrap to two lines at most.
*/
export function configureLevelBox(box: TextBox, axis: Axis): TextBox {
  const {orient, shapeConfig} = axis.schema;
  const labelConfig = (shapeConfig?.labelConfig ?? {}) as Record<
    string,
    unknown
  >;
  const font = Object.fromEntries(
    FONT_KEYS.filter(k => labelConfig[k] !== undefined).map(k => [
      k,
      labelConfig[k],
    ]),
  );
  const horizontal = orient === "top" || orient === "bottom";
  return box
    .config(font)
    .textAnchor("middle")
    .verticalAlign(
      orient === "bottom" ? "top" : orient === "top" ? "bottom" : "middle",
    )
    .maxLines(horizontal ? 2 : null)
    .config(
      configPrep.bind(axis as unknown as ConfigPrepHost)(
        axis.schema.levelConfig,
      ),
    );
}

/** A level label to measure or draw, as the level TextBox reads it. */
interface LevelDatum extends DataPoint {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Lays out `data` in the level TextBox and returns each box's lines. */
function measureBoxes(
  axis: Axis,
  data: LevelDatum[],
): {lines: string[]; widths: number[]; lH: number}[] {
  const box = configureLevelBox(new TextBox().renderMode("compute"), axis);
  const laid = box.data(data)._textData();
  const byIndex = new Map(laid.map(t => [t.i, t]));
  return data.map((_, i) => {
    const t = byIndex.get(i);
    return t
      ? {lines: t.lines, widths: t.widths, lH: t.lH}
      : {lines: [], widths: [], lH: 0};
  });
}

/** How far a vertical axis's outer level labels may reach across the chart. */
const COLUMN_SHARE = 0.2;

/** Measures one row of outer level labels. */
function measureRow(
  axis: Axis,
  boxes: AxisLevelBox[],
  horizontal: boolean,
): AxisLevelRow {
  const p = axis.schema.padding as number;
  if (horizontal) {
    const sizes = measureBoxes(
      axis,
      boxes.map((b, i) => ({
        id: b.id,
        text: b.text,
        i,
        x: 0,
        y: 0,
        width: Math.max(0, b.hi - b.lo - p),
        height: 1e4,
      })),
    );
    const text = Math.ceil(max(sizes, s => s.lines.length * s.lH) ?? 0);
    return {boxes, text, depth: text ? text + p : 0};
  }
  // A column as wide as its widest label, up to a share of the chart.
  const cap = Math.max(40, (axis.schema.width as number) * COLUMN_SHARE);
  const sizes = measureBoxes(
    axis,
    boxes.map((b, i) => ({
      id: b.id,
      text: b.text,
      i,
      x: 0,
      y: 0,
      width: cap,
      height: Math.max(0, b.hi - b.lo),
    })),
  );
  const text = Math.ceil(max(sizes, s => max(s.widths) ?? 0) ?? 0);
  return {boxes, text, depth: text ? text + p : 0};
}

/**
    Lays out an axis's outer level rows (see `levels`) across its current
    scale, or `undefined` when it draws none: an axis without `levels`, not
    of categories, labeling none of them, or whose categories have one
    level only.
    @param axis The axis, its scale built for this layout pass.
    @param labels The categories it labels.
    @param hBuff How far its ticks reach past the axis line.
*/
export function layoutAxisLevels(
  axis: Axis,
  labels: unknown[],
  hBuff: number,
): AxisLevelLayout | undefined {
  const scale = axis._d3Scale;
  if (!hasLevels(axis) || !scale || !labels.length) return undefined;
  const domain = scale.domain() as unknown[];
  const groups = levelGroups(domain, axis.schema.levels as AxisLevels);
  if (!groups.length) return undefined;
  const band = axis.schema.scale === "band" && scale.bandwidth;
  const centers = domain.map(
    d => axis._getPosition(d) + (band ? scale.bandwidth!() / 2 : 0),
  );
  const step = scale.step ? scale.step() : 0;
  const range = extent(scale.range() as number[]) as [number, number];
  const {horizontal} = axis._position;
  const format = levelFormatter(axis);
  const rows = groups.map((row, r) =>
    measureRow(
      axis,
      row.map((group, k) => {
        const [lo, hi] = groupSpan(group, centers, step, range);
        const level = groups.length - 1 - r;
        return {
          id: `level-${r}-${k}`,
          text: format(group.value, level),
          value: group.value,
          level,
          lo,
          hi,
        };
      }),
      horizontal,
    ),
  );
  const dividers = Array.from(levelDividers(groups), ([first, row]) => ({
    at: (centers[first - 1] + centers[first]) / 2,
    row,
  }));
  const room = rows.reduce((sum, row) => sum + row.depth, 0);
  // The rows start past the tick labels, once the axis has measured them.
  return {rows, dividers, room, start: hBuff};
}
