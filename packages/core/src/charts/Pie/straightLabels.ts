/**
    A Pie's straight slice labels, each centered on its slice's bisector
    (see `straightLayout.ts`).
*/
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {resolveAccessor} from "../features/emitHelpers.js";
import {ringLabelFont, ringTextWidth} from "../features/ringLabelNodes.js";
import type {RingArc} from "../features/ringLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {PieSlice} from "./pieLabels.js";
import {sectorEdges} from "./sectorBox.js";
import {
  centerLabelLines,
  straightLabelLayout,
  straightLabelOptions,
  wrapWidths,
} from "./straightLayout.js";
import type {StraightLabelLayout} from "./straightLayout.js";

/** What placing the straight labels needs. */
export interface StraightLabelInputs {
  viz: VizInstance;
  slices: PieSlice[];
  /** Each slice's ring segment. */
  arcOf: (d: PieSlice) => RingArc;
  /** The Path shape config, for each slice's fill. */
  sc: Record<string, unknown>;
  /** Each slice's share, as text. */
  sharePct: (d: PieSlice) => string;
  /** The Path shape's labelConfig. */
  labelConfig: Record<string, unknown>;
}

/** The slice a label node names. */
const sliceOf = (node: SceneNode) =>
  (node.datum as {data?: PieSlice} | undefined)?.data;

/**
    Each slice's straight label, centered on its bisector: the name, at the
    largest size that shows it whole, and the share percentage beneath it
    when there is room (see `straightLabelLayout`).
    @param inputs The slices, their segments and fills, and the label config.
*/
export function pieStraightLabels(inputs: StraightLabelInputs): SceneNode[] {
  const {viz, slices, arcOf, sc, sharePct, labelConfig} = inputs;
  const options = straightLabelOptions(labelConfig);
  const font = ringLabelFont(labelConfig);
  const unitWidth = (text: string) => ringTextWidth(text, font)(1);
  const layouts = new Map<PieSlice, StraightLabelLayout>();
  slices.forEach((d, i) => {
    const name = viz._drawLabel(d.data as DataPoint, d.i ?? i);
    const edges = name ? sectorEdges(arcOf(d)) : null;
    if (!edges) return;
    const layout = straightLabelLayout(
      edges,
      wrapWidths(String(name), unitWidth, options.maxLines),
      unitWidth(sharePct(d)),
      options,
    );
    if (layout) layouts.set(d, layout);
  });

  const nodes = emitLabels({
    data: slices as unknown as DataPoint[],
    label: (_d, i) => {
      const name = viz._drawLabel(
        slices[i].data as DataPoint,
        slices[i].i ?? i,
      );
      return layouts.get(slices[i])?.share
        ? [name, sharePct(slices[i])]
        : [name];
    },
    // The boxes are in chart-centered path coordinates, so the anchor is
    // the origin and labelBounds carries each absolute box.
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (_d, i) => `pie-label-${i}`,
    labelBounds: (_d, i) => {
      const layout = layouts.get(slices[i]);
      if (!layout) return false;
      const boxes = layout.share ? [layout.name, layout.share] : [layout.name];
      return boxes.map(b => ({...b, angle: 0}));
    },
    labelConfig: {
      fontColor: (d: {data?: PieSlice}) => {
        const slice = (d.data ?? d) as PieSlice;
        const fill = resolveAccessor<string>(
          sc.fill,
          slice.data as DataPoint,
          slice.i ?? 0,
        );
        return colorContrast(
          typeof fill === "string" ? fill : "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      textAnchor: "middle",
      verticalAlign: "middle",
      ...labelConfig,
      // Each label's size is worked out to fit its slice.
      fontResize: false,
      fontSize: (d: {data?: PieSlice; l?: number}) => {
        const layout = d.data ? layouts.get(d.data) : undefined;
        if (!layout) return options.fontMin;
        return d.l === 1 && layout.shareSize
          ? layout.shareSize
          : layout.fontSize;
      },
    },
  });

  if (labelConfig.verticalAlign === undefined) {
    const bySlice = new Map<PieSlice, SceneNode[]>();
    for (const node of nodes) {
      const slice = sliceOf(node);
      if (!slice) continue;
      bySlice.set(slice, [...(bySlice.get(slice) ?? []), node]);
    }
    bySlice.forEach((list, slice) => {
      const layout = layouts.get(slice);
      if (layout) centerLabelLines(list, layout.center[1]);
    });
  }
  return nodes;
}
