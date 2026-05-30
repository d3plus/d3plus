/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `Viz` — the typed contract for the runtime Viz surface that v4's free
    functions (plotPaint, vizPreDrawPure, vizDrawPure, runVizPipeline,
    apply*Layout stages, FeatureModules) read and write.

    This replaces `viz: any` across the free-function surface. The
    interface enumerates ~140 fields the audit found across the runtime
    code paths, grouped by category. Each entry is the BEST-EFFORT type
    inferred from usage; fields that are deeply chart-specific or
    legacy-shaped use `any` rather than half-accurate narrowing.

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

import type {DataPoint} from "@d3plus/data";
import type {SceneNode, Transform} from "@d3plus/render";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type {ResolvedSpec} from "./resolveSpec.js";

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

/** D3-style selection (loose — d3-selection's types are too generic to repeat here). */
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

/** A Renderer instance — see @d3plus/render. */
export interface VizRenderer {
  kind: "svg" | "canvas";
  target(): {container: Element; width: number; height: number} | undefined;
  destroy(): void;
  drawScene(scene: any, opts?: any): any;
  [key: string]: any;
}

/**
    The structural contract free functions read/write on a chart instance.
    Class instances satisfy it via their `[key: string]: any` signature;
    chart-specific extensions (TreeViz, PieViz, etc.) add stash slots.
*/
export interface VizInstance {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  /** User-set config from fluent accessors (`.sum(...)`, `.x(...)`, …). */
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
  _noDataMessage?: false | string | ((config: any) => string);

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
  _size?: (d: DataPoint, i: number) => number;
  _value?: (d: DataPoint, i: number) => number;
  _time?: (d: DataPoint, i: number) => string | number | Date;
  _sort?: ((a: any, b: any) => number) | null;
  _label?: (d: DataPoint, i: number) => string;
  _thresholdName?: (d: DataPoint, i: number) => string;
  _sum?: (d: DataPoint, i: number) => number;

  /* 5. Config slots */
  _xConfig?: Record<string, any>;
  _yConfig?: Record<string, any>;
  _x2Config?: Record<string, any>;
  _y2Config?: Record<string, any>;
  _backgroundConfig?: Record<string, any>;
  _legendConfig?: Record<string, any>;
  _colorScaleConfig?: Record<string, any>;
  _timelineConfig?: Record<string, any>;
  _backConfig?: Record<string, any>;
  _titleConfig?: Record<string, any>;
  _subtitleConfig?: Record<string, any>;
  _axisConfig?: Record<string, any>;

  /* 6. Scene & output */
  _chartScene?: SceneNode[];
  _chartTransform?: Transform;
  _featurePanels?: SceneNode[];
  _shapes?: any[];
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
  _userHover?: number;
  _userDuration?: number;
  _dataCutoff: number;
  _brushing?: boolean;

  /* 8. Plot-specific (only present on Plot subclasses) */
  _xAxis?: any;
  _yAxis?: any;
  _x2Axis?: any;
  _y2Axis?: any;
  _xFunc?: (d: any, axis?: string) => number;
  _yFunc?: (d: any, axis?: string) => number;
  _baseline?: number;
  _stacked?: boolean;
  _stackOffset?: (series: any[], order: any) => void;
  _stackOrder?: (series: any[]) => number[];
  _confidence?: [number, number] | false;
  _lineLabels?: ((d: DataPoint, i: number) => boolean) | boolean;
  _lineMarkers?: boolean;
  _barPadding?: number;
  _groupPadding?: number;
  _annotations?: any[];
  _axisPersist?: boolean;
  _labelPosition?: (d: DataPoint, i: number) => "auto" | "inside" | "outside";
  _labelConnectorConfig?: Record<string, any>;
  _lineMarkerConfig?: Record<string, any>;
  _confidenceConfig?: Record<string, any>;
  _xCutoff?: number;
  _yCutoff?: number;
  _discreteCutoff?: number;
  _buffer?: Record<string, any>;

  /* 9. Feature/component class references */
  _legendClass?: any;
  _colorScaleClass?: any;
  _timelineClass?: any;
  _titleClass?: any;
  _subtitleClass?: any;
  _backClass?: any;
  _messageClass?: any;
  _tooltipClass?: any;
  _legendSort?: (a: DataPoint, b: DataPoint) => number;
  _legendPosition?: (config: any) => string | false;
  _legend?: ((config: any, data: DataPoint[]) => boolean) | boolean;
  _legendDepth?: number;
  _colorScalePosition?: (config: any) => string | false;
  _colorScale?: false | string | ((d: DataPoint, i: number) => string);
  _title?: ((data: DataPoint[]) => string | false) | string | false;
  _subtitle?: ((data: DataPoint[]) => string | false) | string | false;
  _attribution?: string | false;
  _attributionStyle?: Record<string, any>;
  _timeline?: boolean;
  _total?: boolean | ((d: DataPoint[], i: number) => number);

  /* 10. DOM + interaction */
  _container?: D3Selection;
  _zoomGroup?: D3Selection;
  _tileGroup?: D3Selection;
  _tileGen?: any;
  _zoomBehavior?: any;
  _zoomBrush?: any;
  _zoomSet?: boolean;
  _zoomToBounds?: (bounds: number[][] | null, duration?: number) => void;
  _renderTiles?: (transform?: any, duration?: number) => void;
  _wirePlotShapeEvents?: (shape: any, shapeKey: string, events: string[]) => void;

  /* 11. Identity */
  _uuid: string;

  /* Pipeline shims (these are class methods on chart instances) */
  _preDraw(): void;
  _draw(callback?: () => void): void;
  _drawSceneToTarget(durationOverride?: number): void;
  _thresholdFunction?(data: DataPoint[], tree?: any): DataPoint[];
  toScene?(): any;
  config?(_?: any): any;
  active?(_?: any): any;
  hover?(_?: any): any;
}
