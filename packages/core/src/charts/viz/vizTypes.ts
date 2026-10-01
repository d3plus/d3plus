/**
    `Viz` — the typed contract for the runtime Viz surface that v4's free
    functions (plotPaint, vizPreDrawPure, vizDrawPure, runVizPipeline,
    apply*Layout stages, FeatureModules) read and write.

    This replaces `viz: any` across the free-function surface. The
    interface enumerates ~140 fields the audit found across the runtime
    code paths, grouped by category. Each entry is the BEST-EFFORT type
    inferred from usage; fields that are deeply chart-specific or
    loosely-shaped use `any` rather than half-accurate narrowing.

    Compatibility:
      - The class hierarchy (Viz/Plot/BarChart/.../Pie/Tree) already has
        `[key: string]: any` index signatures. Casting `this as Viz` from
        inside a class method is a widening, not a narrowing — TypeScript
        accepts it.
      - Chart-specific extensions (TreeViz/PieViz/etc.) can extend this
        interface to add stash slots (`_treeCtx`, `_pieData`, …). Today
        the index signature on the chart classes covers those.

    @module
*/

import type {PlotZoomBase, ZoomState} from "../Plot/plotZoom.js";
import type {ZoomControlIconKey} from "../drawSteps/zoomControlsMarkup.js";
import type {ZoomTransform} from "d3-zoom";

import type {DataPoint} from "@d3plus/data";
import type {ClipShape, SceneNode, Transform, TransitionRect} from "@d3plus/render";

import type {
  Axis,
  ColorScale,
  Legend,
  Message,
  TextBox,
  Timeline,
  Tooltip,
} from "../../components/index.js";
import type Shape from "../../shapes/Shape.js";
import type {D3plusConfig, D3Scale} from "../../utils/index.js";
import type {PlotPaintContext} from "../features/plotPaint.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {ResolvedSpec} from "../pipeline/resolveSpec.js";

/** Margin object with all four sides. */
export interface Margin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Padding object with all four sides. */
export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** One entry on the drill-down history stack (`Viz._history`), pushed by a click.shape drill-down and popped by Back. */
export interface DrillDownHistoryEntry {
  depth: number;
  filter?: (d: DataPoint, i: number) => boolean;
  /** `groupBy[groupDepth]`'s value for the clicked node — identifies the reunion node the Back morph grows back into. */
  groupId?: unknown;
  /** The groupBy index `groupId` was read at (== `_drawDepth` when the node was clicked). */
  groupDepth?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
    D3-style selection — deliberately loose. d3-selection's element/datum
    generics are invariant, so a single typed alias can't accept every
    `select(...)` result the chart code assigns to `_select`/`_container`/etc.;
    the `any` methods + index signature are the escape hatch (same rationale as
    the per-class fluent-accessor index signatures).
*/
export type D3Selection = {
  node(): any;
  attr(name: string, ...args: any[]): any;
  style(name: string, ...args: any[]): any;
  selectAll(selector: string): any;
  select(selector: string | any): any;
  on(event: string, handler: any): any;
  call(...args: any[]): any;
  transition(...args: any[]): any;
  [key: string]: any;
};

/** A Renderer instance — loose to accept any backend (svg/canvas). */
export interface VizRenderer {
  kind: "svg" | "canvas";
  target(): {container: Element; width: number; height: number} | undefined;
  destroy(): void;
  drawScene(scene: any, opts?: any): any;
  toSVGString?(): string;
  toCanvas?(): HTMLCanvasElement;
  whenSettled?(): Promise<void>;
  [key: string]: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
    The structural contract free functions read/write on a chart instance.
    Class instances satisfy it via their `[key: string]: any` signature;
    chart-specific extensions (TreeViz, PieViz, etc.) add stash slots.
*/
export interface VizInstance {
  /**
      Post-coercion fluent storage. `any` is deliberate (see BaseClass.schema):
      accessor/const fields are stored as functions and called as such.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>;
  /** Chart-internal scratch (d3 layout instances, computed derived state). */
  ctx: Record<string, unknown>;

  /* 1. Dimensions & layout */
  _width: number;
  _height: number;
  _margin: Margin;
  _padding: Padding;

  /* 2. Data & filtering */
  _data: DataPoint[];
  _filteredData: DataPoint[];
  _formattedData?: DataPoint[];
  _legendData: DataPoint[];
  _hidden: (string | number)[];
  _solo: (string | number)[];
  _filter?: (d: DataPoint, i: number) => boolean;
  _timeFilter?: (d: DataPoint, i: number) => boolean;
  _noDataMessage?: false | string | ((config: VizInstance) => string);

  /* 3. Grouping & aggregation */
  _groupBy: ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[];
  _depth?: number;
  _drawDepth: number;
  _discrete?: "x" | "y";
  _aggs: Record<string, (leaves: DataPoint[]) => unknown>;

  /* 4. Accessors */
  _id: (d: DataPoint, i: number) => string | number;
  _ids: (d: DataPoint, i: number) => string[];
  _drawLabel: (d: DataPoint, i: number, depth?: number) => string;
  _x?: (d: DataPoint, i: number) => number | Date | string;
  _y?: (d: DataPoint, i: number) => number | Date | string;
  _x2?: (d: DataPoint, i: number) => number | Date | string;
  _y2?: (d: DataPoint, i: number) => number | Date | string;
  _shape: (d: DataPoint, i: number) => string;
  _size?: (d: DataPoint, i?: number) => number;
  _value?: (d: DataPoint, i: number) => number;
  _time?: (d: DataPoint, i: number) => string | number | Date;
  _sort?: ((a: DataPoint, b: DataPoint) => number) | null;
  _label?: (d: DataPoint, i: number) => string;
  _thresholdName?: (d: DataPoint, i: number) => string;
  _sum?: (d: DataPoint, i: number) => number;

  /* 5. Config slots */
  _xConfig?: Record<string, unknown>;
  _yConfig?: Record<string, unknown>;
  _x2Config?: Record<string, unknown>;
  _y2Config?: Record<string, unknown>;
  _backgroundConfig?: Record<string, unknown>;
  _legendConfig?: Record<string, unknown>;
  _colorScaleConfig?: Record<string, unknown>;
  _timelineConfig?: Record<string, unknown>;
  _backConfig?: Record<string, unknown>;
  _titleConfig?: Record<string, unknown>;
  _subtitleConfig?: Record<string, unknown>;
  _axisConfig?: Record<string, unknown>;

  /* 6. Scene & output */
  _chartScene?: SceneNode[];
  _chartTransform?: Transform;
  _chartClip?: ClipShape;
  _featurePanels?: SceneNode[];
  _shapes?: Shape[];
  _previousShapes?: string[];
  _previousAnnotations?: Record<string, string[]>;
  _zoomTransform?: Transform;
  /** Data-shape nodes the automatic `zoomMax` measures when they aren't `_chartScene`'s top level (Plot). */
  _zoomShapes?: SceneNode[];
  /** The unzoomed Plot draw an axis-rescaling zoom rescales from. */
  _plotZoomBase?: PlotZoomBase;
  /** Pending repaint that drops a Plot's zoom clip once an animated reset settles. */
  _plotUnclipTimer?: ReturnType<typeof setTimeout>;
  /**
      Chart-specific zoom: repaints for a transform and returns true, or
      returns false to fall back to picture zoom (Plot rescales its axes).
  */
  _zoomRescale?: (t: ZoomState, duration?: number) => boolean;
  /** Cleanup functions returned by `zoomControlIcons`' mount functions, keyed by button. */
  _zoomIconCleanup?: Partial<Record<ZoomControlIconKey, () => void>>;
  /** Cleanup function returned by an `attributionIcon` mount function. */
  _attributionIconCleanup?: () => void;

  /* 7. Lifecycle & rendering */
  _select?: D3Selection;
  _sceneTarget?: Element;
  _sceneRenderer?: VizRenderer;
  _duration: number;
  _renderer?: "svg" | "canvas";
  _renderMode?: "full" | "compute";
  _focus?: string | number | undefined;
  _active?: ((d: DataPoint, i?: number) => boolean) | false;
  _hover?: ((d: DataPoint, i?: number) => boolean) | false;
  /** True while the current hover came from a colorScale bucket swatch. */
  _hoverBucket?: boolean;
  _highlight?: ((d: DataPoint, i?: number) => boolean) | false;
  /** Whether the search control's input is currently open. */
  _searchOpen?: boolean;
  /** The search control's current (lowercased) search term. */
  _searchTerm?: string;
  /** The `_highlight` predicate saved when the search box opened, restored when it closes. */
  _searchPrevHighlight?: ((d: DataPoint, i?: number) => boolean) | false;
  /** 0-based index of the current match within `searchMatches(...)`, once Enter/Shift+Enter has stepped to one. */
  _searchMatchIndex?: number;
  _ordinalColorScale?: ((value: string) => string) | undefined;
  _hoverDatum?: DataPoint | null;
  /** Epoch ms until which an animated transition is in flight (pointer routing pauses). */
  _transitionEndsAt?: number;
  _userHover?: number;
  _userDuration?: number;
  _dataCutoff: number;
  _brushing?: boolean;
  /** Whether the table-view toggle is currently showing the data table instead of the chart. */
  _tableView?: boolean;
  /** The data table's current page (0-indexed), when `tableViewPageSize` paginates it. */
  _tableViewPage?: number;
  /** The data table's current sort column + direction, when the user has clicked a header. */
  _tableViewSort?: {column: string; direction: "asc" | "desc"};
  /** Which dataset the data table currently shows — `viz._data` (raw) once toggled, `viz._filteredData` (aggregate) by default. */
  _tableViewDataSource?: "raw" | "aggregate";
  /** Cached first-occurrence-index lookups (exact JSON match, and groupBy-key fallback) for restoring `.data()` insertion order to the aggregate view; invalidated by comparing against the raw array reference they were built from. */
  _tableViewGroupOrder?: {data: DataPoint[]; exact: Map<string, number>; group: Map<string, number>};
  /** Timeline brush selection (timeline feature). */
  _timelineSelection?: (Date | number)[] | false;
  /** The last drawn timeline value (ms), to detect multi-period trail jumps. */
  _trailSeq?: number;
  /** The user-set data, retained to detect changes across `.data()` calls. */
  _userData?: DataPoint[] | string;
  /** Drill-down history stack (back button). */
  _history?: DrillDownHistoryEntry[];
  /**
      The local, chart-family-defined "body rect" flip-morph fractions are
      measured against — e.g. Treemap/Pack's margin-adjusted chart area at
      local origin, or Plot's measured axis plot rect. Set by `runChartDraw`
      (via `ChartDefinition.chartBodyRect`) or by Plot's own paint pipeline.
  */
  _bodyRect?: {x: number; y: number; width: number; height: number};
  /**
      One-shot: the clicked node's rect, captured at click time and
      normalized as fractions of the *pre-click* `_bodyRect`, armed by
      `clickShape`. Resolved into `_resolvedEnterFrom` (against the *new*
      draw's `_bodyRect`) and cleared by `resolveDrillMorph`. Also carries:
      `key`, the clicked node's own scene key, resolved into
      `_resolvedInstantExitKey` so its own exit (now filtered out of the new
      scene) is removed instantly instead of animating on top of the
      children that replace it; and, when the clicked node carried them
      (currently only Pie/Donut wedges), `parentStartAngle`/`parentEndAngle`
      — its angular range, read by the next draw's `pieEmit` to build each
      entering child wedge's `flipFromArc` (a real arc confined within that
      range, at full radius) via the actual arc generator.
  */
  _pendingEnterOrigin?: {
    fx: number; fy: number; fw: number; fh: number;
    key?: string | number;
    parentStartAngle?: number;
    parentEndAngle?: number;
  };
  /**
      One-shot: the group id/depth being un-filtered by a Back click, armed by
      the two Back-click sites — plus the OLD (pre-render) `_bodyRect`,
      captured at the same moment, so the exiting siblings' own (frozen)
      geometry can be read as proportions of the frame they were actually
      laid out in. Resolved into `_resolvedExitTo`/`_resolvedExitToBody` (by
      finding the matching node in the *new* `_chartScene`) and cleared by
      `resolveDrillMorph`.
  */
  _pendingExitReunion?: {
    groupId: unknown;
    groupDepth: number;
    body?: {x: number; y: number; width: number; height: number};
  };
  /**
      The drill-down morph's resolved enter/exit boxes for the upcoming
      `drawScene` call, plus each one's "body" reference box (the full
      layout entering/exiting nodes' own geometry is proportional within —
      see `DrawOptions.enterFromBody`/`exitToBody`). Set by
      `resolveDrillMorph`, read and one-shot cleared by `_drawSceneToTarget`.
  */
  _resolvedEnterFrom?: TransitionRect;
  _resolvedEnterFromBody?: TransitionRect;
  _resolvedExitTo?: TransitionRect;
  _resolvedExitToBody?: TransitionRect;
  /** See `DrawOptions.instantExitKey` — the clicked node's own key, resolved from `_pendingEnterOrigin.key`. */
  _resolvedInstantExitKey?: string | number;
  /** See `DrawOptions.reunionEnterKey` — the Back click's reunion node's own key, resolved when `resolveDrillMorph` finds a match. */
  _resolvedReunionEnterKey?: string | number;
  /** See `DrawOptions.reunionEnterFrom` — the OLD (pre-Back) body rect, the full size the reunion node's former children occupied. */
  _resolvedReunionEnterFrom?: TransitionRect;
  /** See `DrawOptions.instantExitAll` — set alongside `_resolvedReunionEnterKey`, when a reunion match was found. */
  _resolvedInstantExitAll?: boolean;
  /** Cached measured size of the shared top-left controls panel (back/table-view/search). `measurement` is `topLeftControlsMarkup.ts`-internal (per-item positions); `signature` is the cache key (each contribution's html + resolved style). */
  _topLeftControlsBox?: {width: number; height: number; signature: string; measurement: unknown};

  /* 8. Plot-specific (only present on Plot subclasses) */
  _xAxis?: Axis;
  _yAxis?: Axis;
  _x2Axis?: Axis;
  _y2Axis?: Axis;
  /** The x/y data keys, when set by string (Plot's default axis titles). */
  _xKey?: string;
  _yKey?: string;
  _xFunc?: (d: DataPoint, axis?: string) => number;
  _yFunc?: (d: DataPoint, axis?: string) => number;
  /** The plot area (inside the axes) in chart content space, set by the paint phase. */
  _plotArea?: {x: number; y: number; width: number; height: number};
  /** Crosshair guide-line paint for the shared tooltip. */
  _crosshairConfig?: Record<string, unknown>;
  /**
      The active shared-tooltip hover, if any: the snapped discrete position
      (pixel + data value), the hovered Line points to mark, and which side of
      the marks the crosshair draws on.
  */
  _sharedHoverState?: {
    mode: "shared" | "single";
    axis: "x" | "y";
    px: number;
    value: unknown;
    markers: {datum: DataPoint; x: number; y: number}[];
    layer: "back" | "front";
  } | null;
  /** True while the shared multi-series tooltip owns the tooltip. */
  _sharedHoverActive?: boolean;
  /** The tooltip's own `arrow`/`thead`/`tbody`, held while the shared tooltip replaces them. */
  _sharedTooltipSaved?: {arrow: unknown; thead: unknown; tbody: unknown};
  /** Internal size scale built in Plot's pipeline; maps `_size` → pixel radius. */
  _sizeScaleD3?: D3Scale;
  /** Per-axis "is this axis time-valued" flags, set by `formatPlotData`. */
  _xTime?: boolean;
  _x2Time?: boolean;
  _yTime?: boolean;
  _y2Time?: boolean;
  _baseline?: number;
  _stacked?: boolean;
  _stackOffset?: (series: number[][][], order: number[]) => void;
  /** d3-stack order: an accessor, or an explicit array of series keys. */
  _stackOrder?: ((series: number[][][]) => number[]) | unknown[];
  _confidence?: [number, number] | false;
  _lineLabels?: ((d: DataPoint, i: number) => boolean) | boolean;
  _lineMarkers?: boolean;
  _barPadding?: number;
  _groupPadding?: number;
  _annotations?: Record<string, unknown>[];
  _axisPersist?: boolean;
  _labelPosition?: (d: DataPoint, i: number) => "auto" | "inside" | "outside";
  _labelConnectorConfig?: Record<string, unknown>;
  _lineMarkerConfig?: Record<string, unknown>;
  _confidenceConfig?: Record<string, unknown>;
  _xCutoff?: number;
  _yCutoff?: number;
  _discreteCutoff?: number;
  _buffer?: Record<string, unknown>;

  /* 9. Feature/component class references */
  _legendClass?: Legend;
  _colorScaleClass?: ColorScale;
  _timelineClass?: Timeline;
  _titleClass?: TextBox;
  _subtitleClass?: TextBox;
  _messageClass?: Message;
  _tooltipClass?: Tooltip;
  _legendSort?: (a: DataPoint, b: DataPoint) => number;
  _legendPosition?: (config: VizInstance) => string | false;
  _legend?: ((config: VizInstance, data: DataPoint[]) => boolean) | boolean;
  _legendDepth?: number;
  _colorScalePosition?: (config: VizInstance) => string | false;
  _colorScale?: false | string | ((d: DataPoint, i: number) => string);
  _title?: ((data: DataPoint[]) => string | false) | string | false;
  _subtitle?: ((data: DataPoint[]) => string | false) | string | false;
  _attribution?: string | false;
  _attributionStyle?: Record<string, unknown>;
  _timeline?: boolean;
  _total?: boolean | ((d: DataPoint[], i: number) => number);

  /* 10. DOM + interaction */
  _container?: D3Selection;
  /**
      Element d3-zoom binds to. Defaults to `_container` (the compute svg); the
      Canvas backend points it at the <canvas> so pan/zoom and pointer picking
      share one interaction surface.
  */
  _zoomEventTarget?: D3Selection;
  _zoomGroup?: D3Selection;
  _tileGroup?: D3Selection;
  // Opaque d3 instances (d3-tile generator, d3-zoom behavior + brush); their
  // generic types add no value at this contract boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _tileGen?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _zoomBehavior?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _zoomBrush?: any;
  _zoomSet?: boolean;
  /** Whether a Geomap's themed basemap resolved dark on the latest draw. */
  _basemapDark?: boolean;
  /** Whether a Geomap is watching its backdrop for theme changes. */
  _themeWatch?: boolean;
  /** The attribution d3plus last set from the tile URL (vs. a user-set one). */
  _tileAttribution?: string | false;
  /** Whether a compact (ⓘ) attribution was clicked open. */
  _attributionPinned?: boolean;
  _zoomToBounds?: (bounds: number[][] | null, duration?: number) => void;
  _renderTiles?: (transform?: ZoomTransform, duration?: number) => void;
  /**
      Geomap only: the static (identity-transform) basemap tile list — URLs and
      projection-pixel positions — used by @d3plus/ssr to fetch + inline tiles.
  */
  _computeTileList?: () => Array<{
    key: string;
    url: string;
    x: number;
    y: number;
    size: number;
  }>;
  /** Set by @d3plus/ssr: emit ocean/tiles into the scene for a complete server render. */
  _ssr?: boolean;
  /** Set by @d3plus/ssr: pre-fetched basemap tiles keyed by `${x}-${y}-${z}` → data URI. */
  _ssrTiles?: Map<string, string>;
  _wirePlotShapeEvents?: (shape: Shape, shapeKey: string, events: string[]) => void;

  /* 11. Identity */
  _uuid: string;

  /* Pipeline shims (these are class methods on chart instances) */
  _preDraw(): void;
  _draw(callback?: () => void): void;
  /** Plot's paint phase: builds `_chartScene` from the measured context. */
  _paint?(pCtx: PlotPaintContext): VizInstance;
  _drawSceneToTarget(durationOverride?: number): void;
  _scheduleSceneRepaint(): void;
  _sceneRepaintRAF?: number;
  _thresholdFunction?(data: DataPoint[], tree?: unknown): DataPoint[];
  toScene?(): SceneNode;
  config?(_?: D3plusConfig): D3plusConfig | this;
  active?(_?: unknown): unknown;
  hover?(_?: unknown): unknown;
  /* Fluent accessors invoked imperatively by features/pipeline (installFluent). */
  timeFilter?(_?: ((d: DataPoint, i: number) => boolean) | false): VizInstance;
  render?(callback?: () => void): VizInstance;
}
