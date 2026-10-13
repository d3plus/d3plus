/**
    Waterfall — a stacked BarChart whose bars float: each change starts where
    the running total before it ended, and subtotal rows draw from the
    baseline (zero by default) to the running total. Bars are colored by whether they increase, decrease, or
    total, with thin connectors carrying each bar's end level to the next.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import BarChart from "../BarChart/index.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {waterfallBuffer} from "./buffer.js";
import {connectorBars, connectorNodes, connectorSegments} from "./connectors.js";
import {KIND_LABELS, kindColor, labelAlign, labelBox, stepLabel, tooltipRows} from "./labels.js";
import {
  categoryAxis,
  interceptAxes,
  KIND_KEY,
  kindOf,
  legendKind,
  resetSteps,
  sourceRow,
  stepOf,
  syncCategorySort,
  valueFormat,
  waterfallBaseline,
  type WaterfallState,
} from "./state.js";
import {WATERFALL_KINDS, waterfallKinds, waterfallStackOffset, type RowAccessor} from "./steps.js";

type Handler = (this: unknown, d: DataPoint, i: number, x?: unknown, event?: unknown) => void;

/** A kind's display name, translated. */
const kindText = (viz: VizInstance, d: DataPoint) => {
  const kind = kindOf(viz, d);
  return kind ? viz.schema.translate(KIND_LABELS[kind]) : undefined;
};

/** Whether bars stand upright (categories along x). */
const vertical = (viz: VizInstance) => categoryAxis(viz) === "x";

/** A bar's tooltip title: its series, or its kind when the bars have no series. */
function tooltipTitle(viz: VizInstance, d: DataPoint, i: number): string {
  const row = sourceRow(d)!;
  if (legendKind(row)) return kindText(viz, row) ?? "";
  const label = viz._drawLabel(row, i);
  return label === "undefined" ? kindText(viz, row) ?? label : label;
}

/** Bars: kind colors, value labels past each bar's end, and a plain-language aria label. */
function configureBars(viz: VizInstance): void {
  const baseFill = viz.schema.shapeConfig.fill as RowAccessor;
  viz.schema.shapeConfig.fill = (d: DataPoint, i: number) => {
    const kind = kindOf(viz, d);
    return kind ? kindColor(kind, viz.schema, viz.schema.colorDefaults) : baseFill(d, i);
  };
  const align = (d: DataPoint, key: "textAnchor" | "verticalAlign", fallback: string) => {
    const step = stepOf(viz, d);
    return step ? labelAlign(step, vertical(viz))[key] : fallback;
  };
  const bar = viz.schema.shapeConfig.Bar ?? {};
  viz.schema.shapeConfig.Bar = {
    ...bar,
    ariaLabel: (d: DataPoint, i: number) => {
      const step = stepOf(viz, d);
      if (!step) return viz._drawLabel(sourceRow(d)!, i);
      return `${step.category}, ${kindText(viz, d)}: ${stepLabel(step, valueFormat(viz))}.`;
    },
    label: (d: DataPoint) => {
      const step = stepOf(viz, d);
      return step ? stepLabel(step, valueFormat(viz)) : false;
    },
    labelBounds: (d: DataPoint, _i: number, s: {width: number; height: number}) => {
      const step = stepOf(viz, d);
      return step ? labelBox(step, s, vertical(viz)) : false;
    },
    labelConfig: {
      ...(bar.labelConfig ?? {}),
      fontColor: () => backgroundInk(viz),
      fontResize: false,
      fontSize: 12,
      fontStroke: "transparent",
      fontStrokeWidth: 0,
      padding: 0,
      textAnchor: (d: DataPoint) => align(d, "textAnchor", "middle"),
      verticalAlign: (d: DataPoint) => align(d, "verticalAlign", "middle"),
    },
  };
}

/** The legend: one entry per kind drawn, which highlights that kind's bars. */
function configureLegend(viz: VizInstance): void {
  const label = (d: DataPoint, i: number) => kindText(viz, d) ?? viz._drawLabel(d, i);
  const legendConfig = viz.schema.legendConfig;
  viz.schema.legendConfig = {
    ...legendConfig,
    label,
    shapeConfig: {...(legendConfig.shapeConfig ?? {}), ariaLabel: label},
  };
  viz.schema.legendSort = (a: DataPoint, b: DataPoint) =>
    WATERFALL_KINDS.indexOf(kindOf(viz, a)!) - WATERFALL_KINDS.indexOf(kindOf(viz, b)!);
  // Hiding a kind would rewrite every running total, so entries are a key only.
  delete viz.schema.on["click.legend"];
  const enter = viz.schema.on.mouseenter as Handler;
  viz.schema.on.mouseenter = function (this: unknown, d: DataPoint, i: number, x?: unknown, event?: unknown) {
    const kind = legendKind(d);
    if (!kind) return enter.call(this, d, i, x, event);
    if (viz.schema.shapeConfig.hoverOpacity === 1) return;
    viz.hover!((h: DataPoint) => kindOf(viz, h) === kind);
  };
}

export const waterfallDef: ChartDefinition = {
  name: "Waterfall",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],

  setup: viz => {
    viz.ctx.waterfall = {
      accessors: {x: viz._x as RowAccessor, y: viz._y as RowAccessor},
      steps: new WeakMap(),
      laidOut: new WeakSet(),
    } satisfies WaterfallState;
    interceptAxes(viz);
    viz._stackOffset = waterfallStackOffset(row => stepOf(viz, row), () => waterfallBaseline(viz));
    // Each series keeps its own running total, drawn side by side.
    viz._stackGroup = (d, i) => viz._ids(d, i).slice(0, viz._drawDepth + 1).join("_");
    // Each bar is alone in its stack, so a share would always be 100%.
    viz._stackShares = false;
    viz.schema.color = (d: DataPoint) => kindOf(viz, d);
    configureBars(viz);
    configureLegend(viz);
    viz._buffer = {
      ...viz._buffer,
      Bar: waterfallBuffer(row => stepOf(viz, row), {
        vertical: () => vertical(viz),
        labels: () => viz.schema.shapeConfig.Bar?.label !== false,
      }),
    };
    viz._plotUnderlay = (shapes, x, y) => {
      if (!viz.schema.connectors) return [];
      const upright = vertical(viz);
      const bars = connectorBars(shapes, row => stepOf(viz, row), upright);
      const level = upright ? (v: number) => y(v) : (v: number) => x(v);
      return connectorNodes(connectorSegments(bars, level, upright), viz.schema.connectorConfig);
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      resetSteps(viz);
      syncCategorySort(viz);
      preDraw();
      const rows: DataPoint[] = viz._filteredData || [];
      viz._legendData = waterfallKinds(rows.map(d => stepOf(viz, d))).map(kind => ({[KIND_KEY]: kind}));
    };
  },

  ctx: {},

  fields: [
    /**
        On a waterfall, subtotal bars start at the baseline (0 by default),
        and the value axis always reaches it. To zoom in on a bridge between
        large totals (say 1,000 to 1,020), set it just below them (`980`):
        the axis then starts there, with no break. Running totals still
        count from zero. A `yDomain` (`xDomain` for horizontal bars) that
        stops short of the baseline keeps it on the axis behind a break.
    */
    {key: "baseline", default: 0},
    /** Draws a thin line from the end of each bar to the start of the next. */
    {key: "connectors", default: true},
    /**
        Fill for bars that lower the running total. Defaults to `colorDefaults.off`.
        @type {CssColor | function}
    */
    {key: "decreaseColor"},
    /**
        Fill for bars that raise the running total. Defaults to `colorDefaults.on`.
        @type {CssColor | function}
    */
    {key: "increaseColor"},
    /** Shows the legend when it has more than one kind of bar. */
    {
      key: "legend",
      coerce: "const",
      factory: () => (_config: unknown, arr: DataPoint[]) => arr.length > 1,
    },
    {key: "stacked", default: true},
    /**
        Marks subtotal rows (a data key or accessor; truthy marks the row).
        A subtotal bar draws from the `baseline` (zero by default) to the
        running total. When the row has its own value, the running total
        resets to that value.
    */
    {
      key: "subtotal",
      coerce: v => (typeof v === "string" ? accessor(v) : typeof v === "function" ? v : undefined),
    },
    /**
        Fill for subtotal bars. Defaults to `colorDefaults.sequential`.
        @type {CssColor | function}
    */
    {key: "totalColor"},
    /**
        Line styles for the connectors: `stroke`, `strokeWidth`,
        `strokeOpacity`, and `strokeDasharray`. Each may be a function of the
        row the connector leaves and its index.
    */
    {
      key: "connectorConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        stroke: () => backgroundInk(viz),
        strokeDasharray: "",
        strokeOpacity: 0.6,
        strokeWidth: 1,
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) => tooltipTitle(viz, d, i),
        tbody: (d: DataPoint) => tooltipRows(stepOf(viz, d), valueFormat(viz), viz.schema.translate),
      }),
    },
  ],
};

/**
    Creates a waterfall chart: one bar per category (`x`, or `y` with
    `discrete("y")` for horizontal bars) whose value is the change it makes
    to a running total. Each bar floats from where the previous bar ended;
    rows marked by `subtotal` draw from the baseline to the running total.
    Bars are colored as increases, decreases, or totals, and labeled with
    their change. Each `groupBy` series keeps its own running total, drawn
    side by side.

    The value axis includes zero by default. To zoom in on a bridge between
    large totals (say 1,000 to 1,020), set `baseline` (e.g. `baseline(980)`):
    subtotal bars then rise from it and the axis starts there. Or set a
    `yDomain` (`xDomain` for horizontal bars) that stops short of zero: the
    axis keeps zero and draws a break, as BarChart does.
*/
export default makeChart(waterfallDef, BarChart);
