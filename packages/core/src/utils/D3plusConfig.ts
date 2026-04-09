import type {DataPoint} from "@d3plus/data";

type Position = "top" | "right" | "bottom" | "left";

type DataPointAccessor<T> = string | ((d: DataPoint) => T);

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
  gridConfig?: Record<string, string | number>;
  label?: string;
  labels?: unknown[];
  labelOffset?: false | number;
  maxSize?: number;
  scale?: AxisScale;
  tickFormat?: (d: number | string) => string | number;
  ticks?: unknown[];
  tickSize?: number;
  title?: string;
}

export interface TooltipConfig {
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

export interface D3plusConfig {
  /** Data array or URL string to load data from. */
  data?: DataPoint[] | string;
  /** Locale code used for text and number formatting. */
  locale?: string;

  /** Custom aggregation functions keyed by data property. */
  aggs?: {[k: string]: (d: DataPoint[]) => unknown};
  /** Padding between bars in pixels. */
  barPadding?: number;
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
  /** Position of the color scale, or false to hide it. */
  colorScalePosition?: false | Position;
  /** Column key for matrix-style layouts. */
  column?: string;
  /** Active depth level for nested groupings. */
  depth?: number;
  /** Sets orientation of main category axis. */
  discrete?: "x" | "y";
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
  /** Label accessor for shapes. */
  label?: string | ((...args: unknown[]) => string);
  /** Whether to show the legend. */
  legend?: boolean;
  /** Configuration for the legend component. */
  legendConfig?: {
    label?: DataPointAccessor<string>;
    shapeConfig?: Record<string, string | number>;
  };
  /** Position of the legend. */
  legendPosition?: Position;
  /** Tooltip configuration for legend items. */
  legendTooltip?: TooltipConfig;
  /** Whether to show labels on line charts. */
  lineLabels?: boolean;
  /** Whether to show the loading message. */
  loadingMessage?: boolean;
  /** Custom HTML content for the loading indicator. */
  loadingHTML?: string;
  /** Metric key for the visualization. */
  metric?: string;
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
  /** Size accessor key. */
  size?: string;
  /** Whether to stack series. */
  stacked?: boolean;
  /** Custom order for stacked series. */
  stackOrder?: string[];
  /** Value accessor for treemaps and aggregation. */
  sum?: DataPointAccessor<number>;
  /** Threshold value for grouping small slices. */
  threshold?: number;
  /** Label for the threshold group. */
  thresholdName?: string;
  /** URL to XYZ map tiles. */
  tileUrl?: string;
  /** Whether to show map tiles. */
  tiles?: boolean;
  /** Time key for temporal data. */
  time?: string;
  /** Chart title or title accessor function. */
  title?: string | ((data: DataPoint[]) => string);
  /** CSS style configuration for the title. */
  titleConfig?: Record<string, string | number>;
  /** Whether to show tooltips. */
  tooltip?: boolean;
  /** Configuration for the tooltip component. */
  tooltipConfig?: TooltipConfig;
  /** Path or object for the topojson data. */
  topojson?: string | object;
  /** CSS color to fill the map shapes. */
  topojsonFill?: string;
  /** Accessor function for topojson feature IDs. */
  topojsonId?: (obj: Record<string, unknown>) => string;
  /** Value accessor for the visualization. */
  value?: DataPointAccessor<number>;
  /** Key, index, or accessor function for x-axis values. */
  x?: string | number | ((...args: unknown[]) => unknown);
  /** Configuration for the x-axis. */
  xConfig?: AxisConfig;
  /** Custom sort function for x-axis values. */
  xSort?: (a: DataPoint, b: DataPoint) => number;
  /** Key, index, or accessor function for y-axis values. */
  y?: string | number | ((...args: unknown[]) => unknown);
  /** Configuration for the y-axis. */
  yConfig?: AxisConfig;
  /** Custom sort function for y-axis values. */
  ySort?: (a: DataPoint, b: DataPoint) => number;
  /** Set to false to disable zooming on geomaps. */
  zoom?: false;

  /** Allows additional custom properties. */
  [key: string]: unknown;
}
