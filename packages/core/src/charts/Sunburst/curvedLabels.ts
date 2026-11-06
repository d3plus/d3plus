/**
    Where each Sunburst arc's label goes (see `labelPosition`): a straight
    box along the ring or along the radius (`sunburstLabelBox`), or a curve
    along the arc itself (`ringLabelFit`), whichever shows the label larger.
    A curve reads like the box along the ring but follows it, so it wins that
    tie; the box along the radius suits the narrow arcs of the outer rings,
    where a name runs out of arc long before it runs out of ring.
*/
import type {SceneNode} from "@d3plus/render";

import {ringLabelFont, ringLabelNodes} from "../features/ringLabelNodes.js";
import type {RingLabel} from "../features/ringLabelNodes.js";
import {
  chooseRingLabel,
  ringLabelFit,
  ringLabelPosition,
} from "../features/ringLabels.js";
import type {RingLabelFit} from "../features/ringLabels.js";
import {measureLabel} from "../partition/labelWords.js";
import type {LabelMetrics} from "../partition/labelWords.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {sunburstLabelBox} from "./labelFit.js";
import type {SunburstLabelBox} from "./labelFit.js";
import type {SunburstArc} from "./geometry.js";
import type {SunburstNode} from "./partition.js";

/** Every labeled arc's straight box or curve. */
export interface SunburstLabelPlacements {
  boxes: Map<SunburstNode, SunburstLabelBox>;
  curves: Map<SunburstNode, RingLabelFit>;
}

/** What placing the labels needs. */
export interface SunburstLabelInputs {
  /** Each node's label text. */
  labelOf: (node: SunburstNode) => string;
  /** Each node's padded arc. */
  arcOf: (node: SunburstNode) => SunburstArc & {padAngle?: number};
  fontMin: number;
  fontMax: number;
}

/**
    A label's one-line width at a font size, from its words measured at 1px.
    @param metrics The label's words and space at a 1px font size.
*/
export function metricsWidth(
  metrics: LabelMetrics,
): (fontSize: number) => number {
  const n = metrics.words.length;
  const total =
    metrics.words.reduce((a, b) => a + b, 0) +
    metrics.space * Math.max(0, n - 1);
  return fontSize => total * fontSize;
}

/**
    Places every node's label, measured in the label font: a straight box,
    a curve along its arc, or nothing when neither fits.
    @param viz The chart.
    @param nodes The laid-out nodes.
    @param labelConfig The Path labelConfig.
    @param inputs Each node's text and arc, and the font range.
*/
export function sunburstLabelPlacements(
  viz: VizInstance,
  nodes: SunburstNode[],
  labelConfig: Record<string, unknown>,
  inputs: SunburstLabelInputs,
): SunburstLabelPlacements {
  const {fontMin, fontMax} = inputs;
  const boxes = new Map<SunburstNode, SunburstLabelBox>();
  const curves = new Map<SunburstNode, RingLabelFit>();
  for (const node of nodes) {
    const metrics = measureLabel(inputs.labelOf(node), node.datum, labelConfig);
    if (!metrics.words.length) continue;
    const arc = inputs.arcOf(node);
    const position = ringLabelPosition(viz, node.datum, node.i ?? 0);
    const box =
      position === "along"
        ? null
        : sunburstLabelBox(arc, metrics, {fontMin, fontMax});
    const fit =
      position === "inside" || position === "outside"
        ? null
        : ringLabelFit(arc, metricsWidth(metrics), {fontMin, fontMax});
    const choice = chooseRingLabel(
      position,
      box ? {fontSize: box.fontSize, truncated: false} : null,
      fit,
      box?.orientation === "radial" ? "straight" : "curved",
    );
    if (choice === "straight" && box) boxes.set(node, box);
    if (choice === "curved" && fit) curves.set(node, fit);
  }
  return {boxes, curves};
}

/**
    The text nodes for the curved labels.
    @param viz The chart.
    @param curves Each curved node's fit.
    @param labelConfig The Path labelConfig.
    @param inputs Each node's text and text color.
*/
export function sunburstCurvedNodes(
  viz: VizInstance,
  curves: Map<SunburstNode, RingLabelFit>,
  labelConfig: Record<string, unknown>,
  inputs: {
    labelOf: (node: SunburstNode) => string;
    colorOf: (node: SunburstNode) => string;
  },
): SceneNode[] {
  const labels: RingLabel[] = [...curves].map(([node, fit]) => ({
    key: `sunburst-curved-${node.id}`,
    text: inputs.labelOf(node),
    fit,
    color: inputs.colorOf(node),
    datum: node.datum,
    index: node.i ?? 0,
  }));
  return ringLabelNodes(viz, labels, ringLabelFont(labelConfig));
}
