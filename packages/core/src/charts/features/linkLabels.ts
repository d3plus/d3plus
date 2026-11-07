/**
    `linkLabel` on the node-link charts: a line of text at the middle of each
    link, along it or level, on a pad of the chart's background so it reads
    over the links. Along a curved link, the text and its pad follow the
    curve. Labels that would cover a node or another label are left out, the
    most prominent links' first. Labels are inert to the pointer and
    keyboard, and dim with their link on hover.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import {lineLeft, pathTextBoxes} from "@d3plus/render";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {measureLabel} from "./circleLabels.js";
import {linkRow} from "./linkColor.js";
import type {
  LabelObstacles,
  LinkAnchor,
  LinkLabelBox,
} from "./linkLabelGeometry.js";
import {placeLinkLabels, uprightAngle} from "./linkLabelGeometry.js";
import {
  curvedLabelPad,
  curvedLabelSpot,
  distanceAlong,
} from "./linkLabelPath.js";
import type {CurvedLabelSpot} from "./linkLabelPath.js";
import {polylineD, polylineLength} from "./pathLabelGeometry.js";
import type {Pt} from "./pathLabelGeometry.js";
import {pathLabelNodes} from "./pathLabels.js";

/** `linkLabelConfig`'s defaults. */
export const LINK_LABEL_DEFAULTS = {
  rotate: "along",
  fontSize: 10,
  padding: 2,
  backgroundOpacity: 0.85,
};

/** The resolved `linkLabelConfig`. */
export interface LinkLabelSettings {
  /** `"along"` runs text along its link (kept upright); `"horizontal"` keeps it level. */
  rotate: "along" | "horizontal";
  fontSize: number;
  /** The pad around the text, in pixels. */
  padding: number;
  /** The opacity of the background pad. */
  backgroundOpacity: number;
  /** The rest, as TextBox config (fontFamily, fontColor, fontWeight, …). */
  text: Record<string, unknown>;
}

/** Reads `linkLabelConfig`, with its defaults for anything missing or invalid. */
export function linkLabelSettings(viz: VizInstance): LinkLabelSettings {
  const cfg = (viz.schema.linkLabelConfig ?? {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
  const {rotate, fontSize, padding, backgroundOpacity, ...text} = cfg;
  return {
    rotate: rotate === "horizontal" ? "horizontal" : "along",
    fontSize: num(fontSize, LINK_LABEL_DEFAULTS.fontSize) || 1,
    padding: num(padding, LINK_LABEL_DEFAULTS.padding),
    backgroundOpacity: Math.min(
      1,
      num(backgroundOpacity, LINK_LABEL_DEFAULTS.backgroundOpacity),
    ),
    text,
  };
}

/**
    A `linkLabel` value as text: a number abbreviated in the chart's locale,
    a string as given, and nothing for anything else.
*/
export function linkLabelText(value: unknown, locale?: string): string {
  if (typeof value === "number")
    return Number.isFinite(value) ? formatAbbreviate(value, locale) : "";
  if (typeof value === "string") return value.trim() ? value : "";
  return "";
}

/**
    The boxes the lines of text scene nodes (such as a chart's node labels)
    cover, each rotated with its node: about a line's glyphs, from 0.8em
    above its baseline to 0.2em below.
    @param nodes Scene nodes; text nodes inside groups are included.
*/
export function textLineBoxes(nodes: readonly SceneNode[]): LinkLabelBox[] {
  const out: LinkLabelBox[] = [];
  const visit = (node: SceneNode) => {
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(visit);
    if (node.type !== "text") return;
    const size = node.font?.size ?? 0;
    const tr = node.transform ?? {};
    const [ax, ay] = tr.rotateAnchor ?? [0, 0];
    const angle = tr.rotate ?? 0;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Text on a path: a box for each stretch of the path its glyphs cover.
    if (node.path) {
      for (const box of pathTextBoxes(node)) {
        const cx = box.x - ax,
          cy = box.y - ay;
        out.push({
          x: (tr.x ?? 0) + ax + cx * cos - cy * sin,
          y: (tr.y ?? 0) + ay + cx * sin + cy * cos,
          width: box.width,
          height: box.height,
          angle: angle + box.angle,
        });
      }
      return;
    }
    for (const line of node.lines ?? []) {
      if (!line.text || !size) continue;
      const width =
        line.width ||
        measureLabel(line.text, {
          family: node.font.family,
          size,
          weight: node.font.weight,
        }).width;
      const left = lineLeft({x: line.x, width}, node.font);
      // The line's center in the node's frame, then rotated about its anchor.
      const cx = left + width / 2 - ax;
      const cy = line.y - size * 0.3 - ay;
      out.push({
        x: (tr.x ?? 0) + ax + cx * cos - cy * sin,
        y: (tr.y ?? 0) + ay + cx * sin + cy * cos,
        width,
        height: size,
        angle,
      });
    }
  };
  nodes.forEach(visit);
  return out;
}

/** One drawn link a label may go on. */
export interface LinkLabelRequest {
  /** The link's scene key; the label's is built from it. */
  key: string;
  /** The drawn link's datum, which the label carries so it dims with the link. */
  link: object;
  /** The link's position among the drawn links. */
  i: number;
  /** Where on the link the label goes, or null for nowhere. */
  anchor: LinkAnchor | null;
  /**
      A curved link's centerline, between the edges of its nodes: an
      `"along"` label follows it, centered where `anchor` falls on it (or
      halfway along without one). A straight link needs none.
  */
  path?: Pt[] | null;
  /** Links with a larger priority (such as a wider stroke) get their label first. */
  priority?: number;
}

/** A label that fit: its text and its box. */
interface PlacedLabel {
  key: string;
  link: object;
  text: string;
  box: LinkLabelBox;
  /** A curved label's boxes, along its glyphs and pad. */
  boxes?: LinkLabelBox[];
  textWidth: number;
  textHeight: number;
  /** A curved label's text node and the centerline stretch its pad covers. */
  curve?: {node: SceneNode; pad: Pt[]};
}

/** A label to place, in priority order. */
type Candidate = PlacedLabel & {priority: number; order: number};

/**
    The labels for the drawn links, as scene nodes: for each link with
    `linkLabel` text that fits, a group at the link's middle, rotated with
    the link unless `linkLabelConfig.rotate` is `"horizontal"`, holding a pad
    in the chart's background and the text in the chart's ink. Along a
    curved link (one with a `path`), the text follows the curve over a pad
    that follows it too.
    @param obstacles The nodes labels stay clear of.
*/
export function emitLinkLabels(
  viz: VizInstance,
  requests: readonly LinkLabelRequest[],
  obstacles: LabelObstacles,
): SceneNode[] {
  const accessor = viz.schema.linkLabel as
    ((d: DataPoint, i: number) => unknown) | undefined;
  if (typeof accessor !== "function" || !requests.length) return [];
  const settings = linkLabelSettings(viz);
  const font = {
    family: settings.text.fontFamily as string | string[] | undefined,
    size: settings.fontSize,
    weight: settings.text.fontWeight as string | number | undefined,
  };
  const pad = settings.padding;
  const candidates: Candidate[] = [];
  const curved: {base: Candidate; spot: CurvedLabelSpot}[] = [];
  requests.forEach((req, order) => {
    const {row, index} = linkRow(req.link, req.i);
    const text = linkLabelText(accessor(row, index), viz.schema.locale);
    if (!text) return;
    const size = measureLabel(text, font);
    const base = {
      key: req.key,
      link: row,
      text,
      textWidth: size.width,
      textHeight: size.height,
      priority: req.priority ?? 0,
      order,
    };
    const path = settings.rotate === "along" ? req.path : null;
    if (path && path.length > 1) {
      const at = req.anchor
        ? distanceAlong(path, [req.anchor.x, req.anchor.y])
        : polylineLength(path) / 2;
      const spot = curvedLabelSpot(
        path,
        at,
        size.width,
        settings.fontSize,
        pad,
      );
      if (spot) {
        const [x, y] = spot.stretch[Math.floor(spot.stretch.length / 2)];
        curved.push({
          base: {...base, box: {x, y, width: 0, height: 0, angle: 0}},
          spot,
        });
        return;
      }
    }
    if (!req.anchor) return;
    candidates.push({
      ...base,
      box: {
        x: req.anchor.x,
        y: req.anchor.y,
        width: size.width + pad * 2,
        height: size.height + pad * 2,
        angle:
          settings.rotate === "horizontal" ? 0 : uprightAngle(req.anchor.angle),
      },
    });
  });
  candidates.push(...curvedCandidates(viz, curved, settings));
  candidates.sort((a, b) => b.priority - a.priority || a.order - b.order);
  const placed = placeLinkLabels(candidates, obstacles);
  return placed.map(label =>
    label.curve
      ? curvedGroup(viz, label, label.curve, settings)
      : labelGroup(viz, label, settings),
  );
}

/** Whether text cut short keeps fewer than three letters before its ellipsis. */
const tooShort = (drawn: string, full: string): boolean =>
  drawn !== full && drawn.replace(/[\s.\u2026]+$/, "").length < 3;

/**
    The curved labels as candidates: each one's text laid along its spot
    (cut short with an ellipsis where the stretch is too short for it), its
    pad's stretch, and the boxes its glyphs and pad cover. A label whose
    stretch has room for fewer than three letters is left out.
*/
function curvedCandidates(
  viz: VizInstance,
  curved: readonly {base: Candidate; spot: CurvedLabelSpot}[],
  settings: LinkLabelSettings,
): Candidate[] {
  if (!curved.length) return [];
  const pad = settings.padding;
  const nodes = pathLabelNodes(
    viz,
    curved.map(({base, spot}) => ({
      key: `${base.key}-label`,
      text: base.text,
      d: polylineD(spot.text),
      color: "",
      anchor: "middle" as const,
    })),
    {
      fontColor: () => backgroundInk(viz),
      fontWeight: 400,
      ...settings.text,
      fontResize: false,
      fontSize: settings.fontSize,
      lineHeight: settings.fontSize * 1.2,
      pointerEvents: "none",
    },
    {halo: false},
  );
  const byKey = new Map(nodes.map(n => [String(n.key), n]));
  return curved.flatMap(({base, spot}) => {
    const node = byKey.get(`${base.key}-label`);
    const line = node?.type === "text" ? node.lines[0] : undefined;
    if (!node || !line || tooShort(line.text, base.text)) return [];
    const boxes = textLineBoxes([node]).map(b => ({
      ...b,
      width: b.width + pad * 2,
      height: b.height + pad * 2,
    }));
    if (!boxes.length) return [];
    return [
      {
        ...base,
        box: boxes[Math.floor(boxes.length / 2)],
        boxes,
        curve: {node, pad: curvedLabelPad(spot, line.width ?? 0, pad)},
      },
    ];
  });
}

/**
    One curved label's group: a stroke of the chart's background along the
    stretch its text covers, as thick as the text and its pad, then the
    text along the curve.
*/
function curvedGroup(
  viz: VizInstance,
  label: PlacedLabel,
  curve: {node: SceneNode; pad: Pt[]},
  settings: LinkLabelSettings,
): SceneNode {
  const pad: SceneNode = {
    type: "path",
    key: `${label.key}-label-pad`,
    d: polylineD(curve.pad),
    interactive: false,
    paint: {
      fill: "none",
      stroke: chartBackground(viz),
      strokeOpacity: settings.backgroundOpacity,
      strokeWidth: label.textHeight + settings.padding * 2,
      strokeLinecap: "butt",
    },
  };
  return {
    type: "group",
    key: `${label.key}-label-group`,
    datum: label.link as DataPoint,
    interactive: false,
    children: [pad, curve.node],
  };
}

/** One label's group: the pad, then the text, both centered on the group's origin. */
function labelGroup(
  viz: VizInstance,
  label: PlacedLabel,
  settings: LinkLabelSettings,
): SceneNode {
  const {box} = label;
  const pad: SceneNode = {
    type: "rect",
    key: `${label.key}-label-pad`,
    x: -box.width / 2,
    y: -box.height / 2,
    width: box.width,
    height: box.height,
    rx: Math.min(box.height / 2, 3),
    interactive: false,
    paint: {
      fill: chartBackground(viz),
      fillOpacity: settings.backgroundOpacity,
    },
  };
  const text = emitLabels({
    data: [{text: label.text} as DataPoint],
    label: d => d.text as string,
    labelBounds: () => ({
      x: -label.textWidth / 2,
      y: -label.textHeight / 2,
      width: label.textWidth,
      height: label.textHeight,
    }),
    x: constant(0),
    y: constant(0),
    aes: constant({}),
    rotate: constant(0),
    id: () => `${label.key}-label`,
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      ...settings.text,
      fontResize: false,
      fontSize: settings.fontSize,
      lineHeight: settings.fontSize * 1.2,
      padding: 0,
      pointerEvents: "none",
      textAnchor: "middle",
      verticalAlign: "middle",
    },
  }).map(node => {
    // The group carries the link's datum, so the text dims once, with it.
    const {datum: _datum, ...rest} = node as SceneNode & {datum?: unknown};
    void _datum;
    return {...rest, interactive: false} as SceneNode;
  });
  return {
    type: "group",
    key: `${label.key}-label-group`,
    datum: label.link as DataPoint,
    interactive: false,
    transform: box.angle
      ? {x: box.x, y: box.y, rotate: box.angle}
      : {x: box.x, y: box.y},
    children: [pad, ...text],
  };
}
