/**
    The scene of a callout annotation: per row, a connector from the box to
    the anchor, an arrowhead or dot at the anchor, the box, and its wrapped
    text, all inert.
*/
import type {
  CircleNode,
  LineNode,
  Paint,
  PathNode,
  RectNode,
  SceneNode,
} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {anchorPoint, inPlot, type AnnotationFrame} from "./annotationFrame.js";
import {
  annotationTextNode,
  annotationTextStyle,
  wrapAnnotationText,
  type TextAlign,
} from "./annotationText.js";
import type {Annotation, AnnotationRef} from "./annotationTypes.js";
import {
  arrowheadPoints,
  connectorEndpoints,
  placeCalloutBox,
  pullBack,
  type Box,
  type Point,
} from "./calloutLayout.js";

type Row = Record<string, unknown>;

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Whether a color setting turns its paint off. */
const off = (v: unknown): boolean => v === false || v === "none";

/**
    Reads one style key for a callout row: an accessor on the annotation
    called with the row, else the row's own value, else the annotation's.
    @param annotation The callout annotation.
    @param d The row.
    @param i The row's index.
*/
export function calloutPicker(
  annotation: Annotation,
  d: Row,
  i: number,
): (key: string) => unknown {
  return key => {
    const own = annotation[key];
    if (typeof own === "function") return own(d, i);
    return d[key] !== undefined ? d[key] : own;
  };
}

/** The box's rect, or null when it has neither fill nor border. */
function boxNode(
  viz: VizInstance,
  pick: (key: string) => unknown,
  box: Box,
  key: string,
  ink: string,
): RectNode | null {
  const fill = pick("fill"),
    stroke = pick("stroke");
  if (off(fill) && off(stroke)) return null;
  const paint: Paint = off(fill)
    ? {fill: "none"}
    : {
        fill: (fill as string) || chartBackground(viz),
        fillOpacity: num(pick("fillOpacity"), 1),
      };
  if (!off(stroke)) {
    paint.stroke = (stroke as string) || ink;
    paint.strokeWidth = num(pick("strokeWidth"), 1);
    paint.strokeOpacity = num(pick("strokeOpacity"), 0.25);
  }
  return {
    type: "rect",
    key,
    interactive: false,
    ...box,
    rx: num(pick("rx"), 3),
    paint,
  };
}

/** The connector line and its anchor marker, or nothing when it is off or too short. */
function connectorNodes(
  pick: (key: string) => unknown,
  box: Box,
  anchor: Point,
  key: string,
  ink: string,
): SceneNode[] {
  if (pick("connector") === false) return [];
  const ends = connectorEndpoints(box, anchor, num(pick("standoff"), 0));
  if (!ends) return [];
  const color = (pick("connectorStroke") as string) || ink;
  const opacity = num(pick("connectorStrokeOpacity"), 1);
  const marker = pick("marker") ?? "arrow";
  const size = Math.max(0, num(pick("markerSize"), 6));
  const width = num(pick("connectorStrokeWidth"), 1);
  const out: SceneNode[] = [];
  const end =
    marker === "arrow" && size ? pullBack(ends.from, ends.to, size) : ends.to;
  const paint: Paint = {
    fill: "none",
    stroke: color,
    strokeWidth: width,
    strokeOpacity: opacity,
  };
  const dash = parseDash(pick("connectorStrokeDasharray"));
  if (dash) paint.strokeDasharray = dash;
  out.push({
    type: "line",
    key: `${key}-connector`,
    interactive: false,
    points: [ends.from, end],
    curve: "linear",
    paint,
  } as LineNode);
  if (marker === "arrow" && size) {
    const [tip, a, b] = arrowheadPoints(ends.from, ends.to, size);
    out.push({
      type: "path",
      key: `${key}-marker`,
      interactive: false,
      d: `M${tip[0]},${tip[1]}L${a[0]},${a[1]}L${b[0]},${b[1]}Z`,
      paint: {fill: color, opacity},
    } as PathNode);
  } else if (marker === "dot" && size)
    out.push({
      type: "circle",
      key: `${key}-marker`,
      interactive: false,
      cx: ends.to[0],
      cy: ends.to[1],
      r: size / 2,
      paint: {fill: color, opacity},
    } as CircleNode);
  return out;
}

/**
    The scene nodes of one callout row, or nothing when it has no label or
    its anchor lies outside the plot area (a zoom that pans it out of view).
    @param viz The chart.
    @param annotation The callout annotation.
    @param frame The plot area and its axes.
    @param row The row, its index, and its key.
*/
export function calloutRowNodes(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  row: {d: Row; i: number; key: string},
): SceneNode[] {
  const pick = calloutPicker(annotation, row.d, row.i);
  const anchor = anchorPoint(
    frame,
    row.d,
    annotation.xRef as AnnotationRef | undefined,
    annotation.yRef as AnnotationRef | undefined,
  );
  if (!anchor.every(Number.isFinite) || !inPlot(anchor, frame.plot)) return [];
  const text = pick("label");
  if (text === undefined || text === null || text === false || text === "")
    return [];
  const style = annotationTextStyle(viz, pick);
  const block = wrapAnnotationText(`${text}`, style);
  if (!block.lines.length) return [];
  const padding = Math.max(0, num(pick("padding"), 6));
  const box = placeCalloutBox(
    anchor,
    {width: block.width + padding * 2, height: block.height + padding * 2},
    [num(pick("dx"), 0), num(pick("dy"), -40)],
    frame.plot,
    pick("clamp") !== false,
  );
  const align = (pick("textAlign") as TextAlign) || "middle";
  const textX =
    align === "start"
      ? box.x + padding
      : align === "end"
        ? box.x + box.width - padding
        : box.x + box.width / 2;
  const ink = style.fontColor;
  const out = connectorNodes(pick, box, anchor, row.key, ink);
  const rect = boxNode(viz, pick, box, `${row.key}-box`, ink);
  if (rect) out.push(rect);
  out.push(
    annotationTextNode(block, style, {
      key: `${row.key}-label`,
      x: textX,
      y: box.y + padding,
      align,
    }),
  );
  return out;
}

/**
    The scene nodes of a callout annotation's rows.
    @param viz The chart.
    @param annotation The callout annotation.
    @param frame The plot area and its axes.
    @param key The annotation's key, which prefixes its nodes'.
*/
export function calloutNodes(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  key: string,
): SceneNode[] {
  const data = Array.isArray(annotation.data) ? (annotation.data as Row[]) : [];
  return data.flatMap((d, i) =>
    calloutRowNodes(viz, annotation, frame, {d, i, key: `${key}-${i}`}),
  );
}
