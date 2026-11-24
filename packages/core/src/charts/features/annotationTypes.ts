/**
    The config shapes of a Plot's callout annotations, reference lines, and
    reference bands.
*/
import type {DataPoint} from "@d3plus/data";

import type {ReferenceDragConfig} from "./referenceDragValue.js";

/**
    How an annotation position is read on one axis: `"data"` (the default)
    maps it through the axis scale, in data units (a number, a date, or a
    category); `"plot"` reads it as a fraction of the plot area, from `0` at
    the left (or bottom) edge to `1` at the right (or top) edge.
*/
export type AnnotationRef = "data" | "plot";

/** A value on a Plot axis: a number, a date (a Date, timestamp, or date string), or a category. */
export type AnnotationValue = number | string | Date;

/**
    A user annotation: a shape key (a Shape class name such as `"Line"` or
    `"Rect"`, or `"Callout"`, `"ReferenceLine"`, or `"ReferenceBand"`) plus
    its config, optionally z-layered.
*/
export interface Annotation {
  shape: string;
  layer?: string;
  [key: string]: unknown;
}

/**
    A statistic of the values the chart draws on an axis: their `"mean"`,
    `"median"`, `"min"`, or `"max"`.
*/
export type ReferenceStatistic = "mean" | "median" | "min" | "max";

/**
    A reference position: a value on the axis, a statistic of the drawn
    rows' values on it, or a function given the drawn rows (the chart's own
    data rows, or one series' rows) that returns a value.
*/
export type ReferenceValue =
  | AnnotationValue
  | ReferenceStatistic
  | ((rows: DataPoint[]) => AnnotationValue | null | undefined);

/** A constant, or a `(datum, index)` accessor over a callout's data rows. */
type CalloutValue<T> = T | ((d: DataPoint, i: number) => T);

/** The text and stroke styles shared by callouts and reference labels. */
export interface AnnotationTextStyle {
  /** Text color. Defaults to the chart's text color for its background. */
  fontColor?: string;
  /** Font family. Defaults to the chart's `fontFamily`. */
  fontFamily?: string | string[];
  /** Font size, in pixels. Defaults to `12`. */
  fontSize?: number;
  /** Font weight. Defaults to `400`. */
  fontWeight?: number | string;
  /** Line height, in pixels. Defaults to 1.3 times `fontSize`. */
  lineHeight?: number;
  /** The width, in pixels, the text wraps at. Defaults to `150`. */
  maxWidth?: number;
}

/**
    A callout annotation (`{shape: "Callout", data: [...]}` in `annotations`):
    a note anchored at each row's `x`/`y` (or `x2`/`y2`, on those axes), drawn
    as wrapped text in a box offset from the anchor by `dx`/`dy` pixels, with
    a connector line from the box to the anchor ending in an arrowhead or a
    dot. Each style key takes a constant or a `(d, i)` accessor, and a row's
    own key of the same name wins over a constant. The box stays inside the
    plot area. Callouts draw in front of the data unless `layer: "back"`, and
    never respond to the pointer or keyboard.
*/
export interface CalloutAnnotation extends AnnotationTextStyle {
  shape: "Callout";
  /** The anchors: each row's `x`/`y` (or `x2`/`y2`) and `label`. */
  data: DataPoint[];
  /** `"front"` (the default) or `"back"` of the data shapes. */
  layer?: "back" | "front";
  /** How the anchors' `x` values are read. Defaults to `"data"`. */
  xRef?: AnnotationRef;
  /** How the anchors' `y` values are read. Defaults to `"data"`. */
  yRef?: AnnotationRef;
  /** The text. Defaults to each row's `label`. */
  label?: CalloutValue<string>;
  /** Horizontal offset of the box's center from the anchor, in pixels. Defaults to `0`. */
  dx?: CalloutValue<number>;
  /** Vertical offset of the box's center from the anchor, in pixels (negative is up). Defaults to `-40`. */
  dy?: CalloutValue<number>;
  /** Text alignment in the box: `"start"`, `"middle"` (the default), or `"end"`. */
  textAlign?: CalloutValue<"start" | "middle" | "end">;
  /** Space between the text and the box's edge, in pixels. Defaults to `6`. */
  padding?: CalloutValue<number>;
  /** Box fill. Defaults to the chart's background; `false` or `"none"` draws no box. */
  fill?: CalloutValue<string | false>;
  /** Box fill opacity. Defaults to `1`. */
  fillOpacity?: CalloutValue<number>;
  /** Box border color. Defaults to the text color. `false` or `"none"` draws no border. */
  stroke?: CalloutValue<string | false>;
  /** Box border opacity. Defaults to `0.25`. */
  strokeOpacity?: CalloutValue<number>;
  /** Box border width. Defaults to `1`. */
  strokeWidth?: CalloutValue<number>;
  /** Box corner radius. Defaults to `3`. */
  rx?: CalloutValue<number>;
  /** Whether a line joins the box to its anchor. Defaults to `true`. */
  connector?: CalloutValue<boolean>;
  /** Connector color. Defaults to the text color. */
  connectorStroke?: CalloutValue<string>;
  /** Connector width. Defaults to `1`. */
  connectorStrokeWidth?: CalloutValue<number>;
  /** Connector opacity. Defaults to `1`. */
  connectorStrokeOpacity?: CalloutValue<number>;
  /** Connector dash pattern, as a string ("4 2") or numbers. */
  connectorStrokeDasharray?: CalloutValue<string | number[]>;
  /** What marks the anchor: `"arrow"` (the default), `"dot"`, or `"none"`. */
  marker?: CalloutValue<"arrow" | "dot" | "none">;
  /** Arrowhead length or dot diameter, in pixels. Defaults to `6`. */
  markerSize?: CalloutValue<number>;
  /** Gap between the connector's end and the anchor, in pixels. Defaults to `0`. */
  standoff?: CalloutValue<number>;
  /** Whether the box is kept inside the plot area. Defaults to `true`. */
  clamp?: CalloutValue<boolean>;
  /**
      Picks the anchors from the rows the chart draws, in place of `data`:
      the row with the largest (`"max"`) or smallest (`"min"`) value on the
      value axis, the `"first"` or `"last"` along the other axis, or a
      function given the drawn rows (the chart's own data rows) that returns
      the ones to annotate. Each anchor row has the drawn `x`/`y`, and the
      data row it came from as `data`; the label defaults to the row's
      series label.
  */
  select?:
    "max" | "min" | "first" | "last" | ((rows: DataPoint[]) => DataPoint[]);
  /** With `select`: picks a row from each series instead of one over every row. Defaults to `false`. */
  perSeries?: boolean;
  /**
      A line from the anchor straight to an axis: `"x"` (or `true`) down to
      the x axis, `"y"` across to the y axis, or `"both"`. Defaults to
      `false`.
  */
  dropline?: CalloutValue<boolean | "x" | "y" | "both">;
  /** Dropline color. Defaults to the text color. */
  droplineStroke?: CalloutValue<string>;
  /** Dropline width. Defaults to `1`. */
  droplineStrokeWidth?: CalloutValue<number>;
  /** Dropline opacity. Defaults to `0.5`. */
  droplineStrokeOpacity?: CalloutValue<number>;
  /** Dropline dash pattern, as a string ("4 2", the default) or numbers. */
  droplineStrokeDasharray?: CalloutValue<string | number[]>;
}

/** The line and label styles shared by reference lines and bands. */
export interface ReferenceStyle extends AnnotationTextStyle {
  /** The text drawn with it. */
  label?: string;
  /** `"back"` (the default) or `"front"` of the data shapes. The label draws above the data either way. */
  layer?: "back" | "front";
}

/**
    A full-width or full-height line across the plot at one value: give `x`
    (a vertical line) or `y` (a horizontal one), or `x2`/`y2` for the
    secondary axes. The value can be a statistic of the rows the chart
    draws (`"mean"`, `"median"`, `"min"`, `"max"`) or a function given
    those rows, and the line is labeled with the statistic's name unless it
    has a `label`. On a continuous or time axis the value widens the axis
    domain to show the line, unless the user set that end of the domain.
*/
export interface ReferenceLineConfig extends Omit<ReferenceStyle, "label"> {
  x?: ReferenceValue;
  y?: ReferenceValue;
  x2?: ReferenceValue;
  y2?: ReferenceValue;
  /** A name for the line, which a `valueColors` threshold can give in `values` to follow it. */
  id?: string;
  /**
      Lets the reader drag the line along its axis with the pointer, or move
      it with the arrow keys once it has focus: `true`, or the range it can
      move in (`min`, `max`; the axis's by default) and the `step` its
      value snaps to (without one, about a pixel's worth; on a category
      axis it snaps to the categories, and `min`/`max` are categories). The
      value it is moved to replaces its own (a statistic or function
      becomes that fixed value), so it lasts through redraws and
      `referenceLines()` reads it back; the chart fires
      `drag.referenceLine` as it moves and `end.referenceLine` when it is
      let go, then redraws to refit its axes. Unlabeled, it is labeled with
      its value. A grip at the end away from its label marks it. A
      `perSeries` line can't be dragged. Defaults to `false`.
  */
  draggable?: boolean | ReferenceDragConfig;
  /** How the value is read. Defaults to `"data"`. */
  ref?: AnnotationRef;
  /**
      The text drawn with it, or a function given the line's value and the
      rows it was computed from. `false` draws none.
  */
  label?:
    string | false | ((value: AnnotationValue, rows: DataPoint[]) => string);
  /**
      With a statistic or function value: draws one line per series, each
      computed over that series' rows and drawn in its color (labeled with
      the series' name). Defaults to `false`, one line over every row.
  */
  perSeries?: boolean;
  /**
      Where the line starts on the other axis (an x value for a horizontal
      line, a y value for a vertical one), read like the line's own value.
      Defaults to the plot's edge.
  */
  from?: AnnotationValue;
  /** Where the line ends on the other axis. Defaults to the plot's edge. */
  to?: AnnotationValue;
  /**
      Emphasizes the drawn rows whose value is `"above"` the line (or, for
      a vertical line, to its right) or `"below"` it, graying the rest the
      way `highlight` does, while no `highlight` is set. A row of a series
      with its own line (`perSeries`) compares against that line.
  */
  highlight?: "above" | "below";
  /** Which end of the line the label sits at: `"end"` (the default: the right, or the top) or `"start"`. */
  labelPosition?: "start" | "end";
  /** Line color. Defaults to the chart's text color. */
  stroke?: string;
  /** Line opacity. Defaults to `0.6`. */
  strokeOpacity?: number;
  /** Line width. Defaults to `1`. */
  strokeWidth?: number;
  /** `true` dashes the line ("4 4"); a dash pattern string or numbers sets its own. */
  dash?: boolean | string | number[];
}

/**
    A shaded span across the plot between two values: give `x` (a vertical
    band) or `y` (a horizontal one) as `[start, end]`, or `x2`/`y2`. Give
    both an x and a y range to shade the rectangle between them. Either end
    can be a statistic of the drawn rows (`"mean"`, `"median"`, `"min"`,
    `"max"`) or a function given them. On a category axis the band covers
    each end category's whole slot; on a continuous or time axis its ends
    widen the axis domain, unless the user set that end of the domain.
*/
export interface ReferenceBandConfig extends ReferenceStyle {
  x?: [ReferenceValue, ReferenceValue];
  y?: [ReferenceValue, ReferenceValue];
  x2?: [ReferenceValue, ReferenceValue];
  y2?: [ReferenceValue, ReferenceValue];
  /**
      Lets the reader drag each edge of the band along its axis, or move it
      with the arrow keys, as a `draggable` reference line moves: `true`, or
      `{min, max, step}`. An edge can't pass the span's other end. The moved
      end replaces its own in the span, and the chart fires
      `drag.referenceBand` and `end.referenceBand` with the whole span.
      Defaults to `false`.
  */
  draggable?: boolean | ReferenceDragConfig;
  /** How the values are read. Defaults to `"data"`. */
  ref?: AnnotationRef;
  /** Which corner the label sits in: `"start"` (the default: the top left) or `"end"` (the top right). */
  labelPosition?: "start" | "end";
  /** Band fill. Defaults to the chart's text color. */
  fill?: string;
  /** Band fill opacity. Defaults to `0.08`. */
  fillOpacity?: number;
  /** Edge color; unset, the band has no edges. */
  stroke?: string;
  /** Edge opacity. Defaults to `0.4`. */
  strokeOpacity?: number;
  /** Edge width. Defaults to `1`. */
  strokeWidth?: number;
}

/** One quadrant's label and fill. */
export interface QuadrantStyle extends AnnotationTextStyle {
  /** The text drawn in the quadrant's outer corner. */
  label?: string;
  /** The quadrant's fill. Defaults to the quadrants' `fill`. */
  fill?: string;
  /** The quadrant's fill opacity. Defaults to the quadrants' `fillOpacity`. */
  fillOpacity?: number;
}

/**
    Splits the plot into four quadrants around a center: a line across the
    plot at the center's `x` and one at its `y`, with each quadrant's label
    in its outer corner and an optional fill.
*/
export interface QuadrantsConfig extends AnnotationTextStyle {
  /** The center's x value, a statistic of the drawn rows, or a function of them. Defaults to `"mean"`. */
  x?: ReferenceValue;
  /** The center's y value, a statistic of the drawn rows, or a function of them. Defaults to `"mean"`. */
  y?: ReferenceValue;
  /** How the center is read. Defaults to `"data"`. */
  ref?: AnnotationRef;
  /**
      Lets the reader drag each divider along its axis, or move it with the
      arrow keys, as a `draggable` reference line moves: `true`, or
      `{min, max, step}`. A moved divider sets the center's `x` or `y`, and
      the chart fires `drag.quadrants` and `end.quadrants` with the center
      as `{x, y}` and the axis moved in place of an index. Defaults to
      `false`.
  */
  draggable?: boolean | ReferenceDragConfig;
  /** The top-left quadrant. */
  topLeft?: QuadrantStyle;
  /** The top-right quadrant. */
  topRight?: QuadrantStyle;
  /** The bottom-left quadrant. */
  bottomLeft?: QuadrantStyle;
  /** The bottom-right quadrant. */
  bottomRight?: QuadrantStyle;
  /** Every quadrant's fill; unset, a quadrant has none unless it sets its own. */
  fill?: string;
  /** Every quadrant's fill opacity. Defaults to `0.08`. */
  fillOpacity?: number;
  /** Divider color. Defaults to the chart's text color. */
  stroke?: string;
  /** Divider opacity. Defaults to `0.6`. */
  strokeOpacity?: number;
  /** Divider width. Defaults to `1`. */
  strokeWidth?: number;
  /** `true` dashes the dividers ("4 4"); a dash pattern string or numbers sets its own. */
  dash?: boolean | string | number[];
  /** `"back"` (the default) or `"front"` of the data shapes. The labels draw above the data either way. */
  layer?: "back" | "front";
}
