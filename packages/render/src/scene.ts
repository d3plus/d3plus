import type {DataPoint} from "@d3plus/data";

/**
    @type CurveName
    The name of a curve interpolator (e.g. "linear", "catmullRom", "stepAfter").
    A backend resolves the name to a concrete d3-shape curve factory at draw time,
    so the scene stays serializable and free of function references.
*/
export type CurveName = string;

/**
    @interface Paint
    A fully-resolved paint description. No accessor functions survive into a scene —
    every value here is a concrete primitive computed during scene construction,
    which is what lets a backend paint without re-running data accessors.
*/
export interface Paint {
  /**
      Resolved color, or a serializable special-fill token a backend
      materializes: `pattern:<json>` for a textures.js texture, or
      `gradient:<json>` for a {@link SceneGradient}. Tokens keep the scene
      free of `url(#…)` references that only resolve against one SVG document.
  */
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  /** Normalized to numbers (the SVG Shape stores this as a string). */
  strokeDasharray?: number[];
  strokeLinecap?: "butt" | "round" | "square";
  vectorEffect?: "none" | "non-scaling-stroke";
  shapeRendering?: string;
  /** Node-level alpha. Hover/active dimming is expressed here, not via DOM surgery. */
  opacity?: number;
}

/**
    @interface Transform
    A 2D affine transform, replacing the SVG transform string that
    Shape._applyTransform builds today. Uniform scale only, matching Shape._scale.
*/
export interface Transform {
  x?: number;
  y?: number;
  scale?: number;
  /** Rotation in degrees. */
  rotate?: number;
  rotateAnchor?: [number, number];
}

/**
    @interface SceneGradient
    A resolved, serializable gradient fill, encoded into `Paint.fill` as the
    token `gradient:<json>` (the same scheme as the `pattern:<json>` texture
    token). Coordinates are in objectBoundingBox units (0–1), so a backend
    scales the gradient to the painted node's bounds: the SVG backend maps
    them straight onto a `<linearGradient>` (whose default `gradientUnits` is
    already objectBoundingBox); the Canvas backend multiplies them by the
    node's bounding box to build a `CanvasGradient`.
*/
export interface SceneGradient {
  type: "linear";
  /**
      Coordinate space for `from`/`to`. Default (omitted) is objectBoundingBox
      (0–1, scaled to the node's bounds). `"userSpaceOnUse"` treats them as
      absolute scene coordinates — used by motion trails so the gradient stays
      put as the path's bounding box grows, instead of remapping (and snapping).
  */
  units?: "userSpaceOnUse";
  /** Start point — objectBoundingBox units (0–1), or absolute for userSpaceOnUse. */
  from: [number, number];
  /** End point — objectBoundingBox units (0–1), or absolute for userSpaceOnUse. */
  to: [number, number];
  /** Color stops; `offset` in 0–1, sorted ascending. */
  stops: {offset: number; color: string}[];
}

/** Encodes a {@link SceneGradient} as a `gradient:<json>` `Paint.fill` token. */
export function gradientToken(g: SceneGradient): string {
  return `gradient:${JSON.stringify(g)}`;
}

/** Decodes a `gradient:<json>` token, or returns null if `fill` is not one. */
export function parseGradient(fill?: string): SceneGradient | null {
  if (!fill || !fill.startsWith("gradient:")) return null;
  try {
    return JSON.parse(fill.slice("gradient:".length)) as SceneGradient;
  } catch {
    return null;
  }
}

/**
    @type FontStyle
    The slant of a font face.
*/
export type FontStyle = "normal" | "italic";

/**
    @interface FontSpec
    Resolved font metrics for a TextNode. Text is laid out (wrapped, positioned)
    during scene construction, so backends only paint pre-computed lines.
*/
export interface FontSpec {
  family?: string;
  size?: number;
  weight?: number | string;
  style?: FontStyle;
  anchor?: "start" | "middle" | "end";
  baseline?: "alphabetic" | "middle" | "hanging";
  /** Writing direction; SVG maps this to the `dir` attribute. */
  dir?: "ltr" | "rtl";
}

/**
    @interface TextRun
    An inline span within a TextLine with optional per-run style overrides
    (e.g. bold/italic produced by HTML markup in TextBox). Backends emit
    nested <tspan>s for SVG or weight-aware paints for Canvas.
*/
export interface TextRun {
  text: string;
  style?: {
    weight?: number | string;
    style?: FontStyle;
  };
}

/**
    @type ClipShape
    A clipping region for a GroupNode. SVG maps this to a <clipPath>;
    Canvas maps it to ctx.clip().
*/
export type ClipShape =
  | {type: "rect"; x: number; y: number; width: number; height: number}
  | {type: "path"; d: string};

/**
    @type HitShape
    An optional explicit hit-test geometry that overrides a node's drawn geometry,
    replacing the invisible hit-area rects/paths used by the SVG Shape today.
*/
export type HitShape =
  | {type: "rect"; x: number; y: number; width: number; height: number}
  | {type: "circle"; cx: number; cy: number; r: number}
  | {type: "path"; d: string};

/**
    @interface AriaSpec
    Accessibility metadata. The SVG backend applies these as role/aria-label
    attributes natively; the Canvas backend mirrors them in a shadow tree.
*/
export interface AriaSpec {
  role?: string;
  label?: string;
  hidden?: boolean;
}

/**
    @interface NodeBase
    Fields shared by every scene node.
*/
export interface NodeBase {
  /** Stable identity for enter/update/exit diffing and tween pairing (= Shape._id). */
  key: string | number;
  /**
      An explicit DOM id, emitted as the SVG element's `id` attribute. Distinct
      from `key` (a renderer-only identity for diffing) so callers can address a
      mounted element from outside the scene graph.
  */
  id?: string;
  /** The original (unwrapped) datum, carried for interaction callbacks — not for drawing. */
  datum?: DataPoint;
  index?: number;
  /**
      The emitting shape's type (`Shape._name`: "Bar", "Line", "Circle", …),
      carried so pointer handlers can route shape-class-scoped events
      (`"click.Bar"`) without reconstructing the source shape. Interaction
      metadata only — backends never read it for drawing.
  */
  shapeType?: string;
  /**
      The chart-level interactive component this node belongs to ("legend"),
      stamped by Viz.toScene so the pointer bridge can route component-scoped
      handlers on every backend — including Canvas, where there is no per-shape
      DOM to walk. Interaction metadata only — backends never read it for drawing.
  */
  interactionGroup?: string;
  paint?: Paint;
  transform?: Transform;
  /** When false, the node is ignored by hit-testing (= SVG pointer-events: none). */
  interactive?: boolean;
  hit?: HitShape;
  aria?: AriaSpec;
  /** Z-order within the parent group; stable sort key replacing DOM append order. */
  z?: number;
  /**
      Hint for the animate layer to draw a motion trail (a tapering cone that
      fades from the mark's color at its current position to transparent at its
      previous one) as it moves between frames — e.g. points sliding
      year-to-year on Timeline play. Honored for point (circle) and rect marks.
  */
  trail?: boolean;
  /**
      How many past moves the trail keeps visible (a persistent trail). `0`/unset
      is the default ephemeral trail (only the current move, fading out on
      arrival). A number keeps that many step-segments, fading older ones to
      transparent; `true` keeps a long slowly-fading tail. The animate layer
      chains each segment's cone geometry and gradient so the path curves and
      fades continuously through the mark's history.
  */
  trailPersist?: number | boolean;
  /**
      Explicit bounding box for an objectBoundingBox gradient fill on a node the
      Canvas backend can't measure geometrically (a `path`). The SVG backend
      derives the box from the element automatically; Canvas reads this instead
      of parsing `d`. Used by motion-trail cones.
  */
  gradientBounds?: {x: number; y: number; w: number; h: number};
}

export interface RectNode extends NodeBase {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  ry?: number;
}

export interface CircleNode extends NodeBase {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface LineNode extends NodeBase {
  type: "line";
  points: [number, number][];
  curve?: CurveName;
}

export interface AreaNode extends NodeBase {
  type: "area";
  topline: [number, number][];
  baseline: [number, number][];
  curve?: CurveName;
}

/** Pre-serialized SVG path data (the Path shape, Geomap, d3-geo output). */
export interface PathNode extends NodeBase {
  type: "path";
  d: string;
}

export interface ImageNode extends NodeBase {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
  /**
      SVG `preserveAspectRatio` value controlling how the image fits its
      `width`×`height` box. Passed straight through by the SVG backend; the
      Canvas backend honors the `meet`/`slice`/`none` mode (slice = CSS
      `cover`, meet = `contain`, none = stretch). Omitted = the SVG default
      (`xMidYMid meet`, i.e. contain).
  */
  preserveAspectRatio?: string;
}

/** A single laid-out line of text within a TextNode. */
export interface TextLine {
  text: string;
  x: number;
  y: number;
  width: number;
  /** Optional inline runs with style overrides (bold/italic from HTML markup). */
  runs?: TextRun[];
}

export interface TextNode extends NodeBase {
  type: "text";
  x: number;
  y: number;
  /** Pre-wrapped, pre-positioned lines — backends do not re-measure or re-wrap. */
  lines: TextLine[];
  font: FontSpec;
  /**
      Layout box width/height (the wrap box the lines were positioned in). Used
      only as a fallback to center a font-size transition's scale when a node has
      no laid-out lines.
  */
  width?: number;
  height?: number;
}

/**
    The center of a text node's visible glyph box in its local coordinate space,
    derived from the laid-out lines. Unlike the layout box center
    (`[width/2, height/2]`), this reflects the actual text-anchor and vertical
    alignment — `start`/`end` text sits to one side of its box, `top`-aligned
    text near the top. A font-size transition glides this *visual* center so the
    label stays put even when the anchor/alignment flips (e.g. Rings' ring →
    center re-focus, where `text-anchor` changes start/end → middle).
*/
export function textVisualCenter(node: TextNode): [number, number] {
  const lines = node.lines;
  const fs = node.font?.size ?? 0;
  if (!lines || !lines.length)
    return [(node.width ?? 0) / 2, (node.height ?? 0) / 2];
  const anchor = node.font?.anchor;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ln of lines) {
    const w = ln.width || 0;
    const left = anchor === "middle" ? ln.x - w / 2 : anchor === "end" ? ln.x - w : ln.x;
    if (left < minX) minX = left;
    if (left + w > maxX) maxX = left + w;
    if (ln.y < minY) minY = ln.y;
    if (ln.y > maxY) maxY = ln.y;
  }
  // `y` is a baseline; glyphs extend ~0.8em above and ~0.2em below it, so the
  // optical mid-line sits ~0.3em above the baseline midpoint.
  return [(minX + maxX) / 2, (minY + maxY) / 2 - fs * 0.3];
}

/** A transform/clip container; mirrors the nested <g> structure of the SVG output. */
export interface GroupNode extends NodeBase {
  type: "group";
  children: SceneNode[];
  clip?: ClipShape;
}

/**
    Embedded HTML at an absolute pixel position over the scene. The renderer
    mounts the HTML in a sibling `<div>` (NOT inside the SVG) positioned via
    CSS. Backends that can't host DOM (pure-Canvas-export, server-side
    rendering) skip these nodes — chart logic that depends on HTML overlays
    (zoom controls, attribution links, the Tooltip portal) must degrade
    gracefully when picked up by a non-DOM backend.

    The `html` field is rendered as HTML (innerHTML). Callers that need
    user-supplied text MUST sanitize before assigning.

    Serializability note: `onMount` is the documented escape from the
    "scene is pure data" principle. Pure scene types use no functions;
    HtmlOverlay is the explicit interactive surface and accepts a callback
    for post-mount event wiring (e.g. zoom control buttons). Renderers call
    it once after the host div is first appended, and again on each update
    so consumers can re-bind handlers if they replace innerHTML. Consumers
    are responsible for idempotent wiring (remove old listeners first).
*/
export interface HtmlOverlayNode extends NodeBase {
  type: "htmlOverlay";
  /** Top-left x position in scene coordinates. */
  x: number;
  /** Top-left y position in scene coordinates. */
  y: number;
  /** Optional explicit width (defaults to content-driven). */
  width?: number;
  /** Optional explicit height (defaults to content-driven). */
  height?: number;
  /** Raw HTML (innerHTML) for the overlay. Caller is responsible for sanitization. */
  html: string;
  /** Optional CSS class names applied to the host <div>. */
  className?: string;
  /** Optional inline-style key/value record applied to the host <div>. */
  style?: Record<string, string | number>;
  /**
      Declarative event wiring — a record of CSS-selector → event-name →
      handler. The renderer attaches one listener per (selector, event)
      pair and dispatches by `event.target.closest(selector)` matching.
      Prefer this over `onMount` for click/hover/keyboard wiring: the
      declarative form is serializable, survives scene snapshots, and
      keeps closures off the scene primitive.

      Example:
        events: {
          ".zoom-in": {click: e => viz.zoomIn()},
          ".zoom-out": {click: e => viz.zoomOut()},
        }
  */
  events?: Record<
    string,
    Partial<Record<string, (e: Event) => void>>
  >;
  /**
      Optional callback fired ONCE after the overlay's host `<div>` is
      first created — AFTER `innerHTML` / `style` / `dimensions` are
      written so the consumer can `host.querySelector(...)` inside the
      callback. Prefer `events` over `onMount` when possible; this is the
      escape hatch for non-event setup (e.g. instantiating a third-party
      widget on the host element).
  */
  onMount?: (el: HTMLDivElement) => void;

  /**
      Optional callback fired on EVERY draw (including the first). Mirror
      of `onMount` for state that must reflect each render's data —
      typically reading `node.html` is enough and you don't need this.
      Use when listeners must rebind because their closures captured
      stale-by-design state.
  */
  onUpdate?: (el: HTMLDivElement) => void;
}

/**
    @type SceneNode
    The discriminated union of every drawable primitive. Chart logic emits these;
    a Renderer backend consumes them. Contains only resolved values — no accessors,
    no DOM references, no closures — so a scene is serializable and memoizable.
*/
export type SceneNode =
  | RectNode
  | CircleNode
  | LineNode
  | AreaNode
  | PathNode
  | ImageNode
  | TextNode
  | GroupNode
  | HtmlOverlayNode;

/**
    @interface Scene
    A complete, backend-agnostic description of one frame of a visualization.
*/
export interface Scene {
  root: GroupNode;
  width: number;
  height: number;
  meta?: {
    background?: string;
    /** Device pixel ratio hint for HiDPI canvas rendering. */
    pixelRatio?: number;
  };
}
