/**
    The config shapes of a Plot's callout annotations, reference lines, and
    reference bands.
*/
import type {DataPoint} from "@d3plus/data";

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
    secondary axes. On a continuous or time axis the value widens the axis
    domain to show the line, unless the user set that end of the domain.
*/
export interface ReferenceLineConfig extends ReferenceStyle {
  x?: AnnotationValue;
  y?: AnnotationValue;
  x2?: AnnotationValue;
  y2?: AnnotationValue;
  /** How the value is read. Defaults to `"data"`. */
  ref?: AnnotationRef;
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
    band) or `y` (a horizontal one) as `[start, end]`, or `x2`/`y2`. On a
    category axis the band covers each end category's whole slot; on a
    continuous or time axis its ends widen the axis domain, unless the user
    set that end of the domain.
*/
export interface ReferenceBandConfig extends ReferenceStyle {
  x?: [AnnotationValue, AnnotationValue];
  y?: [AnnotationValue, AnnotationValue];
  x2?: [AnnotationValue, AnnotationValue];
  y2?: [AnnotationValue, AnnotationValue];
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
