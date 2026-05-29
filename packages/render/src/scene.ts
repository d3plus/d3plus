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
  /** Resolved color, or "url(#…)" / "pattern:<key>" for textures. */
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
  paint?: Paint;
  transform?: Transform;
  /** When false, the node is ignored by hit-testing (= SVG pointer-events: none). */
  interactive?: boolean;
  hit?: HitShape;
  aria?: AriaSpec;
  /** Z-order within the parent group; stable sort key replacing DOM append order. */
  z?: number;
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
    "scene is pure data" RFC principle. Pure scene types use no functions;
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
      Optional callback fired ONCE after the overlay's host `<div>` is
      first created. Receives the host element so consumers can attach
      event listeners. Renderers track first-mount per `node.key` and
      skip subsequent calls — so a chart that re-renders 60 times/sec
      during a zoom drag doesn't re-execute setup work per frame.
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
