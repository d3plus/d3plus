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

import type {ZoomTransform} from "d3-zoom";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode, Transform} from "@d3plus/render";

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
  _featurePanels?: SceneNode[];
  _shapes?: Shape[];
  _previousShapes?: string[];
  _previousAnnotations?: Record<string, string[]>;
  _zoomTransform?: Transform;

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
  _hoverDatum?: DataPoint | null;
  _userHover?: number;
  _userDuration?: number;
  _dataCutoff: number;
  _brushing?: boolean;
  /** Timeline brush selection (timeline feature). */
  _timelineSelection?: (Date | number)[] | false;
  /** The user-set data, retained to detect changes across `.data()` calls. */
  _userData?: DataPoint[] | string;
  /** Drill-down history stack (back button). */
  _history?: DataPoint[];

  /* 8. Plot-specific (only present on Plot subclasses) */
  _xAxis?: Axis;
  _yAxis?: Axis;
  _x2Axis?: Axis;
  _y2Axis?: Axis;
  _xFunc?: (d: DataPoint, axis?: string) => number;
  _yFunc?: (d: DataPoint, axis?: string) => number;
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
  _backClass?: TextBox;
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
  _zoomToBounds?: (bounds: number[][] | null, duration?: number) => void;
  _renderTiles?: (transform?: ZoomTransform, duration?: number) => void;
  _wirePlotShapeEvents?: (shape: Shape, shapeKey: string, events: string[]) => void;

  /* 11. Identity */
  _uuid: string;

  /* Pipeline shims (these are class methods on chart instances) */
  _preDraw(): void;
  _draw(callback?: () => void): void;
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
