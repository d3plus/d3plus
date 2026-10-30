/**
    SlopeChart — a LinePlot comparing each series between two periods.
*/

import {assign} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {warnConfigOnce} from "../../utils/configWarnings.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import LinePlot from "../LinePlot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  slopeColors,
  slopeDirections,
  slopePeriods,
  type SlopeColorSetting,
  type SlopeDirection,
} from "./slope.js";

/**
    The value axis config that hides its labels, ticks, gridlines, and line:
    each line's labels name its values.
*/
export const slopeValueAxis = {
  barConfig: {stroke: "transparent"},
  labels: [],
  ticks: [],
};

/** A row accessor. */
type RowFn = (d: Record<string, unknown>, i: number) => unknown;

/** What a SlopeChart remembers between its data prep and its paint. */
interface SlopeState {
  directions: Map<string, SlopeDirection>;
}

/** The chart's slope state, once its data has been prepared. */
const slopeState = (viz: VizInstance) =>
  viz.ctx.slope as SlopeState | undefined;

/** Formats a period for a warning. */
const periodText = (p: unknown): string =>
  p instanceof Date ? p.toISOString().slice(0, 10) : `${p}`;

/**
    Notes each series' direction, and warns when the data spans more than
    two periods (every period is still drawn).
*/
export function prepareSlope(viz: VizInstance): void {
  const rows = viz._filteredData as unknown as Record<string, unknown>[];
  const x = viz._x as unknown as RowFn;
  const periods = slopePeriods(rows.map((d, i) => x(d, i)));
  if (periods.length > 2)
    warnConfigOnce(
      viz,
      "slopePeriods",
      `SlopeChart compares two periods, but its data has ${periods.length} (${periods.map(periodText).join(", ")}). Every period is drawn; filter the data to two periods to compare them.`,
    );
  viz.ctx.slope = {
    directions: slopeDirections(rows, viz._id as RowFn, x, viz._y as RowFn),
  } satisfies SlopeState;
}

/**
    The color `slopeColor` gives a row's series, or `undefined` when it is
    off or the series has no direction yet.
*/
export function slopeFill(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string | undefined {
  const colors = slopeColors(
    viz.schema.slopeColor as SlopeColorSetting | undefined,
    Boolean(viz._theme?.dark),
    viz._theme?.textMuted,
  );
  if (!colors) return undefined;
  while (d.__d3plus__ && d.data) {
    d = d.data as DataPoint;
    i = d.i as number;
  }
  const direction = slopeState(viz)?.directions.get(`${viz._id(d, i)}`);
  return direction ? colors[direction] : undefined;
}

export const slopeChartDef: ChartDefinition = {
  name: "SlopeChart",
  paintDriven: true,

  setup: viz => {
    viz._lineMarkers = true;
    viz._yConfig = assign({}, viz._yConfig ?? {}, slopeValueAxis);
    // The hidden value axis takes no title from the `y` key.
    (viz as unknown as {_yTitle?: unknown})._yTitle = null;
    // Direction colors take over the fill every other color derives from.
    const fill = viz.schema.shapeConfig.fill;
    viz.schema.shapeConfig.fill = (d: DataPoint, i: number) =>
      slopeFill(viz, d, i) ?? (typeof fill === "function" ? fill(d, i) : fill);
    // Markers take their line's color.
    viz._lineMarkerConfig = assign({}, viz._lineMarkerConfig ?? {}, {
      fill: (d: DataPoint, i: number) => {
        const {shapeConfig} = viz.schema;
        const stroke = shapeConfig.Line?.stroke ?? shapeConfig.stroke;
        return typeof stroke === "function" ? stroke(d, i) : stroke;
      },
    });
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      preDraw();
      prepareSlope(viz);
    };
  },

  ctx: {},

  fields: [
    /** SlopeChart badges only the x axis on hover: the value axis names no values. */
    {key: "axisHover", default: "x"},
    /** SlopeChart has no legend by default: each line names its series at both ends. */
    {key: "legend", default: false, coerce: "const"},
    /** SlopeChart defaults to `"both"`. */
    {key: "lineLabels", default: "both"},
    /** SlopeChart defaults to `{value: true}`. */
    {key: "lineLabelConfig", merge: true, default: {value: true}},
    /**
        Colors each line by its direction between its first and last
        period. `true` draws rising lines green, falling lines red, and flat
        lines in the theme's muted text color, in shades that suit a light
        or dark theme; an object sets any of `up`, `down`, and `flat`
        itself. The legend and markers follow. Off by default.
    */
    {key: "slopeColor", default: false},
  ],
};

/**
    Creates a slope chart from an array of data: a LinePlot comparing each
    series between two periods, with a line from its first value to its
    second. Each line is labeled at both ends with its series name and value
    (`lineLabels: "both"` with `lineLabelConfig: {value: true}`), labels that
    would overlap are nudged apart on each side, and the value axis hides its
    labels, ticks, and gridlines, since the labels carry the values (tooltips
    still show them). The x axis shows the periods in the data; with more
    than two, every period is drawn and a warning suggests filtering to two.
    Markers sit at each end of every line. `slopeColor` colors each line by
    whether it rose, fell, or stayed flat. For ranks rather than values, use
    a two-period BumpChart, which labels its rank axes with the series names.
*/
export default makeChart(slopeChartDef, LinePlot);
