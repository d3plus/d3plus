/**
    Curved slice labels for a Donut, or any Pie with an `innerRadius` (see
    `labelPosition`): a slice's name runs along its arc where that reads
    better than the straight label in its largest box. A full Pie's wedges
    run to a point at the center, so its labels stay straight. Names follow
    the middle of a wide ring, or the rim of one whose hole is small, where
    a wedge is widest. The share goes on a second, smaller line beneath the
    name when the ring has room for both.
*/
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode, TextNode} from "@d3plus/render";

import {resolveAccessor} from "../features/emitHelpers.js";
import {textLineBoxes} from "../features/linkLabels.js";
import {
  clearRingLabels,
  ringLabelFont,
  ringLabelNodes,
  ringTextWidth,
} from "../features/ringLabelNodes.js";
import type {RingLabel} from "../features/ringLabelNodes.js";
import {
  chooseRingLabel,
  ringLabelFit,
  ringLabelPair,
  ringLabelPosition,
  textBroken,
} from "../features/ringLabels.js";
import type {
  RingArc,
  RingLabelCandidate,
  RingLabelFitOptions,
} from "../features/ringLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A laid-out slice, as `pieEmit` sees it. */
export interface PieLabelSlice {
  data: DataPoint;
  i?: number;
}

/** What placing the curved labels needs from `pieEmit`. */
export interface PieCurvedInputs<S extends PieLabelSlice> {
  viz: VizInstance;
  slices: S[];
  /** Each slice's ring segment. */
  arcOf: (slice: S) => RingArc;
  /** Each slice's name. */
  nameOf: (slice: S) => string;
  /** Each slice's share, as text. */
  shareOf: (slice: S) => string;
  /** Each slice's fill. */
  fillOf: (slice: S) => unknown;
  /** The straight labels, as `emitLabels` drew them. */
  straight: SceneNode[];
  /** The Path shape's labelConfig. */
  labelConfig: Record<string, unknown>;
}

/** A positive number, or undefined. */
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/** The slice a straight label node names. */
const sliceOf = <S>(node: SceneNode): S | undefined =>
  (node.datum as {data?: S} | undefined)?.data;

/**
    The font range curved labels try: the labelConfig's `fontSize` alone,
    else `fontMin` to `fontMax`, 8 to 24 by default.
    @param config The labelConfig.
*/
export function ringFontRange(config: Record<string, unknown>): {
  fontMin: number;
  fontMax: number;
} {
  const size = num(config.fontSize);
  const fontMax = size ?? num(config.fontMax) ?? 24;
  const fontMin = Math.min(fontMax, size ?? num(config.fontMin) ?? 8);
  return {fontMin, fontMax};
}

/**
    The labels for every slice: each slice's straight label (from
    `straight`) or its curved one, whichever its `labelPosition` and the fit
    choose (see `chooseRingLabel`).
    @param inputs The slices and their geometry, fills, and straight labels.
*/
export function pieSliceLabels<S extends PieLabelSlice>(
  inputs: PieCurvedInputs<S>,
): {straight: SceneNode[]; curved: SceneNode[]} {
  const {viz, slices, arcOf, nameOf, shareOf, fillOf, labelConfig} = inputs;
  const bySlice = new Map<S, SceneNode[]>();
  for (const node of inputs.straight) {
    const slice = sliceOf<S>(node);
    if (!slice) continue;
    const list = bySlice.get(slice);
    if (list) list.push(node);
    else bySlice.set(slice, [node]);
  }
  const font = ringLabelFont(labelConfig);
  const range = ringFontRange(labelConfig);
  const keep: SceneNode[] = [];
  const curved: RingLabel[] = [];
  slices.forEach((slice, k) => {
    const i = slice.i ?? k;
    const name = nameOf(slice);
    const nodes = bySlice.get(slice) ?? [];
    const first = nodes[0] as TextNode | undefined;
    const straight: RingLabelCandidate | null = first
      ? {
          fontSize: first.font?.size ?? 0,
          truncated: textBroken(
            first.lines.map(l => l.text),
            name,
          ),
        }
      : null;
    const arc = arcOf(slice);
    // A full Pie keeps its straight labels, whatever its labelPosition.
    if (!(arc.innerRadius > 0)) {
      keep.push(...nodes);
      return;
    }
    const options: RingLabelFitOptions = {
      ...range,
      // Near a small hole a wedge is narrow, so the curve hugs the rim.
      align: arc.innerRadius >= arc.outerRadius * 0.3 ? "middle" : "outer",
    };
    const width = ringTextWidth(name, font);
    const fit = name ? ringLabelFit(arc, width, options) : null;
    const position = ringLabelPosition(viz, slice.data, i);
    const choice = chooseRingLabel(position, straight, fit);
    if (choice === "straight") keep.push(...nodes);
    if (choice !== "curved" || !fit) return;
    const userColor = resolveAccessor<unknown>(
      labelConfig.fontColor,
      slice.data,
      i,
    );
    const fill = fillOf(slice);
    const color =
      typeof userColor === "string"
        ? userColor
        : colorContrast(
            typeof fill === "string" ? fill : "rgb(255, 255, 255)",
            viz.schema.colorDefaults,
          );
    const share = shareOf(slice);
    const pair = fit.truncated
      ? null
      : ringLabelPair(arc, width, ringTextWidth(share, font), options);
    const base = {color, datum: slice.data, index: i};
    const key = `pie-label-curved-${viz._ids(slice.data, i).join("-")}`;
    if (pair)
      curved.push(
        {...base, key, text: name, fit: pair[0]},
        {...base, key: `${key}-share`, text: share, fit: pair[1]},
      );
    else curved.push({...base, key, text: name, fit});
  });
  const curvedNodes = clearRingLabels(
    ringLabelNodes(viz, curved, font),
    textLineBoxes(keep),
  );
  return {straight: keep, curved: curvedNodes};
}
