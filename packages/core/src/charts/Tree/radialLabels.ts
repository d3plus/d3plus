/**
    A radial Tree's labels (see `radialLayout.ts`): each leaf's along its
    spoke past the circle, each branch's inward toward its parent, and the
    center node's beneath it, in the shape's labelConfig. Branch and center
    labels lie over links, so they draw over a halo.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {userLabelConfig} from "../features/emitHelpers.js";
import {emitSpokeLabels} from "../features/spokeLabels.js";
import type {SpokeLabel} from "../features/spokeLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {RADIAL_LABEL_FONT_SIZE} from "./radialLayout.js";
import type {RadialLabel, RadialTreeNode} from "./radialLayout.js";

/** Each labelled node's text, font, and placement. */
export type RadialLabels = Map<
  RadialTreeNode,
  {text: string; font: {size: number}; place: RadialLabel}
>;

/** The labelConfig keys a spoke label sets itself. */
const OWN_KEYS = [
  "fontResize",
  "fontSize",
  "lineHeight",
  "padding",
  "textAnchor",
  "verticalAlign",
  "rotate",
  "rotateAnchor",
];

/**
    The scene nodes for a radial Tree's labels, keyed `tree-label-<id>` by
    `id`. Labels draw in groups by shape kind, so each takes its own shape's
    labelConfig.
*/
export function emitRadialTreeLabels(
  viz: VizInstance,
  labels: RadialLabels,
  id: (d: RadialTreeNode & DataPoint) => string,
): SceneNode[] {
  const shapeAccessor = viz.schema.shape as (d: DataPoint) => string;
  const groups = new Map<
    string,
    {halo: boolean; shape: string; list: SpokeLabel[]}
  >();
  for (const [node, {text, font, place}] of labels) {
    const row = (node.data ?? node) as DataPoint;
    const shape = shapeAccessor(row);
    const halo = place.kind === "center" || place.inward;
    const key = `${shape}|${halo}`;
    if (!groups.has(key)) groups.set(key, {halo, shape, list: []});
    groups.get(key)!.list.push({
      id: `tree-label-${id(node as RadialTreeNode & DataPoint)}`,
      text,
      datum: row,
      fontSize: font.size,
      x: place.x,
      y: place.y,
      box: place.box,
      rotate: place.kind === "spoke" ? place.rotate : 0,
      anchor: place.kind === "spoke" ? place.anchor : "start",
    });
  }
  const out: SceneNode[] = [];
  for (const {halo, shape, list} of groups.values()) {
    const text = {...userLabelConfig(viz, shape)};
    for (const key of OWN_KEYS) delete text[key];
    out.push(
      ...emitSpokeLabels(viz, list, {
        fontSize: RADIAL_LABEL_FONT_SIZE,
        text,
        halo,
      }),
    );
  }
  return out;
}
