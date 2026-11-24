/**
    Figure — several charts placed together as one figure, under one title
    and saved as one image.

    Implementation files in this folder:
      - `figureTypes.ts` — the `charts` and `layoutConfig` option types.
      - `figureGrid.ts` — pure layout: tracks, placement with spans, cells.
      - `figureAlign.ts` — lining up the plot areas of charts on a grid line.
      - `figureCharts.ts` — `charts` config → chart instances.
      - `figureRender.ts` — drawing each chart over its cell.
      - `figureScene.ts` — the whole figure as one scene, for saving.
*/

import type {Scene} from "@d3plus/render";

import {withRootClasses} from "../../utils/className.js";
import {chartBounds} from "../features/chartGeometry.js";
import {registerChart} from "../definition/chartRegistry.js";
import type {DataDrivenChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {TransformStage} from "../pipeline/stages.js";
import {teardownKeyboardNav} from "../viz/keyboardNav.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {syncFigureCharts} from "./figureCharts.js";
import {figureGrid, resolveFigureLayout} from "./figureGrid.js";
import type {FigureCell} from "./figureGrid.js";
import {
  FIGURE_LINK_PREFIX,
  figureSettled,
  figureState,
  insetBox,
  queueFigureCharts,
  removeFigureChart,
} from "./figureRender.js";
import type {FigureHost, FigureState} from "./figureRender.js";
import {composeFigureScene, sceneMarkup} from "./figureScene.js";
import type {FigurePart} from "./figureScene.js";

let figureCount = 0;

/** The figure, as its layout stage reads it. */
type FigureViz = VizInstance & FigureHost;

/**
    Figure's layout stage: reads `charts` into chart instances (tearing down
    the ones no longer listed), lays them out over the area the figure's
    chrome leaves, and queues drawing them.
*/
export const applyFigureLayout: TransformStage = ctx => {
  const viz = ctx.viz as FigureViz;
  const state = viz._figure;
  const {children, removed} = syncFigureCharts(
    viz,
    Array.isArray(viz.schema.charts) ? viz.schema.charts : [],
    state.children,
  );
  removed.forEach(removeFigureChart);
  state.children = children;
  const {width, height} = chartBounds(viz);
  const cells = figureGrid(
    children.map(c => c.placement),
    {x: viz._margin.left, y: viz._margin.top, width, height},
    resolveFigureLayout(viz.schema.layoutConfig),
  );
  viz.ctx.figureCells = cells;
  queueFigureCharts(viz, () => viz.ctx.figureCells as FigureCell[]);
  return {};
};

export const figureDef: DataDrivenChartDefinition = {
  name: "Figure",

  layoutStage: applyFigureLayout,
  // The charts draw themselves, over the figure's chart area.
  emit: () => [],

  fields: [
    /**
        Config applied to every chart in the figure, before each chart's own
        `config`: what the charts share, such as a `theme` or `locale`.
        Defaults to `{saveControl: false}`: the figure's download button
        saves every chart, so the charts don't show their own.
    */
    {key: "chartConfig", merge: true, default: {saveControl: false}},
    /**
        The charts the figure draws, in reading order: chart instances, or
        `{chart, config, column, row, columnSpan, rowSpan}` objects, where
        `chart` is an instance, a chart class, or a chart class's name.
        @type {Array}
    */
    {key: "charts", default: []},
    /** Each chart is a Tab stop of its own, with keyboard navigation between its marks; the figure has none to move between. */
    {
      key: "keyboardNav",
      default: false,
      onSet: (viz: VizInstance, value: unknown) => {
        if (!value) teardownKeyboardNav(viz);
      },
    },
    /**
        The grid the charts are placed on: `columns` and `rows` (a count, or
        each track's relative size), `padding` (16 by default), and `align`
        (lines up plot areas on shared grid lines, `true` by default).
        @type {{columns, rows, padding, align}}
    */
    {key: "layoutConfig", merge: true, default: {}},
    /** The figure has no data of its own to show in a legend; each chart keeps its own. */
    {key: "legend", coerce: "const", default: false},
    /**
        The link group every chart without a `link` of its own joins, so
        hovering, highlighting, and legend clicks in one chart show in the
        rest, and a value takes the same color in each. A group of the
        figure's own by default; `false` leaves the charts unlinked.
    */
    {key: "link", factory: () => `${FIGURE_LINK_PREFIX}${++figureCount}`},
    /** A figure has no data of its own, so it never reports having none. */
    {key: "noDataMessage", default: false},
    /** A figure has no rows of its own to search; each chart keeps its own search. */
    {key: "search", default: false},
    /** A figure has no rows of its own to show as a table; each chart keeps its own table view. */
    {key: "tableView", default: false},
    /** The timeline belongs to the charts. */
    {key: "timeline", default: false},
    /** Zooming belongs to the charts. */
    {key: "zoom", default: false},
  ],
};

const FigureChart = makeChart(figureDef);

/**
    Places several charts together as one figure, with one title, subtitle,
    and download button. Give it `charts` (chart instances, or objects naming
    a chart class and its config) and it lays them out on a grid
    (`layoutConfig`: columns and rows with relative sizes, spans, padding),
    sizes and draws each one, lines up the plot areas of charts with axes
    that share a grid line, and links the charts so hovering or highlighting
    in one shows in the rest. A Figure can hold another Figure.
*/
export default class Figure extends FigureChart {
  static readonly _displayName: string = "Figure";
  /** @private */
  _figure: FigureState = figureState();
  /** @private Saved from `toSVGString()`: the charts draw outside the figure's own surface. */
  _vectorSave = true;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();
    this._constructed(new.target, Figure);
  }

  /**
      Draws the figure and every chart in it. The callback runs once every
      chart has drawn too.
      @param callback Optional callback invoked after rendering completes.
  */
  render(callback?: () => void): this {
    const state = this._figure;
    return super.render(
      callback
        ? () => {
            figureSettled(state).then(callback);
          }
        : undefined,
    );
  }

  /**
      The whole figure as one scene: its own title and chrome with every
      chart's scene placed in its box.
      @private
  */
  _compositeScene(): Scene {
    const parts: FigurePart[] = [];
    for (const child of this._figure.children) {
      if (!child.cell) continue;
      const box = insetBox(child.cell, child.inset);
      const chart = child.chart as {
        _compositeScene?: () => Scene;
        toScene: () => Scene;
      };
      const scene = chart._compositeScene
        ? chart._compositeScene()
        : chart.toScene();
      parts.push({scene, x: box.x, y: box.y});
    }
    return composeFigureScene(this.toScene(), parts);
  }

  /**
      Serializes the whole figure (its chrome and every chart) to an SVG
      string, as the figure's download button saves it. Returns `""` before
      the figure has rendered.
  */
  toSVGString(): string {
    if (!this._sceneRenderer) return "";
    return withRootClasses(
      sceneMarkup(this._compositeScene()),
      this.schema.className,
    );
  }

  /**
      Tears the figure down, and every chart in it.
  */
  destroy(): this {
    const state = this._figure;
    state.children.forEach(removeFigureChart);
    state.children = [];
    state.host?.remove();
    state.host = undefined;
    return super.destroy();
  }
}

registerChart("Figure", Figure);
