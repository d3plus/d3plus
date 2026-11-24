/**
    Dashboard — several charts placed together as one dashboard, under one title
    and saved as one image.

    Implementation files in this folder:
      - `dashboardTypes.ts` — the `charts` and `layoutConfig` option types.
      - `dashboardGrid.ts` — pure layout: tracks, placement with spans, cells.
      - `dashboardAlign.ts` — lining up the plot areas of charts on a grid line.
      - `dashboardCharts.ts` — `charts` config → chart instances.
      - `dashboardRender.ts` — drawing each chart over its cell.
      - `dashboardScene.ts` — the whole dashboard as one scene, for saving.
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
import {dashboardGrid, resolveDashboardLayout} from "./dashboardGrid.js";
import type {DashboardCell} from "./dashboardGrid.js";
import {dashboardLegendRule} from "./dashboardLegend.js";
import type {LegendHost} from "./dashboardLegend.js";
import {DASHBOARD_LINK_PREFIX} from "./dashboardLink.js";
import {prepareDashboard} from "./dashboardPrepare.js";
import {
  dashboardSettled,
  dashboardState,
  insetBox,
  queueDashboardCharts,
  removeDashboardChart,
} from "./dashboardRender.js";
import type {DashboardHost, DashboardState} from "./dashboardRender.js";
import {composeDashboardScene, sceneMarkup} from "./dashboardScene.js";
import type {DashboardPart} from "./dashboardScene.js";

let dashboardCount = 0;

/** The dashboard, as its layout stage reads it. */
type DashboardViz = VizInstance & DashboardHost;

/**
    Dashboard's layout stage: lays its charts out over the area its chrome
    leaves, and queues drawing them.
*/
export const applyDashboardLayout: TransformStage = ctx => {
  const viz = ctx.viz as DashboardViz;
  const {width, height} = chartBounds(viz);
  const cells = dashboardGrid(
    viz._dashboard.children.map(c => c.placement),
    {x: viz._margin.left, y: viz._margin.top, width, height},
    resolveDashboardLayout(viz.schema.layoutConfig),
  );
  viz.ctx.dashboardCells = cells;
  queueDashboardCharts(viz, () => viz.ctx.dashboardCells as DashboardCell[]);
  return {};
};

export const dashboardDef: DataDrivenChartDefinition = {
  name: "Dashboard",

  layoutStage: applyDashboardLayout,
  // The charts draw themselves, over the dashboard's chart area.
  emit: () => [],

  fields: [
    /**
        Config applied to every chart in the dashboard, after the dashboard's
        own `renderer`, `theme`, and `locale` and before each chart's own
        `config`: what the charts share, such as a `tooltipConfig`. Defaults
        to turning off each chart's download, table view, search, and zoom
        buttons: the dashboard's download button saves every chart.
    */
    {
      key: "chartConfig",
      merge: true,
      default: {
        saveControl: false,
        search: false,
        tableView: false,
        zoomControls: false,
      },
    },
    /**
        The charts the dashboard draws, in reading order: chart instances, or
        `{chart, config, column, row, columnSpan, rowSpan}` objects, where
        `chart` is an instance, a chart class, or a chart class's name.
        @type {Array}
    */
    {key: "charts", default: []},
    /** Each chart is a Tab stop of its own, with keyboard navigation between its marks; the dashboard has none to move between. */
    {
      key: "keyboardNav",
      default: false,
      onSet: (viz: VizInstance, value: unknown) => {
        if (!value) teardownKeyboardNav(viz);
      },
    },
    /**
        The grid the charts are placed on: `columns` and `rows` (a count, or
        each track's relative size), `padding` (4 by default), `align`
        (lines up plot areas on shared grid lines, `true` by default), and
        `shareX` / `shareY` (one domain for the charts stacked in a column /
        side by side in a row, labeled on the outer edge only).
        @type {{columns, rows, padding, align, shareX, shareY}}
    */
    {key: "layoutConfig", merge: true, default: {}},
    /**
        Draws one legend for every chart: the legend of `legendChart` (the
        first chart whose legend is on, by default), linked to every chart,
        in place of the charts' own. It shows by that chart's own rule;
        `false` turns it off and gives each chart its own legend back. A
        chart whose config (or `chartConfig`) sets `legend` keeps its own.
    */
    {key: "legend", coerce: "const", factory: dashboardLegendRule},
    /**
        The index (in `charts`) of the chart whose legend the dashboard
        draws: its data, grouping, and colors make the legend's entries.
        Defaults to the first chart whose own legend is on.
    */
    {key: "legendChart"},
    /**
        The link group every chart without a `link` of its own joins, so
        hovering, highlighting, and legend clicks in one chart show in the
        rest, and a value takes the same color in each. A group of the
        dashboard's own by default; `false` leaves the charts unlinked.
    */
    {key: "link", factory: () => `${DASHBOARD_LINK_PREFIX}${++dashboardCount}`},
    /** A dashboard's data is its legend's, so it never reports having none. */
    {key: "noDataMessage", default: false},
    /** Searching belongs to the charts. */
    {key: "search", default: false},
    /** The table view belongs to the charts. */
    {key: "tableView", default: false},
    /** The timeline belongs to the charts. */
    {key: "timeline", default: false},
    /** Zooming belongs to the charts. */
    {key: "zoom", default: false},
  ],
};

const DashboardChart = makeChart(dashboardDef);

/**
    Places several charts together as one dashboard, with one title, subtitle,
    and download button. Give it `charts` (chart instances, or objects naming
    a chart class and its config) and it lays them out on a grid
    (`layoutConfig`: columns and rows with relative sizes, spans, padding),
    sizes and draws each one, lines up the plot areas of charts with axes
    that share a grid line, and links the charts so hovering or highlighting
    in one shows in the rest. A Dashboard can hold another Dashboard.
*/
export default class Dashboard extends DashboardChart {
  static readonly _displayName: string = "Dashboard";
  /** @private */
  _dashboard: DashboardState = dashboardState();
  /** @private Saved from `toSVGString()`: the charts draw outside the dashboard's own surface. */
  _vectorSave = true;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();
    this._constructed(new.target, Dashboard);
  }

  /**
      Draws the dashboard and every chart in it. The callback runs once every
      chart has drawn too.
      @param callback Optional callback invoked after rendering completes.
  */
  render(callback?: () => void): this {
    prepareDashboard(this as unknown as LegendHost);
    const state = this._dashboard;
    return super.render(
      callback
        ? () => {
            dashboardSettled(state).then(callback);
          }
        : undefined,
    );
  }

  /**
      The whole dashboard as one scene: its own title and chrome with every
      chart's scene placed in its box.
      @private
  */
  _compositeScene(): Scene {
    const parts: DashboardPart[] = [];
    for (const child of this._dashboard.children) {
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
    return composeDashboardScene(this.toScene(), parts);
  }

  /**
      Serializes the whole dashboard (its chrome and every chart) to an SVG
      string, as the dashboard's download button saves it. Returns `""` before
      the dashboard has rendered.
  */
  toSVGString(): string {
    if (!this._sceneRenderer) return "";
    return withRootClasses(
      sceneMarkup(this._compositeScene()),
      this.schema.className,
    );
  }

  /**
      Tears the dashboard down, and every chart in it.
  */
  destroy(): this {
    const state = this._dashboard;
    state.children.forEach(removeDashboardChart);
    state.children = [];
    state.host?.remove();
    state.host = undefined;
    return super.destroy();
  }
}

registerChart("Dashboard", Dashboard);
