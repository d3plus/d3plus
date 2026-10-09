import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import type VizBase from "../charts/viz/VizBase.js";
import type {LinkOption} from "../charts/viz/linkGroup.js";
import type {FacetConfig} from "../charts/facet/facetConfig.js";
import type {AccessorFn} from "./AccessorFn.js";
import type {
  SizeLegendLineConfig,
  SizeLegendShapeConfig,
  SizeLegendTextConfig,
} from "../components/SizeLegend/SizeLegend.js";
import type {SizeLegendScale, SizeLegendSize} from "../components/SizeLegend/sizeLegendLayout.js";

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
  /**
      The baseline value: where a Plot's bars and areas start, and the value
      an axis's `baselineBreak` returns to. Defaults to `0` on an axis.
  */
  baseline?: number;
  /**
      When the domain of a linear value axis stops short of the `baseline`
      (e.g. `[1100, 2100]` with a baseline of `0`), keeps the baseline as the
      axis's end tick and breaks the axis between it and the domain: a short
      stretch of axis holds the baseline tick and two tilted marks with a gap
      in the axis line, then the domain spans the rest. Style it with the
      axis's `baselineBreakConfig`. In a Plot it applies to a user-supplied
      value domain (`yDomain`/`yConfig.domain`, or the x versions for
      horizontal bars), and bars start at the baseline tick; turned off, a
      `yDomain` stretches to reach the baseline while a `yConfig.domain` is
      kept and cuts its bars off at the axis. Defaults to `true` for BarChart
      and `false` for other Plots and a standalone Axis.
  */
  baselineBreak?: boolean;
  /**
      Style of the baseline break: `space` (pixels of axis between the baseline
      tick and the first tick after the break, default `36`), `gap` (pixels
      between the two marks, where the axis line is not drawn, default `5`),
      `size` (length of each mark, drawn outward from the axis line on the
      tick side so it never reaches into the plot, default `10`), `angle`
      (degrees each mark tilts from perpendicular to the axis, default `30`),
      `lines` (whether a Plot runs a straight line across the plot from the
      foot of each mark, perpendicular to the axis, default `true`; they take
      the axis line's `barConfig` style), `lineConfig` (those lines'
      `stroke`, `stroke-width`, and other line styles, layered over the axis
      line style), `mask` (whether a Plot cuts the gap between the two
      lines straight across the shapes, default `false`), plus `stroke`,
      `stroke-width`, and the other line styles `barConfig` takes, for the
      marks.
  */
  baselineBreakConfig?: Record<string, string | number | boolean | Record<string, string | number>>;
  /**
      Value ranges to remove from a linear axis: one `[start, end]` pair, or a
      list of them (`[[start, end], [start, end]]`). Each range collapses to a
      short fixed gap in the axis, marked like the baseline break, with no
      ticks or gridlines inside it and both of its edges labeled; the values
      on either side keep one shared scale. Reversed pairs are flipped,
      overlapping ones merged, and ranges that don't lie strictly inside the
      domain (or that don't leave room for the data) are ignored. Only
      positions change — tooltips and labels still show the real values.
  */
  break?: false | [number, number] | [number, number][];
  /**
      Style of the ranges set with `break`: the same `space`, `gap`, `size`,
      `angle`, `lines`, `lineConfig`, and mark line styles as
      `baselineBreakConfig`, with `mask` (whether a Plot cuts the gap between
      the break's two lines straight across the shapes) defaulting to `true`.
  */
  breakConfig?: Record<string, string | number | boolean | Record<string, string | number>>;
  /** Grid values of the axis. */
  grid?: unknown[];
  gridConfig?: Record<string, string | number>;
  /** Grid size of the axis. */
  gridSize?: number;
  label?: string;
  /** Visible tick labels of the axis. */
  labels?: unknown[];
  labelOffset?: false | number;
  /**
      Exact size of the space that contains the axis tick labels and title.
      Labels that need more room overflow outward instead of moving the axis
      line; zooming pins a rescaled axis this way so it doesn't shift.
  */
  fixedSize?: number;
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
  /**
      Whether the domain's min and max are always shown as ticks, even when
      they aren't among the scale's own "nice" tick values (the nearest nice
      tick is dropped when it would crowd them). Defaults to `true`; zooming
      turns it off so a rescaled axis shows only nice values.
  */
  domainTicks?: boolean;
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
  /**
      Whether a chart's tooltip title leads with a swatch of the hovered
      shape's color and shape. `true` by default; set it in `legendTooltip`
      to drop the swatch from legend tooltips only.
  */
  titleSwatch?: boolean;
  body?: ((d: DataPoint) => string) | string;
  /**
      Header rows. A cell function receives `(d, i, x)`; in Pie, Treemap, and
      stacked Plot charts `x.share` is the row's fraction of its total, unless
      the data has its own `share` field (then `x.share` is that field).
  */
  thead?:
    | ((d: DataPoint) => [string, string][])
    | Array<
        Array<
          | ((d: DataPoint, i?: number, x?: {share: number}) => string)
          | string
        >
      >;
  /**
      Body rows. A cell function receives `(d, i, x)`; in Pie, Treemap, and
      stacked Plot charts `x.share` is the row's fraction of its total, unless
      the data has its own `share` field (then `x.share` is that field).
  */
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

export interface SizeLegendConfig {
  /**
      The values to draw circles for: an array of values, how many to pick
      from the size domain (default 3: its min, max, and a round middle), or
      a function receiving the `[min, max]` domain and returning values.
  */
  values?: number[] | number | ((domain: [number, number]) => number[]);
  /** Formats each value's label. Defaults to the locale's abbreviated number format. */
  tickFormat?: (value: number) => string;
  /** Title above the circles. Defaults to the `size` key when `size` is set to a string. */
  title?: string;
  /** Circle paint: `fill`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeOpacity`. */
  shapeConfig?: SizeLegendShapeConfig;
  /** Leader-line paint: `stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`. */
  lineConfig?: SizeLegendLineConfig;
  /** Value-label font: `fontColor`, `fontFamily`, `fontSize`. */
  labelConfig?: SizeLegendTextConfig;
  /** Title font: `fontColor`, `fontFamily`, `fontSize`, `fontWeight`. */
  titleConfig?: SizeLegendTextConfig;
  padding?: number;
  /** Length of the leader lines past the largest circle, in pixels. */
  lineLength?: number;
  /** Gap between each leader line and its label, in pixels. */
  labelPadding?: number;
}

export interface TrendLineConfig {
  /** `"series"` (default) fits one line per series, colored to match it; `"all"` fits one line to every point. Stacked charts always fit the stack totals. */
  group?: "series" | "all";
  /** The polynomial degree when `trendLine` is `"polynomial"`. Defaults to 2. */
  order?: number;
  /** Draws a confidence band around a linear fit. Defaults to `false`. */
  confidence?: boolean;
  /** The confidence band's level, between 0 and 1. Defaults to 0.95. */
  confidenceLevel?: number;
  /** Area shape config for the confidence band. Its fill defaults to the line color. */
  confidenceConfig?: Record<string, unknown>;
  /**
      Extends each trend line past the end of its data: a number of steps (at the data's own spacing — the median gap between values, or the calendar interval of dates), or `{to}` an end value to step up to (a number, or on a time axis a Date or a parseable date such as a year). Widens the axis to fit. Ignored on a category axis. Defaults to `0` (off).
  */
  projection?: number | {to: number | string | Date};
  /** Line shape config for the projected stretch, merged over the line's own styles. Defaults to `{strokeDasharray: "2 4"}`. */
  projectionConfig?: Record<string, unknown>;
  /** Shows the fitted equation, R², and observations when hovering a line. Defaults to `true`. */
  tooltip?: boolean;
  /** Line color. Defaults to the series color (dark gray when `group` is `"all"`). */
  stroke?: string;
  /** Line width in pixels. Defaults to 2. */
  strokeWidth?: number;
  /** Line dash pattern. Defaults to `"6 4"`. */
  strokeDasharray?: string;
  /** Other Line shape config. */
  [key: string]: unknown;
}

export interface ColorScaleConfig {
  /** The scale's colors: one color, expanded into a light→dark ramp, or an array of colors to step through. */
  color?: string | string[];
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

/** `colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors. */
export type ColorDefaultsConfig = Partial<Omit<ColorDefaults, "scale">> & {
  scale?: ColorDefaults["scale"] | string[];
};

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
  /**
      The Radar's axis styles, named after the parts of a Plot axis: the
      inner level rings are its gridlines (`gridConfig`, a faint stroke like
      Plot's gridlines), the outer ring is its axis line (`barConfig`, the
      chart's background ink), and the spokes and metric labels are its ticks
      (`shapeConfig`, with `shapeConfig.labelConfig` for the labels). Ring
      styles take `stroke`, `strokeWidth`, `strokeOpacity`,
      `strokeDasharray`, and `opacity` (or Plot's `"stroke-width"` spelling),
      each a value or a `(ring, i) => value` accessor.
  */
  axisConfig?: {
    barConfig?: Record<string, unknown>;
    gridConfig?: Record<string, unknown>;
    shapeConfig?: Record<string, unknown>;
  };
  /**
      Text (rendered as HTML — any valid HTML string works, including anchor
      links) shown in the chart's bottom-right corner, most often a map tile
      credit. `false` (the default) shows nothing. A credit wider than half
      the chart area collapses to a small "ⓘ" badge that expands on hover,
      focus, or click.
  */
  attribution?: string | boolean;
  /**
      Overrides the "ⓘ" badge a long attribution collapses to, which
      otherwise renders as an inline SVG. A string is used as the badge's
      raw HTML content; a mount function, `(el: HTMLElement) => void | (() =>
      void)`, is called once with the badge's reserved element so a live
      component (a React tree via `createRoot(el).render(...)`, or anything
      else imperative) can be mounted into it — return a cleanup function if
      there's teardown to do.
  */
  attributionIcon?: string | ((el: HTMLElement) => void | (() => void));
  /** CSS key/value pairs used to style the attribution text. */
  attributionStyle?: Record<string, unknown>;
  /** Additional CSS class name(s) applied to the back button, alongside the fixed `back-control` class. */
  backControlClassName?: string;
  /** Padding between bars in pixels. */
  barPadding?: number;
  /**
      The baseline value: where a Plot's bars and areas start, and the value
      an axis's `baselineBreak` returns to. Defaults to `0` on an axis.
  */
  baseline?: number;
  /**
      When the domain of a linear value axis stops short of the `baseline`
      (e.g. `[1100, 2100]` with a baseline of `0`), keeps the baseline as the
      axis's end tick and breaks the axis between it and the domain: a short
      stretch of axis holds the baseline tick and two tilted marks with a gap
      in the axis line, then the domain spans the rest. Style it with the
      axis's `baselineBreakConfig`. In a Plot it applies to a user-supplied
      value domain (`yDomain`/`yConfig.domain`, or the x versions for
      horizontal bars), and bars start at the baseline tick; turned off, a
      `yDomain` stretches to reach the baseline while a `yConfig.domain` is
      kept and cuts its bars off at the axis. Defaults to `true` for BarChart
      and `false` for other Plots and a standalone Axis.
  */
  baselineBreak?: boolean;
  /** Whether to cache the processed data between renders. */
  cache?: boolean;
  /** Overrides for the default colors used for data fills and legible text (see `colorDefaults` in @d3plus/color). */
  colorDefaults?: ColorDefaultsConfig;
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
  /** Pyramid: where the category labels go — `"center"` (a gutter between the halves, the default) or `"left"`. */
  categoryPosition?: "center" | "left";
  /** Pyramid: a comparison value per row (data key or accessor), drawn as an outline around each side's bars. */
  comparison?: string | ((d: DataPoint, i: number) => number) | false;
  /** Pyramid: line styles for the comparison outline (`stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`), each optionally a function of the side value and its index. */
  comparisonConfig?: Record<string, unknown>;
  /**
      The confidence interval as `[lower, upper]` bounds — each given as an
      accessor function or a static data key (e.g. `["lci", "hci"]`), or `false`
      to disable (no band or error bars, no axis widening, no tooltip bounds).
      Lines draw it as a band, bars as error bars.
  */
  confidence?:
    | [
        string | ((d: DataPoint, i: number) => number) | false,
        string | ((d: DataPoint, i: number) => number) | false,
      ]
    | false;
  /**
      Styles the `confidence` interval: a line's band (an Area) or a bar's
      error bar (a Path, with `stroke`, `strokeWidth`, and `capWidth` — the end
      caps' length in pixels or as a percentage string of the bar's thickness).
      Keys nested under `Area` or `Bar` apply only to that shape. `tooltip:
      false` leaves the bounds out of tooltips. Accepted keys: any Area or
      Path key, `capWidth`, `tooltip`, `Area` (Area keys), and `Bar` (Path
      keys and `capWidth`); any other key logs a warning.
  */
  confidenceConfig?: Record<string, unknown>;
  /**
      Paint for the shared tooltip's crosshair guide line (`stroke`,
      `strokeWidth`, `strokeDasharray`, `strokeOpacity`, …).
  */
  crosshairConfig?: Record<string, unknown>;
  /** Maximum number of data points to render before downsampling. */
  dataCutoff?: number;
  /** Active depth level for nested groupings. */
  depth?: number;
  /** Sets orientation of main category axis. */
  discrete?: "x" | "y";
  /** Default duration of transitions, in milliseconds. */
  duration?: number;
  /** Splits the chart into small multiples: one equally sized panel per distinct value of this data key or accessor, sharing one legend, color scale, title, and timeline. `false` draws a single chart. */
  facet?: string | ((d: DataPoint, i: number) => unknown) | false;
  /** Layout and scale sharing for small multiples (see `facet`): `columns`, `rows`, `padding`, `sort`, `scales` (`"shared"` or `"independent"`), `axes` (`"outer"` or `"all"`), `title`, and `titleConfig`. */
  facetConfig?: FacetConfig;
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
      would be redundant, and to show it with one entry per category when
      `color` is a category that isn't a `groupBy` level.
  */
  legend?: boolean | ((config: D3plusConfig, arr: DataPoint[]) => boolean);
  /** Configuration for the legend component. */
  legendConfig?: {
    label?: DataPointAccessor<string>;
    /**
        Each item's swatch: `"Rect"` (a square), `"Circle"` (a dot), or `"Line"`
        (a dot with a short stroke through it). Defaults to the shape of the
        series it stands for: a dot for Circles, the line glyph for Lines, and
        a square for everything else.
    */
    shape?: "Rect" | "Circle" | "Line" | DataPointAccessor<string>;
    shapeConfig?: Record<string, string | number>;
  };
  /** Inverts legend click behavior (click hides / shift-click solos, or the reverse), or an accessor receiving the viz. */
  legendFilterInvert?: boolean | ((viz: VizBase) => boolean);
  /**
      Whether one legend may be drawn inside the empty space around the chart's
      marks instead of in a margin (size legend first, then legend, then
      colorScale), or an accessor receiving the resolved config. Defaults to `true`.
  */
  legendInset?: boolean | ((config: D3plusConfig) => boolean);
  /** Style of the semi-transparent box behind a legend drawn inside the chart. */
  legendInsetConfig?: {
    /** Box fill; defaults to the chart's background color. */
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    /** Corner radius. */
    rx?: number;
    /** Space between the box's edge and the legend inside it. */
    margin?: number;
    /** Space kept between the box and the chart's marks and edges. */
    padding?: number;
  };
  /** Whether the legend uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  legendPadding?: boolean | ((viz: VizBase) => boolean);
  /** Position of the legend, or an accessor returning it. */
  legendPosition?: Position | (() => Position);
  /** Custom sort comparator for legend items. */
  legendSort?: (a: DataPoint, b: DataPoint) => number;
  /** Tooltip configuration for legend items. */
  legendTooltip?: TooltipConfig;
  /**
      Formats the Radar's level value labels. Receives the ring's value and
      returns its label. Defaults to the abbreviated number format the axes
      use (`1.5k`, `2M`, …).
  */
  levelFormat?: (d: number) => string | number;
  /**
      Direction of the Radar's level value labels, in degrees clockwise from
      12 o'clock. `0` (the default) runs the labels straight up from the
      center. Each label sits just inside its ring, offset to the clockwise
      side of that direction so neither line crosses the text. Spokes start
      at 3 o'clock, so the spoke for the metric at index `i` of `n` sits at
      `90 + 360 * i / n` degrees.
  */
  levelLabelAngle?: number;
  /** Style of the Radar's level value labels. */
  levelLabelConfig?: {
    /** Text color. Defaults to the color that contrasts with the chart's background. */
    fontColor?: string;
    /** Font family. Defaults to the chart's `fontFamily`. */
    fontFamily?: string | string[];
    /** Text opacity. Defaults to `1`. */
    fontOpacity?: number;
    /** Font size, in pixels. Defaults to `10`. */
    fontSize?: number;
    /** Font weight. Defaults to `400`. */
    fontWeight?: number | string;
  };
  /** Whether the Radar labels each level ring with its value. Defaults to `true`. */
  levelLabels?: boolean;
  /**
      The Radar's level rings. A number (default `6`) is the approximate ring
      count: the radial domain is rounded out to "nice" values and the rings
      sit on its ticks, the same way axis ticks are chosen. An array sets the
      exact ring values.
  */
  levels?: number | number[];
  /** Whether to show labels on line charts. */
  lineLabels?: boolean;
  /** Links this chart to every other chart with the same group name, so hovering, `active`, `highlight` (including search), and legend hide/solo clicks in one are mirrored in the rest, and a value gets the same categorical color in every chart. Rows match across charts by the value of `by` (a data key or accessor), which defaults to the chart's own id. A string is shorthand for `{group}`; set `hover`, `active`, `highlight`, `legend`, or `color` to `false` to stop sharing that behavior. */
  link?: LinkOption;
  /** Whether to show the loading message. */
  loadingMessage?: boolean;
  /** Custom HTML content for the loading indicator, or a function receiving the viz instance. */
  loadingHTML?: string | ((viz: VizBase) => string);
  /** Metric key for the visualization. */
  metric?: string;
  /** Shows a small overview + draggable-viewport minimap underneath the zoom controls once the chart is zoomed in. On by default whenever `zoom` is enabled. */
  minimap?: boolean;
  /** Additional CSS class name(s) applied to the minimap, alongside its fixed `d3plus-minimap`/etc. classes. */
  minimapClassName?: string;
  /** Custom HTML content shown when no data is supplied, or a function receiving the viz instance. */
  noDataHTML?: string | ((viz: VizBase) => string);
  /**
      Ocean color for geomaps (any CSS value including 'transparent'), or a
      `{light, dark}` pair chosen by the chart's backdrop. Defaults to the
      default basemap's own water colors.
  */
  ocean?: string | {light: string; dark: string};
  /** Event listeners keyed by event name. */
  on?: Record<string, (event: Event) => void>;
  /**
      Room (px) the Radar reserves around its web for the metric labels.
      `"auto"` (the default) measures the labels and gives the web the largest
      radius at which every label fits inside the chart, wrapping long labels
      onto two lines (and truncating what still doesn't fit) rather than
      shrinking the web below half its largest possible size. A number
      reserves exactly that much room and wraps labels to that width.
  */
  outerPadding?: number | "auto";
  /** Pyramid: draws each value as a fraction of the frame's total, with the axis and tooltip reading percentages. */
  percent?: boolean;
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
  /** Shows a top-left search button that expands into an input; typing highlights shapes whose label matches. On by default for every chart. */
  search?: boolean;
  /** Resolves the string the search box matches its typed term against, for a given datum. Defaults to the mark's resolved on-screen label. */
  searchAccessor?: (d: DataPoint, i: number) => string;
  /** Additional CSS class name(s) applied to the search toggle button and input, alongside the fixed `search-control` classes. */
  searchControlClassName?: string;
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
  /** Pyramid: the side values (the first `groupBy` level) as `[left, right]`. */
  sides?: unknown[];
  /** Pyramid: TextBox styles for the side titles. */
  sideTitleConfig?: TextBoxConfig;
  /** Pyramid: draws the name of each side above its half of the chart. */
  sideTitles?: boolean;
  /** Size accessor key. */
  size?: string;
  /**
      Controls size-legend visibility — the nested-circle key drawn in the
      bottom-right corner of charts that size their marks. Shown by default
      whenever marks are sized by more than one value, unless it would take
      up more than a third of the chart's width or height; pass `true` to
      always show it, `false` to hide it, or a `(config, scale, size) =>
      boolean` accessor.
  */
  sizeLegend?:
    | boolean
    | ((config: D3plusConfig, scale: SizeLegendScale, size: SizeLegendSize) => boolean);
  /** Configuration for the size-legend component. */
  sizeLegendConfig?: SizeLegendConfig;
  /**
      Which margin the size legend claims in the bottom-right corner:
      `"right"` (default) keeps the chart's full height, `"bottom"` its full
      width.
  */
  sizeLegendPosition?: "right" | "bottom";
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
  /**
      Packs a Plot's circles into a beeswarm: each circle keeps its value along
      one axis and is placed beside its neighbors along the other, so none
      overlap. `"x"` or `"y"` names the value axis; `true` uses x when its
      values are numeric, else y; `false` draws a plain scatter. When the other
      axis holds categories (strings), each category gets its own swarm in its
      own band; otherwise that axis's values are ignored and its axis is hidden.
      Circles keep their ids, so switching a chart between `false` and `true`
      animates each circle between its scatter and swarm position. The default,
      `"auto"`, swarms only when every mark is a Circle and every row lacks a y
      (or x) value.
  */
  swarm?: boolean | "auto" | "x" | "y";
  /**
      Options for `swarm`: `padding`, the minimum pixel gap between circles
      (default `1`), and `overflow`, what happens when a swarm is wider than
      its band — `"shrink"` (default) scales every circle down until each
      swarm fits, `"clamp"` keeps the sizes and holds outlying circles at the
      band's edge, and `"visible"` lets swarms spill past their band.
  */
  swarmConfig?: {padding?: number; overflow?: "shrink" | "clamp" | "visible"};
  /** Whether the subtitle uses the visualization's internal padding when positioning, or an accessor receiving the viz. */
  subtitlePadding?: boolean | ((viz: VizBase) => boolean);
  /** Value accessor for treemaps and aggregation. */
  sum?: DataPointAccessor<number>;
  /** Accessible description applied to the root SVG (`<desc>`). */
  svgDesc?: string;
  /** Accessible title applied to the root SVG (`<title>`). */
  svgTitle?: string;
  /** Pyramid: centers the value axis on zero so both halves share one scale. */
  symmetric?: boolean;
  /** Enables the top-left table-view toggle button, which swaps the chart for a static, scrollable `<table>` of its data. On by default for every chart. */
  tableView?: boolean;
  /** Additional CSS class name(s) applied to the `<table>` element rendered while in table view, alongside the fixed `d3plus-table-view-table` class. */
  tableViewClassName?: string;
  /** Additional CSS class name(s) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. */
  tableViewControlClassName?: string;
  /** CSS key/value pairs styling the table-view toggle button. `false` removes all default styling. */
  tableViewControlStyle?: Record<string, unknown> | false;
  /** CSS key/value pairs styling the table-view toggle button while active (showing the data table). `false` removes all default styling. */
  tableViewControlStyleActive?: Record<string, unknown> | false;
  /** CSS key/value pairs styling the table-view toggle button on hover. `false` removes all default styling. */
  tableViewControlStyleHover?: Record<string, unknown> | false;
  /** Whether the data table shows a "download CSV" button, exporting its full (sorted, unpaginated) rows. On by default. */
  tableViewDownload?: boolean;
  /** Rows per page while in table view. `false` (or any non-positive number) disables pagination and shows every row on one page. */
  tableViewPageSize?: number | false;
  /** Whether the data table's column headers are clickable to sort (toggling asc/desc). On by default. */
  tableViewSort?: boolean;
  /** Threshold value for grouping small slices. */
  threshold?: number;
  /** Label for the threshold group, or a `(datum, index)` accessor. */
  thresholdName?: string | ((d: DataPoint, i: number) => string);
  /**
      URL template for XYZ map tiles, with `{z}`, `{x}`, `{y}` (and optional
      `{s}` subdomain) placeholders — or a `{light, dark}` pair, chosen by the
      chart's backdrop. Defaults to Esri's Light Gray and Dark Gray Canvas.
  */
  tileUrl?: string | {light: string; dark: string};
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
  /**
      Whether hovering a Plot's plot area shows one tooltip listing every
      series' value at the nearest discrete-axis position, with a crosshair
      through it. Applies when a discrete axis is set and at least two series
      share that position.
  */
  tooltipShared?: boolean;
  /**
      Draws an automatic trend line fit to the plotted data: `true` (or
      `"linear"`) for a least-squares line, or `"exponential"`,
      `"logarithmic"`, `"power"`, or `"polynomial"`. `false` removes it.
  */
  trendLine?: boolean | "linear" | "exponential" | "logarithmic" | "power" | "polynomial";
  /**
      Options for the trend lines: `group` (`"series"` or `"all"`), the
      polynomial `order`, a `confidence` band with `confidenceLevel` and
      `confidenceConfig`, a `projection` into the future with
      `projectionConfig`, `tooltip`, and Line styles (`stroke`,
      `strokeWidth`, `strokeDasharray`, …).
  */
  trendLineConfig?: TrendLineConfig;
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
  /**
      Value range(s) to remove from the x axis — `[start, end]` or a list of
      them — drawn as a break in the axis with a gap cut across the shapes
      that cross it (see the axis `break` and `breakConfig`).
  */
  xBreak?: [number, number] | [number, number][];
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
  /**
      Value range(s) to remove from the y axis — `[start, end]` or a list of
      them, e.g. `[100, 900]` to fit one outlier bar — drawn as a break in the
      axis with a gap cut across the shapes that cross it (see the axis
      `break` and `breakConfig`).
  */
  yBreak?: [number, number] | [number, number][];
  /** The y domain as an array. If either value is undefined, it is calculated from the data. */
  yDomain?: (number | Date)[];
  /** The y2 domain as an array. If either value is undefined, it is calculated from the data. */
  y2Domain?: (number | Date)[];
  /** Custom sort function for y-axis values. */
  ySort?: (a: DataPoint, b: DataPoint) => number;
  /** Defines a custom sorting comparator function for discrete y2 axes. */
  y2Sort?: (a: DataPoint, b: DataPoint) => number;
  /** Enables pan/zoom with zoom-control buttons. On by default for every chart. */
  zoom?: boolean;
  /** Additional CSS class name(s) applied to each zoom control button, alongside the fixed `zoom-control`/`zoom-in`/etc. classes. */
  zoomControlClassName?: string;
  /**
      Overrides one or more of the four built-in zoom-control icons (`zoomIn`,
      `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline
      SVGs. Each value is either raw HTML — used as that button's content — or
      a mount function, `(el: HTMLElement) => void | (() => void)`, called
      once with the button's reserved icon slot so a live component (a React
      tree via `createRoot(el).render(...)`, or anything else imperative) can
      be mounted into it — return a cleanup function if there's teardown to do.
  */
  zoomControlIcons?: Partial<
    Record<
      "zoomIn" | "zoomOut" | "zoomReset" | "zoomBrush",
      string | ((el: HTMLElement) => void | (() => void))
    >
  >;
  /** Multiplier applied to programmatic zoom steps. */
  zoomFactor?: number;
  /** Maximum zoom scale factor. Defaults to the scale at which the smallest shape fills the chart area. */
  zoomMax?: number;
  /** Whether panning (drag) is enabled while zoomed. */
  zoomPan?: boolean;
  /**
      Whether the mouse wheel (and one-finger touch) zooms. `"modifier"` (the
      default) leaves page scrolling alone: only
      Ctrl/⌘ + wheel or a trackpad/two-finger pinch zooms, and one finger pans
      only once zoomed in. `true` zooms on any wheel; `false` never does.
  */
  zoomScroll?: boolean | "modifier";

  /** Allows additional custom properties. */
  [key: string]: unknown;
}
