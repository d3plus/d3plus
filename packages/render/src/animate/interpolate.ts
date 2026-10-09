import {arc as d3Arc} from "d3-shape";
import {interpolateNumber, interpolateRgb} from "d3-interpolate";
import {interpolatePath} from "d3-interpolate-path";
import {pathBounds} from "@d3plus/math";

import {textVisualCenter} from "../scene.js";

import type {
  ArcGeometry,
  AreaNode,
  CircleNode,
  GroupNode,
  LineNode,
  Paint,
  PathNode,
  RectNode,
  SceneNode,
  TextNode,
  Transform,
  TransitionRect,
} from "../scene.js";

/**
    Builds a Pie/Donut wedge's `d` string directly from its polar
    parameters — a pure-geometry utility (d3-shape is already a dependency
    of this package for Path/Geomap), used so the animate layer can rebuild
    an exact arc at every interpolated frame instead of morphing a `d`
    STRING between two differently-curved shapes (see `ArcGeometry`).
*/
/** d3.pie()'s span — a wedge's own startAngle/endAngle are always within [0, FULL_TURN]. */
const FULL_TURN = Math.PI * 2;

const arcGenerator = d3Arc<ArcGeometry>()
  .innerRadius(d => d.innerRadius)
  .outerRadius(d => d.outerRadius)
  .startAngle(d => d.startAngle)
  .endAngle(d => d.endAngle)
  .padAngle(d => d.padAngle ?? 0);

export function arcPath(params: ArcGeometry): string {
  return arcGenerator(params) ?? "";
}

/**
    Interpolates an {@link ArcGeometry} frame by frame (each field lerped
    independently), rebuilding `d` via the real arc generator at every `t` —
    exact radius throughout, no path-resampling artifacts. Exported so the
    SVG backend's own `d`-attribute tween (`setPath`, which drives the DOM
    transition directly via `attrTween` rather than `interpolateNode`'s
    per-frame Canvas painting) can use the identical geometric interpolation.
*/
export function lerpArc(a: ArcGeometry, b: ArcGeometry): Interp<ArcGeometry> {
  const ir = lerpNum(a.innerRadius, b.innerRadius);
  const or = lerpNum(a.outerRadius, b.outerRadius);
  const sa = lerpNum(a.startAngle, b.startAngle);
  const ea = lerpNum(a.endAngle, b.endAngle);
  const pa = lerpNum(a.padAngle ?? 0, b.padAngle ?? 0);
  return t => ({innerRadius: ir(t), outerRadius: or(t), startAngle: sa(t), endAngle: ea(t), padAngle: pa(t)});
}

/**
    @type Interp
    A function mapping normalized time [0,1] to an interpolated value.
*/
export type Interp<T> = (t: number) => T;

/**
    The default easing curve, identical to d3-transition's default (cubic in-out),
    so Canvas frame interpolation matches SVG transition motion.
    @param t Normalized time in [0,1].
*/
export function cubicInOut(t: number): number {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

/**
    A degenerate, zero-height path collapsed onto the box's own horizontal
    centerline, so `interpolatePath` can morph an Area band (a `path` node
    with `shapeType: "Area"` — StackedArea/AreaPlot's actual scene
    representation, pre-serialized `d` string, not the `AreaNode` type) into
    or out of it.
*/
function flatAreaPath(rect: TransitionRect): string {
  const midY = rect.y + rect.height / 2;
  const x0 = rect.x, x1 = rect.x + rect.width;
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
function fitTransform(own: TransitionRect, target: TransitionRect, scale: number): Transform {
  const ownCx = own.x + own.width / 2, ownCy = own.y + own.height / 2;
  const targetCx = target.x + target.width / 2, targetCy = target.y + target.height / 2;
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
function proportionalRect(
  node: RectNode,
  body: TransitionRect,
  target: TransitionRect,
): Pick<RectNode, "x" | "y" | "width" | "height"> {
  const bw = body.width || 1e-6, bh = body.height || 1e-6;
  const fx = (node.x - body.x) / bw, fy = (node.y - body.y) / bh;
  const fw = node.width / bw, fh = node.height / bh;
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
function proportionalCircle(
  node: CircleNode,
  body: TransitionRect,
  target: TransitionRect,
): Pick<CircleNode, "cx" | "cy" | "r"> {
  const bw = body.width || 1e-6, bh = body.height || 1e-6;
  const scale = Math.min(target.width / bw, target.height / bh);
  const fx = (node.cx - body.x) / bw, fy = (node.cy - body.y) / bh;
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
function proportionalPoint(
  x: number,
  y: number,
  body: TransitionRect,
  target: TransitionRect,
): {x: number; y: number} {
  const bw = body.width || 1e-6, bh = body.height || 1e-6;
  const fx = (x - body.x) / bw, fy = (y - body.y) / bh;
  return {x: target.x + fx * target.width, y: target.y + fy * target.height};
}

/** Interpolates a numeric field, snapping when either endpoint is absent or equal. */
function lerpNum(a: number | undefined, b: number): Interp<number> {
  if (a === undefined || a === b) return () => b;
  const i = interpolateNumber(a, b);
  return t => i(t);
}

/** Interpolates a color field, snapping when either endpoint is absent or equal. */
function lerpColor(
  a: string | undefined,
  b: string | undefined,
): Interp<string | undefined> {
  if (b === undefined || a === undefined || a === b) return () => b;
  const i = interpolateRgb(a, b);
  return t => i(t);
}

/** Interpolates point arrays of equal length; snaps to the target when lengths differ. */
function lerpPoints(
  a: [number, number][],
  b: [number, number][],
): Interp<[number, number][]> {
  if (a.length !== b.length) return () => b;
  const xs = b.map((p, i) => interpolateNumber(a[i][0], p[0]));
  const ys = b.map((p, i) => interpolateNumber(a[i][1], p[1]));
  return t => b.map((_, i) => [xs[i](t), ys[i](t)]);
}

/** Builds an interpolator for the shared Paint fields. Snap-only fields follow the target. */
function interpPaint(a: Paint = {}, b: Paint = {}): Interp<Paint> {
  const fill = lerpColor(a.fill, b.fill);
  const stroke = lerpColor(a.stroke, b.stroke);
  const fillOpacity = b.fillOpacity === undefined ? null : lerpNum(a.fillOpacity, b.fillOpacity);
  const strokeOpacity = b.strokeOpacity === undefined ? null : lerpNum(a.strokeOpacity, b.strokeOpacity);
  const strokeWidth = b.strokeWidth === undefined ? null : lerpNum(a.strokeWidth, b.strokeWidth);
  // Opacity defaults to 1 (the SVG default) when either endpoint sets it, so that
  // collapse()'s opacity:0 fades a node fully in on enter and fully out on exit.
  const opacity =
    a.opacity === undefined && b.opacity === undefined
      ? null
      : lerpNum(a.opacity ?? 1, b.opacity ?? 1);
  return t => ({
    ...b,
    fill: fill(t),
    stroke: stroke(t),
    ...(fillOpacity ? {fillOpacity: fillOpacity(t)} : {}),
    ...(strokeOpacity ? {strokeOpacity: strokeOpacity(t)} : {}),
    ...(strokeWidth ? {strokeWidth: strokeWidth(t)} : {}),
    ...(opacity ? {opacity: opacity(t)} : {}),
  });
}

/** Builds an interpolator for the affine Transform fields. */
function interpTransform(a: Transform = {}, b: Transform = {}): Interp<Transform> {
  const x = lerpNum(a.x ?? 0, b.x ?? 0);
  const y = lerpNum(a.y ?? 0, b.y ?? 0);
  const scale = lerpNum(a.scale ?? 1, b.scale ?? 1);
  const rotate = lerpNum(a.rotate ?? 0, b.rotate ?? 0);
  return t => ({...b, x: x(t), y: y(t), scale: scale(t), rotate: rotate(t)});
}

/**
    Builds an interpolator between two nodes of the same type. When the types differ
    (a rare key reuse across shape kinds) it snaps to the target. Group children are
    not recursed here — interpolateScene handles nested groups.
    @param from The starting node.
    @param to The target node.
*/
export function interpolateNode(from: SceneNode, to: SceneNode): Interp<SceneNode> {
  if (from.type !== to.type) return () => to;

  const paint = interpPaint(from.paint, to.paint);
  const hasTransform = Boolean(from.transform || to.transform);
  const transform = hasTransform ? interpTransform(from.transform, to.transform) : null;

  const base = (t: number): SceneNode =>
    ({...to, paint: paint(t), ...(transform ? {transform: transform(t)} : {})}) as SceneNode;

  switch (to.type) {
    case "rect": {
      const f = from as RectNode;
      const x = lerpNum(f.x, to.x), y = lerpNum(f.y, to.y);
      const w = lerpNum(f.width, to.width), h = lerpNum(f.height, to.height);
      return t => ({...(base(t) as RectNode), x: x(t), y: y(t), width: w(t), height: h(t)});
    }
    case "circle": {
      const f = from as CircleNode;
      const cx = lerpNum(f.cx, to.cx), cy = lerpNum(f.cy, to.cy), r = lerpNum(f.r, to.r);
      return t => ({...(base(t) as CircleNode), cx: cx(t), cy: cy(t), r: r(t)});
    }
    case "line": {
      const f = from as LineNode;
      const pts = lerpPoints(f.points, to.points);
      return t => ({...(base(t) as LineNode), points: pts(t)});
    }
    case "area": {
      const f = from as AreaNode;
      const top = lerpPoints(f.topline, to.topline);
      const bot = lerpPoints(f.baseline, to.baseline);
      return t => ({...(base(t) as AreaNode), topline: top(t), baseline: bot(t)});
    }
    case "path": {
      const f = from as PathNode, n = to as PathNode;
      // Both endpoints carry real polar parameters (Pie/Donut) — interpolate
      // those numbers and rebuild `d` every frame instead of morphing the
      // `d` STRING via generic point-resampling, which has no notion of
      // "arc" and visibly bulges/pinches the radius between two
      // differently-curved paths (e.g. a narrow confined slice growing into
      // its final angular span).
      if (f.arc && n.arc) {
        const arc = lerpArc(f.arc, n.arc);
        return t => ({...(base(t) as PathNode), d: arcPath(arc(t))});
      }
      const d = interpolatePath(f.d, to.d);
      return t => ({...(base(t) as PathNode), d: d(t)});
    }
    case "text": {
      // A font-size change eases in as a scale (old/new → 1) layered on the
      // target transform, mirroring the SVG renderer. The text layout (tspans)
      // stays at the target size; the scale grows/shrinks the glyphs into place.
      // The scale pivots about the NEW visual center (anchor-aware); we glide
      // that center's position old→new and place the origin at `pos − scale·c`.
      // `base(t)` is still used for rotation interpolation.
      const f = from as TextNode, n = to as TextNode;
      const fromSize = f.font?.size, toSize = n.font?.size;
      if (fromSize && toSize && fromSize !== toSize) {
        const baseScale = to.transform?.scale ?? 1;
        const [nvcx, nvcy] = textVisualCenter(n);
        const [ovcx, ovcy] = textVisualCenter(f);
        const si = lerpNum(fromSize / toSize, 1);
        const pxI = lerpNum((f.transform?.x ?? 0) + ovcx, (n.transform?.x ?? 0) + nvcx);
        const pyI = lerpNum((f.transform?.y ?? 0) + ovcy, (n.transform?.y ?? 0) + nvcy);
        return t => {
          const b = base(t);
          const tr = b.transform ?? to.transform ?? {};
          const scale = baseScale * si(t);
          return {
            ...b,
            transform: {...tr, scale, x: pxI(t) - scale * nvcx, y: pyI(t) - scale * nvcy},
          } as SceneNode;
        };
      }
      return base;
    }
    default:
      // image, group: snap geometry, animate paint/transform only.
      return base;
  }
}

/**
    Produces the degenerate "zero" form of a node used as the start of an enter
    animation and the end of an exit animation: opacity fades to 0, and geometric
    shapes collapse (rect shrinks toward its center, circle radius → 0), mirroring
    the enter/exit conventions of the SVG Shape classes.
    @param node The node to collapse.
*/
export function collapse(node: SceneNode): SceneNode {
  const paint: Paint = {...node.paint, opacity: 0};
  switch (node.type) {
    case "rect": {
      // A bar's measure-axis edge is anchored at local 0 (its baseline), so it
      // grows in from that edge rather than from its center: a vertical bar has
      // a horizontal edge at y=0, a horizontal bar a vertical edge at x=0.
      // Collapse only the measure dimension and keep the bar's full breadth.
      // Plain rects (Treemap cells, etc.) collapse toward their center.
      if (node.shapeType === "Bar") {
        if (node.y === 0 || node.y + node.height === 0)
          return {...node, paint, y: 0, height: 0};
        if (node.x === 0 || node.x + node.width === 0)
          return {...node, paint, x: 0, width: 0};
      }
      return {
        ...node,
        paint,
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
        width: 0,
        height: 0,
      };
    }
    case "circle":
      return {...node, paint, r: 0};
    case "area": {
      // Collapse to a flat line at the shape's own vertical center, keeping
      // each point's x — the band grows out of/into that centerline.
      const f = node as AreaNode;
      const midY = f.topline.reduce((s, p) => s + p[1], 0) / (f.topline.length || 1);
      const flat = (pts: [number, number][]): [number, number][] =>
        pts.map(([x]): [number, number] => [x, midY]);
      return {...node, paint, topline: flat(f.topline), baseline: flat(f.baseline)};
    }
    case "path":
      // A Sankey link encodes its flow magnitude as stroke-width, so it grows
      // that thickness in on enter (and drains it on exit) from 0, keeping its
      // own opacity — rather than the default opacity fade other paths use.
      if (node.shapeType === "Link")
        return {...node, paint: {...node.paint, strokeWidth: 0}};
      // StackedArea/AreaPlot's band, collapsed to a flat line at its own
      // vertical center — the band grows out of/into that centerline.
      if (node.shapeType === "Area")
        return {...node, paint, d: flatAreaPath(pathBounds(node.d))};
      // A Pie/Donut wedge collapses to a zero-WIDTH slice at its OWN full
      // radius — not scaled down to a point/dot — at whichever of 0 or a
      // full turn (2π) is closer to the wedge's own position: d3.pie()'s
      // slices span [0, 2π] monotonically, so those two values are the SAME
      // screen angle (12 o'clock) but numerically far apart, and collapsing
      // every wedge toward the literal number 0 would sweep the long way
      // around the whole circle for one sitting just before completing the
      // loop back to the top. Picking the nearer representation instead
      // sweeps the short way — left (toward 0) for a wedge in the first
      // half, right/wrapping (toward 2π) for one in the second half —
      // reading as "shrinking back into 12 o'clock" rather than unrolling
      // backward across everyone else's wedges. Every wedge's arc LENGTH
      // shrinks to zero while its radius stays constant throughout
      // (interpolateNode's "path" case lerps startAngle/endAngle directly
      // once both endpoints carry `arc`, rebuilding `d` every frame — see
      // `ArcGeometry`). Falls back to the old scale-to-a-point behavior
      // (mirrors how a plain circle collapses to r: 0) for a Pie-tagged
      // path with no `arc` params.
      if (node.shapeType === "Pie") {
        const f = node as PathNode;
        if (f.arc) {
          const mid = (f.arc.startAngle + f.arc.endAngle) / 2;
          const targetAngle = mid > Math.PI ? FULL_TURN : 0;
          const collapsed: ArcGeometry = {...f.arc, startAngle: targetAngle, endAngle: targetAngle};
          return {...node, paint, arc: collapsed, d: arcPath(collapsed)};
        }
        const own = pathBounds(node.d);
        return {...node, paint, transform: fitTransform(own, own, 0)};
      }
      return {...node, paint} as SceneNode;
    case "group":
      return {...(node as GroupNode), paint};
    default:
      return {...node, paint} as SceneNode;
  }
}

/**
    Whether a node is eligible to collapse to/from an explicit
    `DrawOptions.enterFrom`/`exitTo` box (the drill-morph transition) instead
    of its own degenerate center. True for chart-body content — a plain
    rect/circle/area with no `interactionGroup` tag, a `path` node
    specifically stamped `shapeType: "Area"` (StackedArea/AreaPlot's band) or
    `shapeType: "Pie"` (Pie/Donut's wedge), or a `text` node stamped
    `shapeType: "Label"` (a chart-body shape's own label, e.g. Treemap/Pie's
    label text — NOT title/subtitle/legend text, which is never stamped this
    way) — and false for chrome (legend, timeline, back button — all stamped
    by `Viz.toScene`) and for any other node type/shapeType with no
    rect-collapse mapping (an untagged/unlabeled text node, a plain/Link
    path, line, group, image).
    @param node The node to test.
*/
export function isFlipEligible(node: SceneNode): boolean {
  return (
    node.interactionGroup == null &&
    (node.type === "rect" || node.type === "circle" || node.type === "area" ||
      (node.type === "path" && (node.shapeType === "Area" || node.shapeType === "Pie")) ||
      (node.type === "text" && node.shapeType === "Label"))
  );
}

/**
    Produces the start form of an entering node (or end form of an exiting
    node) for the drill-morph transition: the node's paint fades from/to 0
    opacity, same as {@link collapse}, but its geometry collapses to/from an
    explicit external box instead of its own center — e.g. a Treemap cell
    entering from the clicked parent's on-screen rect, or a Bar exiting into
    the reappearing parent's rect. Only called on nodes {@link isFlipEligible}
    has already approved.
    @param node The node to collapse.
    @param rect The external box to collapse to/from.
    @param body The full layout's reference box (e.g. `viz._bodyRect`, in the
        same coordinate frame `node`'s own geometry is expressed in), if the
        caller has one. When present, Treemap cells (`rect`, not `shapeType:
        "Bar"`), Pack circles (`shapeType: "Pack"`), and Pie/Donut wedges
        (`shapeType: "Pie"`) map their position PROPORTIONALLY within `body`
        into `rect`, instead of each one individually becoming/filling
        `rect` — so the whole set of siblings scales/moves together as one
        unit (reading as "the clicked parent's rect zooming into the full
        layout"), preserving their relative positions and never overlapping.
        Absent, or for any other eligible node, falls back to the plain
        "become/fill `rect` on its own" behavior.
    @param entering True when collapsing an ENTERING node's start (not an
        exiting node's end). Two effects: (1) the node starts at its own
        real (target) opacity rather than fading up from 0 — growing INTO
        the clicked parent's rect already reads as "arriving," so a
        simultaneous opacity fade is redundant, and on a Treemap/Pie in
        particular it visibly dims the whole transition; an exit still
        fades out on top of its geometric collapse, since disappearing
        needs the fade to read as "gone." (2) gates `node.flipFromArc` (see
        `PathNode.flipFromArc`): it's a chart-computed *enter* start, baked
        onto the node once at emit time, so a node that previously entered
        this way and is later collapsed as an EXIT (e.g. a child shrinking
        back into a reappearing parent on Back) must ignore its own stale
        `flipFromArc` rather than reapply it to a different transition.
*/
export function collapseTo(
  node: SceneNode,
  rect: TransitionRect,
  body?: TransitionRect,
  entering?: boolean,
): SceneNode {
  const paint: Paint = {...node.paint, opacity: entering ? (node.paint?.opacity ?? 1) : 0};
  switch (node.type) {
    case "rect": {
      // Bars keep the plain "become the box" behavior — an axis-based
      // layout has no "whole layout, shrunk into a box" reading the way a
      // space-filling Treemap does.
      if (body && node.shapeType !== "Bar")
        return {...node, paint, ...proportionalRect(node, body, rect)};
      return {...node, paint, x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    }
    case "circle": {
      // A Plot scatter point (shapeType "Circle") keeps the plain "become
      // the box" behavior — it isn't part of a space-subdividing layout.
      if (body && node.shapeType === "Pack")
        return {...node, paint, ...proportionalCircle(node, body, rect)};
      const r = Math.min(rect.width, rect.height) / 2;
      return {...node, paint, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2, r};
    }
    case "area": {
      // Remap topline/baseline into a flat line down the rect's vertical
      // center, spread proportionally across the rect's x-span.
      const f = node as AreaNode;
      const n = f.topline.length;
      const midY = rect.y + rect.height / 2;
      const line = (pts: [number, number][]): [number, number][] =>
        pts.map((_, i): [number, number] => [
          rect.x + (n > 1 ? (i / (n - 1)) * rect.width : rect.width / 2),
          midY,
        ]);
      return {...node, paint, topline: line(f.topline), baseline: line(f.baseline)};
    }
    case "path":
      // Only reached for shapeType "Area"/"Pie" — isFlipEligible excludes
      // every other path (a plain path, or a Sankey Link) from this call.
      // A wedge scales+translates its real shape into the box (preserving
      // its silhouette, so it visibly "is" the clicked parent at full size
      // instead of a degenerate sliver); an Area band still flattens, since
      // a partial-height band reads naturally as "growing up from the rect".
      if (node.shapeType === "Pie") {
        // The chart layer (pieEmit) already built this wedge's real polar
        // parameters confined to the clicked parent's angular range, at
        // full final radius. Stamping them as `arc` (alongside a `d` built
        // from them, for the very first commit before any transition takes
        // over) lets interpolateNode's "path" case interpolate the NUMBERS
        // — angle by angle, exact radius throughout — instead of morphing
        // a `d` string, so entering wedges read as arcs growing their
        // angular span, not the whole pie scaling up from a miniature. The
        // render layer has no arc generator of its own, so it can't
        // reconstruct this from `d`/a bounding box.
        if (entering && node.flipFromArc)
          return {...node, paint, transform: undefined, arc: node.flipFromArc, d: arcPath(node.flipFromArc)};
        // The reappearing reunion wedge (drill-UP): the chart layer already
        // built a full-circle start at this wedge's own real radii — it
        // "instantly" shows the full layout its children currently occupy
        // (a filled-in ring/disc), then animates the angles down to its own
        // real slice, instead of the generic scale+translate fallback below
        // (which would read as an awkward resize/reposition rather than a
        // clean angular sweep).
        if (entering && node.reunionFromArc)
          return {...node, paint, transform: undefined, arc: node.reunionFromArc, d: arcPath(node.reunionFromArc)};
        // Fallback (neither flipFromArc nor reunionFromArc — a plain, non-
        // morph exit, which isn't re-emitted so has no fresh arc generator
        // to call): the WHOLE pie (body), not this wedge's own bbox, is the
        // source — every wedge then shares the same scale+translate, so the
        // pie scales as one rigid, non-overlapping unit (a miniature of the
        // full pie) instead of each wedge individually filling rect.
        const source = body ?? pathBounds(node.d);
        const scale = Math.min(rect.width / (source.width || 1e-6), rect.height / (source.height || 1e-6));
        return {...node, paint, transform: fitTransform(source, rect, scale)};
      }
      return {...node, paint, d: flatAreaPath(rect)};
    case "text": {
      // Only reached for shapeType "Label" — isFlipEligible excludes every
      // other text node (title/subtitle/legend/axis, none of which are
      // stamped this way). Font size/rotation are left alone in every case
      // below; only position (`transform.x/y` — TextBox.toScene() always
      // parks the layout at x:0,y:0 and carries the real position on
      // `transform`) changes.
      const f = node as TextNode;
      const tr = f.transform ?? {};
      // The chart already computed this label's start the same geometric
      // way its own shape is remapped (e.g. a Pie wedge's angular
      // confinement) — use it verbatim instead of the generic Cartesian
      // fallback below, which has no notion of e.g. a circular layout.
      if (entering && f.flipFromTransform)
        return {...node, paint, transform: {...tr, x: f.flipFromTransform.x, y: f.flipFromTransform.y}};
      // Generic fallback: move the label's own position proportionally
      // within `body` into `rect`, same as a Treemap cell's own geometry —
      // so a label reads as moving along with its shape instead of fading
      // in in place.
      const point = body
        ? proportionalPoint(tr.x ?? 0, tr.y ?? 0, body, rect)
        : {x: rect.x + rect.width / 2, y: rect.y + rect.height / 2};
      return {...node, paint, transform: {...tr, x: point.x, y: point.y}};
    }
    default:
      return node;
  }
}
