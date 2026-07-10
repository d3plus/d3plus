import type {DataPoint} from "@d3plus/data";

import type VizBase from "../charts/viz/VizBase.js";
import type {AccessorFn} from "./AccessorFn.js";

type Position = "top" | "right" | "bottom" | "left";

type DataPointAccessor<T> = string | ((d: DataPoint) => T);

/** A config value that is either a constant or a `(datum, index)` accessor. */
type Accessor<T> = T | ((d: DataPoint, i?: number) => T);

type AxisScale =
  | "auto"
  | "band"
  | "diverging"
  | "divergingLog"
  | "divergingPow"
  | "divergingSqrt"
  | "divergingSymlog"
  | "identity"
  | "implicit"
  | "jenks"
  | "linear"
  | "log"
  | "ordinal"
  | "point"
  | "pow"
  | "quantile"
  | "quantize"
  | "radial"
  | "sequential"
  | "sequentialLog"
  | "sequentialPow"
  | "sequentialQuantile"
  | "sequentialSqrt"
  | "sequentialSymlog"
  | "sqrt"
  | "symlog"
  | "threshold"
  | "time"
  | "utc";

export interface AxisConfig {
  barConfig?: Record<string, string | number>;
  /** Grid values of the axis. */
  grid?: unknown[];
  gridConfig?: Record<string, string | number>;
  /** Grid size of the axis. */
  gridSize?: number;
  label?: string;
  /** Visible tick labels of the axis. */
  labels?: unknown[];
  labelOffset?: false | number;
  /** Maximum size allowed for the space that contains the axis tick labels and title. */
  maxSize?: number;
  /** Minimum size alloted for the space that contains the axis tick labels and title. */
  minSize?: number;
  /**
      Scale range (in pixels) of the axis. The given array must have 2 values,
      but one may be `undefined` to allow the default behavior for that value.
  */
  range?: (number | undefined)[];
  /** Scale of the axis. */
  scale?: AxisScale;
  /** Tick formatter. */
  tickFormat?: (d: number | string) => string | number;
  /** Tick values of the axis. */
  ticks?: unknown[];
  tickSize?: number;
  /**
      Defines a custom locale object to be used in time scales. Must include
      `dateTime`, `date`, `time`, `periods`, `days`, `shortDays`, `months`, and
      `shortMonths` (see
      [d3-time-format](https://github.com/d3/d3-time-format/blob/master/README.md#timeFormatLocale)).
  */
  timeLocale?: Record<string, unknown>;
  /** Title of the axis. */
  title?: string;
}

export interface TooltipConfig {
  /** The inner HTML content of the arrow element, empty by default. */
  arrow?: ((d: DataPoint) => string) | string;
  /** The background color accessor for each tooltip. */
  background?: ((d: DataPoint) => string) | string;
  /** The border accessor for each tooltip. */
  border?: ((d: DataPoint) => string) | string;
  /** The border-radius accessor for each tooltip. */
  borderRadius?: ((d: DataPoint) => string) | string;
  /** The footer content accessor for each tooltip. */
  footer?: ((d: DataPoint) => string) | string;
  /** The max-width accessor for each tooltip. */
  maxWidth?: ((d: DataPoint) => string | number) | string | number;
  /** The min-width accessor for each tooltip. */
  minWidth?: ((d: DataPoint) => string | number) | string | number;
  /** The pixel offset between the tooltip and its anchor point. */
  offset?: ((d: DataPoint) => number) | number;
  /** The inner padding of each tooltip. */
  padding?: ((d: DataPoint) => string | number) | string | number;
  title?: ((d: DataPoint) => string) | string;
  body?: ((d: DataPoint) => string) | string;
  thead?:
    | ((d: DataPoint) => [string, string][])
    | Array<
        Array<
          | ((d: DataPoint, i?: number, x?: {share: number}) => string)
          | string
        >
      >;
  tbody?:
    | ((d: DataPoint) => [string, string][])
    | Array<
        Array<
          | ((d: DataPoint, i?: number, x?: {share: number}) => string)
          | string
        >
      >;
}

export interface TextBoxConfig {
  /** The text content for each box. */
  text?: Accessor<string>;
  /** The font color as an accessor function or static string. Inferred from the DOM selection by default. */
  fontColor?: Accessor<string>;
  /** The font size in pixels. Inferred from the DOM selection by default. */
  fontSize?: Accessor<number>;
  /**
      The font-family to use: a font name, a comma-separated list of fallbacks,
      an array of fallbacks, or an accessor returning a string or array. The
      first available font on the client is used.
  */
  fontFamily?: Accessor<string | string[]>;
  /** The font weight. Inferred from the DOM selection by default. */
  fontWeight?: Accessor<string | number>;
  /** The minimum font size in pixels, used when dynamically resizing fonts. */
  fontMin?: number;
  /** The maximum font size in pixels, used when dynamically resizing fonts. */
  fontMax?: number;
  /** Toggles font resizing — a static boolean, or an accessor returning a boolean. */
  fontResize?: Accessor<boolean>;
  /** The font opacity as an accessor function or static number between 0 and 1. */
  fontOpacity?: Accessor<number>;
  /** The font stroke color for the rendered text. */
  fontStroke?: Accessor<string>;
  /** The font stroke width for the rendered text. */
  fontStrokeWidth?: Accessor<number>;
  /** The line height, which is 1.2 times the font size by default. */
  lineHeight?: Accessor<number>;
  /** Restricts the maximum number of lines to wrap onto; null (unlimited) by default. */
  maxLines?: Accessor<number | null>;
  /** Whether text is allowed to overflow its bounding box. */
  overflow?: Accessor<boolean>;
  /**
      Handles truncated lines, returning the new line value. Passed the line's
      text and number; by default appends an ellipsis to every line except a
      first word that cannot fit (which returns "").
  */
  ellipsis?: (text: string, line: number) => string;
  /** The padding as a CSS shorthand string or number. Defaults to 0. */
  padding?: Accessor<string | number>;
  /** The anchor point around which to rotate the text box. */
  rotateAnchor?: Accessor<[number, number]>;
  /** The word split function: given a string, returns it split into an array of words. */
  split?: (text: string) => string[];
  /** The width for each text box. */
  width?: Accessor<number>;
  /** The height for each text box. */
  height?: Accessor<number>;
  /** The x position (left edge) for each text box. */
  x?: Accessor<number>;
  /** The y position (top edge) for each text box. */
  y?: Accessor<number>;
}

export interface TimelineConfig {
  /** Brush event filter. */
  brushFilter?: () => boolean;
  /**
      The minimum number of ticks that can be highlighted when using "ticks"
      `buttonBehavior`. Helpful for x/y plots where selecting fewer than 2 time
      periods is undesirable.
  */
  brushMin?: number;
  /** Toggles the horizontal alignment of the button timeline. */
  buttonAlign?: "start" | "middle" | "end";
  /** Toggles the style of the timeline. */
  buttonBehavior?: "auto" | "buttons" | "ticks";
  /** Button height. */
  buttonHeight?: number;
  /** Button padding. */
  buttonPadding?: number;
  /** Handle style. */
  handleConfig?: Record<string, unknown>;
  /** Handle size. */
  handleSize?: number;
  /**
      Determines the visibility of the play button to the left of the timeline,
      which cycles through the available periods at a rate set by `playButtonInterval`.
  */
  playButton?: boolean;
  /**
      The interval, in milliseconds, between periods when cycling via the play
      button. Used only when the chart's `duration` is 0 (no transition);
      otherwise playback steps once per `duration` so each step animates in full.
  */
  playButtonInterval?: number;
  /** The current selection. Defaults to the most recent period in the timeline. */
  selection?: (Date | number)[] | Date | number | false;
  /** Toggles the snapping value. */
  snapping?: boolean;
}

export interface LegendConfig {
  /** The active method for all shapes. */
  active?: ((d: DataPoint, i?: number) => boolean) | false;
  /** The hover method for all shapes. */
  hover?: ((d: DataPoint, i?: number) => boolean) | false;
  /** The shape type used for each legend entry. */
  shape?: Accessor<string>;
}

export interface ColorScaleConfig {
  /**
      For a linear scale, the `[min, max]` values used by the color scale; values
      outside this range map to the nearest color.
  */
  domain?: number[];
  /**
      Formats the label for each bucket in a bucket-type scale ("jenks",
      "quantile", …). Passed the bucket's start value, its index, the full
      bucket array, and every data value used to build the buckets.
  */
  bucketFormat?: (
    start: number,
    i: number,
    buckets: number[],
    values: number[],
  ) => string;
  /** Given a bucket's minimum and maximum values, returns the full label. */
  bucketJoiner?: (min: string, max: string) => string;
}

export interface D3plusConfig {
  /** Data array or URL string to load data from. */
  data?: DataPoint[] | string;
  /** Locale code used for text and number formatting. */
  locale?: string;

  /** The active callback function for highlighting shapes. */
  active?: ((d: DataPoint, i: number) => boolean) | false | null;
  /** Custom aggregation functions keyed by data property. */
  aggs?: {[k: string]: (d: DataPoint[]) => unknown};
  /** Hides the SVG from assistive technology when true (`aria-hidden`). */
  ariaHidden?: boolean;
  /** Padding between bars in pixels. */
  barPadding?: number;
  /** The baseline for the x/y plot. */
  baseline?: number;
  /** Whether to cache the processed data between renders. */
  cache?: boolean;
  /** Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. */
  colorOrdinal?: boolean;
  /** Color scale key or custom color function. */
  colorScale?: string | ((d: number) => string);
  /** Configuration for the color scale component. */
  colorScaleConfig?: {
    axisConfig?: AxisConfig;
    centered?: boolean;
    colors?: string[];
    colorMin?: string;
    colorMid?: string;
    colorMax?: string;
    scale?: AxisScale;
  };
  /** Whether the color scale uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  colorScalePadding?: boolean | ((viz: VizBase) => boolean);
  /** Position of the color scale, `false` to hide it, or an accessor returning either. */
  colorScalePosition?: false | Position | (() => false | Position);
  /** Column key for matrix-style layouts. */
  column?: string;
  /**
      The confidence interval as `[lower, upper]` bounds — each given as an
      accessor function or a static data key (e.g. `["lci", "hci"]`), or `false`
      to disable.
  */
  confidence?:
    | [
        string | ((d: DataPoint, i: number) => number),
        string | ((d: DataPoint, i: number) => number),
      ]
    | false;
  /** Maximum number of data points to render before downsampling. */
  dataCutoff?: number;
  /** Active depth level for nested groupings. */
  depth?: number;
  /** Sets orientation of main category axis. */
  discrete?: "x" | "y";
  /** Default duration of transitions, in milliseconds. */
  duration?: number;
  /** Predicate filtering which data points are included, or false to disable. */
  filter?: ((d: DataPoint, i: number) => boolean) | false;
  /** Allows removing specific geographies from topojson file to improve zoom. */
  fitFilter?:
    | number
    | string
    | ((d: Record<string, unknown>) => boolean);
  /** Grouping key(s) or accessor function(s). */
  groupBy?:
    | string
    | string[]
    | ((d: DataPoint) => string | number)
    | ((d: DataPoint) => string | number)[];
  /** Padding between groups of bars in pixels. */
  groupPadding?: number;
  /** Overall height of the visualization in pixels. */
  height?: number;
  /** Color for legend shapes whose grouping is hidden (via legend click), or a `(datum, index)` accessor. */
  hiddenColor?: string | ((d: DataPoint, i: number) => string);
  /** Opacity for legend labels whose grouping is hidden (via legend click), or a `(datum, index)` accessor. */
  hiddenOpacity?: number | ((d: DataPoint, i: number) => number);
  /** The hover callback function for highlighting shapes on mouseover. */
  hover?: ((d: DataPoint, i: number) => boolean) | false | null;
  /** Persistently emphasizes matching marks (keep color) and grays the rest. */
  highlight?: ((d: DataPoint, i: number) => boolean) | false | null;
  /** Label accessor for shapes. */
  label?: string | string[] | false | AccessorFn;
  /**
      Controls legend visibility. Pass `false` to hide it, `true` to always
      show it, or a `(config, data) => boolean` accessor to decide dynamically
      — the chart defaults use an accessor to auto-hide the legend when it
      would be redundant.
  */
  legend?: boolean | ((config: D3plusConfig, arr: DataPoint[]) => boolean);
  /** Configuration for the legend component. */
  legendConfig?: {
    label?: DataPointAccessor<string>;
    shapeConfig?: Record<string, string | number>;
  };
  /** Inverts legend click behavior (click hides / shift-click solos, or the reverse), or an accessor receiving the viz. */
  legendFilterInvert?: boolean | ((viz: VizBase) => boolean);
  /** Whether the legend uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  legendPadding?: boolean | ((viz: VizBase) => boolean);
  /** Position of the legend, or an accessor returning it. */
  legendPosition?: Position | (() => Position);
  /** Custom sort comparator for legend items. */
  legendSort?: (a: DataPoint, b: DataPoint) => number;
  /** Tooltip configuration for legend items. */
  legendTooltip?: TooltipConfig;
  /** Whether to show labels on line charts. */
  lineLabels?: boolean;
  /** Whether to show the loading message. */
  loadingMessage?: boolean;
  /** Custom HTML content for the loading indicator, or a function receiving the viz instance. */
  loadingHTML?: string | ((viz: VizBase) => string);
  /** Metric key for the visualization. */
  metric?: string;
  /** Custom HTML content shown when no data is supplied, or a function receiving the viz instance. */
  noDataHTML?: string | ((viz: VizBase) => string);
  /** Ocean color for geomaps (any CSS value including 'transparent'). */
  ocean?: string;
  /** Event listeners keyed by event name. */
  on?: Record<string, (event: Event) => void>;
  /** Coordinate accessor for point-based geomaps. */
  point?: (d: DataPoint) => number[];
  /** Point size accessor for geomaps. */
  pointSize?: string | ((d: DataPoint) => number);
  /** Minimum point size for geomaps. */
  pointSizeMin?: number;
  /** Maximum point size for geomaps. */
  pointSizeMax?: number;
  /** Map projection name or function. */
  projection?: string | ((x: number, y: number) => [number, number]);
  /** Outer padding between the visualization edge and map shapes. */
  projectionPadding?: number | string;
  /** Rotation offset for the map projection center. */
  projectionRotate?: [number, number];
  /** Row key for matrix-style layouts. */
  row?: string;
  /** Scrollable container selector for tooltip positioning. */
  scrollContainer?: string | Window;
  /** Configuration for shape rendering. */
  shapeConfig?: {
    duration?: number;
    [key: string]: unknown;
  };
  /**
      A [sort comparator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
      that receives each shape class (e.g. "Circle", "Line") as its arguments.
      Shapes are drawn in groups by type, so this defines the layering order for
      all shapes of a given type.
  */
  shapeSort?: (a: string, b: string) => number;
  /** Size accessor key. */
  size?: string;
  /** Whether to stack series. */
  stacked?: boolean;
  /**
      Vertical offset applied to stacked series. One of `"diverging"`
      (default — positive and negative values split around zero), `"none"`,
      `"expand"` (normalize each stack to 100%), `"silhouette"` (streamgraph),
      or `"wiggle"` (minimize slope changes); or a custom offset function.
  */
  stackOffset?: string | ((series: number[][][], order: number[]) => void);
  /**
      Order of stacked series, from the bottom of the stack upward. Accepts a
      named order (`"descending"` [default] / `"ascending"` by summed value,
      `"key"` / `"keyReverse"` alphabetically, `"none"` / `"data"` for input
      order, or d3's `"insideOut"` / `"appearance"` / `"reverse"`), an Array of
      series keys for an explicit order, a value accessor, or a `{value, order}`
      config to rank series by an aggregate of any data field.
  */
  stackOrder?:
    | string
    | string[]
    | {value: string | ((d: DataPoint) => unknown); order?: "ascending" | "descending"}
    | ((d: DataPoint) => unknown);
  /** Subtitle text, or an accessor returning it. */
  subtitle?: string | ((data: DataPoint[]) => string);
  /** Whether the subtitle uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  subtitlePadding?: boolean | ((viz: VizBase) => boolean);
  /** Value accessor for treemaps and aggregation. */
  sum?: DataPointAccessor<number>;
  /** Accessible description applied to the root SVG (`<desc>`). */
  svgDesc?: string;
  /** Accessible title applied to the root SVG (`<title>`). */
  svgTitle?: string;
  /** Threshold value for grouping small slices. */
  threshold?: number;
  /** Label for the threshold group, or a `(datum, index)` accessor. */
  thresholdName?: string | ((d: DataPoint, i: number) => string);
  /** URL to XYZ map tiles. */
  tileUrl?: string;
  /** Whether to show map tiles. */
  tiles?: boolean;
  /** Time key for temporal data. */
  time?: string;
  /** Predicate filtering which time slices are shown, or false to disable. */
  timeFilter?: ((d: DataPoint, i: number) => boolean) | false;
  /** Whether to show the timeline component. */
  timeline?: boolean;
  /** Whether the timeline uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  timelinePadding?: boolean | ((viz: VizBase) => boolean);
  /** Chart title or title accessor function. */
  title?: string | ((data: DataPoint[]) => string);
  /** CSS style configuration for the title. */
  titleConfig?: Record<string, string | number>;
  /** Whether the title uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  titlePadding?: boolean | ((viz: VizBase) => boolean);
  /** Whether to show tooltips, or a `(datum, index)` accessor deciding per mark. */
  tooltip?: boolean | ((d: DataPoint, i: number) => boolean);
  /** Configuration for the tooltip component. */
  tooltipConfig?: TooltipConfig;
  /** Path or object for the topojson data. */
  topojson?: string | object;
  /** CSS color to fill the map shapes. */
  topojsonFill?: string;
  /** Accessor function for topojson feature IDs. */
  topojsonId?: (obj: Record<string, unknown>) => string;
  /** Whether the total uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  totalPadding?: boolean | ((viz: VizBase) => boolean);
  /** Value accessor for the visualization. */
  value?: DataPointAccessor<number>;
  /** Overall width of the visualization in pixels. */
  width?: number;
  /** Key, index, or accessor function for x-axis values. */
  x?: string | number | ((d: DataPoint, i: number) => unknown);
  /** Configuration for the x-axis. */
  xConfig?: AxisConfig;
  /** The x domain as an array. If either value is undefined, it is calculated from the data. */
  xDomain?: (number | Date)[];
  /** The x2 domain as an array. If either value is undefined, it is calculated from the data. */
  x2Domain?: (number | Date)[];
  /** Custom sort function for x-axis values. */
  xSort?: (a: DataPoint, b: DataPoint) => number;
  /** Defines a custom sorting comparator function for discrete x2 axes. */
  x2Sort?: (a: DataPoint, b: DataPoint) => number;
  /** Key, index, or accessor function for y-axis values. */
  y?: string | number | ((d: DataPoint, i: number) => unknown);
  /** Configuration for the y-axis. */
  yConfig?: AxisConfig;
  /** The y domain as an array. If either value is undefined, it is calculated from the data. */
  yDomain?: (number | Date)[];
  /** The y2 domain as an array. If either value is undefined, it is calculated from the data. */
  y2Domain?: (number | Date)[];
  /** Custom sort function for y-axis values. */
  ySort?: (a: DataPoint, b: DataPoint) => number;
  /** Defines a custom sorting comparator function for discrete y2 axes. */
  y2Sort?: (a: DataPoint, b: DataPoint) => number;
  /** Set to false to disable zooming on Geomap and Network. */
  zoom?: boolean;
  /** Multiplier applied to programmatic zoom steps. */
  zoomFactor?: number;
  /** Maximum zoom scale factor. */
  zoomMax?: number;
  /** Whether panning (drag) is enabled while zoomed. */
  zoomPan?: boolean;
  /** Whether scroll-wheel zooming is enabled. */
  zoomScroll?: boolean;

  /** Allows additional custom properties. */
  [key: string]: unknown;
}
