import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import type VizBase from "../charts/viz/VizBase.js";
import type {LinkOption} from "../charts/viz/linkGroup.js";
import type {BarShareInfo} from "../charts/Plot/barWidth.js";
import type {ConnectGaps} from "../charts/Plot/connectGaps.js";
import type {SlopeColorSetting} from "../charts/SlopeChart/slope.js";
import type {
  LineLabelConfig,
  LineLabelsSetting,
} from "../charts/Plot/lineLabelSides.js";
import type {FacetConfig} from "../charts/facet/facetConfig.js";
import type {BrushSelection} from "../charts/ParallelCoordinates/brushFilter.js";
import type {DimensionOptions} from "../charts/ParallelCoordinates/dimensions.js";
import type {AlluvialDimensionInput} from "../charts/Alluvial/dimensions.js";
import type {AccessorFn} from "./AccessorFn.js";
import type {ThemeSetting} from "./theme.js";
import type {
  ConstOrAccessor,
  CssColor,
  Orient,
  SideOrient,
} from "../shapes/shapeConfig.js";
import type {
  SizeLegendLineConfig,
  SizeLegendShapeConfig,
  SizeLegendTextConfig,
} from "../components/SizeLegend/SizeLegend.js";
import type {
  SizeLegendScale,
  SizeLegendSize,
} from "../components/SizeLegend/sizeLegendLayout.js";
import type {ColorScaleTypeSetting} from "../components/ColorScale/colorScaleType.js";
import type {ColorScaleHoverMarkConfig} from "../components/ColorScale/colorScaleHoverMark.js";
import type {
  ReferenceBandConfig,
  ReferenceLineConfig,
} from "../charts/features/annotationTypes.js";
import type {RangeBreakRule} from "../components/Axis/rangeBreaks.js";
import type {
  BinValueOption,
  ContourConfig,
  ContoursOption,
  PointConfig,
} from "../charts/Hexbin/settings.js";

type Position = "top" | "right" | "bottom" | "left";
/** One variable of a bivariate `colorScale`: a data key, or an accessor returning a number. */
export type ColorScaleField =
  string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]);

/** A legend or colorScale side, or `"auto"` to let the chart choose (inside the chart when it fits, else right on wide charts and bottom otherwise). */
type PanelPosition = Position | "auto";

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
      The axis's domain: `[min, max]` on a continuous axis, or the categories
      to show on a discrete one. In a Plot it overrides `xDomain`/`yDomain`
      and isn't rounded unless `rounding` says so; a single end (`[min]` or
      `[undefined, max]`) pins that end like `yDomain([min])`.
  */
  domain?: (number | string | Date | undefined)[];
  /**
      The tick the axis's `baselineBreak` returns to. Defaults to `0`. To start
      a Plot's value axis at a value, set the chart's `baseline` instead.
  */
  baseline?: number;
  /**
      When a linear value axis's domain stops short of the `baseline` (e.g.
      `[1100, 2100]` with a baseline of `0`), keeps the baseline tick and
      breaks the axis between it and the domain, styled by
      `baselineBreakConfig`. Turned off, a Plot's `yDomain` stretches to the
      baseline instead. Defaults to `true` for Plots whose marks grow from `0`
      (BarChart, AreaPlot, Histogram, Lollipop), else `false`.
  */
  baselineBreak?: boolean;
  /**
      Style of the baseline break: `space` (axis pixels between the baseline
      tick and the domain, default `36`), `gap` (pixels between the two marks,
      default `5`), `size` (mark length, default `10`), `angle` (mark tilt in
      degrees, default `30`), `lines` (whether a Plot draws lines across the
      plot at the break, default `true`), `lineConfig` (their style), `mask`
      (whether a Plot cuts the gap across its shapes, default `true`), and
      `stroke`, `stroke-width`, and other line styles for the marks.
  */
  baselineBreakConfig?: Record<
    string,
    string | number | boolean | Record<string, string | number>
  >;
  /**
      Value ranges to remove from a linear axis: one `[start, end]` pair or a
      list of them. Each collapses to a short marked gap (styled by
      `breakConfig`); values either side share one scale, and tooltips still
      show real values. Ranges outside the domain are ignored.
  */
  break?: false | [number, number] | [number, number][];
  /**
      Style of the ranges set with `break`: the same `space`, `gap`, `size`,
      `angle`, `lines`, `lineConfig`, `mask`, and mark line styles, with the
      same defaults, as `baselineBreakConfig`, plus `spaceMin`: the least
      `space` a break shrinks to on an axis too short for it (by default it
      is dropped instead).
  */
  breakConfig?: Record<
    string,
    string | number | boolean | Record<string, string | number>
  >;
  /**
      Stretches of time to hide from a time axis (weekends, nights, holidays),
      so the data closes up around them: one rule or a list of them.
      `"weekends"`; `{days: [5, 6]}` (0 is Sunday); `{hours: [17, 9]}`, daily,
      wrapping past midnight (`9.5` is 9:30); `{values: [date, …]}`, whole
      days; or `{bounds: [start, end]}`, one range. Rules use local time. A
      rule's `marker` draws the `break` marker at the gap (on by default for
      `bounds` only).
      @example
      {rangeBreaks: ["weekends", {hours: [16, 9.5]}, {values: ["2024-07-04"]}]}
  */
  rangeBreaks?: false | RangeBreakRule | RangeBreakRule[];
  /** Grid values of the axis. */
  grid?: unknown[];
  gridConfig?: Record<string, string | number>;
  /** Grid size of the axis. */
  gridSize?: number;
  label?: string;
  /**
      Visible tick labels of the axis. Also takes a list of label lists, from
      the most labels to the fewest: the axis labels the first list whose
      labels all fit whole without crowding, else the last one, thinned. Its
      ticks then follow the chosen list unless `ticks` is set.
  */
  labels?: unknown[];
  labelOffset?: false | number;
  /**
      Whether to rotate the axis labels: `true` rotates them -90 degrees,
      `false` keeps them flat, and a number rotates them that many degrees
      clockwise (`-45` rises to the right). Unset (the default), a horizontal
      axis of categories slants its labels when they don't fit flat.
  */
  labelRotation?: boolean | number;
  /**
      Exact size of the space that contains the axis tick labels and title.
      Labels that need more room overflow outward instead of moving the axis
      line; zooming pins a rescaled axis this way so it doesn't shift.
  */
  fixedSize?: number;
  /**
      Maximum size allowed for the space that contains the axis tick labels
      and title: a number of pixels, or a function that is given the room the
      axis has across its labels and returns that maximum. The room is a
      horizontal axis's `height` or a vertical axis's `width`; in a chart, it
      is the chart's height (for a horizontal axis) or width (for a vertical
      one) inside its margins. A chart can call the function more than once
      in a draw, so it should depend only on its argument.
      @example
      {maxSize: size => size / 3}
  */
  maxSize?: number | ((size: number) => number);
  /** Minimum size alloted for the space that contains the axis tick labels and title. */
  minSize?: number;
  /**
      Scale range (in pixels) of the axis. The given array must have 2 values,
      but one may be `undefined` to allow the default behavior for that value.
  */
  range?: (number | undefined)[];
  /**
      Tick formatter for labels drawn rotated (see `labelRotation`), in place
      of `tickFormat`: rotation is decided by measuring the labels this way,
      so a long label can rotate in a shorter form.
  */
  rotatedTickFormat?: (d: number | string) => string | number;
  /**
      How a linear or log axis rounds its domain to "nice" values: "outside"
      widens each end past the data, "inside" pulls each end in, and "none"
      keeps it as given. Defaults to "none" on an Axis and "outside" in a
      Plot. A Plot only rounds the ends a user domain leaves open, unless
      `rounding` is set here.
  */
  rounding?: "none" | "outside" | "inside";
  /** Scale of the axis. */
  scale?: AxisScale;
  /**
      The exponent of a `"pow"` axis (`scale: "pow"`): below 1 it spreads the
      small values out and squeezes the large ones together (`0.5` matches
      a `"sqrt"` axis), above 1 it does the opposite. Defaults to `1`, which
      draws like a linear axis. Only a `"pow"` axis reads it; on any other
      scale it has no effect, and a value that isn't a positive number falls
      back to `1`. Ticks are spaced evenly along a power axis and rounded to
      round values.
  */
  exponent?: number;
  /**
      Whether to flip the axis's direction, so its values run the other
      way: a horizontal axis from right to left, a vertical one from top to
      bottom (a Plot's y axis, categories included, normally runs bottom to
      top, so reversing it lists them from the top). Everything placed on
      the axis follows it: shapes, tick labels, gridlines, breaks, zooming,
      and hover badges. Defaults to `false`.
  */
  reverse?: boolean;
  /** The shape drawn at each tick: `"Line"` (the default), `"Rect"`, or `"Circle"`. */
  shape?: "Line" | "Rect" | "Circle";
  /** Tick style of the axis. */
  shapeConfig?: Record<string, unknown>;
  /** Tick formatter, called with the axis as `this`. Defaults to the locale's abbreviated number format ("1.5k"), with years printed in full ("1990") when the axis's values are all whole numbers from 1000 through 2999. */
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
  /**
      The tooltip shown when a tick label is hovered, in a chart: its text
      (the same on every tick), a function that receives the tick's value (as
      `tickFormat` does) and its index and returns the text, or a tooltip
      config (as `tooltipConfig`) whose accessors receive the same. The index
      counts the axis's labels from the start of its domain (0 is the bottom
      label of a y axis, the left one of an x axis). Unset (the default) or
      when the function returns nothing, a label cut short with an ellipsis
      shows its whole text; `false`, set or returned, shows no tooltip.
      @example
      {tickTooltip: value => notes[value]}
  */
  tickTooltip?:
    | string
    | ((value: number | string, index: number) => string | false | void)
    | AxisTooltipConfig<[value: number | string, index: number]>
    | false;
  /** Title of the axis. */
  title?: string;
  /** Title configuration of the axis. */
  titleConfig?: Record<string, unknown>;
  /**
      The tooltip shown when the axis title is hovered, in a chart: the
      tooltip's text, a function that receives the title and returns it, or a
      tooltip config (as `tooltipConfig`) whose accessors receive the title.
      Unset (the default) or when the function returns nothing, a title cut
      short with an ellipsis shows its whole text; `false`, set or returned,
      shows no tooltip.
      @example
      {title: "GDP per capita", titleTooltip: "Constant 2015 US$"}
  */
  titleTooltip?:
    | string
    | ((title: string) => string | false | void)
    | AxisTooltipConfig<[title: string]>
    | false;
}

/**
    The `groupBy` levels a `tooltip` accessor receives as its third argument,
    and whether it is asked about a legend entry.
*/
export interface TooltipLevels {
  /**
      The `groupBy` level, from 0, the hovered item stands for: the level the
      chart draws, or the item's own level where a chart draws several at
      once (a Sunburst or Icicle node, a Tree node, a Treemap group header).
      A legend entry stands for the level its label is read from.
  */
  depth: number;
  /** The deepest `groupBy` level: `groupBy.length - 1`. */
  maxDepth: number;
  /** Whether the hovered item is a legend entry, not a mark. */
  legend: boolean;
}
/** `T` with every accessor in it called with `Args`. */
type WithAccessorArgs<T, Args extends unknown[]> = T extends (
  ...args: never[]
) => infer R
  ? (...args: Args) => R
  : T extends Array<infer U>
    ? Array<WithAccessorArgs<U, Args>>
    : T;

/**
    A tooltip config for an axis label (see `titleTooltip` and
    `tickTooltip`): a `TooltipConfig` whose accessors are called with `Args`
    in place of a data point.
*/
export type AxisTooltipConfig<Args extends unknown[]> = {
  [K in keyof TooltipConfig]: WithAccessorArgs<TooltipConfig[K], Args>;
};

export interface TooltipConfig {
  /** The inner HTML content of the arrow element, empty by default. */
  arrow?: ((d: DataPoint) => string) | string;
  /**
      CSS classes added to each tooltip element, beside its fixed
      `d3plus-tooltip` class, so page CSS can style one chart's tooltips: a
      space-separated string or an array.
  */
  className?: string | string[];
  /** The background color accessor for each tooltip. */
  background?: ((d: DataPoint) => CssColor) | CssColor;
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
  /** Overall CSS styles applied to the tooltip container. */
  tooltipStyle?: Record<string, string>;
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
          ((d: DataPoint, i?: number, x?: {share: number}) => string) | string
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
          ((d: DataPoint, i?: number, x?: {share: number}) => string) | string
        >
      >;
}

export interface TextBoxConfig {
  /** The text content for each box. */
  text?: Accessor<string>;
  /** The font color as an accessor function or static string. Inferred from the DOM selection by default. */
  fontColor?: Accessor<CssColor>;
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
  fontStroke?: Accessor<CssColor>;
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
      text and number; by default drops the line's trailing periods, commas,
      and spaces and appends "...", except for a first word that cannot fit
      (which returns ""). The ended line is measured, and words come off its
      end until it fits the box.
  */
  ellipsis?: (text: string, line: number) => string;
  /**
      Lets truncated text cut a word: the word that did not fit (or a first
      word wider than the box) is cut to the longest start that fits with the
      `ellipsis`, by whole characters, so emoji and accented letters are never
      split. Defaults to `false`, which only breaks between words, and draws
      nothing when the first word does not fit.
  */
  truncateWord?: Accessor<boolean>;
  /** The padding as a CSS shorthand string or number. Defaults to 0. */
  padding?: Accessor<string | number>;
  /** The rotation of each text box, in degrees about its `rotateAnchor`. */
  rotate?: Accessor<number>;
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
  /**
      The horizontal alignment of each line in its box. `"start"`,
      `"middle"`, and `"end"` align lines to the box's start edge, center, or
      end edge (the start is the right edge in right-to-left text).
      `"justify"` spreads each line's words across the box, or its characters
      in CJK text, leaving a paragraph's last line and any line that ends at a
      newline start-aligned. A percentage such as `"25%"` places each line
      that share of the way across the box, so `"0%"`, `"50%"`, and `"100%"`
      match start, middle, and end; percentages follow the writing direction.
  */
  textAnchor?: Accessor<"start" | "middle" | "end" | "justify" | `${number}%`>;
  /**
      An SVG path `d` (or a `(datum, index)` accessor returning one) for the
      text to follow, in coordinates relative to the box's `x` and `y`. The
      text is drawn as one line with its baseline on the path, wrapped to the
      path's length past `startOffset` (and cut short with the `ellipsis` and
      `truncateWord`). `textAnchor` places it along that stretch of path:
      `"middle"` centers it, `"end"` ends it at the path's end, a percentage
      places it that share along, and `"justify"` reads as `"start"`, since
      the one line ends its paragraph. Falsy draws the text in its box.
  */
  textPath?: Accessor<string | false | null>;
  /**
      Where along the `textPath` the text's room begins: a distance in pixels,
      or a percentage of the path's length such as `"25%"`. Defaults to 0.
  */
  startOffset?: Accessor<number | `${number}%`>;
  /**
      Which side of the `textPath` the text sits on, read in the path's
      direction: `"left"` (the default) follows the path as drawn, with the
      text above a left-to-right path, and `"right"` follows it backwards, so
      the text sits on its other side.
  */
  side?: Accessor<"left" | "right">;
  /**
      Draws a transparent rect behind each box, so a hover or click anywhere
      in the box (padding included), not just on its glyphs, reaches the
      box's datum. `true`, or `{padding}` (a number or CSS shorthand) to
      reach further than the box. Text on a path gets the path's bounds grown
      by a font size. Defaults to `false`.
  */
  hitbox?: Accessor<boolean | {padding?: number | string}>;
  /** The vertical alignment of the lines in each box. */
  verticalAlign?: Accessor<"top" | "middle" | "bottom">;
  /** Whether the text receives pointer events (`"none"` lets them through to what is underneath). */
  pointerEvents?: Accessor<"auto" | "none">;
  /**
      The inline HTML tags to draw as styles: a map of tag names to CSS
      declarations, `true` for the defaults (`<b>`, `<strong>`, `<i>`, `<em>`),
      or `false` to draw tags as text.
  */
  html?: boolean | Record<string, string>;
  /** The outline text wraps within, `"square"` or `"circle"`, or a `(datum, index)` accessor. */
  shape?:
    "square" | "circle" | ((d: DataPoint, i: number) => "square" | "circle");
}

export interface TimelineConfig {
  /**
      The cursor shown over the timeline's brush area, where a click or drag
      picks periods: a CSS cursor, or a function given how the timeline is
      drawn (`"ticks"` or `"buttons"`) that returns one. Defaults to
      `"pointer"`. The handles keep `ew-resize` and the selected range
      `move`; `handleConfig` and `selectionConfig` take a `cursor` too.
      @example
{brushCursor: mode => (mode === "buttons" ? "pointer" : "crosshair")}
  */
  brushCursor?: string | ((mode: "ticks" | "buttons") => string);
  /** Brush event filter. */
  brushFilter?: () => boolean;
  /**
      Stretches of time the timeline hides, as an axis config's
      `rangeBreaks` takes them. By default the timeline takes the rules of
      the axis that plots the chart's `time` values (such as
      `xConfig.rangeBreaks`); set this to use others, or `false` for none.
  */
  rangeBreaks?: false | RangeBreakRule | RangeBreakRule[];
  /**
      The maximum number of ticks (or buttons) a selection can span; unlimited
      by default. A wider brush is pulled in to it on release, keeping the end
      being dragged, and a wider starting selection keeps its latest periods.
      A `brushMax` below `brushMin` rises to it.
  */
  brushMax?: number;
  /**
      The minimum number of ticks (or buttons) a selection can span. Helpful
      for x/y plots where selecting fewer than 2 time periods is undesirable.
      A narrower brush widens to it on release: a drag keeps the end being
      dragged (or, with ticks, its first tick), and a click selects the
      clicked period and the ones after it. A narrower starting selection
      keeps its latest period, and a chart that starts on its latest period
      starts on its latest `brushMin` instead. Either way, the selection grows the other way where the
      timeline runs out. Unused with `brushing: false`.
  */
  brushMin?: number;
  /** Toggles the horizontal alignment of the button timeline. */
  buttonAlign?: "start" | "middle" | "end";
  /**
      How the timeline draws its periods: `"ticks"` along an axis,
      `"buttons"` in a row, or `"auto"` (the default), which draws buttons
      when every label fits and ticks otherwise, and checks again whenever
      the chart redraws. The timeline's group carries a class naming the
      result, for page CSS: `d3plus-viz-timeline-ticks` or
      `d3plus-viz-timeline-buttons` on a chart's `g.d3plus-viz-timeline`, and
      `d3plus-Timeline-ticks` or `d3plus-Timeline-buttons` on the Timeline's
      own group.
  */
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
      Listeners for the brush's `start`, `brush` and `end` events. On a chart,
      `end` receives the period the viewer picked once a click, drag or
      playback step settles (a Date, or `[start, end]` Dates for a range),
      and `brush` receives it, snapped to whole periods, as a drag moves
      (with `brushing` on and `snapping` off, the last committed one);
      `start` receives the d3-brush event.
      @example
{on: {end: period => console.log(period)}}
  */
  on?: {
    start?: (event: unknown) => void;
    brush?: (selection: Date | Date[]) => void;
    end?: (selection: Date | Date[]) => void;
  };
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
  /**
      The current selection. Defaults to the most recent period in the
      timeline. On a chart it is where the timeline starts, and the chart
      starts on the same period(s); the viewer's picks replace it.
  */
  selection?: (Date | number)[] | Date | number | false;
  /**
      Whether to run the timeline from its latest period to its earliest.
      Selections, the default selection, and playback still read from
      earliest to latest. Defaults to `false`.
  */
  reverse?: boolean;
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
  /** `"series"` (default) fits one line per series, colored to match it; `"all"` fits one line to every point (a moving average averages the points sharing a position). Stacked charts always fit the stack totals. */
  group?: "series" | "all";
  /**
      A moving average's window: how many points each average spans,
      counting each distinct position along the axis once, or on a time axis
      a span of time, such as `{days: 30}` (`seconds`, `minutes`, `hours`,
      `days`, `weeks`, `months`, `years`), which averages the points in the
      span ending at each point (centered on it, with `center`), so gaps and
      uneven spacing average over the same length of time. A span starts at
      the first point, averaging the points it holds so far; on any other
      axis it falls back to 7 points, with a console warning. With a number
      of points, the first `window − 1` (with `center`, the ends) have no
      average. Defaults to 7.
  */
  window?:
    | number
    | {
        seconds?: number;
        minutes?: number;
        hours?: number;
        days?: number;
        weeks?: number;
        months?: number;
        years?: number;
      };
  /** Centers a moving average's window on each point instead of ending it there. Defaults to `false` (a trailing window). */
  center?: boolean;
  /** Draws bands either side of a moving average (Bollinger bands), this many standard deviations of each window from it, styled by `confidenceConfig`. Defaults to 2; `false` drops them. */
  bands?: boolean | number;
  /** The polynomial degree when `trendLine` is `"polynomial"`. Defaults to 2. */
  order?: number;
  /** Draws a confidence band around a linear fit. Defaults to `false`. */
  confidence?: boolean;
  /** The confidence band's level, between 0 and 1. Defaults to 0.95. */
  confidenceLevel?: number;
  /** Area shape config for the confidence band. Its fill defaults to the line color. */
  confidenceConfig?: Record<string, unknown>;
  /**
      Extends each regression trend line (not a moving average) past the end of its data: a number of steps (at the data's own spacing — the median gap between values, or the calendar interval of dates), or `{to}` an end value to step up to (a number, or on a time axis a Date or a parseable date such as a year). Widens the axis to fit. Ignored on a category axis. Defaults to `0` (off).
  */
  projection?: number | {to: number | string | Date};
  /** Line shape config for the projected stretch, merged over the line's own styles. Defaults to `{strokeDasharray: "2 4"}`. */
  projectionConfig?: Record<string, unknown>;
  /** Shows the fitted equation, R², and observations when hovering a line. Defaults to `true`. */
  tooltip?: boolean;
  /** Line color. Defaults to the series color (dark gray when `group` is `"all"`). */
  stroke?: CssColor;
  /** Line width in pixels. Defaults to 2. */
  strokeWidth?: number;
  /** Line dash pattern. Defaults to `"6 4"`. */
  strokeDasharray?: string;
  /**
      Labels each trend line along its path, near its end, in the line's
      color: `true` names the series, `"equation"` shows its fitted equation
      and R² (a moving average's name and window, such as "Moving Average
      (7)" or "Moving Average (30 days)"), and a function of the fit (`label`, `color`, and `fit` with the
      regression's `coefficients` and `r2`, or the moving average's `window`,
      `center`, and `deviations`) returns any text. Defaults to `"equation"`;
      `false` turns labels off.
  */
  label?:
    | boolean
    | "equation"
    | ((fit: {
        label: string;
        color: string;
        fit: {
          type: string;
          coefficients?: number[];
          r2?: number;
          window?: number;
          center?: boolean;
          deviations?: number;
        };
      }) => string | false | null | undefined);
  /** TextBox config for the trend line labels, such as `fontSize` (default 11) or `fontColor`. */
  labelConfig?: Record<string, unknown>;
  /** Other Line shape config. */
  [key: string]: unknown;
}

/** The `linkLabelConfig` options. */
export interface LinkLabelConfig {
  /**
      `"along"` runs text along its link, kept upright: on a curved link
      (a Rings spline, an ArcDiagram arc, a self-loop, a bundled edge, a
      Geomap flow arc, a Sankey band), the text follows the curve over a
      pad that curves with it, and is cut short with an ellipsis where the
      curve has too little room. `"horizontal"` keeps it level.
  */
  rotate?: "along" | "horizontal";
  fontSize?: number;
  /** The pad around the text, in pixels. */
  padding?: number;
  /** The opacity of the pad, which takes the chart's background color. */
  backgroundOpacity?: number;
  /**
      The tightest bend an `"along"` label follows, as a radius in ems of
      `fontSize`. A label is cut short of a tighter bend, and keeps a
      straight label when too little of the curve is left for a few
      letters, as on a small self-loop. Defaults to `2`.
  */
  minRadius?: number;
  /** Any other TextBox setting, such as `fontColor`, `fontFamily`, or `fontWeight`. */
  [key: string]: unknown;
}

/** The `linkBundleConfig` options. */
export interface LinkBundleConfig {
  /**
      How closely each link keeps to its bundle, from `0` (drawn straight)
      to `1` (fully bundled). Defaults to `0.85`.
  */
  strength?: number;
  /**
      How many times the points along each link double as the bundling
      settles (finer bends, more work). Defaults to `6`.
  */
  cycles?: number;
  /**
      The simulation steps in the first cycle; each later cycle takes two
      thirds as many. Defaults to `50`.
  */
  iterations?: number;
  /**
      How alike two links must be, from `0` to `1`, to pull on each other:
      the product of how parallel they are, how alike their lengths are,
      how near they are, and how much each lies alongside the other. Lower
      values bundle more links. Defaults to `0.4`.
  */
  compatibility?: number;
  /**
      Whether each bundled link is drawn as a smooth curve (`true`, the
      default) or as straight runs between its bend points.
  */
  smoothing?: boolean;
}

/** The `clusterConfig.labelConfig` options. */
export interface ClusterLabelConfig {
  /** The largest font size a cluster name takes, in pixels. Defaults to `16`. */
  fontMax?: number;
  /** The smallest font size a cluster name may shrink to before it is left off, in pixels. Defaults to `10`. */
  fontMin?: number;
  /** The space kept clear around each name, in pixels. Defaults to `4`. */
  padding?: number;
  /** Any other TextBox setting, such as `fontColor` (defaults to the chart's text color), `fontFamily`, `fontOpacity`, or `fontWeight`. */
  [key: string]: unknown;
}

/** The `clusterConfig` options. */
export interface ClusterConfig {
  /** The most clusters to keep. When there are more, the smallest joins the cluster it shares the most link weight with (or, when it has no links to another cluster, the largest), until there are this many. Defaults to `12`, the palette's distinct colors. */
  max?: number;
  /** Names each cluster from its most-connected node's row, its index (0 is the largest), and its members' rows. Defaults to "{node} cluster", translated, with the node's label. */
  label?: (d: DataPoint, i: number, nodes: DataPoint[]) => string;
  /** Styles the cluster names a Network draws inside its clusters, or `false` for none. */
  labelConfig?: ClusterLabelConfig | false;
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
      Draws a bucket-type scale ("jenks", "quantile", …) as one bar with an
      axis along it, labeled where the buckets start, instead of a labeled
      swatch for each bucket. Defaults to `false`.
  */
  bucketAxis?: boolean;
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
  /**
      The kind of scale: `"linear"` or `"log"` (a continuous gradient), or
      `"jenks"`, `"buckets"`, or `"quantile"` (discrete buckets). A function
      picks one on each render: it receives the numeric values the scale is
      built from (sorted, without null or NaN) and their `[min, max]` extent,
      with the ColorScale as `this`, and returns a scale name, as in
      `(values, [min, max]) => max - min > 5 ? "jenks" : "linear"`. An unknown
      name logs a warning and builds a linear scale. Defaults to `"linear"`,
      and to `"jenks"` in a chart's `colorScaleConfig`.
  */
  scale?: ColorScaleTypeSetting;
  /**
      Whether hovering a shape marks its value on the color scale: a tick and
      a badge with the value (and, on a `bucketAxis`, an outline around its
      bucket). A swatch scale lights the value's swatch instead. Defaults to
      `true`.
  */
  hoverMark?: boolean;
  /**
      Holds the palest step of a single-hue ramp darker on a light theme
      (`colorRamp`'s `ordinal` option), so the lowest values still read as
      thin lines against the background instead of fading into it. Dark
      themes keep their ramps. Defaults to `false`.
  */
  ordinalRamp?: boolean;
  /**
      Styles the `hoverMark`: `tickConfig` (`stroke`, `strokeWidth`, `length`),
      `badgeConfig` (`fill`, `stroke`, `strokeWidth`, `fontColor`,
      `fontFamily`, `fontSize`, `fontWeight`, `padding`, `rx`), and
      `outlineConfig`, the bucket outline on a `bucketAxis` bar (`stroke`,
      `strokeWidth`). Each is a value or a function of the hovered value.
  */
  hoverMarkConfig?: ColorScaleHoverMarkConfig;
  /**
      Draws the scale as a bivariate key: each row's `value` is a pair of
      numbers, and a chart sets this when its `colorScale` names two fields.
      Defaults to `false`.
  */
  bivariate?: boolean;
  /** How many quantile bins a bivariate scale splits each variable into, from `2` to `4`. Defaults to `3`. */
  bivariateBuckets?: number;
  /**
      A bivariate scale's colors: a square grid, row-major from the low/low
      corner, each row one bin of the second variable and each column one bin
      of the first. A grid of another size than `bivariateBuckets` is blended
      to fit. Defaults to Joshua Stevens' blue–red 3×3 scheme.
  */
  bivariateColors?: string[];
  /** A bivariate key's names for its two variables, in `colorScale` order. Defaults to the two field names. */
  bivariateLabels?: [string, string];
}

/** `colorDefaults` input: any subset of the color defaults, with `scale` also accepting an array of colors. */
export type ColorDefaultsConfig = Partial<Omit<ColorDefaults, "scale">> & {
  scale?: ColorDefaults["scale"] | string[];
};

/** One `confidence` bound: a data key, an accessor, or `false` for none. */
export type ConfidenceBound =
  string | ((d: DataPoint, i: number) => number) | false;

/** One `confidence` band: a `[lower, upper]` pair, `[lower, upper, label]`, or a `{lower, upper, label}` object. */
export type ConfidenceBandSetting =
  | [ConfidenceBound, ConfidenceBound]
  | [ConfidenceBound, ConfidenceBound, string]
  | {lower?: ConfidenceBound; upper?: ConfidenceBound; label?: string};

/** A file type the top-left download button can save the chart as. */
export type SaveFormat = "png" | "svg" | "jpg";

export interface SaveControlConfig {
  /** The saved file's name, without its extension. Defaults to the chart's title, or `"download"` when it has none. */
  filename?: string;
  /** The file types offered, in menu order. With a single format, the button saves that format in one click, with no menu. Defaults to `["png", "svg", "jpg"]`. */
  formats?: SaveFormat[];
  /** The color painted behind the chart. Defaults to the page color behind the chart, so a JPG never comes out black. `false` leaves PNG and SVG files transparent. */
  background?: string | false;
  /** Called once the file is handed to the browser, or with the `Error` when the chart could not be saved. Without it, errors are logged to the console. */
  callback?: (error?: Error) => void;
  /** Other options are passed to html-to-image when saving a PNG or JPG, such as `pixelRatio` or `quality`. */
  [key: string]: unknown;
}

/** Styles the ring keyboard navigation draws around the focused mark. Each is a value or a `(d, i) => value` accessor of the focused data row. */
export interface KeyboardNavConfig {
  /** The ring's color. Defaults to the ink that reads against the chart's background (dark on a light page, light on a dark one). */
  stroke?: string | ((d: DataPoint, i: number) => string);
  /** The ring's width in pixels. Defaults to `2`. */
  strokeWidth?: number | ((d: DataPoint, i: number) => number);
  /** Space between the mark and a rectangular or circular ring, in pixels. Defaults to `2`. A path (a pie wedge, a map region) is outlined along its own edge. */
  padding?: number | ((d: DataPoint, i: number) => number);
}

/** Fits and styles circle labels (see `labelPosition`). The TextBox keys style labels drawn beside their circles. */
export interface PointLabelConfig extends Omit<
  TextBoxConfig,
  "fontMin" | "fontSize" | "padding"
> {
  /** The smallest font size, in pixels, of a label inside its circle under `"auto"` (default `10`). */
  fontMin?: number;
  /** The font size, in pixels, of a label beside its circle (default `11`). */
  fontSize?: number;
  /** The space, in pixels, between a circle's edge and a label beside it (default `3`). */
  padding?: number;
}

export interface D3plusConfig {
  /** Data array or URL string to load data from. */
  data?: DataPoint[] | string;
  /**
      CSS classes added to the outermost element the chart or component draws
      into, beside its fixed classes, so page CSS can target it: a chart's root
      `<svg class="d3plus-viz">` (and, with the Canvas renderer, its
      `<canvas>`), the HTML layer holding its controls, and a standalone
      component's `<svg>`. A space-separated string or an array; a new value
      replaces the classes the previous one added.
  */
  className?: string | string[];
  /** Locale code used for text and number formatting. */
  locale?: string;

  /** The active callback function for highlighting shapes. */
  active?: ((d: DataPoint, i: number) => boolean) | false | null;
  /** Custom aggregation functions keyed by data property. */
  aggs?: {[k: string]: (d: DataPoint[]) => unknown};
  /**
      Which side of ArcDiagram's line the arcs take: `"above"` (the default),
      `"below"`, or `"both"`, where a link running forward along the line
      (its source before its target) arcs above and one running backward arcs
      below. On a vertical line, "above" is its right side. Node labels sit
      on the other side of the line (below it with `"both"`).
  */
  arcSide?: "above" | "below" | "both";
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
      Whether hovering a Plot's mark draws a dashed guide to each axis with a
      badge showing its value there. `"x"` or `"y"` limits it to that
      direction. Defaults to `true` (`"x"` on BumpChart and Streamgraph).
  */
  axisHover?: boolean | "x" | "y";
  /**
      Styles the `axisHover` guides and badges. `guideConfig` takes `stroke`
      (the hovered mark's color by default), `strokeWidth` (default `1`),
      `strokeDasharray` (default `"4 3"`), and `strokeOpacity`. `badgeConfig`
      takes `fill` (the hovered mark's color by default), `fontColor` (a
      color contrasting the fill by default), `fontFamily`, `fontSize`
      (default `12`), `fontWeight` (default `400`), `padding` around the text
      (default `4`), and `rx` corner radius (default `2`). Each is a value or
      a `(d, i) => value` accessor of the hovered data row.
  */
  axisHoverConfig?: {
    guideConfig?: Record<string, unknown>;
    badgeConfig?: Record<string, unknown>;
  };
  /**
      Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).
  */
  attribution?: string | boolean;
  /**
      Overrides the "ⓘ" icon a long attribution collapses to (see `attribution`), which otherwise renders as an inline SVG. Accepts an HTML string — used as the toggle button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it. A returned cleanup function runs right before that slot is discarded, which happens whenever the credit's markup regenerates (its text or theme changes), not just once per chart.
  */
  attributionIcon?: string | ((el: HTMLElement) => void | (() => void));
  /** CSS key/value pairs used to style the attribution text. */
  attributionStyle?: Record<string, unknown>;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the back button, alongside its fixed `back-control` class. Setting this automatically disables d3plus's built-in inline `backControlStyle` default (as long as you haven't already customized it yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
  */
  backControlClassName?: string;
  /**
      An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  backControlStyle?: Record<string, unknown> | false;
  /** Padding between bars in pixels. */
  barPadding?: number;
  /**
      BarChart/Marimekko: makes each bar as wide as its own measure (a data
      key or accessor, read off the merge of the bar's rows, so numbers sum
      unless `aggs` says otherwise). The bars sit end to end along a
      continuous axis of cumulative width, each labeled at its center, and
      tooltips show each bar's width and its share of the total. Off by
      default on BarChart; on Marimekko, `false` turns it off.
  */
  barWidth?: string | false | ((d: DataPoint, i?: number) => number);
  /**
      BarChart/Marimekko with `barWidth`: whether each category's axis label
      also shows its bar's share of the total width ("Retail" over "50%").
      `"opposite"` puts the shares on the axis across from the names (styled
      with `x2Config`/`y2Config`). `barWidthShareFormat` changes the text.
      Defaults to `"opposite"` for Marimekko, `false` for BarChart.
  */
  barWidthShare?: boolean | "opposite";
  /**
      BarChart/Marimekko with `barWidthShare`: returns each bar's width-share
      label. Called with the merge of the bar's rows' data (numbers summed
      unless `aggs` says otherwise) and the bar's `{share, size, total,
      text}`: its share of the total width (0–1), its width measure, every
      bar's combined width, and the default label (such as "23%"). The
      tooltip keeps showing the share.
  */
  barWidthShareFormat?: (d: DataPoint, info: BarShareInfo) => unknown;
  /**
      Starts a Plot's value axis at a value, like `yDomain([n])` (or
      `xDomain([n])` for horizontal charts); the far end comes from the data.
      Bars, areas, and stems still grow from `0`, so with `baselineBreak` on
      the axis breaks back to a `0` tick. A bound in `yDomain`/`xDomain` wins.
  */
  baseline?: number;
  /**
      When a linear value axis's domain stops short of the `baseline` (e.g.
      `[1100, 2100]` with a baseline of `0`), keeps the baseline tick and
      breaks the axis between it and the domain, styled by
      `baselineBreakConfig`. Turned off, a Plot's `yDomain` stretches to the
      baseline instead. Defaults to `true` for Plots whose marks grow from `0`
      (BarChart, AreaPlot, Histogram, Lollipop), else `false`.
  */
  baselineBreak?: boolean;
  /** Bullet: the qualitative ranges behind each measure, as threshold values (`[60, 85]`) or band objects (`{min, max, color}`), or a `(d, i) => bands` accessor for per-row bands. */
  bands?:
    | (number | {min?: number; max?: number; color?: string})[]
    | ((
        d: DataPoint,
        i: number,
      ) => (number | {min?: number; max?: number; color?: string})[]);
  /**
      Hexbin: the bin shape, `"hex"` (default) for hexagons or `"square"`
      for squares, or `false` to draw no bins (for contours alone).
  */
  binShape?: "hex" | "square" | false;
  /**
      Hexbin: the bin size in pixels, a hexagon's radius or a square's side.
      Bins keep this size at any zoom: the observations are binned again for
      each view, and the colorScale refits to the bins in view. Defaults to
      `12`.
  */
  binSize?: number;
  /**
      Hexbin: what each bin measures, which its color shows. `"count"`
      (default) is the number of observations in the bin; `{value, agg,
      label}` is the `"sum"` (default) or `"mean"` of `value` (a data key or
      accessor) over the bin's observations, named `label` in the tooltip.
  */
  binValue?: BinValueOption;
  /** Candlestick: the share of each period's room its candle body (or OHLC ticks) spans, from 0 to 1. Defaults to `0.7`. */
  bodyWidth?: number;
  /** BoxWhisker: accessor or data key for each summary row's upper whisker end. See `boxMedian`. */
  boxMax?: string | ((d: DataPoint, i: number) => number);
  /**
      BoxWhisker: accessor or data key for each summary row's median. Setting
      it, `boxMin`, `boxQ1`, `boxQ3`, or `boxMax` draws boxes from statistics
      you already have: each row is one box (placed by its `x`, or `y` when
      `discrete` is `"y"`) drawn from those values, with nothing computed and
      `whiskerMode` unused. All five are needed (a warning names any left
      unset), and a row whose values aren't all numbers draws no box. The
      value axis spans every row's statistics and outliers, and the tooltip
      lists them.
  */
  boxMedian?: string | ((d: DataPoint, i: number) => number);
  /** BoxWhisker: accessor or data key for each summary row's lower whisker end. See `boxMedian`. */
  boxMin?: string | ((d: DataPoint, i: number) => number);
  /** BoxWhisker: accessor or data key for each summary row's outliers, an array of values drawn as points past the whiskers. Used only with the other box statistics; see `boxMedian`. */
  boxOutliers?: string | ((d: DataPoint, i: number) => number[]);
  /** Alluvial: the fill opacity of the bands between columns (default `0.5`). */
  bandOpacity?: number;
  /** BoxWhisker: accessor or data key for each summary row's lower quartile, where its box starts. See `boxMedian`. */
  boxQ1?: string | ((d: DataPoint, i: number) => number);
  /** BoxWhisker: accessor or data key for each summary row's upper quartile, where its box ends. See `boxMedian`. */
  boxQ3?: string | ((d: DataPoint, i: number) => number);
  /**
      ParallelCoordinates: the brush strips over each axis — `width` (px), the
      selection's `fill`, `fillOpacity`, `stroke`, and `strokeWidth`, and
      `inactiveOpacity`, the stroke opacity of the grayed lines outside the
      brushes (by default 30% of each line's own opacity).
  */
  brushConfig?: Record<string, unknown>;
  /**
      ParallelCoordinates: the active brush filters, keyed by dimension — a
      numeric `[min, max]` or a list of selected categories. Rows must pass
      every brush. Brushing an axis updates it, and `on("brush", fn)` is called
      with the new value; `{}` clears every brush.
  */
  brushes?: BrushSelection;
  /**
      ParallelCoordinates: whether each axis can be brushed to filter the
      lines (default `true`). Clicking an axis outside its brush,
      double-clicking it, or pressing Escape while it has focus clears it.
  */
  brushing?: boolean;
  /** Bullet: the most each bullet's band can be thick, in pixels (default 40); raise it to let rows fill a tall chart. */
  bulletSize?: number;
  /**
      Whether the chart uses the data cache that every chart on the page
      shares for the files fetched by `data`, `links`, `nodes`, `topojson`,
      and `fitObject`, so charts loading the same URL share one request and
      loading it again, or changing a formatter, needs none. The cache uses
      up to about 50 MB of memory, dropping the least recently used files
      first. Defaults to `true`; `false` fetches on every load.
      `clearDataCache()` from `@d3plus/data` empties the cache.
  */
  cache?: boolean;
  /** Calendar: styles the weekday, month, and year labels (`fontColor`, `fontFamily`, `fontSize`, default `11`, and `fontWeight`). */
  calendarLabelConfig?: {
    fontColor?: string;
    fontFamily?: string | string[];
    fontSize?: number;
    fontWeight?: number | string;
  };
  /** Matrix and Calendar: the gap between neighboring cells, in pixels. */
  cellPadding?: number;
  /** Calendar: each cell's corner radius, in pixels (kept below a third of the cell). Defaults to `2`. */
  cellRadius?: number;
  /**
      Pie (when `innerRadius` leaves a hole, as in a Donut), Sunburst and
      RadialBar: text drawn in the chart's empty middle. `true` draws the sum
      of every drawn row's value (Sunburst's `sum`), formatted the way the
      tooltips format values; a string draws that string; a function
      receives the drawn rows (after filters and hidden legend entries) and
      their total and returns the text. The text wraps and shrinks to fit
      the hole (see `centerLabelConfig`) and is left out when it can't fit
      whole, or, on a Sunburst, once a click zooms into a node. Defaults to
      `false`.
  */
  centerLabel?:
    boolean | string | ((data: DataPoint[], total: number) => string | false);
  /**
      Pie, Sunburst and RadialBar: styles the `centerLabel` with TextBox keys
      (`fontColor`, `fontFamily`, `fontWeight`, `lineHeight`, `padding`, …).
      The text shrinks from `fontMax` (default `40`) to fit the hole, down to
      `fontMin` (default `10`); a `fontSize` fixes its size instead. Defaults
      to the chart's text color and `padding: 5`. Merged into the current
      config.
  */
  centerLabelConfig?: TextBoxConfig;
  /**
      Sankey: draws links that loop back to a node they left (A → B → A, or a
      node to itself) as bands that run in a lane above or below the nodes.
      `false` leaves them out, with a warning. Defaults to `true`.
  */
  circularLinks?: boolean;
  /**
      Network and ArcDiagram: colors each node by its cluster (found with the
      Louvain method, weighted by `linkSize`), named after its most-connected
      node and listed in the legend; clicking a cluster zooms to it. Applies
      only while the chart's color is its default. Defaults to `true`.
  */
  cluster?: boolean;
  /**
      Network and ArcDiagram: names and styles the clusters (see `cluster`).
      `label` names each cluster: it receives the row of the cluster's
      most-connected node, the cluster's index (0 is the largest), and every
      member's row. `max` is the most clusters to keep (default `12`): while
      there are more, the smallest joins the cluster it shares the most link
      weight with, or the largest when it has none. `labelConfig` styles the
      names a Network draws inside its clusters, or `false` draws none.
  */
  clusterConfig?: ClusterConfig;
  /**
      Candlestick: accessor or data key for each period's closing value
      (default `"close"`). It is the chart's `y`: setting `y` sets it.
  */
  close?: string | ((d: DataPoint, i: number) => number);
  /**
      Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.

      When the color is a category that isn't one of the `groupBy` levels (for example, points grouped by `"country"` and colored by `"region"`), the legend shows one entry per category, labelled by the category. Clicking, shift+clicking, or hovering an entry hides, solos, or highlights every item in that category.
  */
  color?:
    string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]) | false;
  /**
      Alluvial: the column whose categories color the bands — a column index,
      or a dimension's data key or title (default `0`, the first column). Each
      row's band keeps its category's color through every column, and the
      legend lists that column's categories.
  */
  colorBy?: number | string;
  /** Overrides for the default colors used for data fills and legible text (see `colorDefaults` in @d3plus/color). */
  colorDefaults?: ColorDefaultsConfig;
  /** Treat a discrete color field as ordered: color it with a single-hue light→dark ramp instead of nominal categorical hues. */
  colorOrdinal?: boolean;
  /**
      Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point. Two of them (`["a", "b"]`) make a bivariate scale: each variable is split into quantile bins, the pair of bins picks a color from a grid, and the key is that grid turned into a diamond (see `colorScaleConfig.bivariateBuckets`, `bivariateColors`, and `bivariateLabels`). A row missing either value gets no colorScale color.
  */
  colorScale?:
    | string
    | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    | [ColorScaleField, ColorScaleField]
    | false;
  /** A pass-through to the config method of ColorScale. */
  colorScaleConfig?: {
    /** Configures the axis that labels a gradient or `bucketAxis` scale: `labels` lists the values it labels, `ticks` the values it marks, and `tickFormat` writes their text. Along a side of the chart, the whole scale (its bar, ticks, labels and title) takes at most a third of the chart's width (a scale at the left or right) or height (top or bottom), leaving out its title, and then its labels, when they don't fit; `maxSize` sets the room for the axis's labels and title instead. On a scale drawn as swatches, `title` and `titleTooltip` apply to the swatches' title, and `tickTooltip` to each swatch's label, given the value and index of the label at that bucket's start on a `bucketAxis` bar. */
    axisConfig?: AxisConfig;
    /** Draws a bucket-type scale as one bar with an axis along it instead of a labeled swatch for each bucket (see `ColorScaleConfig.bucketAxis`). Defaults to `false`. */
    bucketAxis?: boolean;
    /** Formats the label for each bucket in a bucket-type scale (see `ColorScaleConfig.bucketFormat`). */
    bucketFormat?: ColorScaleConfig["bucketFormat"];
    /** Given a bucket's minimum and maximum labels, returns the full label (see `ColorScaleConfig.bucketJoiner`). */
    bucketJoiner?: ColorScaleConfig["bucketJoiner"];
    /** How many buckets a bucket-type scale splits its values into, or the value each bucket starts at. Defaults to `5`. */
    buckets?: number | number[];
    /** Splits a diverging scale evenly on either side of its `midpoint`. Defaults to `true`. */
    centered?: boolean;
    /** The scale's colors (see `ColorScaleConfig.color`). */
    color?: ColorScaleConfig["color"];
    /** The `[min, max]` values a linear scale spans (see `ColorScaleConfig.domain`). */
    domain?: number[];
    /** The value a diverging scale turns at. Defaults to `0`. */
    midpoint?: number;
    /** The thickness of a gradient's or a `bucketAxis` scale's bar, in pixels. Defaults to `10`. */
    size?: number;
    /** The space around the scale, in pixels. Defaults to `5`. */
    padding?: number;
    /** Styles the bar of a gradient or a `bucketAxis` scale, as a Rect config (`stroke`, `strokeWidth`, …). */
    rectConfig?: Record<string, unknown>;
    /** A scale at the left or right takes at most this many pixels of the chart's width, in place of a third of it. At the top or bottom, it is the scale's length, in place of `colorScaleMaxSize`. */
    width?: number;
    /** A scale at the top or bottom takes at most this many pixels of the chart's height, in place of a third of it. At the left or right, it is the scale's length, in place of `colorScaleMaxSize`. */
    height?: number;
    /** The negative pole of a diverging scale, and the hue of an all-negative ramp. Defaults to `colorDefaults.off`, or the theme's `colorScale.min` on a dark or custom theme. */
    colorMin?: CssColor;
    /** The midpoint of a diverging scale. Defaults to `colorDefaults.light`, or the theme's `colorScale.mid` on a dark or custom theme. */
    colorMid?: CssColor;
    /** The high end of a single-hue ramp and the positive pole of a diverging scale. Defaults to `colorDefaults.sequential`, or the theme's `colorScale.max` on a dark or custom theme. On a dark theme every ramp runs from a dim tint near the background up to this color. */
    colorMax?: CssColor;
    /** The kind of scale, or a function that picks one from the colorScale values on each render (see `ColorScaleConfig.scale`). Defaults to `"jenks"`. */
    scale?: ColorScaleTypeSetting;
    /** Marks a hovered shape's value on the colorScale (see `ColorScaleConfig.hoverMark`). Defaults to `true`. */
    hoverMark?: boolean;
    /** Styles the hover mark (see `ColorScaleConfig.hoverMarkConfig`). */
    hoverMarkConfig?: ColorScaleHoverMarkConfig;
    /** Configures the Legend that draws a bucket-type scale as a swatch for each bucket. Along a side of the chart, the swatches, their labels and title take at most a third of the chart's width (a scale at the left or right) or height (top or bottom): the title and labels wrap onto more lines, and when they still don't fit, the title is left out and then the labels are cut short. Its `width` (left or right) or `height` (top or bottom) sets another limit. */
    legendConfig?: Record<string, unknown>;
    /** How many quantile bins a bivariate `colorScale` splits each variable into, from `2` to `4`. Defaults to `3`. */
    bivariateBuckets?: number;
    /** A bivariate `colorScale`'s colors (see `ColorScaleConfig.bivariateColors`). Defaults to Joshua Stevens' blue–red 3×3 scheme. */
    bivariateColors?: string[];
    /** A bivariate key's names for its two variables. Defaults to the two field names. */
    bivariateLabels?: [string, string];
    /** Holds the palest step of a light theme's single-hue ramp darker (see `ColorScaleConfig.ordinalRamp`). Defaults to `true` when links are colored by number (`linkColor`), so the lowest-valued links still read as lines, and `false` otherwise. */
    ordinalRamp?: boolean;
  };
  /**
      The maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.
  */
  colorScaleMaxSize?: number;
  /**
      Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
  colorScalePadding?: boolean | ((viz: VizBase) => boolean);
  /**
      Defines which side of the visualization to anchor the color scale. Acceptable values are `"auto"` (the default), `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. `"auto"` lets the chart choose: inside the chart when it fits there (see `legendInset`), otherwise the right side of charts more than 1.5 times as wide as they are tall and the bottom of all others. Any other side keeps the color scale there. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.
  */
  colorScalePosition?: false | PanelPosition | (() => false | PanelPosition);
  /** Column key for matrix-style layouts. */
  column?: string;
  /** Pyramid: where the category labels go — `"center"` (a gutter between the halves, the default) or `"left"`. */
  categoryPosition?: "center" | "left";
  /** Pyramid: a comparison value per row (data key or accessor), drawn as an outline around each side's bars. */
  comparison?: string | ((d: DataPoint, i: number) => number) | false;
  /** Pyramid: line styles for the comparison outline (`stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`), each optionally a function of the side value and its index. */
  comparisonConfig?: Record<string, unknown>;
  /** Waterfall: draws a thin line from the end of each bar to the start of the next. */
  connectors?: boolean;
  /**
      The confidence interval as `[lower, upper]` bounds — each given as an
      accessor function or a static data key (e.g. `["lci", "hci"]`), or `false`
      to disable (no band or error bars, no axis widening, no tooltip bounds).
      Lines draw it as a band, bars as error bars; a row without a bound
      pinches the band onto its line. An array of bands, outermost first, draws
      nested bands around each line (a fan) — each a `[lower, upper]` pair,
      `[lower, upper, label]`, or `{lower, upper, label}` — shaded by
      `confidenceConfig.bandOpacity`, with each band's range listed in
      tooltips under its label (bars draw the first band).
  */
  confidence?: ConfidenceBandSetting | ConfidenceBandSetting[] | false;
  /**
      Styles the `confidence` interval: a line's band (Area keys) or a bar's
      error bar (Path keys, plus `capWidth`, in pixels or a percentage of the
      bar). Keys under `Area` or `Bar` apply to that shape only.
      `bandOpacity` ramps nested bands' opacity (default `[0.15, 0.6]`), and
      `tooltip: false` leaves the bounds out of tooltips.
  */
  confidenceConfig?: Record<string, unknown>;
  /**
      How a line crosses a missing value (a skipped step, or a `null`/`NaN`
      value): `true` (the default) or `"solid"` draws straight through,
      `false` breaks the line, and `"dashed"` breaks it and bridges the gap
      with a short dash. An object styles the bridge: `stroke`,
      `strokeDasharray` (default `"2 4"`), `strokeWidth`, and `opacity`.
  */
  connectGaps?: ConnectGaps;
  /** Funnel: fills the gap between consecutive stages with a neck joining their widths. */
  connector?: boolean;
  /**
      Funnel: paint for the necks between stages (`fill`, `opacity`,
      `stroke`, `strokeWidth`), each optionally a function of the stage the
      neck leads into. Waterfall: line styles for the connectors between bars
      (`stroke`, `strokeWidth`, `strokeOpacity`, `strokeDasharray`), each
      optionally a function of the row the connector leaves and its index.
  */
  connectorConfig?: Record<string, unknown>;
  /**
      Hexbin contour options: `bandwidth` (density kernel standard deviation,
      px, default `20`), `thresholds` (a level count, default `8`, or the
      levels themselves), `strokeWidth` (`"lines"` outline width, default
      `1.5`), `fillOpacity` (top `"filled"` level, default `0.8`), `labels`
      (write each level's value along its lines, default `true`),
      `labelSpacing` (px between labels on a line, default `"auto"`),
      `labelStep` (label every n-th level, default `"auto"`), `labelConfig`
      (TextBox config), and `levelFormat`.
  */
  contourConfig?: ContourConfig;
  /**
      Hexbin: draws density contours. `"lines"` (or `true`) outlines each
      density level in its color, and `"filled"` fills the levels with an
      opacity ramp. Levels are in observations per bin (the count a bin
      would hold there), so contours share the bins' colorScale. Over bins,
      contour lines take the chart's text color and leave hover to the bins.
      Defaults to `false`.
  */
  contours?: ContoursOption;
  /** Funnel: the conversion rates each stage's label shows: `"first"`, `"previous"`, `"both"` (or `true`), or `false`. */
  conversion?:
    boolean | "first" | "previous" | "both" | ("first" | "previous")[];
  /**
      Paint for the shared tooltip's crosshair guide line (`stroke`,
      `strokeWidth`, `strokeDasharray`, `strokeOpacity`, …).
  */
  crosshairConfig?: Record<string, unknown>;
  /**
      Funnel: how the width changes between stages, `"linear"` (straight
      sides) or `"smooth"` (curved). ParallelCoordinates: `"linear"`
      (default) draws straight segments between the axes; `"bump"` curves
      into and out of each axis.
  */
  curve?: "linear" | "smooth" | "bump";
  /** Maximum number of data points to render before downsampling. */
  dataCutoff?: number;
  /**
      Transforms `data` before it is drawn: receives the loaded file (or the
      Array passed as `data`) and returns the rows to draw, or a config object
      holding them as `data` (its other keys are applied to the chart). Also
      set by `data(url, format)`.
  */
  dataFormat?: (data: DataPoint[]) => DataPoint[] | Record<string, unknown>;
  /**
      When `data` comes from a URL, re-fetches it every this many milliseconds
      and redraws when it changes, keeping hover, zoom, and legend state.
      Polling pauses while the tab (or, with `detectVisible`, the chart) is
      hidden, and a failed request keeps the last data. Only `data` is polled.
      Defaults to `false` (load once).
  */
  dataPollingInterval?: number | false;
  /**
      Calendar: the day each row falls on, as a data key or accessor returning
      a `Date`, a millisecond timestamp, or a date string (a bare
      `"YYYY-MM-DD"` is read as that local day). Defaults to the row's `date`,
      else its `time`.
  */
  date?: string | ((d: DataPoint, i: number) => Date | number | string);
  /** Waterfall: fill for bars that lower the running total. Defaults to `colorDefaults.off`. */
  decreaseColor?: string;
  /**
      Kernel density options for Violin, Ridgeline, and DensityPlot curves:
      `kernel` (`"gaussian"` or `"epanechnikov"`), `bandwidth` (in data units,
      or a function of the observations returning one; by default Silverman's
      rule of thumb, on each group's own values for Violin and Ridgeline and
      on every group's values together for DensityPlot, so its curves are
      smoothed alike), `points` (how many values each curve is evaluated at:
      80, or about 100 for DensityPlot, which evaluates every curve in the
      same round steps), and `cut` (how far each curve runs past the
      smallest and largest value, in bandwidths: 2 for Violin, 3 for Ridgeline
      and DensityPlot).
  */
  densityConfig?: {
    kernel?: "gaussian" | "epanechnikov" | ((u: number) => number);
    bandwidth?: number | ((values: number[]) => number);
    points?: number;
    cut?: number;
  };
  /**
      How Violin, Ridgeline, and DensityPlot curves are sized against each
      other: `"area"` gives every shape the same area, `"count"` makes areas
      proportional to each group's observations, and `"width"` scales every
      shape to the full width (Violin), height (Ridgeline), or a peak of 1
      (DensityPlot). Defaults to `"area"`, except on a stacked DensityPlot,
      where `"count"` makes the stack's top edge the density of every
      observation.
  */
  densityScale?: "area" | "count" | "width";
  /**
      Gantt: accessor or data key for each task's predecessors, the ids (by
      `groupBy`) of the tasks it waits on, as an array or a comma-separated
      string (default `"dependencies"`). Each draws an elbow arrow from the
      predecessor's end to the task's start.
  */
  dependencies?: string | ((d: DataPoint, i: number) => unknown) | false;
  /** Gantt: styles the dependency arrows: `stroke` (the chart's text color by default), `strokeWidth` (1), `strokeOpacity` (0.55), and `arrowSize` (6, in pixels). */
  dependencyConfig?: {
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    arrowSize?: number;
  };
  /** Active depth level for nested groupings. */
  depth?: number;
  /**
      If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.
  */
  detectResize?: boolean;
  /**
      When resizing the browser window, this is the millisecond delay to trigger the resize event.
  */
  detectResizeDelay?: number;
  /**
      Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.
  */
  detectVisible?: boolean;
  /**
      The interval, in milliseconds, for checking if the visualization is visible on the page. When `detectVisible` defers a render until the visualization scrolls into view, this is also how long it must stay in view before it renders, so visualizations scrolled past quickly are never drawn.
  */
  detectVisibleInterval?: number;
  /**
      With `detectVisible` on, releases the chart's DOM and scene while it is
      scrolled out of view and redraws it when it returns, keeping pages with
      many charts light. Data and config are kept; zoom and selection are not,
      so set `false` to keep them. Defaults to `true`.
  */
  detectVisibleUnload?: boolean;
  /**
      ParallelCoordinates: per-dimension options, keyed by dimension — `domain`
      (either end of a numeric domain may be `undefined`), `reverse`, `title`,
      and any Axis config (`tickFormat`, `ticks`, `scale`, `tickTooltip`,
      `titleTooltip`, …).
  */
  dimensionConfig?: Record<string, DimensionOptions>;
  /**
      Alluvial: styles the column titles drawn above each column (any TextBox
      config), and takes a `titleTooltip`: the tooltip shown when a title is
      hovered, as its text, a function that receives the title and returns it,
      or a tooltip config (as `tooltipConfig`) whose accessors receive the
      title. Unset (the default) or when the
      function returns nothing, a title cut short with an ellipsis shows its
      whole text; `false`, set or returned, shows no tooltip.
      @example
      {maxLines: 1, titleTooltip: title => notes[title]}
  */
  dimensionTitleConfig?: Record<string, unknown> & {
    titleTooltip?:
      | string
      | ((title: string) => string | false | void)
      | AxisTooltipConfig<[title: string]>
      | false;
  };
  /**
      ParallelCoordinates: the data keys to draw an axis for, in order.
      Defaults to every numeric key except the `groupBy` keys and `id`; a key
      whose values aren't all numbers gets a categorical axis.

      Alluvial: the categorical dimensions, one column each, left to right —
      data keys, accessor functions `(d, i) => category`, or `{value, title}`
      objects. A key is its column's title; a bare accessor has none. Rows
      missing a category on any dimension (`undefined`, `null`, or `""`) are
      left out.
  */
  dimensions?: AlluvialDimensionInput[];
  /** Sets orientation of main category axis. */
  discrete?: "x" | "y" | "radius" | "angle";
  /** Candlestick: the color of periods that closed below their open, or an accessor of the row. Defaults to red. */
  downColor?: string | ((d: DataPoint, i: number) => string);
  /** Default duration of transitions, in milliseconds. */
  duration?: number;
  /**
      Priestley and Gantt: accessor or data key for each row's end (default
      `"end"`). A key also aggregates grouped rows by their latest end.
  */
  end?: string | ((d: DataPoint, i: number) => unknown);
  /** Calendar: the fill of days without a value. Defaults to the theme's `colorScale.missing` when it sets one, else a faint tint of the chart's text color, legible on light and dark backgrounds. */
  emptyFill?: string;
  /** Splits the chart into small multiples: one equally sized panel per distinct value of this data key or accessor, sharing one legend, color scale, title, and timeline. `false` draws a single chart. */
  facet?: string | ((d: DataPoint, i: number) => unknown) | false;
  /** Layout and scale sharing for small multiples (see `facet`): `columns`, `rows`, `padding`, `sort`, `scales` (`"shared"` or `"independent"`), `axes` (`"outer"` or `"all"`, for both axes or per axis as `{x, y}`), `title`, and `titleConfig`. */
  facetConfig?: FacetConfig;
  /**
      Fills the area between two series' lines, in the color of whichever
      series is higher, switching color where the lines cross: `true` fills
      between the first two series, `[a, b]` between the series with ids `a`
      and `b`, and a list of `[a, b]` pairs fills between each pair. The fill
      follows the lines' curve and leaves pointer events to the lines.
      Defaults to `false`.
  */
  fillBetween?:
    | boolean
    | [string | number, string | number]
    | [string | number, string | number][];
  /**
      Area styles for `fillBetween` (default `{fillOpacity: 0.25}`). Style
      accessors receive a data row of whichever series is higher, with
      `above` and `below` keys naming the higher and lower series, so a
      `fill` accessor can color the A > B and B > A regions apart. Like a
      confidence band, the fill takes `texture`, `textureDefault`,
      `backgroundImage`, and `backgroundImageFit` from `shapeConfig` (or
      `shapeConfig.Area`), so a texture accessor that picks a series
      textures the regions where that series is higher; set them here to
      style the fill alone, or to `false` to keep it plain.
  */
  fillBetweenConfig?: Record<string, unknown>;
  /** Predicate filtering which data points are included, or false to disable. */
  filter?: ((d: DataPoint, i: number) => boolean) | false;
  /** Allows removing specific geographies from topojson file to improve zoom. */
  fitFilter?: number | string | ((d: Record<string, unknown>) => boolean);
  /**
      Marks a forecast: a shaded backdrop, a rule, and a "Forecast" label over
      the forecast stretch, with lines dashed there (see `forecastConfig`).
      A function flags the forecast rows; `"auto"` (or `true`) flags rows whose
      `confidence` bounds spread from their line; a discrete-axis value starts
      the forecast there; `false` marks nothing. Unset (the default), only a
      trend line projection is marked. Defaults to `"auto"` on a FanChart.

      Bullet: each row's forecast (or other comparative measure), drawn as a
      paler bar behind the measure: a data key, an accessor, a number, or
      `false`.
  */
  forecast?:
    | boolean
    | "auto"
    | number
    | string
    | Date
    | ((d: DataPoint, i: number) => boolean | number);
  /**
      Styles the `forecast` marker: the backdrop's `fill` and `fillOpacity`
      (default `0.05`), the rule's `stroke`, `strokeWidth`, `strokeOpacity`,
      and `strokeDasharray`, the `label` text (default "Forecast"; `false`
      hides it) and its font keys, `lineDasharray` for each line's forecast
      stretch (default `"6 4"`; `false` keeps lines solid), and an optional
      `texture` or `backgroundImage` for the backdrop. `fill: false` or
      `stroke: false` hides the backdrop or rule.

      Bullet: the forecast bar's `size` (a share of the band), `opacity`,
      `fill`, `texture`, and `backgroundImage`/`backgroundImageFit`.
  */
  forecastConfig?: Record<string, unknown>;
  /**
      Dumbbell: orders the categories by their gap, the distance between each
      category's smallest and largest value. `"descending"` puts the widest gap
      first (at the top of horizontal dumbbells, at the left of vertical ones),
      `"ascending"` the narrowest, and `false` keeps the category axis's own
      order. A `ySort`/`xSort` comparator on the category axis takes precedence.
  */
  gapSort?: false | "ascending" | "descending";
  /**
      Gantt: accessor or data key for each task's group, such as its project
      phase. Grouped tasks sit under a header row naming the group, with a
      bracket spanning its tasks.
  */
  group?: string | ((d: DataPoint, i: number) => unknown) | false;
  /** Grouping key(s) or accessor function(s). */
  groupBy?:
    | string
    | string[]
    | ((d: DataPoint) => string | number)
    | ((d: DataPoint) => string | number)[];
  /**
      Treemap: style of the group header strips (see `groupLabels`). The
      accessors receive the group's merged row.
  */
  groupLabelConfig?: {
    /** Strip color. Defaults to a darker shade of the group's color, or a neutral tone when `colorScale` colors the tiles. */
    fill?: CssColor | ((d: DataPoint, i: number) => CssColor);
    /** Text color. Defaults to the color that contrasts with the strip. */
    fontColor?: CssColor | ((d: DataPoint, i: number) => CssColor);
    /** Font family. Defaults to the chart's `fontFamily`. */
    fontFamily?: string | string[];
    /** Font size, in pixels, which sets the strip's height. Defaults to `11`. */
    fontSize?: number;
    /** Font weight. Defaults to `600`. */
    fontWeight?: number | string;
    /**
        The strip's text, given the group's merged row (the same row the
        strip's hover and click handlers receive). Its tooltip title uses it
        too. Unset, or returning nothing, the strip shows the group's
        `groupBy` value at its level; the chart's own `label` names only the
        tiles, since on a merged row it can't tell a group-level field from a
        tile-level one.
    */
    label?: (d: DataPoint, i: number) => string;
    /** Space around the text inside the strip, in pixels. Defaults to `3`. */
    padding?: number;
  };
  /**
      Treemap: whether each group above the drawn tiles of a nested `groupBy`
      gets a header strip naming it, with its tiles below the strip. Every
      level above the tiles gets its own strip; a group too small for one
      gets none. Hovering a strip highlights its group, and clicking it zooms
      into that group (Back steps out). Defaults to `true`.
  */
  groupLabels?: boolean;
  /** Padding between groups of bars in pixels. */
  groupPadding?: number;
  /** Overall height of the visualization in pixels. */
  height?: number;
  /**
      Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).
  */
  hiddenColor?: CssColor | ((d: DataPoint, i: number) => CssColor);
  /**
      Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).
  */
  hiddenOpacity?: number | ((d: DataPoint, i: number) => number);
  /** The hover callback function for highlighting shapes on mouseover. */
  hover?: ((d: DataPoint, i: number) => boolean) | false | null;
  /**
      How close (px) the pointer must come to a point mark (scatter and
      bubble points, Network nodes, Geomap points, Radar dots) to hover it, so small
      points are easy to reach. Defaults to `20`; `0` turns it off.
  */
  hoverDistance?: number;
  /** Candlestick: accessor or data key for each period's highest value (default `"high"`). */
  high?: string | ((d: DataPoint, i: number) => number);
  /** Persistently emphasizes matching marks (keep color) and grays the rest. */
  highlight?: ((d: DataPoint, i: number) => boolean) | false | null;
  /**
      Candlestick: draws rising candles as outlines and falling candles
      filled (default `true`), so direction reads without relying on color;
      `false` fills both.
  */
  hollow?: boolean;
  /** Waterfall: fill for bars that raise the running total. Defaults to `colorDefaults.on`. */
  increaseColor?: string;
  /**
      What Violin draws inside each violin: `"box"` (default; a narrow box
      plot), `"quartiles"` (a solid line at the median and dashed lines at the
      quartiles), `"points"` (the observations packed into a swarm), an array
      of several, or `false` for nothing.
  */
  inner?:
    "box" | "quartiles" | "points" | ("box" | "quartiles" | "points")[] | false;
  /** Styles for Violin's `inner` overlays: `box` (Box config), `quartiles` (Line config), and `points` (Circle config). */
  innerConfig?: {
    box?: Record<string, unknown>;
    quartiles?: Record<string, unknown>;
    points?: Record<string, unknown>;
  };
  /**
      Lets keyboard users move between the chart's marks: the chart is one Tab
      stop, the arrow keys move to the nearest mark in that direction, Home and
      End jump to the ends, Enter or Space click the focused mark, and Escape
      clears it. Defaults to `true`; `false` removes the Tab stop.
  */
  keyboardNav?: boolean;
  /** Styles the focus ring around the mark keyboard navigation has focused (see `KeyboardNavConfig`). */
  keyboardNavConfig?: KeyboardNavConfig;
  /**
      Accessor function, or a constant string applied to every data point's
      label (unlike `value`/`nodeId`/etc., a string here is not treated as a
      per-datum object key — pass a function for that).
  */
  label?: string | string[] | false | AccessorFn;
  /**
      Gantt: the most the task label column may take: a share of the chart's
      width when 1 or below (default `0.3`), else pixels. The column fits the
      widest label up to it, wrapping or truncating longer ones; `0` hides it.
  */
  labelWidth?: number;
  /**
      Where each shape's label goes: `"auto"`, `"along"`, `"inside"`, or
      `"outside"`, or a `(d, i) => string` accessor. `"auto"` picks
      whichever fits best per shape, and a label with no room is left out.

      - Rings (Pie, Donut, Sunburst, Chord, RadialBar) and polar charts
        (Radar, PolarArea, RadialMatrix): `"along"` curves the name along its
        arc. `"inside"` keeps it straight; on a Pie or Donut, `"outside"`
        moves it beside the ring with a leader line.
      - Bars: inside or outside the bar. `"auto"` goes outside when the bar
        is short. Stacked bars always label inside.
      - Circles (Plot points, Network nodes, Geomap points): inside the
        circle, or beside it when it doesn't fit (`"outside"` always beside).
      - Stacked areas: `"auto"` and `"along"` run each name along its band;
        `"inside"` puts it in the band's largest box.

      When every stacked area or RadialBar track is named along its shape,
      the default legend hides. Defaults to `"auto"`.
  */
  labelPosition?:
    | "auto"
    | "along"
    | "inside"
    | "outside"
    | ((d: DataPoint, i: number) => "auto" | "along" | "inside" | "outside");
  /**
      Whether to display the legend. By default it shows when it has more than
      one entry and each entry stands for a single group, or when entries are
      colored by a category that isn't a `groupBy` level. It hides when the
      chart's own labels already name every entry (see `labelPosition`), or
      when every Circle, Rect, and Bar of a Plot shows its whole label as its
      legend entry would, and stays while a series is hidden or soloed.
      `false` hides it, `true` always shows it, and a `(config, data) =>
      boolean` function decides.
  */
  legend?: boolean | ((config: D3plusConfig, arr: DataPoint[]) => boolean);
  /** Configuration object passed to the legend's config method. */
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
  /**
      Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking will solo that category and shift+clicking will hide that category. The Back button undoes each click (see `legendHistory`).
  */
  legendFilterInvert?: boolean | ((viz: VizBase) => boolean);
  /**
      Whether legend clicks go on the chart's Back history, so Back undoes
      them along with drill-downs, in order. Defaults to `true`; `false` leaves
      them off, so Back only steps out of drill-downs.
  */
  legendHistory?: boolean;
  /**
      Whether the chart may draw a legend, size legend, or colorScale inside
      empty space around its marks (over a translucent box, see
      `legendInsetConfig`) instead of in a margin. Only a legend whose position
      is `"auto"` can move inside. Defaults to `true`; also accepts a function
      of the resolved config.
  */
  legendInset?: boolean | ((config: D3plusConfig) => boolean);
  /**
      Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).
  */
  legendInsetConfig?: {
    /** Box fill; defaults to the chart's background color. */
    fill?: CssColor;
    fillOpacity?: number;
    stroke?: CssColor;
    strokeWidth?: number;
    /** Corner radius. */
    rx?: number;
    /** Space between the box's edge and the legend inside it. */
    margin?: number;
    /** Space kept between the box and the chart's marks and edges. */
    padding?: number;
  };
  /**
      Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
  legendPadding?: boolean | ((viz: VizBase) => boolean);
  /**
      Defines which side of the visualization to anchor the legend. Expected values are `"auto"` (the default), `"top"`, `"bottom"`, `"left"`, `"right"`, and `false` to hide it. `"auto"` lets the chart choose: inside the chart when it fits there (see `legendInset`), otherwise the right side of charts more than 1.5 times as wide as they are tall and the bottom of all others. Any other side keeps the legend there.
  */
  legendPosition?: false | PanelPosition | (() => false | PanelPosition);
  /**
      Comparator that orders the legend's entries. By default the legend reads in the order the chart draws: Treemap, Pack, Pie, Donut, Icicle, and Sunburst list their largest entries first; a stacked chart lists its series in stacking order, from the baseline outward (so the default `stackOrder`, `"descending"`, lists the largest first); Waffle and Waterfall follow their own order, and Network and ArcDiagram clusters come largest first; every other chart is alphabetical by label. A threshold group always comes last, whatever the sort.
  */
  legendSort?: (a: DataPoint, b: DataPoint) => number;
  /** Configuration object for the legend tooltip. */
  legendTooltip?: TooltipConfig;
  /**
      Formats the Radar's level value labels and dot tooltip values, or the
      Hexbin's contour level labels and tooltips. Receives the value and
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
    fontColor?: CssColor;
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
  /** ParallelCoordinates: the lines' stroke opacity, or `"auto"` (default) to fade them as their number grows. */
  lineOpacity?: number | "auto";
  /**
      Labels each line with its series name: `true` or `"end"` past its right
      end, `"start"` past its left end, `"both"` at both ends, or `"along"`
      written along the line itself, following its curve. A function of each
      row picks per series (or `false`). End labels that would overlap are
      moved apart, and `lineLabelConfig` can add each end's value. When every
      line is named along it, the default legend hides. Defaults to `"along"`
      on LinePlot, no labels elsewhere.
  */
  lineLabels?: LineLabelsSetting;
  /**
      Options for `lineLabels`. `value: true` adds the line's value at each
      labeled end after the series name (e.g. "Brazil 37%"), formatted as the
      y axis formats its ticks (its `tickFormat` when set). `valueFormat`
      formats it instead, as a function of the value, the row it belongs to,
      and the row's index. Defaults to `{value: false}`.
  */
  lineLabelConfig?: LineLabelConfig;
  /**
      RadialBar's sweep, in degrees from `startAngle`. Defaults to 270 for
      tracks and 360 for the circular bar chart.
  */
  maxAngle?: number;
  /**
      Geomap: how far each link bows into an arc, as a share of the distance
      between its ends: `0` draws the plain great-circle path, and the default
      `0.2` bows it to the left of its direction (negative bows right), so
      links running both ways stay apart. Globes ignore it.
  */
  linkCurve?: number;
  /**
      Network and Geomap: bundles links that run the same way into shared
      curves (force-directed edge bundling), so the main flows read through
      the clutter of a dense chart. A bundled Geomap link ignores
      `linkCurve`. Defaults to `false`.
  */
  linkBundle?: boolean;
  /**
      Tunes `linkBundle`: `strength` (how closely links keep to their
      bundles, `0.85`), `cycles` (`6`), `iterations` (`50`),
      `compatibility` (how alike two links must be to bundle, `0.4`; lower
      bundles more), and `smoothing` (`true` draws smooth curves). Merged
      into the defaults.
  */
  linkBundleConfig?: LinkBundleConfig;
  /**
      Network, Rings, and Geomap: the widest link, in pixels, when `linkSize`
      values differ. Network and Rings default to half the smallest node's
      radius (never thinner than `linkSizeMin`); Geomap defaults to `10`. A
      `linkSizeMin` wider than a set `linkSizeMax` is held to it.
  */
  linkSizeMax?: number;
  /**
      Network, Rings, ArcDiagram, and Geomap: the thinnest link, in pixels,
      when `linkSize` values differ (default `1`).
  */
  linkSizeMin?: number;
  /**
      Colors each link of a Network, Rings, Sankey, ArcDiagram, or Geomap (and
      its arrowheads): `"source"` or `"target"` takes that node's color, and a
      key or accessor reads a value from each link: a number is colored on the
      colorScale, and a string is a color or a palette category. `false` (the
      default) draws every link in the theme's link gray.
  */
  linkColor?:
    | false
    | "source"
    | "target"
    | string
    | ((d: DataPoint, i: number) => unknown);
  /**
      Text drawn at the middle of each link of a Network, Rings, Sankey,
      ArcDiagram, or Geomap: a key or accessor function (receiving the link, with
      `source` and `target` set to the data of its nodes, and its index in
      `links`). It sits halfway along a link's length, centered on
      a Sankey band, and at the top of an ArcDiagram arc, on a pad of the
      chart's background, and follows a curved link's curve (see
      `linkLabelConfig`). Numbers are abbreviated in the chart's locale.
      Labels that would cover a node or another label are hidden, the
      widest links' labels kept first. Defaults to none.
  */
  linkLabel?: string | ((d: DataPoint, i: number) => unknown);
  /**
      Styles the link labels (see `linkLabel`): `rotate` (`"along"`, the
      default, runs text along its link, curves included; `"horizontal"`
      keeps it flat), `fontSize` (default `10`), `padding` (default `2`),
      `backgroundOpacity` of the pad behind the text (default `0.85`),
      `minRadius`, the tightest bend a label follows in ems (default `2`), and
      any other TextBox setting, such as `fontColor`.
  */
  linkLabelConfig?: LinkLabelConfig;
  /** Links this chart to every other chart with the same group name, so hovering, `active`, `highlight` (including search), and legend hide/solo clicks in one are mirrored in the rest, and a value gets the same categorical color in every chart. Rows match across charts by the value of `by` (a data key or accessor), which defaults to the chart's own id. A string is shorthand for `{group}`; set `hover`, `active`, `highlight`, `legend`, or `color` to `false` to stop sharing that behavior. */
  link?: LinkOption;
  /**
      Network, Rings, ArcDiagram, and Geomap: each link's thickness, as a
      pixel number, or an accessor whose values are scaled (see
      `linkSizeScale`) between `linkSizeMin` and `linkSizeMax`. The accessor
      receives each link with `source` and `target` set to its nodes' data.
  */
  linkSize?:
    | number
    | ((
        d: DataPoint & {source: DataPoint; target: DataPoint},
        i: number,
      ) => number);
  /**
      Network, Rings, Sankey, Chord, ArcDiagram, and Geomap: transforms
      `links`
      before they are drawn. The function receives the loaded file (or the
      Array passed as `links`) and returns the links Array. It runs when the
      chart renders, whichever order `links` and `linksFormat` are set in,
      and setting it again re-runs it on the next render. Passing a formatter
      as the second argument of `links(url, format)` sets it, and setting
      `links` alone keeps it.
  */
  linksFormat?: (data: DataPoint[]) => DataPoint[];
  /**
      Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.
  */
  loadingMessage?: boolean;
  /**
      The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
  */
  loadingHTML?: string | ((viz: VizBase) => string);
  /** Candlestick: accessor or data key for each period's lowest value (default `"low"`). */
  low?: string | ((d: DataPoint, i: number) => number);
  /** Bullet: the measure bar's thickness, as a fraction of the band's thickness. */
  measureSize?: number;
  /** Orders Violin and Ridgeline categories by median: `false` (default; data order), `"ascending"`, or `"descending"`. */
  medianSort?: false | "ascending" | "descending";
  /**
      Gantt: accessor or data key for whether a task is a milestone, drawn as
      a diamond at its `end` (default `"milestone"`). Without one, a task that
      starts and ends at the same time is a milestone.
  */
  milestone?: string | ((d: DataPoint, i: number) => unknown) | false;
  /**
      The color of the mask displayed underneath the status message when loading AJAX requests and displaying errors. Set to `false` to turn off the mask completely.
  */
  messageMask?: string | boolean;
  /**
      Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.
  */
  messageStyle?: Record<string, unknown>;
  /** Metric key for the visualization. */
  metric?: string;
  /** Shows a small overview + draggable-viewport minimap in the chart's top-right corner (beneath the zoom controls, when they show) once the chart is zoomed in. On by default whenever `zoom` is enabled. */
  minimap?: boolean;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the minimap's outer box, viewport box, and zoom-level label, alongside their fixed `d3plus-minimap` / `d3plus-minimap-viewport` / `d3plus-minimap-label` classes. Setting this automatically disables d3plus's built-in inline `minimapStyle`/`minimapViewportStyle`/`minimapViewportStyleActive`/`minimapLabelStyle` defaults (as long as you haven't already customized them yourself), so a host page's own styling applies through the cascade with no other configuration needed.
  */
  minimapClassName?: string;
  /**
      An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  minimapLabelStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  minimapStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  minimapViewportStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  minimapViewportStyleActive?: Record<string, unknown> | false;
  /**
      Calendar: formats the month names along year blocks and the titles of
      month blocks — a d3-time-format specifier read in the chart's `locale`,
      a function of the month's first day, or `false` for none.
  */
  monthFormat?: string | ((date: Date) => string) | false;
  /** Calendar: whether to outline each month inside year blocks. Defaults to `true`. */
  monthOutline?: boolean;
  /** Calendar: styles the month outlines (`stroke`, `strokeWidth`, `strokeDasharray`). */
  monthOutlineConfig?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: number[];
  };
  /**
      The inner HTML of the status message displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
  */
  noDataHTML?: string | ((viz: VizBase) => string);
  /**
      Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.
  */
  noDataMessage?: boolean;
  /**
      The order of ArcDiagram's nodes along its line: `"data"` (the default,
      their order in `nodes`), `"label"` (alphabetical), `"group"` (by the
      top `groupBy` or `nodeGroupBy` level when there are several, else by
      the `color` value, then by label), `"degree"`
      (most connected first), or a comparator function receiving two node
      rows, as for `Array.prototype.sort`.
  */
  nodeSort?:
    | "data"
    | "label"
    | "group"
    | "degree"
    | ((a: DataPoint, b: DataPoint) => number);
  /**
      Network, Rings, Sankey, Chord, and ArcDiagram: transforms `nodes`
      before they are drawn. The function receives the loaded file (or the
      Array passed as `nodes`) and returns the nodes Array. It runs when the
      chart renders, whichever order `nodes` and `nodesFormat` are set in,
      and setting it again re-runs it on the next render. Passing a formatter
      as the second argument of `nodes(url, format)` sets it, and setting
      `nodes` alone keeps it.
  */
  nodesFormat?: (data: DataPoint[]) => DataPoint[];
  /**
      Network, Rings, Sankey, ArcDiagram, and Geomap: how many links a node's tooltip
      lists below its number of connections, strongest first, each as the
      node at its other end ("→ Target" or "← Source") and its value. A
      number, or `false` to list none. Defaults to 3 when the links differ
      in value (`linkSize`, or Sankey's `value`), and none when they don't.
  */
  nodeTooltipLinks?: number | false;
  /**
      Network, Rings, ArcDiagram, and Sankey: the network measures a node's
      tooltip lists. `true` (the default) lists them all, `false` none, or
      an Array picks some, in the order to list them: `"degree"` (its number
      of links, as "In-degree" and "Out-degree" when the chart draws arrows
      and in Sankey; it replaces the "Connections" count), `"betweenness"`
      (the share of shortest paths between other nodes that pass through
      it, 0 to 1), `"closeness"` (how near it is to the nodes it can reach,
      0 to 1), and `"cluster"` (the name of its cluster, when clusters color
      the chart). Betweenness and closeness are worked out while the browser
      is idle after the chart draws, and an open tooltip fills them in once
      they are ready.
  */
  nodeTooltipStats?:
    boolean | ("degree" | "betweenness" | "closeness" | "cluster")[];
  /**
      Network, Rings, ArcDiagram, and Sankey: settings for the network
      measures in node tooltips. `weighted: true` counts a strong link (by
      `linkSize`, or Sankey's `value`) as a shorter step than a weak one for
      betweenness and closeness; by default every link is one step.
  */
  nodeTooltipStatsConfig?: {weighted?: boolean};
  /**
      Ocean color for geomaps (any CSS value including 'transparent'), or a
      `{light, dark}` pair chosen by the chart's `theme` (the page behind it
      in `"auto"` mode). Defaults to the default basemap's own water colors.
  */
  ocean?: string | {light: string; dark: string};
  /** Event listeners keyed by event name. */
  on?: Record<string, (event: Event) => void>;
  /** Candlestick: accessor or data key for each period's opening value (default `"open"`). */
  open?: string | ((d: DataPoint, i: number) => number);
  /**
      Plot charts: accessor function or string key for the field that orders
      each series' path, such as a year. Each series' points are joined by a
      line in that order (a Line follows it instead of the discrete axis), so
      the line can double back to trace the path two measures took together.
      Rows that share a series and an order value are aggregated. Arrowheads
      show the direction (`pathArrows`) and the first and last points are
      labeled (`pathLabels`). ConnectedScatter joins points in the data's
      order until it is set. Not used by stacked charts.
  */
  order?: string | ((d: DataPoint, i: number) => unknown);
  /**
      Layout direction. Charts that can be drawn either way take
      `"horizontal"` or `"vertical"`, as do Box shapes. Whisker shapes take the
      side they point toward: `"top"`, `"bottom"`, `"left"`, or `"right"`.
      Shapes also accept a per-datum accessor.
  */
  orient?: ConstOrAccessor<Orient | SideOrient>;
  /**
      How far Ridgeline's tallest ridge rises, in category steps (default
      1.5): 1 reaches the next baseline up, larger values overlap the ridges
      above.
  */
  overlap?: number;
  /**
      Room (px) reserved around a Radar's web (or a polar chart's circle) for
      its labels. `"auto"` (the default) curves every label along the edge
      when they all fit (see `labelPosition`), else sizes the circle to the
      labels measured along their spokes, wrapping long ones onto two lines.
      A number reserves exactly that much room.
  */
  outerPadding?: number | "auto";
  /** Priestley and Gantt: the space between neighboring bars, as a share of each row (d3's band `paddingInner`). */
  paddingInner?: number;
  /** Priestley and Gantt: the space before the first row and after the last, as a share of a row (d3's band `paddingOuter`). */
  paddingOuter?: number;
  /** With `order`: draws an arrowhead on each segment of a series' path, pointing along it, wherever the segment has room for one (default `true`). */
  pathArrows?: boolean;
  /**
      With `order`: labels each series' first and last points. `true` (the
      default) shows their order values (such as the years), `false` none,
      and a function `(d, i) => string` any text. Each label sits beside
      its point on the most open side that keeps it in the plot and clear of
      the points, arrowheads, and other labels, and hides when no side is.
  */
  pathLabels?: boolean | ((d: DataPoint, i: number) => string | false | null);
  /** Pyramid: draws each value as a fraction of the frame's total, with the axis and tooltip reading percentages. */
  percent?: boolean;
  /** Calendar: what each block covers — `"year"` (the default; whole years, stacked) or `"month"` (whole months, as a grid of small calendars). */
  period?: "year" | "month";
  /** Coordinate accessor for point-based geomaps. */
  point?: (d: DataPoint) => number[];
  /**
      Hexbin: the style of the observations `points` draws: `r`, the dot
      radius in pixels (default `1.5`); `fill` (defaults to the chart's text
      color); and `fillOpacity` (default `0.35`). Merged into the current
      config.
  */
  pointConfig?: PointConfig;
  /**
      Fits and styles circle labels (see `labelPosition`): `fontMin` is the
      smallest font size a label may shrink to inside its circle before
      `"auto"` moves it beside the circle (default `10`, the size of the
      chart's smallest text, its total); `fontSize` is the size of a label
      beside its circle (default `11`); `padding` is the space between the
      circle's edge and that label (default `3`). The other TextBox keys
      (`fontColor`, `fontFamily`, `fontWeight`, `fontOpacity`, …) style the
      labels beside their circles, which default to the chart's text color.
      Merged into the current config.
  */
  pointLabelConfig?: PointLabelConfig;
  /** Hexbin: draws the raw observations as small dots beneath the bins and contours. Defaults to `false`. */
  points?: boolean;
  /** Point size accessor for geomaps. */
  pointSize?: string | ((d: DataPoint) => number);
  /** Minimum point size for geomaps. */
  pointSizeMin?: number;
  /** Maximum point size for geomaps. */
  pointSizeMax?: number;
  /**
      Gantt: accessor or data key for each task's progress, a fraction from 0
      to 1 (`0.6`) or a percent string (`"60%"`); default `"progress"`. The
      done part of the bar fills in the task's color and the rest in a paler
      shade, and the tooltip lists it. A milestone below 100% draws pale and
      outlined. A key also averages grouped rows' progress.
  */
  progress?: string | ((d: DataPoint, i: number) => unknown) | false;
  /** Map projection name or function. */
  projection?: string | ((x: number, y: number) => [number, number]);
  /** Outer padding between the visualization edge and map shapes. */
  projectionPadding?: number | string;
  /** Rotation offset for the map projection center. */
  projectionRotate?: [number, number];
  /**
      How PolarArea maps values onto radii: `"sqrt"` (default) keeps each
      wedge's area proportional to its value; `"linear"` its radius.
  */
  radialScale?: "sqrt" | "linear";
  /**
      Whether the chart animates. `"auto"` (default) follows the viewer's OS
      setting, read from the `(prefers-reduced-motion: reduce)` media query at
      each draw (server-side rendering counts as not reduced). `true` always
      draws without motion: shapes, axes, legends, zooms, and fades jump
      straight to their final state. `false` always animates. `duration` keeps
      the value you set either way.
  */
  reducedMotion?: "auto" | boolean;
  /**
      Plot: shaded spans between two values, such as a recession or a target
      range. Give each entry `x` (vertical) or `y` (horizontal) as
      `[start, end]` in data units, `x2`/`y2` for the secondary axes, or
      `ref: "plot"` for fractions of the plot. Optional: a `label` (top-left;
      `labelPosition: "end"` for top-right) with font keys and `maxWidth`,
      `fill`/`fillOpacity` (default the text color at `0.08`), `stroke`,
      `strokeWidth`, `strokeOpacity`, and `layer: "front"` to draw over the
      data. A band widens a continuous axis's domain to fit.
  */
  referenceBands?: ReferenceBandConfig[];
  /**
      Plot: lines across the plot at one value, such as a target or a launch
      date. Give each entry `x` (vertical) or `y` (horizontal) in data units,
      `x2`/`y2` for the secondary axes, or `ref: "plot"` for a fraction of the
      plot. Optional: a `label` at the line's `"end"` or `"start"`
      (`labelPosition`) with font keys and `maxWidth`, `stroke`/`strokeOpacity`
      (default the text color at `0.6`), `strokeWidth` (`1`), `dash` (`true`
      or a dash pattern), and `layer: "front"` to draw over the data. A line
      widens a continuous axis's domain to fit.
  */
  referenceLines?: ReferenceLineConfig[];
  /** Row key for matrix-style layouts. */
  row?: string;
  /** DensityPlot: draws a short tick for every observation just below the value axis, in its group's color, moving the axis's labels down to make room (default `false`; see `rugConfig`). */
  rug?: boolean;
  /** DensityPlot: the `rug` ticks' `size` (length in pixels, default 8), `strokeWidth` (1), and `opacity` (0.7). */
  rugConfig?: {size?: number; strokeWidth?: number; opacity?: number};
  /** Shows a top-left download button that saves the chart, as the reader sees it, as a PNG, SVG, or JPG file. On by default for every chart. */
  saveControl?: boolean;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the download button, alongside the fixed `save-control`/`save-toggle` classes. Setting this automatically disables d3plus's built-in inline `saveControlStyle`/`saveControlStyleActive`/`saveControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling applies through the cascade with no other configuration needed.
  */
  saveControlClassName?: string;
  /** Options for the download button: the saved file's `filename`, the `formats` it offers, the `background` painted behind the chart, a `callback`, and html-to-image options for PNG and JPG files. */
  saveControlConfig?: SaveControlConfig;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the download menu, alongside its fixed `d3plus-save-menu` class (each item has the fixed `save-menu-item` class). Setting this automatically disables d3plus's built-in inline `saveControlMenuStyle`/`saveControlMenuItemStyle`/`saveControlMenuItemStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own menu styling applies through the cascade. The menu's position and open/closed display stay inline.
  */
  saveControlMenuClassName?: string;
  /**
      An object containing CSS key/value pairs that is used to style each item in the download menu. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlMenuClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlMenuItemStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the download menu item under the pointer or keyboard focus. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlMenuClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlMenuItemStyleHover?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the download menu: its background, border, shadow, and spacing. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlMenuClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlMenuStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the download button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the download button while its menu is open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlStyleActive?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the download button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.saveControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  saveControlStyleHover?: Record<string, unknown> | false;
  /**
      If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.
  */
  scrollContainer?: string | HTMLElement | Window;
  /** Shows a top-left search button that expands into an input; typing highlights shapes whose label matches. On by default for every chart. */
  search?: boolean;
  /**
      Resolves the string the search box matches its typed term against, for
      a given datum. Defaults to the mark's resolved on-screen label
      (`viz._drawLabel`) — the same text the user reads on the chart.
      Override it to match against something else instead, e.g. a data
      field that isn't shown as the label.

      This is checked alongside, not instead of, every level of the datum's
      own groupBy hierarchy — searching a leaf's label also matches its
      ancestor group's cell/legend entry, and vice versa, regardless of
      this accessor's override.
  */
  searchAccessor?: (d: DataPoint, i: number) => string;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the search toggle button and input, alongside their fixed `search-control` classes. Setting this automatically disables d3plus's built-in inline `searchControlStyle`/`searchControlStyleActive`/`searchControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
  */
  searchControlClassName?: string;
  /**
      An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  searchControlStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  searchControlStyleActive?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  searchControlStyleHover?: Record<string, unknown> | false;
  /**
      Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.
  */
  shape?: string | ((d: DataPoint, i: number) => string);
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
  /** Bullet: whether every bullet reads against one shared domain, labeled by a single value axis. */
  sharedDomain?: boolean;
  /** Pyramid: the side values (the first `groupBy` level) as `[left, right]`. */
  sides?: unknown[];
  /** Pyramid: TextBox styles for the side titles. */
  sideTitleConfig?: TextBoxConfig;
  /** Pyramid: draws the name of each side above its half of the chart. */
  sideTitles?: boolean;
  /**
      Whether to display the size legend: a nested-circle key, in the chart's bottom-right corner, for charts that size their marks with a `size` accessor (bubble plots, Geomap points via `pointSize`, Network, Rings). By default it shows whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height. Pass `true` to always show it, `false` to hide it, or a function that receives the resolved chart config, the radius scale, and the legend's measured `{width, height, availableWidth, availableHeight}`, and returns a boolean.
  */
  sizeLegend?:
    | boolean
    | ((
        config: D3plusConfig,
        scale: SizeLegendScale,
        size: SizeLegendSize,
      ) => boolean);
  /**
      Candlestick: places periods one slot apart in date order (default
      `true`), so days without data (weekends, holidays) leave no gap, with
      ticks on calendar boundaries; `false` places each period at its date
      on a continuous time axis.
  */
  skipGaps?: boolean;
  /** Size accessor key. */
  size?: string;
  /**
      Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.
  */
  sizeLegendConfig?: SizeLegendConfig;
  /**
      Which margin the size legend claims in the chart's bottom-right corner. `"right"` (the default) widens the right margin, so the chart keeps its full height and the legend sits at the bottom of the right column, below any right-side legend or colorScale. `"bottom"` deepens the bottom margin instead, so the chart keeps its full width and any bottom legend or colorScale narrows to sit beside it.
  */
  sizeLegendPosition?: "right" | "bottom";
  /**
      Anchors a Plot's size scale at zero, so a mark's size is proportional to its value: with the default `sizeScale` of `"sqrt"`, each circle's area is (a value twice as large draws a circle with twice the area), and with `"linear"`, its radius. The largest value still draws at `sizeMax`, while `sizeMin` no longer sets the smallest mark's radius, so values near zero draw as small as they are. Off by default, except on BubbleChart. Ignored when any size is negative or `sizeScale` is `"log"`.
  */
  sizeZero?: boolean;
  /**
      SlopeChart: colors each line by its direction between its first and
      last period. `true` draws rising lines green, falling lines red, and
      flat lines in the theme's muted text color, in shades that suit a light
      or dark theme; an object sets any of `up`, `down`, and `flat` itself.
      The legend and markers follow.
  */
  slopeColor?: SlopeColorSetting;
  /**
      With two groupBy levels, Violin places violins by the first and sets
      them side by side by the second. `split` draws a category holding
      exactly two violins as the two halves of one shape instead.
  */
  split?: boolean;
  /**
      Priestley and Gantt: accessor or data key for each row's start (default
      `"start"`). A key also aggregates grouped rows by their earliest start.
  */
  start?: string | ((d: DataPoint, i: number) => unknown);
  /** Funnel: the gap between consecutive stages, as a fraction (0–1) of each stage's slot. */
  stagePadding?: number;
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
      config to rank series by an aggregate of any data field. The default
      legend lists the series in this order, from the baseline outward.
  */
  stackOrder?:
    | string
    | string[]
    | {
        value: string | ((d: DataPoint) => unknown);
        order?: "ascending" | "descending";
      }
    | ((d: DataPoint) => unknown);
  /** Bullet: a smaller second label under each row's name, as a data key or accessor. */
  subLabel?: string | ((d: DataPoint, i: number) => string) | false;
  /** Configuration object for the subtitle. */
  subtitleConfig?: Record<string, unknown>;
  /**
      Waterfall: marks subtotal rows (a data key or accessor; truthy marks the
      row). A subtotal bar draws from zero to the running total; when the row
      has its own value, the running total resets to that value.
  */
  subtotal?: string | ((d: DataPoint, i: number) => unknown);
  /** Accessor function or string for the visualization's subtitle. */
  subtitle?: string | ((data: DataPoint[]) => string);
  /**
      Packs a Plot's circles into a beeswarm: each keeps its value along one
      axis and is placed beside its neighbors along the other, so none
      overlap. `"x"` or `"y"` names the value axis; `true` picks x when its
      values are numeric, else y; `false` draws a plain scatter. A category
      axis gets one swarm per category. The default, `"auto"`, swarms only
      when every mark is a Circle and rows lack the other axis's value.
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
  /**
      Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
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
  /**
      An additional CSS class name (or space-separated list of class names) applied to the `<table>` element the table-view toggle renders, alongside the fixed `d3plus-table-view-table` class. Lets a host page style the data table with its own table styling (Tailwind, Bootstrap, a design system) via descendant selectors.
  */
  tableViewClassName?: string;
  /**
      An additional CSS class name (or space-separated list of class names) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. Setting this automatically disables d3plus's built-in inline `tableViewControlStyle`/`tableViewControlStyleActive`/`tableViewControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling applies through the cascade with no other configuration needed.
  */
  tableViewControlClassName?: string;
  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  tableViewControlStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  tableViewControlStyleActive?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  tableViewControlStyleHover?: Record<string, unknown> | false;
  /** Whether the data table shows a "download CSV" button, exporting its full (sorted, unpaginated) rows. On by default. */
  tableViewDownload?: boolean;
  /**
      The number of data-table rows shown per page while in table view. Set to `false` (or any non-positive number) to disable pagination and show every row on one page.
  */
  tableViewPageSize?: number | false;
  /** Whether the data table's column headers are clickable to sort (toggling asc/desc). On by default. */
  tableViewSort?: boolean;
  /** Funnel: narrows each stage toward the next stage's width, drawing a continuous funnel instead of flat bars. */
  taper?: boolean;
  /** Gantt: styles the task label column: `fontColor` (the chart's text color by default), `fontFamily`, and `fontSize` (12). */
  taskLabelConfig?: {
    fontColor?: string;
    fontFamily?: string | string[];
    fontSize?: number;
  };
  /**
      Gantt: the order of the tasks: `"data"` (the default) keeps the data's
      order, `"start"` sorts by start, and a function compares two data rows.
      Groups follow their first task.
  */
  taskSort?: "data" | "start" | ((a: DataPoint, b: DataPoint) => number);
  /** Bullet: each row's target, drawn as a marker across the band: a data key, an accessor, a number shared by every row, or `false`. */
  target?: string | number | ((d: DataPoint, i: number) => number) | false;
  /** Bullet: the target marker's `size` (a fraction of the band's thickness), `stroke`, and `strokeWidth`, each a value or a `(d, i)` accessor. */
  targetConfig?: Record<string, unknown>;
  /**
      The chart's colors. `"auto"` (the default) paints no background and
      follows the page, light or dark. `"light"` and `"dark"` paint the
      theme's background and take every chrome color from it. An object
      overrides tokens on top of its `base` preset, e.g.
      `{base: "dark", background: "#123", accent: "#ffd43b"}`. Colors set
      elsewhere in the config win over the theme.
  */
  theme?: ThemeSetting;
  /**
      Threshold value for grouping small slices, as a share of the total
      (`0.05` is 5%). On a stacked Plot (StackedArea, or an AreaPlot,
      BarChart, or LinePlot with `stacked`), the series whose summed value
      across every position is under that share of the whole chart's total
      merge into one series, labelled by `thresholdName` and stacked on top.
      A bucket needs at least two items (a lone small item stays as
      itself), and its tooltips list the items it holds with their values.
      Off by default on Plot charts.
  */
  threshold?: number;
  /** Label for the threshold group, or a `(datum, index)` accessor. */
  thresholdName?: string | ((d: DataPoint, i: number) => string);
  /**
      URL template for XYZ map tiles, with `{z}`, `{x}`, `{y}` (and optional
      `{s}` subdomain) placeholders — or a `{light, dark}` pair, chosen by the
      chart's `theme` (the page behind it in `"auto"` mode). Defaults to
      Esri's Light Gray and Dark Gray Canvas.
  */
  tileUrl?: string | {light: string; dark: string};
  /** Whether to show map tiles. */
  tiles?: boolean;
  /** Time key for temporal data. */
  time?: string;
  /**
      Predicate filtering which time slices are shown, or false to disable.
      With `time` set and no `timeFilter`, a chart starts on its latest
      period, or on `timelineDefault`/`timelineConfig.selection`; setting it
      starts the chart (and its timeline) on the periods it keeps. A
      viewer's pick on the timeline replaces it.
      @example
{timeFilter: d => d.year === 2015}
  */
  timeFilter?: ((d: DataPoint, i: number) => boolean) | false;
  /** Whether to show the timeline component. */
  timeline?: boolean;
  /** Configuration object for the timeline. */
  timelineConfig?: TimelineConfig;
  /**
      Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
  timelinePadding?: boolean | ((viz: VizBase) => boolean);
  /** Accessor function or string for the visualization's title. */
  title?: string | ((data: DataPoint[]) => string);
  /** CSS style configuration for the title. */
  titleConfig?: Record<string, string | number>;
  /**
      Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
  titlePadding?: boolean | ((viz: VizBase) => boolean);
  /**
      Gantt: draws a "today" line across the rows: `true` at the current
      time, or a date (or anything the axis parses) to mark that time. Off
      (`false`) by default; it only draws inside the time axis.
  */
  today?: boolean | Date | string | number;
  /**
      Gantt: styles the "today" line like a `referenceLines` entry: `stroke`,
      `strokeWidth` (1.5), `strokeOpacity` (0.85), `dash`, and its `label`
      (the translated "Today"; `false` for none), with the label's font and
      `labelPosition`.
  */
  todayConfig?: Omit<ReferenceLineConfig, "x" | "y" | "x2" | "y2" | "ref">;
  /**
      Whether to show tooltips, or a
      `(datum, index, {depth, maxDepth, legend})` accessor deciding per mark
      and legend entry. `depth` is the `groupBy` level (from 0) the hovered
      item stands for and `maxDepth` the deepest level, so
      `depth === maxDepth` keeps tooltips to the deepest level; `legend` is
      true for a legend entry. Defaults to `true`.
  */
  tooltip?:
    boolean | ((d: DataPoint, i: number, levels: TooltipLevels) => boolean);
  /** Configuration for the tooltip component. */
  tooltipConfig?: TooltipConfig;
  /**
      Whether hovering a Plot's plot area shows one tooltip listing every
      series' value at the nearest discrete-axis position, with a crosshair
      through it. Applies when a discrete axis is set and at least two series
      share that position.
  */
  tooltipShared?: boolean;
  /** Configuration object for the total bar. */
  totalConfig?: Record<string, unknown>;
  /** Formatter function for the value in the total bar. */
  totalFormat?: (d: number) => string;
  /** Whether RadialBar draws a background track behind every bar. Defaults to `true`. */
  track?: boolean;
  /** Paint for RadialBar's background tracks: `fill`, `opacity`, `stroke`, `strokeWidth`. */
  trackConfig?: Record<string, unknown>;
  /** Share of each RadialBar track (or bar slice) left as a gap between neighbors. Defaults to `0.25`. */
  trackPadding?: number;
  /**
      Draws an automatic trend line fit to the plotted data: `true` (or
      `"linear"`) for a least-squares line, `"exponential"`,
      `"logarithmic"`, `"power"`, or `"polynomial"`, or `"movingAverage"`
      for a rolling mean with bands ±2 standard deviations either side.
      `false` removes it.
  */
  trendLine?:
    | boolean
    | "linear"
    | "exponential"
    | "logarithmic"
    | "power"
    | "polynomial"
    | "movingAverage";
  /**
      Options for the trend lines: `group` (`"series"` or `"all"`), the
      polynomial `order`, a moving average's `window`, `center`, and
      `bands`, a `confidence` band with `confidenceLevel` and
      `confidenceConfig`, a `projection` into the future with
      `projectionConfig`, `tooltip`, and Line styles (`stroke`,
      `strokeWidth`, `strokeDasharray`, …).
  */
  trendLineConfig?: TrendLineConfig;
  /** Path or object for the topojson data. */
  topojson?: string | object;
  /**
      Geomap: transforms `topojson` before it is drawn. The function receives
      the loaded file (or the object passed as `topojson`) and returns the
      topojson to draw. It runs when the chart renders, whichever order
      `topojson` and `topojsonFormat` are set in, and setting it again re-runs
      it on the next render. Passing a formatter as the second argument of
      `topojson(url, format)` sets it, and setting `topojson` alone keeps it.
  */
  topojsonFormat?: (data: Record<string, unknown>) => object;
  /** Geomap: the fill of shapes without data (or without a `colorScale` value). Defaults to the theme's `colorScale.missing` when it sets one, else a quiet gray that suits the basemap. */
  topojsonFill?: CssColor;
  /** Accessor function for topojson feature IDs. */
  topojsonId?: (obj: Record<string, unknown>) => string;
  /** Waterfall: fill for subtotal bars. Defaults to `colorDefaults.sequential`. */
  totalColor?: string;
  /**
      Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
  */
  totalPadding?: boolean | ((viz: VizBase) => boolean);
  /** Candlestick: the color of periods that closed at or above their open, or an accessor of the row. Defaults to green. */
  upColor?: string | ((d: DataPoint, i: number) => string);
  /** Value accessor for the visualization. */
  value?: DataPointAccessor<number>;
  /** Funnel and Gauge: formats each value shown in labels and tooltips, as `(value, datum) => string`. */
  valueFormat?: (value: number, d: DataPoint) => string;
  /**
      Candlestick: how each period draws — `"candlestick"` (default), a wick
      from the high to the low around a body from the open to the close; or
      `"ohlc"`, a high-low line with the open ticked left and the close
      ticked right.
  */
  variant?: "candlestick" | "ohlc";
  /**
      Candlestick: accessor (or data key) for each period's volume. Off by
      default; when set, a strip of volume bars draws under the candles, and
      the tooltip adds a Volume row. `false` turns it off.
  */
  volume?: string | ((d: DataPoint, i: number) => number) | false;
  /**
      Candlestick: the volume strip's `height` (a share of the plot, default
      `0.2`; pixels above 1), `gap` (pixels, default `16`), `axisConfig`
      (its axis), and `shapeConfig` (its bars).
  */
  volumeConfig?: {
    height?: number;
    gap?: number;
    axisConfig?: AxisConfig;
    shapeConfig?: Record<string, unknown>;
  };
  /** Calendar: formats the weekday names — a d3-time-format specifier read in the chart's `locale` (default `"%a"`), a function of a date on that weekday, or `false` for none. */
  weekdayFormat?: string | ((date: Date) => string) | false;
  /** Calendar: the first day of the week, `0` (Sunday) through `6` (Saturday) or a day name such as `"monday"`. Defaults to the first day of the week in the `locale`'s region. */
  weekStart?: number | string;
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
  /**
      The x domain: `[min, max]` on a continuous axis, or the categories to
      show, in order, on a discrete one. Setting one end (`[min]` or
      `[undefined, max]`) pins only that end; the data fills the other. An
      `xConfig.domain` overrides this.
  */
  xDomain?: (number | string | Date)[];
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
  /**
      The y domain: `[min, max]` on a continuous axis, or the categories to
      show, in order, on a discrete one. Setting one end (`[min]` or
      `[undefined, max]`) pins only that end; the data fills the other. A
      `yConfig.domain` overrides this.
  */
  yDomain?: (number | string | Date)[];
  /** The y2 domain as an array. If either value is undefined, it is calculated from the data. */
  y2Domain?: (number | Date)[];
  /** Custom sort function for y-axis values. */
  ySort?: (a: DataPoint, b: DataPoint) => number;
  /** Defines a custom sorting comparator function for discrete y2 axes. */
  y2Sort?: (a: DataPoint, b: DataPoint) => number;
  /** Calendar: formats the year beside each year block — a d3-time-format specifier (default `"%Y"`), a function of the year's first day, or `false` for none. */
  yearFormat?: string | ((date: Date) => string) | false;
  /**
      Enables pan and zoom: the mouse wheel or a pinch (see `zoomScroll`), a
      drag (see `zoomDrag`), a double-click (see `zoomDoubleClick`), the
      zoom-control buttons (see `zoomControls`), and the `zoomIn`, `zoomOut`,
      `zoomReset`, and `zoomBrush` methods. On by default for every chart;
      `false` turns all of them off.
  */
  zoom?: boolean;
  /** The pixel stroke-width of the zoom brush area. */
  zoomBrushHandleSize?: number;
  /**
      An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.
  */
  zoomBrushHandleStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.
  */
  zoomBrushSelectionStyle?: Record<string, unknown> | false;
  /**
      An additional CSS class name (or space-separated list of class names) applied to each zoom control button, alongside the fixed `zoom-control` / `zoom-in` / `zoom-out` / `zoom-reset` / `zoom-brush` classes. Setting this automatically disables d3plus's built-in inline `zoomControlStyle`/`zoomControlStyleActive`/`zoomControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
  */
  zoomControlClassName?: string;
  /**
      Whether the zoom-control buttons (zoom in, zoom out, reset, and brush)
      show in the chart's top-right corner. `false` hides them and gives the
      room they take back to the chart's title, legend, and other top
      content, while zooming stays on: the wheel, pinch, drag, and
      double-click gestures still work, and the chart's `zoomIn`, `zoomOut`,
      `zoomReset`, and `zoomBrush` methods let buttons of your own drive it.
      Defaults to `true`.
  */
  zoomControls?: boolean;
  /**
      Overrides the zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`,
      `zoomBrush`). Each value is an HTML string, or a mount function
      `(el) => void | (() => void)` called with the button's 12×12px icon slot
      (for a React tree, an `<img>`, …); a returned cleanup runs when the
      buttons redraw.
  */
  zoomControlIcons?: Partial<
    Record<
      "zoomIn" | "zoomOut" | "zoomReset" | "zoomBrush",
      string | ((el: HTMLElement) => void | (() => void))
    >
  >;
  /**
      An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  zoomControlStyle?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  zoomControlStyleActive?: Record<string, unknown> | false;
  /**
      An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
  */
  zoomControlStyleHover?: Record<string, unknown> | false;
  /**
      What a double-click on the chart does: `"in"` (the default) doubles
      the zoom around the pointer (Shift + double-click halves it),
      `"reset"` returns to the chart's initial view, like the reset button,
      and `false` does nothing.
  */
  zoomDoubleClick?: "in" | "reset" | false;
  /**
      What a mouse drag on the chart does. `"pan"` (the default) pans it
      (see `zoomPan`). `"brush"` draws a box and zooms into it on release,
      as the brush button does, without turning brush mode on: a click that
      doesn't drag still reaches the shape under it, and hovering still
      shows tooltips. Shift + drag pans in `"brush"` mode, and touch keeps
      panning and pinching as in `"pan"`.
  */
  zoomDrag?: "pan" | "brush";
  /** Multiplier applied to programmatic zoom steps. */
  zoomFactor?: number;
  /** Maximum zoom scale factor. Defaults to the scale at which the smallest shape fills the chart area. */
  zoomMax?: number;
  /** A pixel value to be used to pad all sides of a zoomed area. A Plot's brushed box fills its plot without it, so its axes show the brushed range. */
  zoomPadding?: number;
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
