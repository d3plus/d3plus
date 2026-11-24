/**
    Dashboard: the types of its `charts` and `layoutConfig` options. Types
    only, so `D3plusConfig` can name them without loading any chart code.

    @module
*/

/** Where one chart sits on a Dashboard's grid (rows and columns count from 0). */
export interface DashboardPlacement {
  /** The column the chart starts in. Placed in the first free cell by default. */
  column?: number;
  /** The row the chart starts in. Placed in the first free cell by default. */
  row?: number;
  /** How many columns the chart spans. Defaults to `1`. */
  columnSpan?: number;
  /** How many rows the chart spans. Defaults to `1`. */
  rowSpan?: number;
}

/** A chart instance a Dashboard can hold: any d3plus chart, or another Dashboard. */
export interface DashboardChartInstance {
  render(callback?: () => void): unknown;
}

/** A chart, its class, or its class's name (`"BarChart"`). */
export type DashboardChartSource =
  DashboardChartInstance | (new () => DashboardChartInstance) | string;

/** The object form of a Dashboard chart: the chart, its config, and its place on the grid. */
export interface DashboardChartEntry extends DashboardPlacement {
  /** The chart: an instance, a chart class, or a chart class's name (`"BarChart"`). */
  chart: DashboardChartSource;
  /** Config applied to the chart (with `.config()`) whenever this object changes. */
  config?: Record<string, unknown>;
}

/** One of a Dashboard's `charts`: a chart instance, or the object form placing it. */
export type DashboardChart = DashboardChartInstance | DashboardChartEntry;

// A type alias rather than an interface, so the docs generator doesn't read
// its keys (such as `padding`) as the meaning of other components' keys.
/** The object form of `layoutConfig`. */
export type DashboardLayoutConfig = {
  /** The column count, or each column's width relative to the others (`[2, 1]` makes the first column twice as wide as the second). Chosen automatically by default, to draw the charts as large as the dashboard's shape allows. */
  columns?: number | number[];
  /** The row count, or each row's height relative to the others. Rows are added as the charts need them; an added row takes a share of `1`. */
  rows?: number | number[];
  /** The space between charts, in pixels. Defaults to `4`. */
  padding?: number;
  /** Lines up the plot areas of charts with axes (BarChart, LinePlot, …) that start or end on the same grid line, so stacked charts share their left and right edges and charts side by side share their top and bottom. Defaults to `true`. */
  align?: boolean;
  /** Charts with axes whose columns overlap share one x domain, labeled only on charts with no sharing chart below them. The domain is the one charts set themselves with `xDomain` (merged, when several do), else every chart's merged. Charts whose x axes differ in kind (categories, numbers, dates, log) don't share. Defaults to `false`. */
  shareX?: boolean;
  /** Charts with axes whose rows overlap share one y domain, labeled only on charts with no sharing chart to their left. The domain is the one charts set themselves with `yDomain` (merged, when several do), else every chart's merged. Charts whose y axes differ in kind don't share. Defaults to `false`. */
  shareY?: boolean;
};
