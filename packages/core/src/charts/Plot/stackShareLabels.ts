/**
    Share-percentage labels for stacked Bars: each bar's share of the
    stack at its discrete position, beneath its name.

    Applied to a configured compute-mode shape just before it renders, so it
    wraps whatever `label` / `labelBounds` / `verticalAlign` the chart
    defaults and the user's `shapeConfig` resolved to: the name keeps its
    box and alignment when there's no room, and otherwise sits directly
    above a smaller share line.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {Shape} from "../../shapes/index.js";
import {shareOf as rowShare} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A label bounds box, as returned by a shape's `labelBounds`. */
interface Box {
  height: number;
  width: number;
  x: number;
  y: number;
}

type LabelFn = (d: DataPoint, i: number) => unknown;
type BoundsFn = (d: DataPoint, i: number, aes: unknown) => Box | Box[] | false | null;
type RecordFn = (d: DataPoint, i: number) => unknown;

/** Largest share-line font; the name keeps its own (larger) sizing. */
const SHARE_FONT_MAX = 14;
/** Below this the share line is dropped rather than drawn unreadably small. */
const SHARE_FONT_MIN = 8;

/**
    Splits a label box into a name box and a share band beneath it. Their
    padding overlaps so the bottom-aligned name and top-aligned share meet at
    one line. Returns null when the box is too short to split.
*/
export function splitShareBox(b: Box, padding: number): [Box, Box] | null {
  const sh = Math.min(SHARE_FONT_MAX, (b.height - padding * 2) * 0.4);
  if (sh < SHARE_FONT_MIN) return null;
  const split = b.height - padding - sh;
  return [
    {...b, height: split + padding},
    {...b, height: sh + padding * 2, y: b.y + split - padding},
  ];
}

/**
    Adds a share line to each stacked Bar label on `s`. Labels a user
    already returns as an array (their own multi-line layout) are left alone.
*/
export function applyStackShareLabels(viz: VizInstance, s: Shape): void {
  const shareOf = (d: DataPoint) => rowShare(d) as number;

  const label = s.label() as LabelFn;
  const bounds = s.labelBounds() as BoundsFn | undefined;
  const labelConfig = s.labelConfig() as Record<string, unknown>;
  const padding = typeof labelConfig.padding === "number" ? labelConfig.padding : 0;
  const verticalAlign = labelConfig.verticalAlign;
  if (typeof bounds !== "function") return;

  // Which data points got the two-line layout, keyed the way each label
  // record's `data` resolves (a shape-wrapped datum unwraps to its row).
  const splitData = new WeakSet<object>();
  const recordKey = (d: DataPoint) => (d.__d3plusShape__ ? d.data : d) as object;
  const withShare = (d: DataPoint, i: number) => {
    const text = label(d, i);
    return text === false || text == null || Array.isArray(text) || !Number.isFinite(shareOf(d))
      ? false
      : text;
  };

  s.label(((d: DataPoint, i: number) => {
    const text = withShare(d, i);
    if (text === false) return label(d, i);
    return [text, `${formatAbbreviate(shareOf(d) * 100, viz.schema.locale)}%`];
  }) as never);

  s.labelBounds(((d: DataPoint, i: number, aes: unknown) => {
    const b = bounds(d, i, aes);
    if (!b || Array.isArray(b) || withShare(d, i) === false) return b;
    const boxes = splitShareBox(b, padding);
    if (!boxes) return [b, {...b, height: 0, width: 0}];
    splitData.add(recordKey(d));
    return boxes;
  }) as never);

  s.labelConfig({
    verticalAlign: (d: DataPoint & {l?: number}, i: number) => {
      const split = !!d && splitData.has(d.data as object);
      if (split) return d.l === 1 ? "top" : "bottom";
      return typeof verticalAlign === "function"
        ? (verticalAlign as RecordFn)(d, i)
        : verticalAlign;
    },
  });
}
