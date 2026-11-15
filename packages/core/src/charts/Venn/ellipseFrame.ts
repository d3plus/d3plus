/**
    The classic four- and five-set ellipse layouts, worked out once per set
    count in the ellipses' own frame and kept: each set's polygon, and, for
    each combination of sets as it is first asked for, its outline and its
    label spot. A draw only scales and moves them into the chart area, so
    a redraw or resize doesn't clip polygons or search for label spots
    again.
*/

import {
  FIVE_ELLIPSES,
  FOUR_ELLIPSES,
  ellipsePolygon,
  fitPoint,
  pointBounds,
  polygonIntersection,
  polygonLabelSpot,
} from "./vennEllipses.js";
import type {PointBounds, PointFit, VennPoint} from "./vennEllipses.js";
import type {VennLabelSpot} from "./vennRegions.js";

/** A combination's outline and label spot. */
export interface EllipseRegionShape {
  outline: VennPoint[];
  label: VennLabelSpot;
}

/** A set count's ellipses in their own frame, with the regions worked out so far. */
export interface EllipseFrame {
  /** Each set's ellipse as a polygon, in set order. */
  polygons: VennPoint[][];
  /** The box around every ellipse. */
  bounds: PointBounds;
  /** Each combination (a bit per set) asked for so far, or null when it has no area. */
  regions: Map<number, EllipseRegionShape | null>;
}

const frames = new Map<number, EllipseFrame>();

/**
    The kept frame for `count` sets (four or five), made on first use;
    undefined for any other count.
*/
export function ellipseFrame(count: number): EllipseFrame | undefined {
  const base =
    count === 4 ? FOUR_ELLIPSES : count === 5 ? FIVE_ELLIPSES : undefined;
  if (!base) return undefined;
  let frame = frames.get(count);
  if (!frame) {
    const polygons = base.map(e => ellipsePolygon(e));
    frame = {
      polygons,
      bounds: pointBounds(polygons.flat()),
      regions: new Map(),
    };
    frames.set(count, frame);
  }
  return frame;
}

/**
    The outline and label spot of the combination `mask` (bit `k` for set
    `k`) in `frame`, worked out on first ask and kept; null when its sets
    share no area.
*/
export function frameRegion(
  frame: EllipseFrame,
  mask: number,
): EllipseRegionShape | null {
  if (!frame.regions.has(mask)) {
    const inside = frame.polygons.filter((_, k) => mask & (1 << k));
    const outside = frame.polygons.filter((_, k) => !(mask & (1 << k)));
    const outline =
      inside.length === 1 ? inside[0] : polygonIntersection(inside);
    frame.regions.set(
      mask,
      outline.length
        ? {outline, label: polygonLabelSpot(inside, outside)}
        : null,
    );
  }
  return frame.regions.get(mask) ?? null;
}

/** A region's outline and label spot moved by a fit (the label's room scales too). */
export function fitRegion(
  shape: EllipseRegionShape,
  fit: PointFit,
): EllipseRegionShape {
  const [x, y] = fitPoint([shape.label.x, shape.label.y], fit);
  return {
    outline: shape.outline.map(p => fitPoint(p, fit)),
    label: {x, y, margin: shape.label.margin * fit.scale},
  };
}
