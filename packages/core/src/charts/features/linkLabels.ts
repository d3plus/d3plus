/**
    `linkLabel` on the node-link charts: a line of text at the middle of each
    link, along it or level, on a pad of the chart's background so it reads
    over the links. Labels that would cover a node or another label are left
    out, the most prominent links' first. Labels are inert to the pointer and
    keyboard, and dim with their link on hover.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
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

/** The `linkLabelConfig` options. */
export interface LinkLabelConfig {
  /** `"along"` runs text along its link, kept upright; `"horizontal"` keeps it level. */
  rotate?: "along" | "horizontal";
  fontSize?: number;
  /** The pad around the text, in pixels. */
  padding?: number;
  /** The opacity of the pad, which takes the chart's background color. */
  backgroundOpacity?: number;
  /** Any other TextBox setting, such as `fontColor`, `fontFamily`, or `fontWeight`. */
  [key: string]: unknown;
}

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
  /** Links with a larger priority (such as a wider stroke) get their label first. */
  priority?: number;
}

/** A label that fit: its text and its box. */
interface PlacedLabel {
  key: string;
  link: object;
  text: string;
  box: LinkLabelBox;
  textWidth: number;
  textHeight: number;
}

/**
    The labels for the drawn links, as scene nodes: for each link with
    `linkLabel` text that fits, a group at the link's middle, rotated with
    the link unless `linkLabelConfig.rotate` is `"horizontal"`, holding a pad
    in the chart's background and the text in the chart's ink.
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
  const candidates: (PlacedLabel & {priority: number; order: number})[] = [];
  requests.forEach((req, order) => {
    if (!req.anchor) return;
    const {row, index} = linkRow(req.link, req.i);
    const text = linkLabelText(accessor(row, index), viz.schema.locale);
    if (!text) return;
    const size = measureLabel(text, font);
    const pad = settings.padding;
    candidates.push({
      key: req.key,
      link: row,
      text,
      textWidth: size.width,
      textHeight: size.height,
      box: {
        x: req.anchor.x,
        y: req.anchor.y,
        width: size.width + pad * 2,
        height: size.height + pad * 2,
        angle:
          settings.rotate === "horizontal" ? 0 : uprightAngle(req.anchor.angle),
      },
      priority: req.priority ?? 0,
      order,
    });
  });
  candidates.sort((a, b) => b.priority - a.priority || a.order - b.order);
  const placed = placeLinkLabels(candidates, obstacles);
  return placed.map(label => labelGroup(viz, label, settings));
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
