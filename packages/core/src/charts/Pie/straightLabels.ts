/**
    A Pie's straight slice labels, each in its slice's largest inscribed
    rectangle.
*/
import {colorContrast} from "@d3plus/color";
import {largestRect, path2polygon} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {resolveAccessor} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {PieSlice} from "./pieLabels.js";

/** What placing the straight labels needs. */
export interface StraightLabelInputs {
  viz: VizInstance;
  slices: PieSlice[];
  /** Each slice's path. */
  arcMaker: (d: PieSlice) => string;
  /** The Path shape config, for each slice's fill. */
  sc: Record<string, unknown>;
  /** Each slice's share, as text. */
  sharePct: (d: PieSlice) => string;
  /** The Path shape's labelConfig. */
  labelConfig: Record<string, unknown>;
}

/**
    Each slice's straight label, in its largest inscribed rectangle: the name
    above and the share percentage below, meeting at the rectangle's center.
    Short rectangles skip the share line so it can't crowd out the name.
    With a single angle the search is cheap, so more origins are sampled
    than the default for a tighter box.
    @param inputs The slices, their paths and fills, and the label config.
*/
export function pieStraightLabels(inputs: StraightLabelInputs): SceneNode[] {
  const {viz, slices, arcMaker, sc, sharePct, labelConfig} = inputs;
  const labelBoxes = slices.map(d => {
    const r = largestRect(path2polygon(arcMaker(d)), {angle: 0, nTries: 40});
    if (!r) return false;
    const x = r.cx - r.width / 2;
    const y = r.cy - r.height / 2;
    if (r.height < 50)
      return [{angle: r.angle, width: r.width, height: r.height, x, y}];
    const padding = 5;
    const band = Math.min(32, (r.height - padding * 2) * 0.3) + padding * 2;
    return [
      {angle: r.angle, width: r.width, height: r.height - band, x, y},
      {angle: r.angle, width: r.width, height: band, x, y: y + r.height - band},
    ];
  });

  return emitLabels({
    data: slices as unknown as DataPoint[],
    label: (_d, i) => {
      const name = viz._drawLabel(
        slices[i].data as DataPoint,
        slices[i].i ?? i,
      );
      const box = labelBoxes[i];
      return box && box.length > 1 ? [name, sharePct(slices[i])] : [name];
    },
    // The largest inscribed rectangle is in chart-centered path coordinates,
    // so the anchor is the origin and labelBounds carries the absolute box.
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (_d, i) => `pie-label-${i}`,
    labelBounds: (_d, i) => labelBoxes[i],
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
      fontResize: true,
      textAnchor: "middle",
      verticalAlign: (d: {data?: PieSlice; l?: number}) => {
        if (d && d.l === 1) return "top";
        const box = d && d.data ? labelBoxes[slices.indexOf(d.data)] : false;
        return box && box.length > 1 ? "bottom" : "middle";
      },
      ...labelConfig,
    },
  });
}
