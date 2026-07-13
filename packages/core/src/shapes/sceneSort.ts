import type {DataPoint} from "@d3plus/data";
import {largestRect, path2polygon, pathBounds} from "@d3plus/math";
import type {ClipShape, GroupNode, ImageNode, SceneNode, Transform} from "@d3plus/render";

/** How a backgroundImage fits its shape: `cover` fills the bounding box (cropping
    the overflow, clipped to the shape); `contain` fits the whole image, centered
    and fully visible, inside the shape's largest inscribed rectangle. */
export type BackgroundImageFit = "cover" | "contain";

/** A per-datum background image collected during `Shape.toScene`, before it is
    emitted as a clipped, transformed group by {@link emitBackgroundImages}. */
export interface BackgroundImageSpec {
  key: string | number;
  index: number;
  /** The source datum, carried so hover/active dimming treats the image like its
      shape (dims + raises together). */
  datum?: DataPoint;
  /** The image URL. */
  url: string;
  /** The image box in the shape's LOCAL coordinate space (pre-transform). */
  box: {x: number; y: number; width: number; height: number};
  /** The shape's own geometry as a clip region (local space), or undefined. */
  clip?: ClipShape;
  /** SVG `preserveAspectRatio` — `slice` (cover) or `meet` (contain). */
  preserveAspectRatio: string;
  /** The shape's resolved node opacity — the fade-in target on enter (default 1). */
  opacity?: number;
  /** The shape's transform, carried on the wrapping group. */
  transform?: Transform;
}

/** Follows the chart (`__d3plus__`) and shape (`__d3plusShape__`) wrappers back
    to the source datum, so a `sort` comparator sees the same object the other
    per-datum accessors receive. */
function unwrap(d: DataPoint): DataPoint {
  let cur = d;
  while (cur.__d3plus__ && cur.data) cur = cur.data as DataPoint;
  return cur.__d3plusShape__ ? (cur.data as DataPoint) : cur;
}

/**
    Ranks `data` by a `sort` layering comparator WITHOUT reordering it. Returns
    `rank[i]` = the paint position of datum `i` (lower = painted first = behind),
    which callers stamp onto each node's `z`; the render backends sort every
    group's children ascending by `z` (stably). Returns null when there is no
    comparator or nothing to reorder, so callers emit no `z` and the fast
    append-order path is preserved.
*/
export function sortRanks(
  data: DataPoint[],
  sortFn: ((a: DataPoint, b: DataPoint) => number) | null | undefined,
): number[] | null {
  if (!sortFn || data.length < 2) return null;
  const order = data.map((_d, i) => i);
  order.sort((ai, bi) => sortFn(unwrap(data[ai]), unwrap(data[bi])));
  const rank = new Array<number>(data.length);
  order.forEach((origIdx, pos) => (rank[origIdx] = pos));
  return rank;
}

/** Bounding box of a list of polygon points, or null when degenerate. */
function pointsBox(
  points: [number, number][],
): {x: number; y: number; width: number; height: number} | null {
  if (!points.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of points) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;
  return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}

/**
    The local-space bounding box `{x, y, width, height}` a backgroundImage fills,
    derived from a datum's scene geometry. Rect/Bar geometry is already a box;
    Circle is centered at (cx, cy) with radius r; a `path` uses the exact
    (DOM-free) bounds of its `d`; Area/Line fall back to their polygon `points`.
    Returns null when no finite extent can be determined.
*/
export function backgroundImageBox(
  g: Record<string, unknown>,
  points: [number, number][],
): {x: number; y: number; width: number; height: number} | null {
  if (typeof g.width === "number" && typeof g.height === "number") {
    const x = typeof g.x === "number" ? g.x : -g.width / 2;
    const y = typeof g.y === "number" ? g.y : -g.height / 2;
    return {x, y, width: g.width, height: g.height};
  }
  if (typeof g.r === "number") {
    const cx = typeof g.cx === "number" ? g.cx : 0;
    const cy = typeof g.cy === "number" ? g.cy : 0;
    return {x: cx - g.r, y: cy - g.r, width: g.r * 2, height: g.r * 2};
  }
  if (typeof g.d === "string") {
    const b = pathBounds(g.d);
    return b.width > 0 && b.height > 0 ? b : null;
  }
  return pointsBox(points);
}

/** Rounded-rectangle path `d` (falls back to a plain rect when radii are 0). */
function roundedRectPath(
  x: number, y: number, w: number, h: number, rx: number, ry: number,
): string {
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);
  return (
    `M${x + rx},${y}h${w - 2 * rx}a${rx},${ry} 0 0 1 ${rx},${ry}` +
    `v${h - 2 * ry}a${rx},${ry} 0 0 1 ${-rx},${ry}h${-(w - 2 * rx)}` +
    `a${rx},${ry} 0 0 1 ${-rx},${-ry}v${-(h - 2 * ry)}a${rx},${ry} 0 0 1 ${rx},${-ry}Z`
  );
}

/**
    The shape's own geometry expressed as a clip region in its LOCAL coordinate
    space, so a background image can be clipped to the shape itself (a Path image
    is clipped to the path, a Circle image to the circle, etc.). Returns
    undefined when the geometry has no usable outline.
*/
export function backgroundImageClip(
  g: Record<string, unknown>,
  points: [number, number][],
): ClipShape | undefined {
  if (typeof g.d === "string") return {type: "path", d: g.d};
  if (typeof g.width === "number" && typeof g.height === "number") {
    const x = typeof g.x === "number" ? g.x : -g.width / 2;
    const y = typeof g.y === "number" ? g.y : -g.height / 2;
    const rx = typeof g.rx === "number" ? g.rx : 0;
    const ry = typeof g.ry === "number" ? g.ry : 0;
    return rx > 0 || ry > 0
      ? {type: "path", d: roundedRectPath(x, y, g.width, g.height, rx || ry, ry || rx)}
      : {type: "rect", x, y, width: g.width, height: g.height};
  }
  if (typeof g.r === "number") {
    const cx = typeof g.cx === "number" ? g.cx : 0;
    const cy = typeof g.cy === "number" ? g.cy : 0;
    const r = g.r;
    return {
      type: "path",
      d: `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`,
    };
  }
  if (points.length > 2) {
    const d = `M${points.map(([x, y]) => `${x},${y}`).join("L")}Z`;
    return {type: "path", d};
  }
  return undefined;
}

/** A polygon (local coords) approximating the shape outline, for `largestRect`. */
function shapePolygon(
  g: Record<string, unknown>,
  points: [number, number][],
): [number, number][] {
  if (typeof g.d === "string") return path2polygon(g.d);
  return points;
}

/**
    Resolves a backgroundImage's box + clip + `preserveAspectRatio` for a datum's
    geometry, honoring the fit mode:

    - `cover` — the image fills the shape's bounding box and is cropped
      (`xMidYMid slice`), clipped to the shape's own outline.
    - `contain` — the whole image is centered and fully visible inside the shape:
      it is fit (`xMidYMid meet`) into the shape's largest inscribed axis-aligned
      rectangle (a Rect uses itself; a Circle its inscribed square; a Path/Area
      uses `largestRect` of its polygon). No clip is needed since the box already
      sits inside the shape.

    Returns null when no usable box can be derived.
*/
export function backgroundImageLayout(
  g: Record<string, unknown>,
  points: [number, number][],
  fit: BackgroundImageFit,
): {
  box: {x: number; y: number; width: number; height: number};
  clip?: ClipShape;
  preserveAspectRatio: string;
} | null {
  if (fit !== "contain") {
    const box = backgroundImageBox(g, points);
    if (!box) return null;
    return {
      box,
      clip: backgroundImageClip(g, points),
      preserveAspectRatio: "xMidYMid slice",
    };
  }

  // contain: fit inside the largest inscribed rectangle, fully visible.
  let box: {x: number; y: number; width: number; height: number} | null = null;
  if (typeof g.width === "number" && typeof g.height === "number") {
    box = backgroundImageBox(g, points); // a rect contains itself
  } else if (typeof g.r === "number") {
    // Inscribed square of a circle: side = r·√2, centered on (cx, cy).
    const cx = typeof g.cx === "number" ? g.cx : 0;
    const cy = typeof g.cy === "number" ? g.cy : 0;
    const half = (g.r as number) / Math.SQRT2;
    box = {x: cx - half, y: cy - half, width: half * 2, height: half * 2};
  } else {
    const poly = shapePolygon(g, points);
    const r = poly.length > 2 ? largestRect(poly, {angle: 0}) : null;
    box = r
      ? {x: r.cx - r.width / 2, y: r.cy - r.height / 2, width: r.width, height: r.height}
      : backgroundImageBox(g, points);
  }
  return box ? {box, preserveAspectRatio: "xMidYMid meet"} : null;
}

/**
    Emits the per-datum background images collected during `Shape.toScene`. Each
    image is wrapped in its own group carrying the shape's datum + transform, so
    it is clipped to the shape's outline, positioned in local space, and dims/
    raises together with its shape on hover. The image is non-interactive (and
    keyed apart from the shape) so pointer events pass through to the shape below.
    When `rank` is set (a `sort` comparator is active) every group needs a `z`
    so the backend sort keeps images above the geometry in their own order.
*/
export function emitBackgroundImages(
  specs: BackgroundImageSpec[],
  rank: number[] | null,
  dataLen: number,
): SceneNode[] {
  return specs.map((spec, k) => {
    const image: ImageNode = {
      type: "image",
      // Keyed apart from the shape (which uses `spec.key`): sharing the key would
      // let this non-interactive image overwrite the shape in the hit-test index.
      key: `${spec.key}-bgimage-img`,
      x: spec.box.x,
      y: spec.box.y,
      width: spec.box.width,
      height: spec.box.height,
      href: spec.url,
      preserveAspectRatio: spec.preserveAspectRatio,
      // Decorative: pointer events fall through to the shape underneath.
      interactive: false,
    };
    const group: GroupNode = {
      type: "group",
      key: `${spec.key}-bgimage`,
      children: [image],
      // Carry the shape's datum/index so hover/active dimming treats the image
      // like its shape — dimming and hover-raising the two together (the group
      // is emitted after the geometry, so at equal `z` the image stays on top).
      datum: spec.datum,
      index: spec.index,
      interactive: false,
      // A group-level opacity gives the enter/exit animation a target to fade
      // to/from (matching the shape): the animate layer collapses it to 0 on
      // enter and eases up to this. It also cascades to the image, so hover
      // dimming applied here fades the picture with its shape.
      paint: {opacity: spec.opacity ?? 1},
      ...(spec.transform ? {transform: spec.transform} : {}),
      ...(spec.clip ? {clip: spec.clip} : {}),
      ...(rank ? {z: dataLen + k} : {}),
    };
    return group;
  });
}
