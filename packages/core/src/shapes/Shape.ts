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
import {buildLabelData} from "./buildLabelData.js";

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

/**
    An abstracted class for generating shapes.
*/
export default class Shape extends BaseClass {
  _activeOpacity: number;
  _activeStyle: Record<string, unknown>;
  _ariaLabel: AccessorFn;
  _backgroundImage: AccessorFn;
  _backgroundImageClass: Image;
  _data: DataPoint[];
  _duration: number;
  _fill: AccessorFn;
  _fillOpacity: AccessorFn;
  _hoverOpacity: number;
  _hoverStyle: Record<string, unknown>;
  _id: AccessorFn;
  _label: AccessorFn;
  _labelClass: TextBox;
  _labelConfig: Record<string, unknown>;
  _labelBounds!:
    | ((
        d: DataPoint,
        i: number,
        aes: ShapeAes,
      ) => Record<string, unknown> | null | false)
    | null;
  _name: string;
  _opacity: AccessorFn;
  _pointerEvents: AccessorFn;
  _role: AccessorFn;
  _rotate: AccessorFn;
  _rx: AccessorFn;
  _ry: AccessorFn;
  _scale: AccessorFn;
  _shapeRendering: AccessorFn;
  _stroke: AccessorFn;
  _strokeDasharray: AccessorFn;
  _strokeLinecap: AccessorFn;
  _strokeOpacity: AccessorFn;
  _strokeWidth: AccessorFn;
  _tagName: string;
  _textAnchor: AccessorFn;
  _renderMode: "full" | "compute";
  _texture: AccessorFn;
  _textureDefault: Record<string, unknown>;
  _textureDefs: Record<string, Record<string, unknown>>;
  _vectorEffect: AccessorFn;
  _verticalAlign: AccessorFn;
  _x: AccessorFn;
  _y: AccessorFn;
  _select!: D3Selection;
  _transition!: ReturnType<typeof transition>;
  /** @param data The raw data array to filter. */
  _dataFilter?(data: DataPoint[]): DataPoint[];
  _sort!: ((a: DataPoint, b: DataPoint) => number) | null;
  _group!: D3Selection;
  _update!: D3Selection;
  _enter!: D3Selection;
  _exit!: D3Selection;
  _hoverGroup!: D3Selection;
  _activeGroup!: D3Selection;
  _hitArea!:
    | ((d: DataPoint, i: number, aes: ShapeAes) => Record<string, unknown>)
    | null;
  _active!: ((d: DataPoint, i: number) => boolean) | null;
  _hover!: ((d: DataPoint, i: number) => boolean) | null;
  _discrete: string | undefined;
  _path!: Record<string, unknown>;
  _defined!: AccessorFn;
  _curve!: AccessorFn;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor(tagName: string = "g") {
    super();

    this._renderMode = "full";
    this._activeOpacity = 0.25;
    this._activeStyle = {
      stroke: (d: DataPoint, i: number) => {
        let c = this._fill(d, i) as string;
        if (["transparent", "none"].includes(c))
          c = this._stroke(d, i) as string;
        return color(c)!.darker(1);
      },
      "stroke-width": (d: DataPoint, i: number) => {
        const s = (this._strokeWidth(d, i) as number) || 1;
        return s * 3;
      },
    };
    this._ariaLabel = constant("");
    this._backgroundImage = constant(false);
    this._backgroundImageClass = new Image();
    this._data = [];
    this._duration = 600;
    this._fill = constant("black");
    this._fillOpacity = constant(1);

    this._hoverOpacity = 0.5;
    this._hoverStyle = {
      stroke: (d: DataPoint, i: number) => {
        let c = this._fill(d, i) as string;
        if (["transparent", "none"].includes(c))
          c = this._stroke(d, i) as string;
        return color(c)!.darker(0.5);
      },
      "stroke-width": (d: DataPoint, i: number) => {
        const s = (this._strokeWidth(d, i) as number) || 1;
        return s * 2;
      },
    };
    this._id = (d: DataPoint, i?: number) => (d.id !== void 0 ? d.id : i!);
    this._label = constant(false);
    this._labelClass = new TextBox();
    this._labelConfig = {
      fontColor: (d: DataPoint, i: number) =>
        colorContrast(this._fill(d, i) as string),
      fontSize: 12,
      padding: 5,
    };
    this._name = "Shape";
    this._opacity = constant(1);
    this._pointerEvents = constant("visiblePainted");
    this._role = constant("presentation");
    this._rotate = constant(0);
    this._rx = constant(0);
    this._ry = constant(0);
    this._scale = constant(1);
    this._shapeRendering = constant("geometricPrecision");
    this._stroke = (d: DataPoint, i?: number) =>
      color(this._fill(d, i) as string)!
        .darker(1)
        .formatHex();
    this._strokeDasharray = constant("0");
    this._strokeLinecap = constant("butt");
    this._strokeOpacity = constant(1);
    this._strokeWidth = constant(0);
    this._tagName = tagName;
    this._textAnchor = constant("start");
    this._texture = constant(false);
    this._textureDefault = {};
    this._textureDefs = {};
    this._vectorEffect = constant("non-scaling-stroke");
    this._verticalAlign = constant("top");

    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
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
    const textureVal: unknown = this._texture(d, i);
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

    const fallback = this._textureDefault;

    let texture: Record<string, unknown>;
    if (!isObject(textureVal))
      texture = {texture: textureVal} as Record<string, unknown>;
    else texture = textureVal as Record<string, unknown>;
    if (!texture.background) texture.background = styleLogic(this._fill);
    if (!texture.stroke && !fallback.stroke)
      texture.stroke = styleLogic(this._stroke);
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
    // v4: thin shim over the pure `buildLabelData()` helper. The helper
    // takes the same inputs `this` exposes but works without a Shape
    // instance — emit functions or other callers that need only the
    // label-record layout can call it directly without instantiating
    // a Shape in compute mode.
    // All Shape methods bound to `this` before handing them to the pure
    // helper — subclasses (e.g. Line._dataFilter) reach for `this._id` and
    // friends inside their bodies.
    return buildLabelData({
      data: this._data,
      dataFilter: this._dataFilter ? this._dataFilter.bind(this) : undefined,
      label: this._label,
      labelBounds: this._labelBounds
        ? this._labelBounds.bind(this)
        : undefined,
      x: this._x,
      y: this._y,
      aes: this._aes.bind(this),
      rotate: this._rotate,
      id: this._id,
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
      x = Number(this._x(dd, ii));
      y = Number(this._y(dd, ii));
    }
    const scale =
      wrapped && d.scale !== undefined ? Number(d.scale) : Number(this._scale(dd, ii));
    const rotate =
      wrapped && d.rotate !== undefined
        ? Number(d.rotate)
        : Number(this._rotate((d.data || d) as DataPoint, ii));
    return {x, y, scale, rotate};
  }

  /**
      Builds the resolved Paint for a data point, mirroring _applyStyle. Texture
      fills are not yet resolved here (a follow-up for the SVG/Canvas backends).
      @private
*/
  _scenePaint(d: DataPoint, i: number): Paint {
    // A texture resolves to a stable "pattern:<key>" token (the same JSON config
    // render() uses); each backend materializes or degrades it.
    const textureKey = this._getTextureKey(d, i);
    return {
      fill: textureKey
        ? `pattern:${textureKey}`
        : strOrUndef(this._styleVal(this._fill, d, i)),
      fillOpacity: numOrUndef(this._styleVal(this._fillOpacity, d, i)),
      stroke: strOrUndef(this._styleVal(this._stroke, d, i)),
      strokeWidth: numOrUndef(this._styleVal(this._strokeWidth, d, i)),
      strokeOpacity: numOrUndef(this._styleVal(this._strokeOpacity, d, i)),
      strokeDasharray: parseDash(this._styleVal(this._strokeDasharray, d, i)),
      strokeLinecap: strOrUndef(
        this._styleVal(this._strokeLinecap, d, i),
      ) as Paint["strokeLinecap"],
      vectorEffect: strOrUndef(
        this._styleVal(this._vectorEffect, d, i),
      ) as Paint["vectorEffect"],
      shapeRendering: strOrUndef(this._nestWrapper(this._shapeRendering)(d, i)),
      opacity: numOrUndef(this._nestWrapper(this._opacity)(d, i)),
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
    data.forEach((d, i) => {
      const geom = this._sceneGeometry(d, i);
      if (!geom) return;
      children.push({
        ...geom,
        key: this._nestWrapper(this._id)(d, i) as string | number,
        datum: (d.__d3plusShape__ ? d.data : d) as DataPoint,
        index: i,
        paint: this._scenePaint(d, i),
        transform: this._sceneTransform(d, i),
        aria: {
          role: strOrUndef(this._nestWrapper(this._role)(d, i)),
          label: strOrUndef(this._nestWrapper(this._ariaLabel)(d, i)),
        },
      } as unknown as SceneNode);
    });
    // Include any labels produced by the most recent render() (the label TextBox
    // shares this shape's coordinate space, so its nodes append directly).
    if (
      this._labelClass &&
      typeof (this._labelClass as {toScene?: unknown}).toScene === "function" &&
      this._labelClass._data &&
      this._labelClass._data.length
    ) {
      children.push(...(this._labelClass.toScene().children as SceneNode[]));
    }
    return {type: "group", key: `${this._name}-group`, children};
  }

  render(callback?: () => void): this {
    // Populate the label TextBox so toScene() reads correct label data. The
    // label class is always in compute mode — the scene path materializes text.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lc = this._labelClass as unknown as {renderMode?: (m: string) => any};
    if (lc && typeof lc.renderMode === "function") lc.renderMode("compute");
    this._labelClass.data(this._buildLabelData());

    if (this._renderMode === "compute") {
      // A Viz pipeline is driving this shape — Viz.renderScene composes the
      // whole chart's scene itself, so don't spin up our own SvgRenderer.
      if (callback) setTimeout(callback, 0);
      return this;
    }

    // Standalone shape rendering: route the shape's own toScene() through
    // SvgRenderer. Preserves `new Rect().render()` ergonomics with no legacy
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
        // Use the caller's element as the container — SvgRenderer creates its
        // own <svg> inside it (nested svg-in-svg is valid SVG). The caller's
        // element is preserved so downstream test/queries still find it.
        while (node.firstChild) node.removeChild(node.firstChild);
        const scene = {root: this.toScene(), width, height};
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
    if (!arguments.length || _ === undefined) return this._active;
    this._active = _;
    // v4: active/hover visuals come from the scene path's paint recomputation
    // on the next render(); no DOM mutation here.
    return this;
  }

  /**
      When shapes are active, this is the opacity of any shape that is not active.
*/
  activeOpacity(): number;
  activeOpacity(_: number): this;
  activeOpacity(_?: number): number | this {
    return arguments.length
      ? ((this._activeOpacity = _!), this)
      : this._activeOpacity;
  }

  /**
      The style to apply to active shapes.
*/
  activeStyle(): Record<string, unknown>;
  activeStyle(_: Record<string, unknown>): this;
  activeStyle(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._activeStyle = assign({}, this._activeStyle, _!)), this)
      : this._activeStyle;
  }

  /**
      The aria-label attribute for each shape.
*/
  ariaLabel(): AccessorFn;
  ariaLabel(_: AccessorFn | string): this;
  ariaLabel(_?: AccessorFn | string): AccessorFn | this {
    return _ !== undefined
      ? ((this._ariaLabel = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._ariaLabel;
  }

  /**
      The background-image accessor for each shape.
*/
  backgroundImage(): AccessorFn;
  backgroundImage(_: AccessorFn | string): this;
  backgroundImage(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._backgroundImage = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._backgroundImage;
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
      Determines if either the X or Y position is discrete along a Line, which helps in determining the nearest data point on a line for a hit area event.
*/
  discrete(): string | undefined;
  discrete(_: string): this;
  discrete(_?: string): string | undefined | this {
    return arguments.length ? ((this._discrete = _), this) : this._discrete;
  }

  /**
      The animation duration in milliseconds.
*/
  duration(): number;
  duration(_: number): this;
  duration(_?: number): number | this {
    return arguments.length ? ((this._duration = _!), this) : this._duration;
  }

  /**
      The fill color accessor for each shape.
*/
  fill(): AccessorFn;
  fill(_: AccessorFn | string): this;
  fill(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._fill = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._fill;
  }

  /**
      Defines the "fill-opacity" attribute for the shapes.
*/
  fillOpacity(): AccessorFn;
  fillOpacity(_: AccessorFn | number): this;
  fillOpacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._fillOpacity = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._fillOpacity;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(): ((d: DataPoint, i: number) => boolean) | null;
  hover(_: ((d: DataPoint, i: number) => boolean) | null): this;
  hover(
    _?: ((d: DataPoint, i: number) => boolean) | null,
  ): ((d: DataPoint, i: number) => boolean) | null | this {
    if (!arguments.length || _ === void 0) return this._hover;
    this._hover = _;
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
      ? ((this._hoverStyle = assign({}, this._hoverStyle, _!)), this)
      : this._hoverStyle;
  }

  /**
      The opacity of non-hovered shapes when any shape is hovered.
*/
  hoverOpacity(): number;
  hoverOpacity(_: number): this;
  hoverOpacity(_?: number): number | this {
    return arguments.length
      ? ((this._hoverOpacity = _!), this)
      : this._hoverOpacity;
  }

  /**
      The mouse hit area accessor function.
      @example
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
*/
  hitArea():
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown>)
    | null;
  hitArea(
    _:
      | ((
          d: DataPoint,
          i: number,
          aes: Record<string, unknown>,
        ) => Record<string, unknown>)
      | Record<string, unknown>,
  ): this;
  hitArea(
    _?:
      | ((
          d: DataPoint,
          i: number,
          aes: Record<string, unknown>,
        ) => Record<string, unknown>)
      | Record<string, unknown>,
  ):
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown>)
    | null
    | this {
    return arguments.length
      ? ((this._hitArea = (typeof _ === "function" ? _ : constant(_)) as unknown as (d: DataPoint, i: number, aes: ShapeAes) => Record<string, unknown>), this)
      : this._hitArea;
  }

  /**
      The unique id accessor for each shape.
*/
  id(): AccessorFn;
  id(_: AccessorFn): this;
  id(_?: AccessorFn): AccessorFn | this {
    return arguments.length ? ((this._id = _!), this) : this._id;
  }

  /**
      The text label accessor for each shape.
*/
  label(): AccessorFn;
  label(_: AccessorFn | string | string[]): this;
  label(_?: AccessorFn | string | string[]): AccessorFn | this {
    return arguments.length
      ? ((this._label =
          typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn)),
        this)
      : this._label;
  }

  /**
      The label bounds accessor function.
      @example
function(d, i, shape) {
  return {
    "width": shape.width,
    "height": shape.height,
    "x": -shape.width / 2,
    "y": -shape.height / 2
  };
}
*/
  labelBounds():
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null;
  labelBounds(
    _:
      | ((
          d: DataPoint,
          i: number,
          aes: Record<string, unknown>,
        ) => Record<string, unknown> | null | false)
      | Record<string, unknown>,
  ): this;
  labelBounds(
    _?:
      | ((
          d: DataPoint,
          i: number,
          aes: Record<string, unknown>,
        ) => Record<string, unknown> | null | false)
      | Record<string, unknown>,
  ):
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null
    | this {
    return arguments.length
      ? ((this._labelBounds = (typeof _ === "function" ? _ : constant(_)) as unknown as typeof this._labelBounds), this)
      : this._labelBounds;
  }

  /**
      A pass-through to the config method of the TextBox class used to create a shape's labels.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._labelConfig = assign(this._labelConfig, _!)), this)
      : this._labelConfig;
  }

  /**
      The opacity accessor for each shape.
*/
  opacity(): AccessorFn;
  opacity(_: AccessorFn | number): this;
  opacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._opacity = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._opacity;
  }

  /**
      The pointer-events CSS property for each shape.
*/
  pointerEvents(): AccessorFn;
  pointerEvents(_: AccessorFn | string): this;
  pointerEvents(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._pointerEvents = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._pointerEvents;
  }

  /**
      The role attribute.
*/
  role(): AccessorFn;
  role(_: AccessorFn | string): this;
  role(_?: AccessorFn | string): AccessorFn | this {
    return _ !== undefined
      ? ((this._role = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._role;
  }

  /**
      The rotation angle in degrees for each shape.
*/
  rotate(): AccessorFn;
  rotate(_: AccessorFn | number): this;
  rotate(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._rotate = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._rotate;
  }

  /**
      Defines the "rx" attribute for the shapes.
*/
  rx(): AccessorFn;
  rx(_: AccessorFn | number): this;
  rx(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._rx = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._rx;
  }

  /**
      Defines the "rx" attribute for the shapes.
*/
  ry(): AccessorFn;
  ry(_: AccessorFn | number): this;
  ry(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._ry = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._ry;
  }

  /**
      The scale transform accessor for each shape.
*/
  scale(): AccessorFn;
  scale(_: AccessorFn | number): this;
  scale(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._scale = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._scale;
  }

  /**
      Controls whether render() does the full d3 enter/update/exit DOM work
      ("full", default) or skips it and only populates downstream state for
      toScene() ("compute"). Compute mode is the migration switch that lets the
      legacy attribute-application code stop running for charts driven by the
      scene backends.
*/
  renderMode(): "full" | "compute";
  renderMode(_: "full" | "compute"): this;
  renderMode(_?: "full" | "compute"): "full" | "compute" | this {
    if (!arguments.length) return this._renderMode;
    this._renderMode = _!;
    return this;
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
      The shape-rendering.

@example
function(d) {
  return d.x;
}
*/
  shapeRendering(): AccessorFn;
  shapeRendering(_: AccessorFn | string): this;
  shapeRendering(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._shapeRendering = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._shapeRendering;
  }

  /**
      A comparator function used to sort shapes for layering order.
*/
  sort(): ((a: DataPoint, b: DataPoint) => number) | null;
  sort(_: ((a: DataPoint, b: DataPoint) => number) | null): this;
  sort(
    _?: ((a: DataPoint, b: DataPoint) => number) | null,
  ): ((a: DataPoint, b: DataPoint) => number) | null | this {
    return arguments.length ? ((this._sort = _ ?? null), this) : this._sort;
  }

  /**
      The stroke color accessor for each shape.
*/
  stroke(): AccessorFn;
  stroke(_: AccessorFn | string): this;
  stroke(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._stroke = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._stroke;
  }

  /**
      Defines the "stroke-dasharray" attribute for the shapes.
*/
  strokeDasharray(): AccessorFn;
  strokeDasharray(_: AccessorFn | string): this;
  strokeDasharray(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._strokeDasharray = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._strokeDasharray;
  }

  /**
      Defines the "stroke-linecap" attribute for the shapes. Accepted values are `"butt"`, `"round"`, and `"square"`.
*/
  strokeLinecap(): AccessorFn;
  strokeLinecap(_: AccessorFn | string): this;
  strokeLinecap(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._strokeLinecap = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._strokeLinecap;
  }

  /**
      Defines the "stroke-opacity" attribute for the shapes.
*/
  strokeOpacity(): AccessorFn;
  strokeOpacity(_: AccessorFn | number): this;
  strokeOpacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._strokeOpacity = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._strokeOpacity;
  }

  /**
      The stroke-width.
*/
  strokeWidth(): AccessorFn;
  strokeWidth(_: AccessorFn | number): this;
  strokeWidth(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._strokeWidth = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._strokeWidth;
  }

  /**
      The text-anchor.
*/
  textAnchor(): AccessorFn;
  textAnchor(_: AccessorFn | string): this;
  textAnchor(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._textAnchor = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._textAnchor;
  }

  /**
      Defines the texture used inside of each shape. This uses the [textures.js](https://riccardoscalco.it/textures/) package, and expects either a simple string (`"lines"` or `"circles"`) or a more complex Object containing the various properties of the texture (ie. `{texture: "lines", orientation: "3/8", stroke: "darkorange"}`). If multiple textures are necessary, provide an accsesor Function that returns the correct String/Object for each given data point and index.
*/
  texture(): AccessorFn;
  texture(_: AccessorFn | string | Record<string, unknown>): this;
  texture(
    _?: AccessorFn | string | Record<string, unknown>,
  ): AccessorFn | this {
    return arguments.length
      ? ((this._texture =
          typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn)),
        this)
      : this._texture;
  }

  /**
      A series of global texture methods to be used for all textures (ie. `{stroke: "darkorange", strokeWidth: 2}`).
*/
  textureDefault(): Record<string, unknown>;
  textureDefault(_: Record<string, unknown>): this;
  textureDefault(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._textureDefault = assign(this._textureDefault, _!)), this)
      : this._textureDefault;
  }

  /**
      The vector-effect.
*/
  vectorEffect(): AccessorFn;
  vectorEffect(_: AccessorFn | string): this;
  vectorEffect(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._vectorEffect = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._vectorEffect;
  }

  /**
      The vertical alignment.
*/
  verticalAlign(): AccessorFn;
  verticalAlign(_: AccessorFn | string): this;
  verticalAlign(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._verticalAlign = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn),
        this)
      : this._verticalAlign;
  }

  /**
      The x position accessor for each shape.

@example
function(d) {
  return d.x;
}
*/
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._x = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._x;
  }

  /**
      The y position accessor for each shape.

@example
function(d) {
  return d.y;
}
*/
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._y = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._y;
  }
}
