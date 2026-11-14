/**
    RadialLine — a line drawn around a circle, for cyclical data such as
    hours or months: `x` goes around the circle and `y` is the distance from
    the center. RadialArea fills the same lines down to the center, or
    stacks them.

    Implementation files in this folder:
      - `angles.ts` — where each `x` value sits around the circle.
      - `series.ts` — each group's points, stacked or from the baseline.
      - `paths.ts` — the radial line and band paths, closed into loops.
      - `spokes.ts` — the angular gridlines.
      - `applyLayout.ts` — chart-specific `TransformStage` (the chrome comes
        from `../polar/`).
      - `points.ts` — a dot on each point, its tooltip row, and its hover.
      - `seriesLabels.ts`, `seriesLabelNodes.ts` — `lineLabels`.
      - `emit.ts` — the series paths, then the dots, then the labels.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {centerChartTransform, chartBounds} from "../features/chartGeometry.js";
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import {polarAxisConfig} from "../polar/config.js";
import {polarFacetHooks} from "../polar/polarFacet.js";
import {isPointShape} from "../viz/nearestHover.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {applyRadialLineLayout, radialDomainOf} from "./applyLayout.js";
import type {RadialFrame} from "./applyLayout.js";
import {radialLineEmit} from "./emit.js";
import {radialPointHover, radialPointTooltipRows} from "./points.js";

/** Coerces a key or accessor setting to an accessor. */
const toAccessor = (v: unknown) =>
  typeof v === "function" ? v : fieldAccessor(v as string);

export const radialLineDef: DataDrivenChartDefinition = {
  name: "RadialLine",

  layoutStage: applyRadialLineLayout,
  emit: radialLineEmit,
  insetRegion: sceneInsetRegion,

  chartTransform: (viz: VizInstance) => {
    const {width, height} = chartBounds(viz);
    return centerChartTransform(viz, width, height);
  },

  // The circle the series fill, in the centered chart frame.
  chartBodyRect: (viz: VizInstance) => {
    const r = (viz.ctx.radial as RadialFrame | undefined)?.outer ?? 0;
    return {x: -r, y: -r, width: r * 2, height: r * 2};
  },

  // The dots are points for `hoverDistance`; the paths keep exact
  // hit-testing.
  pointMark: (_viz, node) => isPointShape(node),

  setup: radialPointHover,

  // Square-ish small-multiple panels, each fit to its own values unless
  // `facetConfig.scales` is "shared".
  facet: polarFacetHooks(radialDomainOf),

  ctx: {radialMark: "line"},

  fields: [
    /**
        Whether each line loops from its last `x` value back to its first,
        as cyclical data does.
    */
    {key: "closed", default: true},
    /**
        Which way `x` values advance around the circle: `"clockwise"` or
        `"counterclockwise"`.
    */
    {key: "direction", default: "clockwise"},
    // Nests rows by `x`, so each series keeps one row per `x` value.
    {key: "discrete", default: "x"},
    /**
        The radius of the empty center, in pixels, or a function of the outer
        radius.
        @type {number | function}
    */
    {key: "innerRadius", default: 0},
    /** Formats the ring value labels and the tooltip values. Defaults to the abbreviated number format. */
    {key: "levelFormat"},
    /** Direction of the ring value labels, in degrees clockwise from 12 o'clock. */
    {key: "levelLabelAngle", default: 0},
    /** Whether each value ring is labeled with its value. */
    {key: "levelLabels", default: true},
    /**
        The value rings: an approximate count (the domain rounds out to nice
        values and the rings sit on its ticks), or an array of exact values.
        @type {number | number[]}
    */
    {key: "levels", default: 4},
    /**
        Labels each series with its name: outside its outermost point, or
        inside its band when stacked. `true`, or a function of each series'
        row. Labels that would overlap one placed before them are left out.
        @type {boolean | function}
    */
    {key: "lineLabels", default: false},
    /**
        Room (px) reserved around the circle for the `x` labels, or `"auto"`
        to curve them just outside the circle when they all fit (see
        `labelPosition`), else size the circle to the measured labels.
    */
    {key: "outerPadding", default: "auto"},
    {key: "shape", default: constant("Line"), coerce: "const"},
    /** Where the first `x` value sits, in degrees clockwise from 12 o'clock. */
    {key: "startAngle", default: 0},
    /**
        Accessor or key for each row's place around the circle. Numbers
        spread by value over a period that ends where it starts (see
        `xDomain`); names and dates are categories, spaced evenly in order.
        @type {string | function}
    */
    {key: "x", default: accessor("x"), coerce: toAccessor},
    /**
        For numeric `x` values, the `[start, end]` period the circle spans,
        where `end` meets `start` again (`[0, 24]` for hours). Either end may
        be left `undefined` to come from the data: the smallest value, and
        the largest plus the smallest gap between values. For categories,
        the categories to show, in order.
        @type {Array}
    */
    {key: "xDomain"},
    /**
        Formats the `x` labels around the circle and in the tooltip.
        Defaults to the abbreviated number format for numbers and the axis
        date format for dates.
        @type {function}
    */
    {key: "xFormat"},
    /**
        Accessor or key for each row's value: its distance from the center.
        @type {string | function}
    */
    {key: "y", default: accessor("y"), coerce: toAccessor},
    /**
        The `[min, max]` the radius spans. Either end may be left `undefined`
        to come from the data, rounded out to nice numbers and including
        zero.
        @type {[number, number]}
    */
    {key: "yDomain"},
    /** Styles the ring value labels: `fontColor`, `fontFamily`, `fontOpacity`, `fontSize`, `fontWeight`. */
    {key: "levelLabelConfig", default: {}, merge: true},
    /**
        Styles the chrome like a Plot axis: `gridConfig` the inner value rings
        and the spokes, `barConfig` the outer ring, and
        `shapeConfig.labelConfig` the `x` labels.
    */
    {key: "axisConfig", merge: true, factory: polarAxisConfig},
    // Lines in their series' color, and a dot on each point, styled by
    // `shapeConfig.Circle` (`r: 0` hides them).
    {
      key: "shapeConfig",
      merge: true,
      factory: () => ({
        Line: {fill: "none", strokeWidth: 2},
        Circle: {r: 3},
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint) => radialPointTooltipRows(viz, d),
      }),
    },
  ],
};

/**
    Creates a radial line chart from an array of data: each `groupBy` group
    is a line around a circle, for cyclical data such as hours or months.
    `x` sets each point's angle and `y` its distance from the center; each
    line loops back to its start (`closed`). A dot on every point, styled by
    `shapeConfig.Circle`, shows its value on hover; `r: 0` hides them.
*/
export default makeChart(radialLineDef);
