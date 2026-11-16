/**
    The labels of a Plot's outliers (see `outlierScene.ts`): each names its
    row and value, and sits beside its ring, past the mark's value end where
    there's room, clear of the other marks, lines, and labels and inside the
    plot.
*/
import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {SceneNode, Transform} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {inkBackground} from "../../utils/themeInk.js";
import {
  boxesOverlap,
  boxHitsCircle,
  sideBox,
} from "../features/circleLabelPlacement.js";
import type {
  CircleLabelBox,
  LabelCircle,
  LabelSide,
} from "../features/circleLabelPlacement.js";
import {
  measureLabel,
  pointLabelSettings,
  sideAnchor,
} from "../features/circleLabels.js";
import type {LabelFont} from "../features/circleLabels.js";
import type {Edges} from "../features/pathLabelGeometry.js";
import {mapBox, mapper, ownBoxes} from "../features/sceneBounds.js";
import {textHalo} from "../features/textHalo.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {PlotOutlier} from "./outlierDetect.js";
import {boxCrossesSegment, lineSegments} from "./outlierLines.js";
import type {LineSegment} from "./outlierLines.js";
import {outlierOf} from "./outlierScene.js";
import {axisValue} from "./sharedTooltip.js";

/** The space between a ring and its label, in pixels. */
export const OUTLIER_LABEL_GAP = 2;

/** A drawn ring: its node, its outline, and what it marks. */
export interface OutlierRing {
  node: SceneNode;
  /** A point's ring: its circle, out to the stroke's outer edge. */
  circle?: LabelCircle;
  /** A bar's or square's ring: its box, out to the stroke's outer edge. */
  box?: Bounds;
  /** For a bar: whether its value end is its high end on screen (right, or bottom). */
  endHigh?: boolean;
  /** For a bar: how far inside `box` the bar's own edges lie. */
  inset?: number;
  source: DataPoint;
  outlier: PlotOutlier;
}

/** A label spot: its box, and the side of the ring it's on. */
export interface OutlierLabelSpot {
  box: CircleLabelBox;
  side: LabelSide;
}

/**
    The sides of a point's ring to try its label on, in order: past the
    outlier's own extreme along the value axis first (above a high value on
    a vertical axis), then its corners, then across, and the opposite side
    last.
    @param along The value axis.
    @param side Which fence the outlier lies past (`"high"` when unknown).
*/
export function outlierSides(
  along: "x" | "y",
  side: "high" | "low" | undefined,
): LabelSide[] {
  if (along === "y") {
    const out = side === "low" ? "bottom" : "top";
    const opp = out === "top" ? "bottom" : "top";
    return [
      out,
      `${out}-right`,
      `${out}-left`,
      "right",
      "left",
      `${opp}-right`,
      `${opp}-left`,
      opp,
    ] as LabelSide[];
  }
  const out = side === "low" ? "left" : "right";
  const opp = out === "right" ? "left" : "right";
  return [
    out,
    `top-${out}`,
    `bottom-${out}`,
    "top",
    "bottom",
    `top-${opp}`,
    `bottom-${opp}`,
    opp,
  ] as LabelSide[];
}

/**
    The spots a bar's label can take, in order: past the bar's value end,
    then beside that end on either side, lined up with the bar's own end.
    @param box The bar's ring box.
    @param along The value axis.
    @param endHigh Whether the value end is the box's right (or bottom) edge.
    @param w The label's width.
    @param h The label's height.
    @param gap The space between the ring and the label.
    @param inset How far inside the ring box the bar's own edges lie.
*/
export function barLabelSpots(
  box: Bounds,
  along: "x" | "y",
  endHigh: boolean,
  w: number,
  h: number,
  gap: number,
  inset = 0,
): OutlierLabelSpot[] {
  const {x, y, width, height} = box;
  if (along === "y") {
    const top = endHigh ? y + height + gap : y - gap - h;
    const beside = endHigh ? y + height - inset - h : y + inset;
    return [
      {
        box: {x: x + width / 2 - w / 2, y: top, width: w, height: h},
        side: endHigh ? "bottom" : "top",
      },
      {
        box: {x: x + width + gap, y: beside, width: w, height: h},
        side: "right",
      },
      {box: {x: x - gap - w, y: beside, width: w, height: h}, side: "left"},
    ];
  }
  const left = endHigh ? x + width + gap : x - gap - w;
  const beside = endHigh ? x + width - inset - w : x + inset;
  return [
    {
      box: {x: left, y: y + height / 2 - h / 2, width: w, height: h},
      side: endHigh ? "right" : "left",
    },
    {box: {x: beside, y: y - gap - h, width: w, height: h}, side: "top"},
    {
      box: {x: beside, y: y + height + gap, width: w, height: h},
      side: "bottom",
    },
  ];
}

/**
    Every spot a ring's label can take, in order of preference (see
    `outlierSides` and `barLabelSpots`): a point's label tries each side
    against its ring, then each side again a label's height farther out.
    @param ring The ring.
    @param w The label's width.
    @param h The label's height.
*/
export function outlierLabelSpots(
  ring: Pick<OutlierRing, "circle" | "box" | "endHigh" | "inset" | "outlier">,
  w: number,
  h: number,
): OutlierLabelSpot[] {
  const along = ring.outlier.axis.charAt(0) as "x" | "y";
  const gap = OUTLIER_LABEL_GAP;
  if (ring.box && ring.endHigh !== undefined)
    return barLabelSpots(ring.box, along, ring.endHigh, w, h, gap, ring.inset);
  const circle =
    ring.circle ??
    (ring.box && {
      x: ring.box.x + ring.box.width / 2,
      y: ring.box.y + ring.box.height / 2,
      r: Math.hypot(ring.box.width, ring.box.height) / 2,
    });
  if (!circle) return [];
  const sides = outlierSides(along, ring.outlier.side);
  return [gap, gap + h].flatMap(away =>
    sides.map(side => ({box: sideBox(circle, side, w, h, away), side})),
  );
}

/** Whether a box lies inside the bounds. */
const inside = (b: CircleLabelBox, bounds: Bounds): boolean =>
  b.x >= bounds.x - 1e-6 &&
  b.y >= bounds.y - 1e-6 &&
  b.x + b.width <= bounds.x + bounds.width + 1e-6 &&
  b.y + b.height <= bounds.y + bounds.height + 1e-6;

/**
    Places labels greedily, in order: each takes its first spot inside
    `bounds` that crosses no circle, obstacle, drawn line, or label already
    placed. Null for a label with no such spot.
    @param spots Each label's spots, in order of preference.
    @param circles Circles no label may cross.
    @param obstacles Boxes no label may overlap.
    @param bounds The box labels must stay in.
    @param lines Drawn line segments no label may cross (see `lineSegments`).
*/
export function placeOutlierLabels(
  spots: OutlierLabelSpot[][],
  circles: readonly LabelCircle[],
  obstacles: readonly CircleLabelBox[],
  bounds: Bounds,
  lines: readonly LineSegment[] = [],
): (OutlierLabelSpot | null)[] {
  const taken = obstacles.slice();
  return spots.map(list => {
    const spot = list.find(
      ({box}) =>
        inside(box, bounds) &&
        !circles.some(c => boxHitsCircle(box, c)) &&
        !taken.some(b => boxesOverlap(box, b)) &&
        !lines.some(s => boxCrossesSegment(box, s)),
    );
    if (spot) taken.push(spot.box);
    return spot ?? null;
  });
}

/**
    A ring's label text: `outlierConfig.label`'s, or the row's name and its
    value, formatted as its axis formats it. Empty for no label.
    @param viz The chart.
    @param ring The ring.
    @param label The `outlierConfig.label` setting.
*/
export function outlierLabel(
  viz: VizInstance,
  ring: Pick<OutlierRing, "source" | "outlier">,
  label: unknown,
): string {
  const {source, outlier} = ring;
  const i = outlier.row.i as number;
  if (label === false) return "";
  if (typeof label === "function")
    return `${(label as (d: DataPoint, i: number) => unknown)(source, i) || ""}`;
  const name = viz._drawLabel(source, i);
  const value = axisValue(viz, outlier.axis, outlier.row[outlier.axis]);
  return name ? `${name}: ${value}` : value;
}

/**
    The circles and boxes of the marks and labels under `nodes`, which
    outlier labels keep clear of: all but the labels of the marks in
    `ringed`, which their outlier labels replace.
*/
function sceneObstacles(
  nodes: SceneNode[],
  ringed: Map<DataPoint, PlotOutlier>,
): {
  circles: LabelCircle[];
  boxes: CircleLabelBox[];
} {
  const circles: LabelCircle[] = [];
  const boxes: CircleLabelBox[] = [];
  const walk = (list: SceneNode[], chain: Transform[]) => {
    for (const node of list) {
      if (String(node.key).endsWith("::hit")) continue;
      const next = node.transform ? [...chain, node.transform] : chain;
      const map = mapper(next);
      if (node.type === "group") walk(node.children, next);
      else if (node.type === "circle" && node.datum !== undefined) {
        const [x, y] = map([node.cx, node.cy]);
        circles.push({x, y, r: node.r});
      } else if (
        (node.type === "rect" && node.datum !== undefined) ||
        (node.type === "text" && !outlierOf(ringed, node.datum))
      )
        boxes.push(...ownBoxes(node).map(b => mapBox(b, map)));
    }
  };
  walk(nodes, []);
  return {circles, boxes};
}

/**
    The text nodes of the rings' labels: each placed beside its ring (see
    `placeOutlierLabels`), clear of the marks, lines, and labels in `nodes`, in the
    chart's text color, haloed in its background, and inert to the pointer.
    Each carries its mark's datum, so it dims and lights with the mark, and
    stands in for the mark's own label: `sources` lists the rows labeled.
    @param viz The chart.
    @param rings The rings.
    @param nodes The plot's marks and labels.
    @param edges The plot area.
    @param config `outlierConfig`'s `label` and `labelConfig`.
*/
export function emitOutlierLabels(
  viz: VizInstance,
  rings: OutlierRing[],
  nodes: SceneNode[],
  edges: Edges,
  config: {label?: unknown; labelConfig?: Record<string, unknown>},
): {nodes: SceneNode[]; sources: Set<DataPoint>} {
  const sources = new Set<DataPoint>();
  if (config.label === false || !rings.length) return {nodes: [], sources};
  const settings = pointLabelSettings(viz);
  const text = {...settings.text, ...(config.labelConfig ?? {})};
  const fontSize =
    typeof text.fontSize === "number" ? text.fontSize : settings.fontSize;
  const family = text.fontFamily;
  const weight = text.fontWeight;
  const font: LabelFont = {
    family:
      typeof family === "string" || Array.isArray(family)
        ? (family as string | string[])
        : undefined,
    size: fontSize,
    weight:
      typeof weight === "string" || typeof weight === "number"
        ? weight
        : undefined,
  };
  const texts = rings.map(r => outlierLabel(viz, r, config.label));
  const scene = sceneObstacles(
    nodes,
    new Map(rings.map(r => [r.source, r.outlier])),
  );
  const ringBoxes = rings.flatMap(r => (r.box ? [r.box] : []));
  const ringCircles = rings.flatMap(r => (r.circle ? [r.circle] : []));
  const spots = rings.map((ring, k) => {
    if (!texts[k]) return [];
    const {width, height} = measureLabel(texts[k], font);
    return outlierLabelSpots(ring, width, height);
  });
  const placed = placeOutlierLabels(
    spots,
    [...scene.circles, ...ringCircles],
    [...scene.boxes, ...ringBoxes],
    {
      x: edges.x0,
      y: edges.y0,
      width: edges.x1 - edges.x0,
      height: edges.y1 - edges.y0,
    },
    lineSegments(nodes),
  );
  const labels = placed.flatMap((spot, k) =>
    spot ? [{ring: rings[k], text: texts[k], ...spot}] : [],
  );
  labels.forEach(l => sources.add(l.ring.source));
  type Label = (typeof labels)[number];
  const id = (l: Label) => `outlier-label-${String(l.ring.node.key)}`;
  const sides = new Map(labels.map(l => [`${id(l)}_0`, l.side]));
  const out = emitLabels({
    data: labels as unknown as DataPoint[],
    label: d => (d as unknown as Label).text,
    labelBounds: d => ({...(d as unknown as Label).box}),
    x: constant(0),
    y: constant(0),
    aes: constant({}),
    rotate: constant(0),
    id: d => id(d as unknown as Label),
    datum: d => (d as unknown as Label).ring.node.datum as DataPoint,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      ...text,
      fontResize: false,
      fontSize,
      lineHeight: fontSize * 1.2,
      padding: 0,
      pointerEvents: "none",
      textAnchor: (rec: DataPoint) =>
        sideAnchor(sides.get(String(rec.id)) ?? "right"),
      verticalAlign: "middle",
    },
  }).map(node => ({...node, interactive: false, aboveRaised: true}));
  return {nodes: textHalo(out, inkBackground(viz), 3), sources};
}
