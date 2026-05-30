/**
    Per-shape config types.

    Every `Shape` subclass exposes a `.config(c)` method that accepts a
    plain object whose keys match the class's accessor methods. The
    interfaces below enumerate those keys + their types so users (and
    chart-internal code) get autocomplete + compile-time validation
    instead of `Record<string, unknown>` everywhere.

    Pattern:
      - `BaseShapeConfig` holds the ~40 keys every shape inherits from
        `Shape` (fill, stroke, opacity, hover, label, etc.).
      - Each shape adds its own keys via interface extension
        (RectConfig adds width/height; CircleConfig adds r; etc.).
      - The discriminated union `AnyShapeConfig` is what callers
        composing a transient config object can use.

    These types are **declarative** — they don't change runtime behavior.
    Existing chart code that passes `Record<string, unknown>` still
    works (TypeScript allows a Record where a Partial<Interface> is
    expected if the keys overlap). The win is types AT THE BOUNDARY
    for new code and editor autocomplete on existing call sites.

    @module
*/

import type {DataPoint} from "@d3plus/data";

import type {AccessorFn} from "../utils/index.js";

/**
    A value that can either be a function (called per-datum) or a literal
    that wraps as `constant(_)`. Mirrors the runtime "const" coerce.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConstOrAccessor<T = any> = T | AccessorFn;

/**
    A value that can be a function, a string key (wrapped in `accessor`),
    or a literal (wrapped in `constant`). Mirrors the "accessor" coerce.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StringOrAccessor<T = any> = T | string | AccessorFn;

/**
    Common props inherited from `Shape` — every shape subclass accepts
    these via `.config(...)` regardless of geometry.
*/
export interface BaseShapeConfig {
  /** Data array driving the shape. */
  data?: DataPoint[];

  /** Predicate or null marking which data points are currently active. */
  active?: ((d: DataPoint, i: number) => boolean) | null;
  /** Opacity applied to non-active data points (default ~0.25). */
  activeOpacity?: number;
  /** Style overrides for active data points. */
  activeStyle?: Record<string, unknown>;

  /** ARIA label per datum (accessibility). */
  ariaLabel?: ConstOrAccessor<string>;
  /** Optional background image per datum (url or accessor returning a url). */
  backgroundImage?: ConstOrAccessor<string>;

  /** Discrete-axis key ("x" | "y") for charts that flip layout per axis. */
  discrete?: "x" | "y";
  /** Animation duration in ms. */
  duration?: number;

  /** Fill color or accessor returning one. */
  fill?: ConstOrAccessor<string>;
  /** Fill opacity (0..1). */
  fillOpacity?: ConstOrAccessor<number>;

  /** Predicate or null marking which data points are currently hovered. */
  hover?: ((d: DataPoint, i: number) => boolean) | null;
  /** Opacity applied to non-hovered data points. */
  hoverOpacity?: number;
  /** Style overrides for hovered data points. */
  hoverStyle?: Record<string, unknown>;

  /** Hit-area shape: function returning bounds or static bounds. */
  hitArea?:
    | ((d: DataPoint, i: number, aes: unknown) => Record<string, unknown>)
    | Record<string, unknown>;

  /** Unique-id accessor per datum (used for keyed enter/update/exit). */
  id?: AccessorFn;
  /** Label text(s) per datum. False/undefined skips. */
  label?: ConstOrAccessor<string | string[] | false>;
  /** Label-bounds accessor (where to mount the label). */
  labelBounds?:
    | ((d: DataPoint, i: number, aes: unknown) => Record<string, unknown> | Record<string, unknown>[])
    | Record<string, unknown>;
  /** Label TextBox config (font, padding, etc.). */
  labelConfig?: Record<string, unknown>;

  /** Overall opacity (0..1). */
  opacity?: ConstOrAccessor<number>;
  /** SVG `pointer-events` attribute per datum. */
  pointerEvents?: ConstOrAccessor<string>;
  /** ARIA role per datum (accessibility). */
  role?: ConstOrAccessor<string>;

  /** Rotation in degrees per datum. */
  rotate?: ConstOrAccessor<number>;
  /** SVG `rx` (rect rounded-corner x) — applies to Rect/Bar. */
  rx?: ConstOrAccessor<number>;
  /** SVG `ry` (rect rounded-corner y) — applies to Rect/Bar. */
  ry?: ConstOrAccessor<number>;
  /** Scale factor (1 = identity). */
  scale?: ConstOrAccessor<number>;

  /** "full" runs the legacy DOM enter/update/exit; "compute" skips DOM. */
  renderMode?: "full" | "compute";
  /** Where to mount the shape's DOM (CSS selector, element, or null). */
  select?: string | HTMLElement | SVGElement | null;

  /** SVG `shape-rendering` attribute per datum. */
  shapeRendering?: ConstOrAccessor<string>;

  /** d3-style sort comparator. */
  sort?: ((a: DataPoint, b: DataPoint) => number) | null;

  /** Stroke color. */
  stroke?: ConstOrAccessor<string>;
  /** SVG `stroke-dasharray`. */
  strokeDasharray?: ConstOrAccessor<string>;
  /** SVG `stroke-linecap`. */
  strokeLinecap?: ConstOrAccessor<string>;
  /** SVG `stroke-opacity`. */
  strokeOpacity?: ConstOrAccessor<number>;
  /** Stroke width in pixels. */
  strokeWidth?: ConstOrAccessor<number>;

  /** SVG `text-anchor` for labels. */
  textAnchor?: ConstOrAccessor<string>;
  /** Texture (per textures.js) — name string or full config. */
  texture?: ConstOrAccessor<string | Record<string, unknown>>;
  /** Default texture config merged into the per-datum texture. */
  textureDefault?: Record<string, unknown>;

  /** SVG `vector-effect` (e.g. "non-scaling-stroke"). */
  vectorEffect?: ConstOrAccessor<string>;
  /** Label vertical-align ("top"/"middle"/"bottom"). */
  verticalAlign?: ConstOrAccessor<string>;

  /** X position. */
  x?: ConstOrAccessor<number>;
  /** Y position. */
  y?: ConstOrAccessor<number>;

  /** Event handlers (Object.<event, handler>). */
  on?: Record<string, (...args: unknown[]) => unknown>;

  [key: string]: unknown;
}

/** Rect-specific config (width + height on top of base). */
export interface RectConfig extends BaseShapeConfig {
  width?: ConstOrAccessor<number>;
  height?: ConstOrAccessor<number>;
}

/** Circle-specific config (radius). */
export interface CircleConfig extends BaseShapeConfig {
  r?: ConstOrAccessor<number>;
}

/** Line-specific config (curve + defined). */
export interface LineConfig extends BaseShapeConfig {
  curve?: ConstOrAccessor<string>;
  defined?: AccessorFn;
}

/** Area-specific config (curve, defined, dual-edge x/y). */
export interface AreaConfig extends BaseShapeConfig {
  curve?: ConstOrAccessor<string>;
  defined?: (d: DataPoint) => boolean;
  x0?: ConstOrAccessor<number>;
  x1?: ConstOrAccessor<number> | null;
  y0?: ConstOrAccessor<number>;
  y1?: ConstOrAccessor<number> | null;
}

/** Path-specific config (raw SVG path d string or generator). */
export interface PathConfig extends BaseShapeConfig {
  d?: ConstOrAccessor<string>;
}

/** Bar-specific config (Rect + start/end coords). */
export interface BarConfig extends RectConfig {
  x0?: ConstOrAccessor<number>;
  x1?: ConstOrAccessor<number> | null;
  y0?: ConstOrAccessor<number>;
  y1?: ConstOrAccessor<number> | null;
}

/** Image-specific config (url + dimensions). */
export interface ImageConfig {
  data?: DataPoint[];
  duration?: number;
  height?: ConstOrAccessor<number>;
  id?: AccessorFn;
  opacity?: ConstOrAccessor<number>;
  pointerEvents?: ConstOrAccessor<string>;
  select?: string | HTMLElement | SVGElement | null;
  /** URL accessor returning the image src. */
  url?: AccessorFn;
  width?: ConstOrAccessor<number>;
  x?: ConstOrAccessor<number>;
  y?: ConstOrAccessor<number>;
}

/** Box-specific config (whisker + median + outliers; subset of Shape). */
export interface BoxConfig {
  data?: DataPoint[];
  medianConfig?: Record<string, unknown>;
  /** Orientation: "vertical" or "horizontal". */
  orient?: ConstOrAccessor<string>;
  /** Outlier accessor (per-datum predicate). */
  outlier?: ConstOrAccessor<string>;
  outlierConfig?: Record<string, unknown>;
  rectConfig?: Record<string, unknown>;
  rectWidth?: ConstOrAccessor<number>;
  select?: string | HTMLElement | SVGElement | null;
  whiskerConfig?: Record<string, unknown>;
  /** Whisker mode: single mode string/number or [low, high] pair. */
  whiskerMode?: (string | number)[] | string | number;
  x?: ConstOrAccessor<number>;
  y?: ConstOrAccessor<number>;

  [key: string]: unknown;
}

/** Whisker-specific config. */
export interface WhiskerConfig {
  data?: DataPoint[];
  /** End-cap shape name (e.g. "Rect"). */
  endpoint?: ConstOrAccessor<string>;
  endpointConfig?: Record<string, unknown>;
  /** Whisker length in pixels. */
  length?: ConstOrAccessor<number>;
  lineConfig?: Record<string, unknown>;
  orient?: ConstOrAccessor<string>;
  select?: string | HTMLElement | SVGElement | null;
  x?: ConstOrAccessor<number>;
  y?: ConstOrAccessor<number>;

  [key: string]: unknown;
}

/**
    Union of every shape config — useful for code that composes
    transient configs at runtime without knowing the shape ahead of
    time (Plot's `shapeConfig`, axis decorators, etc.).
*/
export type AnyShapeConfig =
  | BaseShapeConfig
  | RectConfig
  | CircleConfig
  | LineConfig
  | AreaConfig
  | PathConfig
  | BarConfig
  | ImageConfig
  | BoxConfig
  | WhiskerConfig;
