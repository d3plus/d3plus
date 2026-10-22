import type {
  CircleNode,
  RectNode,
  Transform,
  TransitionRect,
} from "../scene.js";

/**
    A degenerate, zero-height path collapsed onto the box's own horizontal
    centerline, so `interpolatePath` can morph an Area band (a `path` node
    with `shapeType: "Area"` — StackedArea/AreaPlot's actual scene
    representation, pre-serialized `d` string, not the `AreaNode` type) into
    or out of it.
*/
export function flatAreaPath(rect: TransitionRect): string {
  const midY = rect.y + rect.height / 2;
  const x0 = rect.x,
    x1 = rect.x + rect.width;
  return `M${x0},${midY}L${x1},${midY}L${x1},${midY}L${x0},${midY}Z`;
}

/**
    A transform that scales a path's own bounding box (`own`, from
    `pathBounds`) to `scale`, translated so its center lands on `target`'s
    center. Used to morph a Pie/Donut wedge (a `path` node with `shapeType:
    "Pie"`) to/from an external box while preserving its actual silhouette —
    unlike Area's `flatAreaPath`, which replaces the `d` string outright, a
    wedge's shape doesn't degrade gracefully into a flattened line, so this
    scales the real shape down instead. `scale: 0` (with `target === own`)
    collapses it to a point at its own center, mirroring how a circle
    collapses to `r: 0`.
*/
export function fitTransform(
  own: TransitionRect,
  target: TransitionRect,
  scale: number,
): Transform {
  const ownCx = own.x + own.width / 2,
    ownCy = own.y + own.height / 2;
  const targetCx = target.x + target.width / 2,
    targetCy = target.y + target.height / 2;
  return {x: targetCx - scale * ownCx, y: targetCy - scale * ownCy, scale};
}

/**
    Maps a rect's own geometry proportionally from `body` (the full layout's
    reference box, e.g. `viz._bodyRect`) into `target` — a non-uniform scale
    per axis, so the whole set of siblings collectively fills `target`
    exactly (matching how they already collectively fill `body`), each
    cell keeping its position/size relative to the others. Used for the
    drill-down morph's Treemap case, so entering/exiting cells read as "the
    whole layout, shrunk into/grown out of the clicked parent's rect"
    instead of each cell individually filling that rect (which would make
    them all overlap at the same spot).
*/
export function proportionalRect(
  node: RectNode,
  body: TransitionRect,
  target: TransitionRect,
): Pick<RectNode, "x" | "y" | "width" | "height"> {
  const bw = body.width || 1e-6,
    bh = body.height || 1e-6;
  const fx = (node.x - body.x) / bw,
    fy = (node.y - body.y) / bh;
  const fw = node.width / bw,
    fh = node.height / bh;
  return {
    x: target.x + fx * target.width,
    y: target.y + fy * target.height,
    width: fw * target.width,
    height: fh * target.height,
  };
}

/**
    The circle counterpart of {@link proportionalRect} — an isotropic scale
    (the smaller of the two axis ratios), so Pack's circles stay circular
    instead of stretching into ellipses when `body`/`target` aren't the same
    aspect ratio.
*/
export function proportionalCircle(
  node: CircleNode,
  body: TransitionRect,
  target: TransitionRect,
): Pick<CircleNode, "cx" | "cy" | "r"> {
  const bw = body.width || 1e-6,
    bh = body.height || 1e-6;
  const scale = Math.min(target.width / bw, target.height / bh);
  const fx = (node.cx - body.x) / bw,
    fy = (node.cy - body.y) / bh;
  return {
    cx: target.x + fx * target.width,
    cy: target.y + fy * target.height,
    r: node.r * scale,
  };
}

/**
    The point counterpart of {@link proportionalRect} — maps a single (x, y),
    such as a label's own `transform`, from its fraction within `body` into
    `target`. Used so a Treemap cell's or Pie wedge's LABEL moves along with
    its shape during the drill-morph instead of just fading in at its final
    spot: wherever the label sits within its shape, it starts at the
    corresponding relative position within the clicked parent's rect.
*/
export function proportionalPoint(
  x: number,
  y: number,
  body: TransitionRect,
  target: TransitionRect,
): {x: number; y: number} {
  const bw = body.width || 1e-6,
    bh = body.height || 1e-6;
  const fx = (x - body.x) / bw,
    fy = (y - body.y) / bh;
  return {x: target.x + fx * target.width, y: target.y + fy * target.height};
}
