/**
    Figure: the types of its `charts` and `layoutConfig` options. Types
    only, so `D3plusConfig` can name them without loading any chart code.

    @module
*/

/** Where one chart sits on a Figure's grid (rows and columns count from 0). */
export interface FigurePlacement {
  /** The column the chart starts in. Placed in the first free cell by default. */
  column?: number;
  /** The row the chart starts in. Placed in the first free cell by default. */
  row?: number;
  /** How many columns the chart spans. Defaults to `1`. */
  columnSpan?: number;
  /** How many rows the chart spans. Defaults to `1`. */
  rowSpan?: number;
}

/** A chart instance a Figure can hold: any d3plus chart, or another Figure. */
export interface FigureChartInstance {
  render(callback?: () => void): unknown;
}

/** A chart, its class, or its class's name (`"BarChart"`). */
export type FigureChartSource =
  FigureChartInstance | (new () => FigureChartInstance) | string;

/** The object form of a Figure chart: the chart, its config, and its place on the grid. */
export interface FigureChartEntry extends FigurePlacement {
  /** The chart: an instance, a chart class, or a chart class's name (`"BarChart"`). */
  chart: FigureChartSource;
  /** Config applied to the chart (with `.config()`) whenever this object changes. */
  config?: Record<string, unknown>;
}

/** One of a Figure's `charts`: a chart instance, or the object form placing it. */
export type FigureChart = FigureChartInstance | FigureChartEntry;

// A type alias rather than an interface, so the docs generator doesn't read
// its keys (such as `padding`) as the meaning of other components' keys.
/** The object form of `layoutConfig`. */
export type FigureLayoutConfig = {
  /** The column count, or each column's width relative to the others (`[2, 1]` makes the first column twice as wide as the second). Chosen automatically by default, to draw the charts as large as the figure's shape allows. */
  columns?: number | number[];
  /** The row count, or each row's height relative to the others. Rows are added as the charts need them; an added row takes a share of `1`. */
  rows?: number | number[];
  /** The space between charts, in pixels. Defaults to `16`. */
  padding?: number;
  /** Lines up the plot areas of charts with axes (BarChart, LinePlot, …) that start or end on the same grid line, so stacked charts share their left and right edges and charts side by side share their top and bottom. Defaults to `true`. */
  align?: boolean;
};
