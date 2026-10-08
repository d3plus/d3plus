/**
    End labels for a short Plot's x axis. A Plot too short for its y axis
    keeps the x axis only for its scale and gridlines — its line, ticks,
    labels, and title are not drawn — and labels the two ends of the x domain
    instead: the start flush with the plot area's left edge, the end flush
    with its right edge, below the plot with the axis's label padding between
    them. The labels use the axis's own tick format and label font, and the
    plot gives up exactly the height they need.

    @module
*/

import {fontExists, rtl as detectRTL} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as d3plusFontFamily, textWrap} from "@d3plus/text";

import type Axis from "../../components/Axis/Axis.js";
import TextBox from "../../components/TextBox.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    How a Plot labels its x axis: with the axis's own tick labels, with its
    two domain ends, or not at all (end-label mode on a chart too short to
    fit them).
*/
export type XLabelMode = "axis" | "ends" | "none";

/**
    Layered over the user's config on the x test axis that measures the plot's
    width while the ends are labeled: no tick labels, so none spill past the
    range ends and inset the plot.
*/
export const END_LABEL_AXIS_CONFIG: Record<string, unknown> = {labels: []};

/** A measured end label. */
export interface EndLabel {
  value: unknown;
  text: string;
  width: number;
}

/** The measured end labels and the space they need below the plot. */
export interface EndLabelMeasure {
  labels: EndLabel[];
  /** The gap between the plot and the labels: the axis's `shapeConfig.labelConfig.padding`. */
  padding: number;
  /** The labels' measured text height. */
  height: number;
}

/** An end label positioned in the plot's content space. */
export interface EndLabelBox {
  value: unknown;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  textAnchor: "start" | "middle" | "end";
}

type Accessor<T> = T | ((d: unknown, i: number) => T);

const resolve = <T>(value: Accessor<T>, d: unknown, i: number): T =>
  typeof value === "function"
    ? (value as (d: unknown, i: number) => T)(d, i)
    : value;

/** The axis label config these labels read their font from. */
interface LabelConfig {
  fontFamily?: Accessor<string | string[]>;
  fontSize?: Accessor<number>;
  fontWeight?: Accessor<number | string>;
  padding?: Accessor<number>;
}

/**
    Whether a Plot labels its x axis with its two ends: the x axis shows, the
    y axis is hidden (the chart is no taller than `yCutoff`), and the user
    hasn't chosen the x labels with `xConfig.labels`.
*/
export function labelsXEnds(viz: Viz, showX: boolean, showY: boolean): boolean {
  return showX && !showY && viz._xConfig?.labels === undefined;
}

/**
    The domain values at an axis's left and right ends, in the form its tick
    labels take (a time scale's as timestamps). One value when both ends hold
    the same value, none for an empty domain.
*/
export function domainEnds(axis: Axis): unknown[] {
  const domain = axis._getDomain();
  if (!domain.length) return [];
  const time = axis.schema.scale === "time";
  const [first, last] = [domain[0], domain[domain.length - 1]].map(d =>
    time ? +(d as Date) : d,
  );
  const same =
    first === last ||
    (first instanceof Date && last instanceof Date && +first === +last);
  return same ? [first] : [first, last];
}

/**
    Formats an axis's domain ends with its tick format and measures them with
    its label font (`shapeConfig.labelConfig` and `shapeConfig.lineHeight`).
    Read after the axis has been measured or rendered.
*/
export function measureEndLabels(axis: Axis): EndLabelMeasure {
  const shapeConfig = axis.schema.shapeConfig as {
    labelConfig?: LabelConfig;
    lineHeight?: (d: unknown, i: number) => number;
  };
  const labelConfig = shapeConfig.labelConfig || {};
  const format = axis._labelFormat || ((d: unknown) => `${d}`);
  let height = 0,
    padding = 0;
  const labels = domainEnds(axis).map((value, i) => {
    const fontSize = resolve(labelConfig.fontSize ?? 12, value, i);
    const lineHeight = shapeConfig.lineHeight
      ? shapeConfig.lineHeight(value, i)
      : fontSize * 1.4;
    const text = `${format(value) ?? ""}`;
    const wrap = textWrap()
      .fontFamily(
        fontExists(
          resolve(labelConfig.fontFamily ?? d3plusFontFamily, value, i),
        ) as string,
      )
      .fontSize(fontSize)
      .fontWeight(resolve(labelConfig.fontWeight ?? 400, value, i))
      .lineHeight(lineHeight)
      .width(Number.MAX_SAFE_INTEGER)
      .height(lineHeight)(text);
    const lines = wrap.lines.filter(l => l !== "");
    height = Math.max(height, Math.ceil(lines.length * lineHeight));
    padding = Math.max(padding, resolve(labelConfig.padding ?? 0, value, i));
    return {
      value,
      text,
      width: lines.length ? Math.ceil(Math.max(...wrap.widths)) : 0,
    };
  });
  return {labels, padding, height};
}

/**
    The height end labels claim below the plot — their padding plus their text
    height — or 0 when that would leave the plot (`available` tall before the
    claim) shorter than the labels.
*/
export function endLabelSpace(
  measure: EndLabelMeasure,
  available: number,
): number {
  const space = measure.height ? measure.padding + measure.height : 0;
  return available - space >= space ? space : 0;
}

/**
    Splits `span` between a start and an end label of natural widths `start`
    and `end`, at least `gap` apart. Labels that fit keep room to their
    natural width; otherwise the narrower one keeps its width (when under half)
    and the other gets the rest, or each gets half, and the TextBox truncates
    what doesn't fit with an ellipsis.
*/
export function allotEndLabelWidths(
  start: number,
  end: number,
  span: number,
  gap: number,
): [number, number] {
  const room = Math.max(0, span - gap);
  if (start + end <= room) return [room - end, room - start];
  const half = room / 2;
  if (start <= half) return [start, room - start];
  if (end <= half) return [room - end, end];
  return [half, half];
}

/**
    Positions measured end labels below a plot spanning `xRange` whose bottom
    edge is at `bottom`: the start label left-aligned to the plot's left edge,
    the end label right-aligned to its right edge, and a lone label (both ends
    one value) centered. `rtl` swaps the anchors, which a right-to-left page
    mirrors.
*/
export function layoutEndLabels(
  measure: EndLabelMeasure,
  xRange: number[],
  bottom: number,
  rtl = false,
): EndLabelBox[] {
  const {labels, padding, height} = measure;
  if (!labels.length || !height) return [];
  const [x0, x1] = [xRange[0], xRange[xRange.length - 1]];
  const y = bottom + padding;
  if (labels.length === 1) {
    const [{value, text}] = labels;
    return [
      {value, text, x: x0, y, width: x1 - x0, height, textAnchor: "middle"},
    ];
  }
  const [start, end] = labels;
  const widths = allotEndLabelWidths(start.width, end.width, x1 - x0, padding);
  return [
    {
      value: start.value,
      text: start.text,
      x: x0,
      y,
      width: widths[0],
      height,
      textAnchor: rtl ? "end" : "start",
    },
    {
      value: end.value,
      text: end.text,
      x: x1 - widths[1],
      y,
      width: widths[1],
      height,
      textAnchor: rtl ? "start" : "end",
    },
  ];
}

/**
    The end labels of a rendered axis, formatted, measured, and positioned
    below a plot spanning `xRange` whose bottom edge is at `bottom`.
*/
export function placeEndLabels(
  axis: Axis,
  xRange: number[],
  bottom: number,
): EndLabelBox[] {
  return layoutEndLabels(measureEndLabels(axis), xRange, bottom, detectRTL());
}

/**
    Re-sizes a bottom axis so its line — the base of its gridlines — sits at
    `y`, the plot's bottom edge, rather than above the space its labels would
    take. Call with the axis fully configured, before it renders.
*/
export function alignAxisLine(axis: Axis, y: number): void {
  axis.measure();
  const line = axis._outerBounds.y + axis._margin.top;
  axis.height((axis.height() as number) + y - line);
}

/**
    The end labels as a scene group, drawn by a TextBox with the axis's label
    config (font, color, …) so they match the axis's own tick labels.
*/
export function emitEndLabels(
  axis: Axis,
  boxes: EndLabelBox[],
): SceneNode | null {
  if (!boxes.length) return null;
  const labelConfig =
    (axis.schema.shapeConfig as {labelConfig?: Record<string, unknown>})
      .labelConfig || {};
  const textBox = new TextBox()
    .renderMode("compute")
    .config(labelConfig)
    .config({
      fontResize: false,
      padding: 0,
      rotate: 0,
      textAnchor: (d: EndLabelBox) => d.textAnchor,
      verticalAlign: "top",
    })
    .data(
      boxes.map((box, i) => ({
        ...box,
        id: boxes.length === 1 ? "middle" : i ? "end" : "start",
        i,
        data: {id: box.value, text: box.text},
      })),
    );
  const {children} = textBox.toScene();
  return children.length
    ? {type: "group", key: "plot-x-end-labels", children}
    : null;
}
