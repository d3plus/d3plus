/**
    Plot's construction-time state: the fluent accessor schema, the scalar
    and config defaults (sourced from `plotDef`), and the four axes with
    their accessors and grid configs.
*/
import {colorAssign, colorGray} from "@d3plus/color";
import {assign} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
} from "../../components/index.js";
import {accessor, constant} from "../../utils/index.js";
import {defaultBuffers} from "../plotBuffers/defaultBuffers.js";
import {linkedColorDefaults} from "../viz/linkGroup.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type Plot from "./index.js";
import {axisHoverDefaults} from "./axisHoverScene.js";
import {fillBetweenDefaults} from "./fillBetween.js";
import {forecastDefaults} from "./forecast.js";
import {plotDef} from "./pipeline.js";
import {plotShapeDefaults} from "./shapeDefaults.js";
import {axisValue} from "./sharedTooltip.js";
import {
  stackOffsetDiverging,
  stackOrderTotalDescending,
} from "./stackHelpers.js";
import {chartGridline} from "../viz/backgroundInk.js";
import {themed} from "../../utils/theme.js";

/**
    Plot's identity-coerce accessor schema. `installFluent` installs it on
    the instance's prototype alongside vizSchema's accessors.
*/
export const plotSchema = [
  {key: "axisHover", coerce: "identity" as const, default: true},
  {key: "axisHoverConfig", merge: true, factory: axisHoverDefaults},
  {key: "barPadding", coerce: "identity" as const},
  {key: "baselineBreak", coerce: "identity" as const},
  {key: "fillBetween", coerce: "identity" as const, default: false},
  {key: "fillBetweenConfig", merge: true, factory: fillBetweenDefaults},
  {key: "forecast", coerce: "identity" as const},
  {key: "forecastConfig", merge: true, factory: forecastDefaults},
  {key: "lineLabels", coerce: "identity" as const},
  {key: "shapeSort", coerce: "identity" as const},
  {key: "sizeMax", coerce: "identity" as const},
  {key: "sizeMin", coerce: "identity" as const},
  {key: "sizeScale", coerce: "identity" as const},
  {key: "stacked", coerce: "identity" as const},
  {key: "swarm", coerce: "identity" as const, default: "auto"},
  {
    key: "swarmConfig",
    merge: true,
    factory: () => ({padding: 1, overflow: "shrink"}),
  },
  {key: "tooltipShared", coerce: "identity" as const},
  {key: "xBreak", coerce: "identity" as const},
  {key: "xCutoff", coerce: "identity" as const},
  {key: "xDomain", coerce: "identity" as const},
  {key: "x2Domain", coerce: "identity" as const},
  {key: "xSort", coerce: "identity" as const},
  {key: "x2Sort", coerce: "identity" as const},
  {key: "yBreak", coerce: "identity" as const},
  {key: "yCutoff", coerce: "identity" as const},
  {key: "yDomain", coerce: "identity" as const},
  {key: "y2Domain", coerce: "identity" as const},
  {key: "ySort", coerce: "identity" as const},
  {key: "y2Sort", coerce: "identity" as const},
];

/** Sets Plot's scalar and config defaults on a new instance. */
export function initPlotDefaults(viz: Plot): void {
  const defaults = plotDef.defaults!;
  viz._axisPersist = defaults.axisPersist as boolean;
  viz._annotations = defaults.annotations as unknown[];
  viz._backgroundConfig = {
    duration: 0,
    fill: "transparent",
  };
  viz.schema.barPadding = defaults.barPadding as number;
  viz._buffer = assign({}, defaultBuffers, {Bar: false, Line: false});
  viz._confidence = false;
  viz._confidenceConfig = {
    // A line's colour is its stroke, so the confidence band fills with that
    // same colour (at the reduced opacity below). Prefer a per-Line stroke
    // override, else the shared stroke accessor (the Line config itself sets
    // no `stroke` — the colour comes from the top-level `shapeConfig.stroke`).
    fill: (d: DataPoint, i: number) => {
      const {Line, stroke} = viz.schema.shapeConfig;
      const s = Line && Line.stroke !== undefined ? Line.stroke : stroke;
      return typeof s === "function" ? s(d, i) : s;
    },
    fillOpacity: constant(0.5),
  };
  viz._crosshairConfig = {
    stroke: () => themed(viz._theme, t => t.textMuted, colorGray[500]),
    strokeDasharray: "4 3",
    strokeWidth: 1,
  };
  viz._discreteCutoff = defaults.discreteCutoff as number;
  viz._groupPadding = defaults.groupPadding as number;
  viz._labelConnectorConfig = {
    strokeDasharray: "1 1",
  };
  viz._labelPosition = constant("auto");
  viz._lineMarkerConfig = {
    fill: (d: DataPoint, i: number) =>
      colorAssign(viz._id(d, i), linkedColorDefaults(viz)),
    r: constant(3),
  };
  viz._lineMarkers = defaults.lineMarkers as boolean;
  viz._previousAnnotations = {back: [], front: []};
  viz._previousShapes = [];
  viz.schema.shape = defaults.shape;
  viz.schema.shapeConfig = assign(
    viz.schema.shapeConfig,
    plotShapeDefaults.call(viz as unknown as VizInstance),
  );
  viz._shapeOrder = ["Area", "Path", "Bar", "Box", "Line", "Rect", "Circle"];
  viz.schema.shapeSort = (a: string, b: string) =>
    viz._shapeOrder.indexOf(a) - viz._shapeOrder.indexOf(b);
  viz.schema.tooltipShared = defaults.tooltipShared as boolean;
  viz.schema.sizeMax = 20;
  viz.schema.sizeMin = 5;
  viz.schema.sizeScale = "sqrt";
  viz._stackOffset = stackOffsetDiverging;
  viz._stackOrder = stackOrderTotalDescending;
  // Off until set: a stacked Plot's threshold folds whole series.
  viz.schema.threshold = constant(0);
  viz._thresholdMemberFormat = (v: number) =>
    axisValue(
      viz as unknown as VizInstance,
      viz.schema.discrete === "y" ? "x" : "y",
      v,
    );
  viz.schema.timelineConfig = assign(viz.schema.timelineConfig, {
    brushMin: () =>
      viz._xTime || viz._yTime || viz._x2Time || viz._y2Time ? 2 : 1,
  });
}

/** Sets Plot's x/x2/y/y2 accessors, axes, and axis configs on a new instance. */
export function initPlotAxes(viz: Plot): void {
  viz._x = accessor("x");
  viz._xKey = "x";
  viz._xAxis = new AxisBottom().align("end");
  // _xTest/_yTest/_x2Test/_y2Test are NOT persistent fields anymore. The
  // measure-only test axes are allocated as locals inside `_draw` and
  // garbage-collected after each draw — proving Plot doesn't need to
  // own a long-lived Axis instance just for layout. See measureAxis()
  // in axisLayout.ts for the standalone shape.
  viz._xConfig = {
    gridConfig: {
      stroke: (d: {id: string}) => {
        if (viz.schema.discrete?.charAt(0) === "x" || viz._swarm?.cross === "x")
          return "transparent";
        const range = viz._xAxis.range();
        const position = viz._xAxis._getPosition.bind(viz._xAxis)(d.id);
        if (range[0] === position) return "transparent";
        return chartGridline(viz);
      },
    },
  };
  viz.schema.xCutoff = 150;

  viz._x2 = accessor("x2");
  viz._x2Key = "x2";
  viz._x2Axis = new AxisTop().align("start");
  viz._x2Config = {};

  viz._y = accessor("y");
  viz._yKey = "y";
  viz._yAxis = new AxisLeft().align("start");
  viz._yKey = "y";
  viz._yConfig = {
    gridConfig: {
      stroke: (d: {id: string}) => {
        if (viz.schema.discrete?.charAt(0) === "y" || viz._swarm?.cross === "y")
          return "transparent";
        const range = viz._yAxis.range();
        const position = viz._yAxis._getPosition.bind(viz._yAxis)(d.id);
        if (range[range.length - 1] === position) return "transparent";
        return chartGridline(viz);
      },
    },
  };
  viz.schema.yCutoff = 150;

  viz._y2 = accessor("y2");
  viz._y2Key = "y2";
  viz._y2Axis = new AxisRight().align("end");
  viz._y2Config = {};
}
