import {color} from "d3-color";
import {select} from "d3-selection";
import {transition} from "d3-transition";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {assign, isObject} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import {SvgRenderer} from "@d3plus/render";
import type {GroupNode, Paint, SceneNode, Transform} from "@d3plus/render";

import {TextBox} from "../components/index.js";
import {accessor, BaseClass, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";
import {buildLabelData} from "./buildLabelData.js";
import {hitAreaNode} from "./hitAreaNode.js";
import type {BaseShapeConfig} from "./shapeConfig.js";

/** Coerces a value to a finite number, or undefined. @private */
export function numOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Returns a non-empty string, or undefined. @private */
export function strOrUndef(v: unknown): string | undefined {
  return v == null || v === "" ? undefined : String(v);
}

/** Parses an SVG stroke-dasharray value into an array of numbers. @private */
export function parseDash(v: unknown): number[] | undefined {
  if (v == null || v === "none" || v === "") return undefined;
  if (typeof v === "number") return [v];
  const parts = String(v)
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => Number.isFinite(n));
  return parts.length ? parts : undefined;
}

export interface ShapeAes {
  width?: number;
  height?: number;
  points?: [number, number][];
  r?: number;
  x?: number;
  y?: number;
}


import Image from "./Image.js";

/** Shape's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const shapeSchema: ConfigField[] = [
  {key: "activeOpacity", coerce: "identity", default: 0.25},
  {key: "ariaLabel", coerce: "const", default: constant("")},
  {key: "backgroundImage", coerce: "const", default: constant(false)},
  {key: "discrete", coerce: "identity"},
  {key: "duration", coerce: "identity", default: 600},
  {key: "fill", coerce: "const", default: constant("black")},
  {key: "fillOpacity", coerce: "const", default: constant(1)},
  {key: "hitArea", coerce: "const"},
  {key: "hoverOpacity", coerce: "identity", default: 0.5},
  {
    key: "id",
    coerce: "identity",
    default: (d: DataPoint, i?: number) => (d.id !== void 0 ? d.id : i!),
  },
  {key: "label", coerce: "const", default: constant(false)},
  {key: "labelBounds", coerce: "const"},
  {key: "opacity", coerce: "const", default: constant(1)},
  {key: "pointerEvents", coerce: "const", default: constant("visiblePainted")},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "role", coerce: "const", default: constant("presentation")},
  {key: "rotate", coerce: "const", default: constant(0)},
  {key: "rx", coerce: "const", default: constant(0)},
  {key: "ry", coerce: "const", default: constant(0)},
  {key: "scale", coerce: "const", default: constant(1)},
  {key: "shapeRendering", coerce: "const", default: constant("geometricPrecision")},
  {key: "stroke", coerce: "const"},
  {key: "strokeDasharray", coerce: "const", default: constant("0")},
  {key: "strokeLinecap", coerce: "const", default: constant("butt")},
  {key: "strokeOpacity", coerce: "const", default: constant(1)},
  {key: "strokeWidth", coerce: "const", default: constant(0)},
  {key: "textAnchor", coerce: "const", default: constant("start")},
  {key: "texture", coerce: "const", default: constant(false)},
  {key: "vectorEffect", coerce: "const", default: constant("non-scaling-stroke")},
  {key: "verticalAlign", coerce: "const", default: constant("top")},
  {key: "x", coerce: "const", default: accessor("x", 0)},
  {key: "y", coerce: "const", default: accessor("y", 0)},
];

/**
    An abstracted class for generating shapes.
*/
export default class Shape extends BaseClass {
  // installFluent generates the config accessors (fill, x, id, …) at runtime;
  // the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  _backgroundImageClass: Image;
  _data: DataPoint[];
  _labelClass: TextBox;
  _name: string;
  _tagName: string;
  _textureDefs: Record<string, Record<string, unknown>>;
  _select!: D3Selection;
  _transition!: ReturnType<typeof transition>;
  /** @param data The raw data array to filter. */
  _dataFilter?(data: DataPoint[]): DataPoint[];
  _group!: D3Selection;
  _update!: D3Selection;
  _enter!: D3Selection;
  _exit!: D3Selection;
  _hoverGroup!: D3Selection;
  _activeGroup!: D3Selection;
  _path!: Record<string, unknown>;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor(tagName: string = "g") {
    super();

    installFluent(this, shapeSchema);

    this._backgroundImageClass = new Image();
    this._data = [];
    this._labelClass = new TextBox();
    this._name = "Shape";
    this._tagName = tagName;
    this._textureDefs = {};

    // stroke defaults to a darker shade of fill — closes over `this.schema`
    // so it tracks the current fill accessor. A fill that doesn't parse as a
    // color (e.g. "none"/"transparent", a gradient token) has no darker shade,
    // so fall back to the fill value itself.
    this.schema.stroke = (d: DataPoint, i?: number) => {
      const c = color(this.schema.fill(d, i) as string);
      return c ? c.darker(1).formatHex() : (this.schema.fill(d, i) as string);
    };

    this.schema.activeStyle = {
      stroke: (d: DataPoint, i: number) => {
        let c = this.schema.fill(d, i) as string;
        if (["transparent", "none"].includes(c))
          c = this.schema.stroke(d, i) as string;
        const col = color(c);
        return col ? col.darker(1) : c;
      },
      "stroke-width": (d: DataPoint, i: number) => {
        const s = (this.schema.strokeWidth(d, i) as number) || 1;
        return s * 3;
      },
    };
    this.schema.hoverStyle = {
      stroke: (d: DataPoint, i: number) => {
        let c = this.schema.fill(d, i) as string;
        if (["transparent", "none"].includes(c))
          c = this.schema.stroke(d, i) as string;
        const col = color(c);
        return col ? col.darker(0.5) : c;
      },
      "stroke-width": (d: DataPoint, i: number) => {
        const s = (this.schema.strokeWidth(d, i) as number) || 1;
        return s * 2;
      },
    };
    // Shape's label defaults. These are pushed to `_labelClass` via
    // `_labelClass.config(this.schema.labelConfig)` in render() so the
    // TextBox actually picks them up.
    // textAnchor defaults to "start" (left-aligned) — Treemap, Pie,
    // etc. rely on this. Bar overrides to "middle" in its constructor.
    this.schema.labelConfig = {
      fontColor: (d: DataPoint, i: number) =>
        colorContrast(this.schema.fill(d, i) as string),
      // Fade labels with their shape's opacity (e.g. an axis tick label hides
      // when `shapeConfig.opacity` is 0). Reads `this.schema.opacity` live —
      // like `fontColor` reads `fill` — which unwraps nested label data.
      fontOpacity: (d: DataPoint, i: number) =>
        this.schema.opacity(d, i) as number,
      fontResize: true,
      fontMax: 50,
      fontMin: 8,
      fontSize: 12,
      padding: 5,
      textAnchor: "start",
      verticalAlign: "top",
    };
    this.schema.textureDefault = {};
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(_d?: DataPoint, _i?: number): ShapeAes {
    return {};
  }


  /**
      Returns a full JSON string of the texture config for a given data point.

      @private
*/
  _getTextureKey(d: DataPoint, i: number): string | false {
    const textureVal: unknown = this.schema.texture(d, i);
    if (!textureVal) return false;

    /**
        Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @private
*/
    const styleLogic = (_: unknown): unknown => {
      return typeof _ !== "function"
        ? _
        : d.nested && d.key && d.values
          ? (_ as AccessorFn)(
              (d.values as unknown as DataPoint[])[0],
              this._data.indexOf((d.values as unknown as DataPoint[])[0]),
            )
          : (_ as AccessorFn)(d, i);
    };

    const fallback = this.schema.textureDefault;

    let texture: Record<string, unknown>;
    if (!isObject(textureVal))
      texture = {texture: textureVal} as Record<string, unknown>;
    else texture = textureVal as Record<string, unknown>;
    if (!texture.background) texture.background = styleLogic(this.schema.fill);
    if (!texture.stroke && !fallback.stroke)
      texture.stroke = styleLogic(this.schema.stroke);
    const pathNames = [
      "squares",
      "nylon",
      "waves",
      "woven",
      "crosses",
      "caps",
      "hexagons",
    ];
    if (
      pathNames.includes(texture.texture as string) ||
      typeof texture.texture === "function"
    ) {
      texture.d = texture.texture;
      texture.texture = "paths";
    } else if (texture.texture === "grid") {
      if (!texture.orientation && !fallback.orientation)
        texture.orientation = ["vertical", "horizontal"];
      texture.texture = "lines";
    }
    if (!texture.fill && texture.texture !== "paths")
      texture.fill = texture.stroke;
    const retObj = assign({}, fallback, texture);
    if (typeof retObj.d === "function") {
      retObj.d = retObj.d(retObj.size || 20);
    }
    return JSON.stringify(retObj);
  }

  /**
      Checks for nested data and uses the appropriate variables for accessor functions.
      @param elem @private
*/
  _nestWrapper(
    method: AccessorFn,
  ): (d: DataPoint, i: number) => DataPoint[keyof DataPoint] {
    return (d: DataPoint, i: number) =>
      method(
        d.__d3plusShape__ ? (d.data as DataPoint) : d,
        d.__d3plusShape__ ? (d.i as number) : i,
      );
  }


  /**
      Adds labels to each shape group.
      @private
*/
  _buildLabelData(): DataPoint[] {
    // Delegates to the pure `buildLabelData()` helper. The helper
    // takes the same inputs `this` exposes but works without a Shape
    // instance — emit functions or other callers that need only the
    // label-record layout can call it directly without instantiating
    // a Shape in compute mode.
    // All Shape methods bound to `this` before handing them to the pure
    // helper — subclasses (e.g. Line._dataFilter) reach for `this.schema.id`
    // and friends inside their bodies.
    return buildLabelData({
      data: this._data,
      dataFilter: this._dataFilter ? this._dataFilter.bind(this) : undefined,
      label: this.schema.label,
      labelBounds: this.schema.labelBounds
        ? this.schema.labelBounds.bind(this)
        : undefined,
      x: this.schema.x,
      y: this.schema.y,
      aes: this._aes.bind(this),
      rotate: this.schema.rotate,
      id: this.schema.id,
    });
  }


  /**
      Renders the current Shape to the page. If a *callback* is specified, it will be called once the shapes are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  /**
      Resolves a style accessor for a data point, mirroring the nested-data logic
      of _applyStyle so scene output matches DOM rendering.
      @private
*/
  _styleVal(fn: unknown, d: DataPoint, i: number): unknown {
    if (typeof fn !== "function") return fn;
    if (d.nested && d.key && d.values) {
      const first = (d.values as unknown as DataPoint[])[0];
      return (fn as AccessorFn)(first, this._data.indexOf(first));
    }
    return (fn as AccessorFn)(d, i);
  }

  /**
      Builds the resolved Transform for a data point, mirroring _applyTransform.
      @private
*/
  _sceneTransform(d: DataPoint, i: number): Transform {
    const wrapped = Boolean(d.__d3plusShape__);
    const dd = (wrapped ? d.data : d) as DataPoint;
    const ii = wrapped ? (d.i as number) : i;
    let x: number, y: number;
    if (wrapped && d.translate) {
      const [tx, ty] = String(d.translate).split(",").map(Number);
      x = tx;
      y = ty;
    } else {
      x = Number(this.schema.x(dd, ii));
      y = Number(this.schema.y(dd, ii));
    }
    const scale =
      wrapped && d.scale !== undefined
        ? Number(d.scale)
        : Number(this.schema.scale(dd, ii));
    const rotate =
      wrapped && d.rotate !== undefined
        ? Number(d.rotate)
        : Number(this.schema.rotate((d.data || d) as DataPoint, ii));
    return {x, y, scale, rotate};
  }

  /**
      Builds the resolved Paint for a data point, mirroring _applyStyle.
      Texture fills are encoded as a stable "pattern:<key>" token at this
      layer; the backend renderers (`SvgRenderer._resolveFill`,
      `CanvasRenderer._resolveFill`) materialize them into a real SVG
      pattern or a Canvas image pattern. The two-stage resolve is
      intentional — Shapes stay backend-free, and texture
      materialization happens once per renderer instead of per-shape.
      @private
*/
  _scenePaint(d: DataPoint, i: number): Paint {
    // A texture resolves to a stable "pattern:<key>" token (the same JSON config
    // render() uses); each backend materializes or degrades it.
    const textureKey = this._getTextureKey(d, i);
    return {
      fill: textureKey
        ? `pattern:${textureKey}`
        : strOrUndef(this._styleVal(this.schema.fill, d, i)),
      fillOpacity: numOrUndef(this._styleVal(this.schema.fillOpacity, d, i)),
      stroke: strOrUndef(this._styleVal(this.schema.stroke, d, i)),
      strokeWidth: numOrUndef(this._styleVal(this.schema.strokeWidth, d, i)),
      strokeOpacity: numOrUndef(this._styleVal(this.schema.strokeOpacity, d, i)),
      strokeDasharray: parseDash(
        this._styleVal(this.schema.strokeDasharray, d, i),
      ),
      strokeLinecap: strOrUndef(
        this._styleVal(this.schema.strokeLinecap, d, i),
      ) as Paint["strokeLinecap"],
      vectorEffect: strOrUndef(
        this._styleVal(this.schema.vectorEffect, d, i),
      ) as Paint["vectorEffect"],
      shapeRendering: strOrUndef(
        this._nestWrapper(this.schema.shapeRendering)(d, i),
      ),
      opacity: numOrUndef(this._nestWrapper(this.schema.opacity)(d, i)),
    };
  }

  /**
      Returns the geometry-specific scene fields for a data point. Overridden by
      each shape subclass; the base provides none.
      @private
*/
  _sceneGeometry(_d: DataPoint, _i: number): Record<string, unknown> | null {
    return null;
  }

  /**
      Produces a backend-agnostic scene graph for this shape's data, reusing the
      same accessors render() applies to the DOM. This is the migration seam toward
      the @d3plus/render pluggable backends; it has no effect on render().
*/
  toScene(): GroupNode {
    let data: DataPoint[] & {key?: AccessorFn} = this._data;
    if (this._dataFilter)
      data = this._dataFilter(data) as DataPoint[] & {key?: AccessorFn};
    const children: SceneNode[] = [];
    // Build the backgroundImage data for emission below. Each datum that
    // resolves to a non-false `backgroundImage(d, i)` becomes an
    // ImageNode positioned at the shape's geometry.
    const imageData: DataPoint[] = [];
    data.forEach((d, i) => {
      const geom = this._sceneGeometry(d, i);
      if (!geom) return;
      const key = this._nestWrapper(this.schema.id)(d, i) as string | number;
      const datum = (d.__d3plusShape__ ? d.data : d) as DataPoint;
      const transform = this._sceneTransform(d, i);

      // Push the hit area (if any) before the geometry so it sits behind it.
      if (this.schema.hitArea) {
        const ha = hitAreaNode(
          this.schema.hitArea, d, i, this._aes(d, i), key, datum, this._name, transform,
        );
        if (ha) children.push(ha);
      }

      children.push({
        ...geom,
        key,
        datum,
        index: i,
        shapeType: this._name,
        paint: this._scenePaint(d, i),
        transform,
        aria: {
          role: strOrUndef(this._nestWrapper(this.schema.role)(d, i)),
          label: strOrUndef(this._nestWrapper(this.schema.ariaLabel)(d, i)),
        },
      } as unknown as SceneNode);
      // backgroundImage: collect a per-datum image when the accessor
      // returns a truthy URL. The image is sized to the shape's
      // geometry (preferring width/height fields when present).
      const bg = this._nestWrapper(this.schema.backgroundImage)(d, i) as
        | string
        | false;
      if (bg) {
        const g = geom as Record<string, unknown>;
        // Shape geometry is origin-centered; its on-screen position lives in
        // the node transform. The background image is emitted as a flat sibling
        // (no transform), so bake the shape's translate into the image x/y —
        // otherwise every image lands at the origin (top-left).
        const t = this._sceneTransform(d, i) as {x?: number; y?: number};
        const w = typeof g.width === "number" ? g.width : undefined;
        const h = typeof g.height === "number" ? g.height : undefined;
        const cx = typeof g.cx === "number" ? g.cx : (typeof g.x === "number" ? g.x : 0);
        const cy = typeof g.cy === "number" ? g.cy : (typeof g.y === "number" ? g.y : 0);
        const r = typeof g.r === "number" ? g.r : undefined;
        const iw = w ?? (r != null ? r * 2 : 0);
        const ih = h ?? (r != null ? r * 2 : 0);
        imageData.push({
          __d3plus__: true,
          data: d,
          i,
          id: this._nestWrapper(this.schema.id)(d, i),
          url: bg,
          x: (t.x ?? 0) + (cx as number) - iw / 2,
          y: (t.y ?? 0) + (cy as number) - ih / 2,
          width: iw,
          height: ih,
        } as unknown as DataPoint);
      }
    });
    // Emit background images AFTER shape children so they paint above the
    // shape's fill — matches the DOM order where the <image> was
    // appended as a sibling of the shape.
    if (imageData.length) {
      this._backgroundImageClass
        .data(imageData)
        .id((d: DataPoint) => `${(d as Record<string, unknown>).id}`)
        .url((d: DataPoint) => (d as Record<string, unknown>).url as string)
        .x((d: DataPoint) => (d as Record<string, unknown>).x as number)
        .y((d: DataPoint) => (d as Record<string, unknown>).y as number)
        .width((d: DataPoint) => (d as Record<string, unknown>).width as number)
        .height((d: DataPoint) => (d as Record<string, unknown>).height as number)
        .renderMode("compute");
      const imgScene = this._backgroundImageClass.toScene();
      if (imgScene && Array.isArray(imgScene.children))
        children.push(...imgScene.children);
    }
    // NOTE: Labels are NOT pushed here. The canonical aggregation point is
    // `emitHelpers.collectComputed(shape)`, which appends `shape.toScene()`
    // AND `shape._labelClass.toScene()` independently. Pushing labels here
    // too would emit them twice in every chart that calls collectComputed
    // (Pie/Donut/Pack/Treemap/Network/Priestley/Radar/RadialMatrix/Geomap…).
    // Standalone shape.render() consumers (no collectComputed wrapper) get
    // labels through Shape.render's own SvgRenderer path below.
    return {type: "group", key: `${this._name}-group`, children};
  }

  render(callback?: () => void): this {
    // Populate the label TextBox so toScene() reads correct label data. The
    // label class is always in compute mode — the scene path materializes text.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lc = this._labelClass as unknown as {renderMode?: (m: string) => any};
    if (lc && typeof lc.renderMode === "function") lc.renderMode("compute");
    // Apply Shape's labelConfig (fontColor, fontResize, padding, textAnchor,
    // verticalAlign, fontSize, …) to the underlying TextBox. Function
    // accessors receive the LABEL RECORD (with `d.data` = source
    // datum, `d.l` = which label index in a multi-label-per-datum
    // setup, `d.text` = label text, etc.). That gives consumers like
    // Treemap (two labels per cell — title + share %) the context to
    // vary anchor / color / etc. based on which label they're styling.
    // Shape's default `fontColor` uses `this.schema.fill(d, i)` — since
    // `fill` is the configPrep-wrapped accessor, it unwraps `d.data`
    // back to the source datum automatically before invoking the user
    // fill function.
    this._labelClass.config(this.schema.labelConfig as Record<string, unknown>);
    this._labelClass.data(this._buildLabelData());

    if (this.schema.renderMode === "compute") {
      // A Viz pipeline is driving this shape — Viz.renderScene composes the
      // whole chart's scene itself, so don't spin up our own SvgRenderer.
      if (callback) setTimeout(callback, 0);
      return this;
    }

    // Standalone shape rendering: route the shape's own toScene() through
    // SvgRenderer. Preserves `new Rect().render()` ergonomics with no
    // d3-selection DOM.
    if (this._select === undefined && typeof document !== "undefined") {
      const div = document.createElement("div");
      div.style.cssText = "display:block;";
      document.body.appendChild(div);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.select(div as any);
    }

    if (this._select) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sel = this._select as any;
      const node: Element | null =
        sel && typeof sel.node === "function" ? sel.node() : sel;
      if (node) {
        const tag = (node.tagName || "").toLowerCase();
        const isSvg = tag === "svg";
        const width = isSvg
          ? Number(node.getAttribute("width")) || 400
          : (node as HTMLElement).clientWidth || 400;
        const height = isSvg
          ? Number(node.getAttribute("height")) || 300
          : (node as HTMLElement).clientHeight || 300;
        // Combine the shape's scene + label children. toScene() deliberately
        // omits labels (collectComputed is the canonical aggregator for the
        // chart pipeline); for the standalone render() path we add them here
        // so `new Rect().data(...).render()` still produces label text.
        const shapeGroup = this.toScene();
        const labelChildren: SceneNode[] = [];
        if (
          this._labelClass &&
          typeof (this._labelClass as {toScene?: unknown}).toScene === "function" &&
          this._labelClass._data &&
          this._labelClass._data.length
        ) {
          labelChildren.push(
            ...(this._labelClass.toScene().children as SceneNode[]),
          );
        }
        const root: GroupNode = {
          ...shapeGroup,
          children: [...shapeGroup.children, ...labelChildren],
        };
        const scene = {root, width, height};
        // Tear down any previous SvgRenderer so its DOM listeners + timers
        // are cleared instead of leaking on every re-render.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prev = (this as any)._sceneRenderer as
          | {destroy?: () => void}
          | undefined;
        if (prev && typeof prev.destroy === "function") prev.destroy();
        // Caller's element is preserved (downstream selectors still find it);
        // we mount SvgRenderer INSIDE it. When `node` is a <g> the result is
        // a nested <svg>-in-<g>, which is valid SVG but visually unusual —
        // chart code reaches this path only via the Box/Whisker full-mode
        // fallback, which is not the recommended flow (compute mode is).
        // Only wipe children when this is the FIRST time we're mounting
        // here — re-renders into the same node would otherwise destroy any
        // labels/auxiliary DOM the caller put alongside.
        if (!prev) {
          while (node.firstChild) node.removeChild(node.firstChild);
        }
        const renderer = new SvgRenderer();
        renderer.mount({container: node, width, height});
        renderer.drawScene(scene);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)._sceneRenderer = renderer;
      }
    }

    if (callback) setTimeout(callback, 0);
    return this;
  }

  /**
      The active callback function for highlighting shapes.
*/
  active(): ((d: DataPoint, i: number) => boolean) | null;
  active(_: ((d: DataPoint, i: number) => boolean) | null): this;
  active(
    _?: ((d: DataPoint, i: number) => boolean) | null,
  ): ((d: DataPoint, i: number) => boolean) | null | this {
    if (!arguments.length || _ === undefined) return this.schema.active;
    this.schema.active = _;
    // v4: active/hover visuals come from the scene path's paint recomputation
    // on the next render(); no DOM mutation here.
    return this;
  }

  /**
      The style to apply to active shapes.
*/
  activeStyle(): Record<string, unknown>;
  activeStyle(_: Record<string, unknown>): this;
  activeStyle(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.activeStyle = assign({}, this.schema.activeStyle, _!)),
        this)
      : this.schema.activeStyle;
  }

  /**
      The data array used to create shapes. A shape will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(): ((d: DataPoint, i: number) => boolean) | null;
  hover(_: ((d: DataPoint, i: number) => boolean) | null): this;
  hover(
    _?: ((d: DataPoint, i: number) => boolean) | null,
  ): ((d: DataPoint, i: number) => boolean) | null | this {
    if (!arguments.length || _ === void 0) return this.schema.hover;
    this.schema.hover = _;
    // v4: hover dim comes from the scene path's paint recomputation; no DOM here.
    return this;
  }

  /**
      The style to apply to hovered shapes.
*/
  hoverStyle(): Record<string, unknown>;
  hoverStyle(_: Record<string, unknown>): this;
  hoverStyle(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.hoverStyle = assign({}, this.schema.hoverStyle, _!)), this)
      : this.schema.hoverStyle;
  }

  /**
      A pass-through to the config method of the TextBox class used to create a shape's labels.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.labelConfig = assign(this.schema.labelConfig, _!)), this)
      : this.schema.labelConfig;
  }

  /**
      The SVG container element as a d3 selector or DOM element.
*/
  select(): D3Selection;
  select(_: string | HTMLElement | SVGElement | null): this;
  select(_?: string | HTMLElement | SVGElement | null): D3Selection | this {
    return arguments.length
      ? ((this._select = select(_ as string) as unknown as D3Selection), this)
      : this._select;
  }

  /**
      A comparator function used to sort shapes for layering order.
*/
  sort(): ((a: DataPoint, b: DataPoint) => number) | null;
  sort(_: ((a: DataPoint, b: DataPoint) => number) | null): this;
  sort(
    _?: ((a: DataPoint, b: DataPoint) => number) | null,
  ): ((a: DataPoint, b: DataPoint) => number) | null | this {
    return arguments.length
      ? ((this.schema.sort = _ ?? null), this)
      : this.schema.sort;
  }

  /**
      A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).
*/
  textureDefault(): Record<string, unknown>;
  textureDefault(_: Record<string, unknown>): this;
  textureDefault(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.textureDefault = assign(this.schema.textureDefault, _!)),
        this)
      : this.schema.textureDefault;
  }

  /**
      Narrowed `.config()` for Shape. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): BaseShapeConfig;
  config(_: Partial<BaseShapeConfig>): this;
  config(_?: Partial<BaseShapeConfig>): BaseShapeConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
