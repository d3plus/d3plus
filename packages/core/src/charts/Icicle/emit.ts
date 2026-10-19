/**
    `icicleEmit` — one Rect SceneNode per laid-out node (the focused node
    filling depth 0), its `backgroundImage` when one is set, plus a label
    TextNode wherever the label fits.
*/

import {colorContrast} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import type {EnterWindow, FadeSwap, SceneNode, TextNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {
  resolveAccessor,
  shapeConfigFor,
  textureFill,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import {measureLabel, partitionSplit} from "../partition/labelWords.js";
import {partitionFillResolver} from "../partition/shade.js";
import type {PartitionFillable} from "../partition/shade.js";

import type {IcicleGhost} from "./applyLayout.js";
import type {IcicleRect} from "./geometry.js";
import {icicleLabelBox} from "./labelFit.js";
import type {IcicleLabelBox} from "./labelFit.js";
import type {IcicleNode} from "./layout.js";

type EmitViz = Parameters<ChartEmit>[0]["viz"];

/** The label text for a node: its key at its own `groupBy` level. */
export function icicleLabel(
  viz: {_drawLabel: (d: DataPoint, i: number, depth?: number) => string},
  node: Pick<IcicleNode, "datum" | "i" | "level">,
): string {
  return viz._drawLabel(node.datum, node.i ?? 0, node.level);
}

/** Resolves a rectangle's fill: the shape config's fill, shaded by level on the default color path. */
function fillResolver(
  viz: EmitViz,
  sc: Record<string, unknown>,
): (node: PartitionFillable) => string | undefined {
  return partitionFillResolver(
    viz.schema,
    sc,
    {color: viz.ctx.icicleDefaultColor, fill: viz.ctx.icicleDefaultFill},
    "Rect",
  );
}

/** Where each node's label fits, measured in the label font; nodes without room are left out. */
function labelBoxes(
  viz: EmitViz,
  nodes: IcicleNode[],
  labelConfig: Record<string, unknown>,
  options: {fontMin: number; fontMax: number},
): Map<IcicleNode, IcicleLabelBox> {
  const boxes = new Map<IcicleNode, IcicleLabelBox>();
  for (const node of nodes) {
    const metrics = measureLabel(
      icicleLabel(viz, node),
      node.datum,
      labelConfig,
    );
    const box = icicleLabelBox(node, metrics, options);
    if (box) boxes.set(node, box);
  }
  return boxes;
}

/**
    Rectangles a zoom-in removed stay for this frame, folding to zero size
    beneath the rectangles that grow into their place; they carry no datum, so
    they take no part in hover or picking, and drop out on the next draw.
*/
function ghostNodes(
  viz: EmitViz,
  fillOf: (node: PartitionFillable) => string | undefined,
): SceneNode[] {
  return ((viz.ctx.icicleGhosts ?? []) as IcicleGhost[]).map(
    g =>
      ({
        type: "rect",
        key: `icicle-${g.id}`,
        ...g.rect,
        paint: {fill: fillOf(g), opacity: 1},
      }) as SceneNode,
  );
}

/**
    The label fade windows, as shares of a transition's eased progress: labels
    are gone before their rectangles visibly move, and return once the
    rectangles have all but settled.
*/
export const ICICLE_LABEL_FADE: FadeSwap = {out: 0.06, in: 0.06};

/** Unwraps a label record to the row it labels. */
function rowOf(d: DataPoint): DataPoint {
  let row = d;
  while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
  return row;
}

export const icicleEmit: ChartEmit = ({viz, shapeData}) => {
  const nodes = (shapeData ?? []) as unknown as IcicleNode[];
  if (!nodes.length) return [];

  const sc = shapeConfigFor(viz, "Rect");
  const sumFn = viz.schema.sum as (d: DataPoint) => number;
  const locale = viz.schema.locale;
  const fillOf = fillResolver(viz, sc);
  const enterRects = (viz.ctx.icicleEnterRects ?? new Map()) as Map<
    string,
    IcicleRect
  >;
  const enterWindows = (viz.ctx.icicleEnterWindows ?? new Map()) as Map<
    string,
    EnterWindow
  >;

  const rectNodes: SceneNode[] = nodes.map(node => {
    const i = node.i ?? 0;
    return {
      type: "rect",
      key: `icicle-${node.id}`,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      // Where an entering rectangle grows from (its root edge, or on a
      // zoom-out where it folded away), and when (see `icicleStagger`).
      enterRect: enterRects.get(node.id),
      enterWindow: enterWindows.get(node.id),
      datum: node.datum,
      paint: {
        fill: textureFill(sc, node.datum, i, fillOf(node)),
        stroke: resolveAccessor<string>(sc.stroke, node.datum, i),
        strokeWidth: resolveAccessor<number>(sc.strokeWidth, node.datum, i),
        // Explicit, so an exiting rectangle fades from a real starting opacity.
        opacity: resolveAccessor<number>(sc.opacity, node.datum, i) ?? 1,
      },
      aria: {
        label: `${icicleLabel(viz, node)}, ${sumFn(node.datum)}, ${formatAbbreviate(node.share * 100, locale)}%`,
      },
    } as SceneNode;
  });

  const imageNodes = backgroundImageNodes(sc, rectNodes, k => [
    nodes[k].datum,
    nodes[k].i ?? 0,
  ]);

  const labelConfig = (userLabelConfig(viz, "Rect") ?? {}) as Record<
    string,
    unknown
  >;
  const fontMin =
    typeof labelConfig.fontMin === "number" ? labelConfig.fontMin : 8;
  const fontMax =
    typeof labelConfig.fontMax === "number" ? labelConfig.fontMax : 24;
  const boxes = labelBoxes(viz, nodes, labelConfig, {fontMin, fontMax});
  const labeled = nodes.filter(n => boxes.has(n));
  const boxOf = (d: unknown) => boxes.get(d as IcicleNode)!;
  const lookup = viz.ctx.icicleNodes as Map<DataPoint, IcicleNode>;

  const labelNodes = emitLabels({
    data: labeled as unknown as DataPoint[],
    label: d => icicleLabel(viz, d as unknown as IcicleNode),
    x: d => boxOf(d).x,
    y: d => boxOf(d).y,
    rotate: d => boxOf(d).rotate,
    aes: () => ({}),
    id: d => `icicle-${(d as unknown as IcicleNode).id}`,
    datum: d => (d as unknown as IcicleNode).datum,
    labelBounds: d => {
      const {width, height} = boxOf(d);
      return {x: -width / 2, y: -height / 2, width, height};
    },
    labelConfig: {
      fontMax,
      fontMin,
      // Words wrap only at spaces; the fit was measured for whole words.
      split: partitionSplit,
      fontResize: true,
      padding: 2,
      textAnchor: "middle",
      verticalAlign: "middle",
      fontColor: (d: DataPoint) => {
        const node = lookup.get(rowOf(d));
        const fill = node ? fillOf(node) : undefined;
        return colorContrast(
          fill ?? "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      ...labelConfig,
    },
  });

  // A label never glides along with its rectangle: when an animated draw
  // moves, retexts, or resizes it, it fades out where it was and back in
  // where it lands. A label whose rectangle stays put stays put.
  for (const n of labelNodes) (n as TextNode).fadeSwap = ICICLE_LABEL_FADE;

  // A rectangle's image and label enter with it.
  const windowOf = new Map(
    nodes.map(n => [n.datum, enterWindows.get(n.id)] as const),
  );
  for (const n of [...imageNodes, ...labelNodes])
    if (n.datum) n.enterWindow = windowOf.get(rowOf(n.datum));

  return [
    ...ghostNodes(viz, fillOf),
    ...rectNodes,
    ...imageNodes,
    ...labelNodes,
  ];
};
