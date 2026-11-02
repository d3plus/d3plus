/**
    Drag-to-rotate for Geomap globes (projections that clip to a circle,
    such as `"geoOrthographic"`): a drag turns the globe under the pointer
    rather than panning the zoom transform, while the wheel, pinch, and zoom
    buttons still zoom. The rotation follows the pointer with versors
    (quaternions), so the place grabbed stays under the pointer however the
    globe is turned, without the gimbal flips of mapping the drag onto
    longitude and latitude. A drag that starts off the globe turns it by
    longitude and latitude instead; one dragged past the globe's edge keeps
    the grabbed place on the horizon.
*/

import type {ZoomTransform} from "d3-zoom";

import type {ZoomGesture, ZoomGestureEvent} from "../drawSteps/zoomGesture.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {clipsToCircle} from "./flowGeometry.js";
import type {LonLat, Point} from "./flowGeometry.js";

/** A rotation as d3-geo's `[lambda, phi, gamma]`, in degrees. */
export type Rotation = [number, number, number];
/** A unit quaternion `[w, x, y, z]`. */
export type Versor = [number, number, number, number];
type Vec3 = [number, number, number];

/** A projection that rotates and inverts, as d3-geo's do. */
export interface RotatingProjection {
  (p: LonLat): Point | null;
  rotate(): number[];
  rotate(r: number[]): RotatingProjection;
  invert?: (p: Point) => LonLat | null;
  scale(): number;
}

const radians = Math.PI / 180;
const degrees = 180 / Math.PI;
const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/** The unit quaternion for a rotation. */
export function versor([l, p, g]: number[]): Versor {
  const hl = (l * radians) / 2,
    hp = (p * radians) / 2,
    hg = ((g ?? 0) * radians) / 2;
  const sl = Math.sin(hl),
    cl = Math.cos(hl),
    sp = Math.sin(hp),
    cp = Math.cos(hp),
    sg = Math.sin(hg),
    cg = Math.cos(hg);
  return [
    cl * cp * cg + sl * sp * sg,
    sl * cp * cg - cl * sp * sg,
    cl * sp * cg + sl * cp * sg,
    cl * cp * sg - sl * sp * cg,
  ];
}

/** The rotation a unit quaternion stands for. */
export function versorRotation(q: Versor): Rotation {
  return [
    Math.atan2(
      2 * (q[0] * q[1] + q[2] * q[3]),
      1 - 2 * (q[1] ** 2 + q[2] ** 2),
    ) * degrees,
    Math.asin(clamp(2 * (q[0] * q[2] - q[3] * q[1]))) * degrees,
    Math.atan2(
      2 * (q[0] * q[3] + q[1] * q[2]),
      1 - 2 * (q[2] ** 2 + q[3] ** 2),
    ) * degrees,
  ];
}

/** A coordinate as a point on the unit sphere. */
export function cartesian([lon, lat]: LonLat): Vec3 {
  const l = lon * radians,
    p = lat * radians,
    cp = Math.cos(p);
  return [cp * Math.cos(l), cp * Math.sin(l), Math.sin(p)];
}

/** The quaternion turning the unit vector `a` onto `b`. */
export function versorDelta(a: Vec3, b: Vec3): Versor {
  const w: Vec3 = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const l = Math.hypot(...w);
  if (!l) return [1, 0, 0, 0];
  const t = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) / 2,
    s = Math.sin(t);
  return [Math.cos(t), (w[2] / l) * s, (-w[1] / l) * s, (w[0] / l) * s];
}

/** The product `a * b` of two quaternions. */
export function versorMultiply(a: Versor, b: Versor): Versor {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[1] * b[0] + a[0] * b[1] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ];
}

const finite = (p: LonLat | null | undefined): LonLat | null =>
  p && Number.isFinite(p[0]) && Number.isFinite(p[1]) ? p : null;

/**
    The place under a pixel, or null off the globe: d3-geo inverts a pixel
    past a globe's edge to the horizon, so the place must project back onto
    the pixel.
*/
function placeAt(projection: RotatingProjection, at: Point): LonLat | null {
  const place = finite(projection.invert?.(at));
  if (!place) return null;
  const back = projection(place);
  return back && Math.hypot(back[0] - at[0], back[1] - at[1]) < 0.5
    ? place
    : null;
}

/**
    The rotation that carries the place under `from` (with the globe turned
    to `start`) to the pixel `to`. Off the globe, where a pixel names no
    place, it turns the globe by longitude and latitude instead, a degree
    per the pixels a degree spans at the globe's center. Leaves the
    projection's rotation as it found it.
*/
export function dragRotation(
  projection: RotatingProjection,
  start: number[],
  from: Point,
  to: Point,
): Rotation {
  const current = projection.rotate();
  projection.rotate(start);
  const a = placeAt(projection, from);
  // Dragged past the edge, the grabbed place follows to the horizon.
  const b = a
    ? (placeAt(projection, to) ?? finite(projection.invert?.(to)))
    : null;
  projection.rotate(current);
  const [l, p, g = 0] = start;
  if (a && b)
    return versorRotation(
      versorMultiply(versor(start), versorDelta(cartesian(a), cartesian(b))),
    );
  const k = degrees / (projection.scale() || 1);
  return [
    l + (to[0] - from[0]) * k,
    Math.max(-90, Math.min(90, p - (to[1] - from[1]) * k)),
    g,
  ];
}

/** Where a pointer event is on `node`, for a mouse or a single touch. */
function pointerOn(event: Event, node: Element): Point | null {
  const touches = (event as TouchEvent).touches;
  const at =
    touches && touches.length
      ? touches[0]
      : (event as MouseEvent).clientX !== undefined
        ? (event as MouseEvent)
        : null;
  if (!at) return null;
  const rect = node.getBoundingClientRect();
  return [
    at.clientX - rect.left - (node.clientLeft || 0),
    at.clientY - rect.top - (node.clientTop || 0),
  ];
}

/**
    A point on the zoom surface in the map's projected pixels: the zoom
    `transform` undone, then the chart's own offset.
*/
export function surfaceToMap(
  point: Point,
  transform: Pick<ZoomTransform, "x" | "y" | "k">,
  offset: {x?: number; y?: number} = {},
): Point {
  return [
    (point[0] - transform.x) / transform.k - (offset.x ?? 0),
    (point[1] - transform.y) / transform.k - (offset.y ?? 0),
  ];
}

/** Whether `viz` is a globe drag can turn now. */
export function globeRotates(viz: VizInstance): boolean {
  return (
    clipsToCircle(viz.schema.projection) &&
    !!viz.schema.zoom &&
    !viz._ssr &&
    !viz._facetPanels &&
    !viz._facetStep
  );
}

/**
    The rotation a globe returns to, and fits its scale at: the configured
    `projectionRotate`, else the one the projection had before it was first
    dragged. Undefined for a globe that hasn't been turned.
*/
export function globeHome(viz: VizInstance): number[] | undefined {
  const configured = viz.schema.projectionRotate as number[] | undefined;
  if (Array.isArray(configured)) return configured;
  const home = viz._globeHome;
  return home && home.projection === viz.schema.projection
    ? home.rotate
    : undefined;
}

/** Whether a gesture event comes from a press that can drag. */
const isPress = (event: Event | null | undefined): event is Event =>
  !!event &&
  (event.type === "mousedown" ||
    event.type === "pointerdown" ||
    (event.type === "touchstart" &&
      ((event as TouchEvent).touches?.length ?? 0) === 1));

/**
    Installs the globe drag on a Geomap: `viz._zoomGesture`, which the zoom
    behavior consults on each gesture, rotating the projection on a drag
    and re-laying the map out (with `relayout`) once per animation frame.
    The zoom controls' reset turns the globe back to `globeHome`.
    @param relayout Re-runs the map's layout and emit for the current projection.
*/
export function installGlobeRotation(
  viz: VizInstance,
  relayout: () => void,
): void {
  let drag: {
    t0: ZoomTransform;
    r0: number[];
    p0: Point;
    to?: Point;
    frame?: number;
  } | null = null;
  const surface = (): Element | null =>
    (viz._zoomEventTarget || viz._container)?.node() ?? null;
  const paint = () => {
    if (!drag || !drag.to) return;
    drag.frame = undefined;
    const projection = viz.schema.projection as RotatingProjection;
    projection.rotate(dragRotation(projection, drag.r0, drag.p0, drag.to));
    relayout();
    viz._drawSceneToTarget?.(0);
  };
  const finish = () => {
    if (!drag) return;
    if (drag.frame !== undefined) cancelAnimationFrame(drag.frame);
    paint();
    drag = null;
    viz._globeDragging = false;
  };
  const gesture: ZoomGesture = {
    start(event: ZoomGestureEvent) {
      drag = null;
      const node = surface();
      if (!node || !globeRotates(viz) || !isPress(event.sourceEvent)) return;
      const at = pointerOn(event.sourceEvent, node);
      if (!at) return;
      const projection = viz.schema.projection as RotatingProjection;
      if (!globeHome(viz))
        viz._globeHome = {projection, rotate: projection.rotate()};
      drag = {
        t0: event.transform,
        r0: projection.rotate(),
        p0: surfaceToMap(at, event.transform, viz._chartTransform),
      };
    },
    zoom(event: ZoomGestureEvent) {
      if (!drag) return false;
      const source = event.sourceEvent;
      const node = surface();
      // A second finger makes it a pinch, which zooms.
      if (
        !source ||
        !node ||
        source.type === "wheel" ||
        ((source as TouchEvent).touches?.length ?? 0) > 1
      ) {
        finish();
        return false;
      }
      // Hold the zoom transform where the drag found it.
      (viz._zoomEventTarget || viz._container)!.property("__zoom", drag.t0);
      const at = pointerOn(source, node);
      if (!at) return true;
      viz._globeDragging = true;
      drag.to = surfaceToMap(at, drag.t0, viz._chartTransform);
      if (typeof requestAnimationFrame !== "function") paint();
      else if (drag.frame === undefined)
        drag.frame = requestAnimationFrame(paint);
      return true;
    },
    end() {
      finish();
    },
    reset() {
      if (!globeRotates(viz)) return;
      const home = globeHome(viz);
      if (!home) return;
      (viz.schema.projection as RotatingProjection).rotate(home);
      relayout();
    },
  };
  viz._zoomGesture = gesture;
}
