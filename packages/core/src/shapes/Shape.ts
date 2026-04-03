import {min} from "d3-array";
import {color} from "d3-color";
import {pointer, select, selectAll} from "d3-selection";
import * as paths from "d3-shape";
import {transition} from "d3-transition";
import textures from "textures";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {unique} from "@d3plus/data";
import {assign, attrize, elem, isObject} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {pointDistance} from "@d3plus/math";
import {strip} from "@d3plus/text";

import {TextBox} from "../components/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

export interface ShapeAes {
  width?: number;
  height?: number;
  points?: [number, number][];
  r?: number;
  x?: number;
  y?: number;
}

/**
 * @param {*} nodeList
 * @param {*} classNames
 * @private
*/
function findLastIndexWithClass(
  nodeList: NodeListOf<ChildNode>,
  classNames: string[],
): number {
  for (let x = 0; x < classNames.length; x++) {
    const className = classNames[x];
    for (let i = nodeList.length - 1; i >= 0; i--) {
      // Iterate backwards
      if ((nodeList[i] as Element).classList.contains(className)) {
        // Check for the class
        return i; // Return the index if found
      }
    }
  }
  return -1; // Return -1 if no element is found with the class
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
  _labelBounds:
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
  _texture: AccessorFn;
  _textureDefault: Record<string, unknown>;
  _textureDefs: Record<string, Record<string, unknown>>;
  _vectorEffect: AccessorFn;
  _verticalAlign: AccessorFn;
  _x: AccessorFn;
  _y: AccessorFn;
  _select: D3Selection;
  _transition: ReturnType<typeof transition>;
  /** @param data The raw data array to filter. */
  _dataFilter?(data: DataPoint[]): DataPoint[];
  _sort: ((a: DataPoint, b: DataPoint) => number) | null;
  _group: D3Selection;
  _update: D3Selection;
  _enter: D3Selection;
  _exit: D3Selection;
  _hoverGroup: D3Selection;
  _activeGroup: D3Selection;
  _hitArea:
    | ((d: DataPoint, i: number, aes: ShapeAes) => Record<string, unknown>)
    | null;
  _active: ((d: DataPoint, i: number) => boolean) | null;
  _hover: ((d: DataPoint, i: number) => boolean) | null;
  _discrete: string | undefined;
  _path: Record<string, unknown>;
  _defined: AccessorFn;
  _curve: AccessorFn;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor(tagName: string = "g") {
    super();

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
      Adds event listeners to each shape group or hit area.
      @private
*/
  _applyEvents(handler: D3Selection): void {
    const events = Object.keys(this._on);
    for (let e = 0; e < events.length; e++) {
      handler.on(events[e], (event: Event, d: DataPoint) => {
        let i: number = 0;
        if (!this._on[events[e]]) return;
        if (d.i !== void 0) i = d.i as number;
        if (d.nested && d.values) {
          const calcPoint = (d: DataPoint, i: number): [number, number] => {
            if (this._discrete === "x")
              return [this._x(d, i) as number, cursor[1]];
            else if (this._discrete === "y")
              return [cursor[0], this._y(d, i) as number];
            else return [this._x(d, i) as number, this._y(d, i) as number];
          };
          const cursor = pointer(event, this._select.node()),
            values = (d.values as unknown as DataPoint[]).map((d: DataPoint) =>
              pointDistance(cursor, calcPoint(d, i)),
            );
          i = values.indexOf(min(values)!);
          d = (d.values as unknown as DataPoint[])[i];
        }
        this._on[events[e]].bind(this)(d, i, undefined, event);
      });
    }
  }

  /**
      Provides the updated styling to the given shape elements.

      @private
*/
  _updateStyle(elem: D3Selection, style: Record<string, unknown>): void {
    const that = this;

    if (elem.size() && elem.node()!.tagName === "g")
      elem = elem.selectAll("*") as unknown as D3Selection;

    /**
        Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @param d data point
        @param i index
        @private
*/
    function styleLogic(this: unknown, d: DataPoint, i: number): unknown {
      return typeof this !== "function"
        ? this
        : d.nested && d.key && d.values
          ? this(
              (d.values as unknown as DataPoint[])[0],
              that._data.indexOf((d.values as unknown as DataPoint[])[0]),
            )
          : this(d, i);
    }

    const styleObject: Record<string, unknown> = {};
    for (const key in style) {
      if ({}.hasOwnProperty.call(style, key)) {
        styleObject[key] = styleLogic.bind(style[key]);
      }
    }

    (elem as any).transition().duration(0).call(attrize, styleObject);
  }

  /**
      Provides the default styling to the shape elements.
      @param elem @private
*/
  _applyStyle(elem: D3Selection): void {
    const that = this;

    if (elem.size() && elem.node()!.tagName === "g")
      elem = elem.selectAll("*") as unknown as D3Selection;

    /**
        Determines whether a shape is a nested collection of data points, and uses the appropriate data and index for the given function context.
        @param d data point
        @param i index
        @private
*/
    function styleLogic(this: unknown, d: DataPoint, i: number): unknown {
      return typeof this !== "function"
        ? this
        : d.nested && d.key && d.values
          ? this(
              (d.values as unknown as DataPoint[])[0],
              that._data.indexOf((d.values as unknown as DataPoint[])[0]),
            )
          : this(d, i);
    }

    (elem as any)
      .attr("fill", (d: DataPoint, i: number) => {
        const texture = this._getTextureKey.bind(this)(d, i);
        return texture
          ? (
              this._textureDefs[texture] as Record<string, unknown> & {
                url: () => string;
              }
            ).url()
          : styleLogic.bind(this._fill)(d, i);
      })
      .attr("fill-opacity", styleLogic.bind(this._fillOpacity))
      .attr("rx", styleLogic.bind(this._rx))
      .attr("ry", styleLogic.bind(this._ry))
      .attr("stroke", styleLogic.bind(this._stroke))
      .attr("stroke-dasharray", styleLogic.bind(this._strokeDasharray))
      .attr("stroke-linecap", styleLogic.bind(this._strokeLinecap))
      .attr("stroke-opacity", styleLogic.bind(this._strokeOpacity))
      .attr("stroke-width", styleLogic.bind(this._strokeWidth))
      .attr("vector-effect", styleLogic.bind(this._vectorEffect));
  }

  /**
      Calculates the transform for the group elements.
      @param elem @private
*/
  _applyTransform(elem: D3Selection): void {
    (elem as any).attr(
      "transform",
      (d: DataPoint, i: number) => `
        translate(${
          d.__d3plusShape__
            ? d.translate
              ? d.translate
              : `${this._x(d.data as DataPoint, d.i as number)},${this._y(d.data as DataPoint, d.i as number)}`
            : `${this._x(d, i)},${this._y(d, i)}`
        })
        scale(${
          d.__d3plusShape__
            ? d.scale || this._scale(d.data as DataPoint, d.i as number)
            : this._scale(d, i)
        })
        rotate(${
          d.__d3plusShape__
            ? d.rotate
              ? d.rotate
              : this._rotate((d.data || d) as DataPoint, d.i as number)
            : this._rotate((d.data || d) as DataPoint, d.i as number)
        })`,
    );
  }

  /**
      Returns a full JSON string of the texture config for a given data point.

      @private
*/
  _getTextureKey(d: DataPoint, i: number): string | false {
    let textureVal: unknown = this._texture(d, i);
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
      Modifies existing shapes to show active status.
      @private
*/
  _renderActive(): void {
    const that = this;

    this._group
      .selectAll(".d3plus-Shape, .d3plus-Image, .d3plus-textBox")
      .each(function (this: Element, d: DataPoint, i: number) {
        if (!d) d = {} as DataPoint;
        if (!d.parentNode)
          d.parentNode = this
            .parentNode as unknown as DataPoint[keyof DataPoint];
        const parent = d.parentNode as unknown as Node;

        if (select(this).classed("d3plus-textBox")) d = d.data as DataPoint;
        if (d.__d3plusShape__ || d.__d3plus__) {
          while (d && (d.__d3plusShape__ || d.__d3plus__)) {
            i = d.i as number;
            d = d.data as DataPoint;
          }
        } else i = that._data.indexOf(d);

        const group: Node =
          !that._active ||
          typeof that._active !== "function" ||
          !that._active(d, i)
            ? parent
            : that._activeGroup.node();
        if (group !== this.parentNode) {
          group.appendChild(this);
          if ((this as SVGElement).className.baseVal.includes("d3plus-Shape")) {
            if (parent === group)
              select(this).call(that._applyStyle.bind(that) as any);
            else
              select(this).call(
                that._updateStyle.bind(that, select(this), that._activeStyle),
              );
          }
        }
      });

    // this._renderImage();
    // this._renderLabels();

    this._group
      .selectAll(
        `g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text`,
      )
      .attr(
        "opacity",
        this._hover
          ? this._hoverOpacity
          : this._active
            ? this._activeOpacity
            : 1,
      );
  }

  /**
      Modifies existing shapes to show hover status.
      @private
*/
  _renderHover(): void {
    const that = this;

    this._group
      .selectAll(
        `g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text, g.d3plus-${this._name}-hover`,
      )
      .selectAll(".d3plus-Shape, .d3plus-Image, .d3plus-textBox")
      .each(function (this: Element, d: DataPoint, i: number) {
        if (!d) d = {} as DataPoint;
        if (!d.parentNode)
          d.parentNode = this
            .parentNode as unknown as DataPoint[keyof DataPoint];
        const parent = d.parentNode as unknown as Node;

        const d3plusType = select(this).classed("d3plus-textBox")
          ? "textBox"
          : select(this).classed("d3plus-Image")
            ? "Image"
            : "Shape";

        if (d3plusType === "textBox") d = d.data as DataPoint;
        if (d.__d3plusShape__ || d.__d3plus__) {
          while (d && (d.__d3plusShape__ || d.__d3plus__)) {
            i = d.i as number;
            d = d.data as DataPoint;
          }
        } else i = that._data.indexOf(d);

        const notHovering =
          !that._hover ||
          typeof that._hover !== "function" ||
          !that._hover(d, i);
        const group = notHovering ? parent : that._hoverGroup.node();
        if (group !== this.parentNode) {
          const afterIndex =
            d3plusType === "textBox"
              ? findLastIndexWithClass(group.childNodes, [
                  "d3plus-Image",
                  "d3plus-Shape",
                ])
              : d3plusType === "Image"
                ? findLastIndexWithClass(group.childNodes, ["d3plus-Shape"])
                : -1;
          if (notHovering) group.appendChild(this);
          else if (afterIndex === -1) group.prepend(this);
          else group.childNodes[afterIndex].after(this);
        }
        if ((this as SVGElement).className.baseVal.includes("d3plus-Shape")) {
          if (parent === group)
            select(this).call(that._applyStyle.bind(that) as any);
          else
            select(this).call(
              that._updateStyle.bind(
                that,
                select(this),
                that._hoverStyle,
              ) as any,
            );
        }
      });

    // this._renderImage();
    // this._renderLabels();

    this._group
      .selectAll(
        `g.d3plus-${this._name}-shape, g.d3plus-${this._name}-image, g.d3plus-${this._name}-text`,
      )
      .attr(
        "opacity",
        this._hover
          ? this._hoverOpacity
          : this._active
            ? this._activeOpacity
            : 1,
      );
  }

  /**
      Adds background image to each shape group.
      @private
*/
  _renderImage(): void {
    const imageData: DataPoint[] = [];

    this._update
      .merge(this._enter)
      .data()
      .forEach((datum: DataPoint, i: number) => {
        const aes = this._aes(datum, i);

        if (aes.r || (aes.width && aes.height)) {
          let d: DataPoint = datum;
          if (datum.nested && datum.key && datum.values) {
            d = (datum.values as unknown as DataPoint[])[0];
            i = this._data.indexOf(d);
          }

          const height = aes.r ? (aes.r as number) * 2 : (aes.height as number),
            url = this._backgroundImage(d, i),
            width = aes.r ? (aes.r as number) * 2 : (aes.width as number);

          if (url) {
            let x: number = d.__d3plusShape__
                ? d.translate
                  ? (d.translate as unknown as number[])[0]
                  : (this._x(d.data as DataPoint, d.i as number) as number)
                : (this._x(d, i) as number),
              y: number = d.__d3plusShape__
                ? d.translate
                  ? (d.translate as unknown as number[])[1]
                  : (this._y(d.data as DataPoint, d.i as number) as number)
                : (this._y(d, i) as number);

            if (aes.x) x += aes.x as number;
            if (aes.y) y += aes.y as number;

            if (d.__d3plusShape__) {
              d = d.data as DataPoint;
              i = d.i as number;
            }

            imageData.push({
              __d3plus__: true,
              data: d,
              height,
              i,
              id: this._id(d, i),
              url,
              width,
              x: x + -width / 2,
              y: y + -height / 2,
            } as unknown as DataPoint);
          }
        }
      });

    this._backgroundImageClass
      .data(imageData)
      .duration(this._duration)
      .opacity(this._nestWrapper(this._opacity))
      .pointerEvents("none")
      .select(
        elem(`g.d3plus-${this._name}-image`, {
          parent: this._group,
          update: {opacity: this._active ? this._activeOpacity : 1},
        }).node(),
      )
      .render();
  }

  /**
      Adds labels to each shape group.
      @private
*/
  _renderLabels(): void {
    const labelData: DataPoint[] = [];

    this._update
      .merge(this._enter)
      .data()
      .forEach((datum: DataPoint, i: number) => {
        let d: DataPoint = datum;
        if (datum.nested && datum.key && datum.values) {
          d = (datum.values as unknown as DataPoint[])[0];
          i = this._data.indexOf(d);
        }

        let labels: unknown = this._label(d, i);

        if (
          this._labelBounds &&
          labels !== false &&
          labels !== undefined &&
          labels !== null
        ) {
          const bounds = this._labelBounds.bind(this)(
            d,
            i,
            this._aes(datum, i),
          ) as Record<string, unknown>;

          if (bounds) {
            if ((labels as unknown[]).constructor !== Array) labels = [labels];

            const x: number = d.__d3plusShape__
                ? d.translate
                  ? (d.translate as unknown as number[])[0]
                  : (this._x(d.data as DataPoint, d.i as number) as number)
                : (this._x(d, i) as number),
              y: number = d.__d3plusShape__
                ? d.translate
                  ? (d.translate as unknown as number[])[1]
                  : (this._y(d.data as DataPoint, d.i as number) as number)
                : (this._y(d, i) as number);

            if (d.__d3plusShape__) {
              d = d.data as DataPoint;
              i = d.i as number;
            }

            for (let l = 0; l < (labels as unknown[]).length; l++) {
              const b = (
                bounds.constructor === Array
                  ? (bounds as unknown as Record<string, unknown>[])[l]
                  : Object.assign({}, bounds)
              ) as Record<string, number>;
              const rotate = this._rotate(d, i) as number;
              const labelConfig = d.labelConfig as DataPoint | undefined;
              let r: number =
                labelConfig && labelConfig.rotate
                  ? (labelConfig.rotate as number)
                  : bounds.angle !== undefined
                    ? (bounds.angle as number)
                    : 0;
              r += rotate;
              const rotateAnchor =
                rotate !== 0
                  ? [b.x * -1 || 0, b.y * -1 || 0]
                  : [b.width / 2, b.height / 2];

              labelData.push({
                __d3plus__: true,
                data: d,
                height: b.height,
                l,
                id: `${this._id(d, i)}_${l}`,
                r,
                rotateAnchor,
                text: (labels as unknown[])[l],
                width: b.width,
                x: x + b.x,
                y: y + b.y,
              } as unknown as DataPoint);
            }
          }
        }
      });

    this._labelClass
      .data(labelData)
      .duration(this._duration)
      .fontOpacity(this._nestWrapper(this._opacity) as unknown as number)
      .pointerEvents("none")
      .rotate(
        ((d: DataPoint) =>
          (d.__d3plus__
            ? d.r
            : (d.data as DataPoint)
                .r) as unknown as number) as unknown as number,
      )
      .rotateAnchor(
        (d: DataPoint) =>
          (d.__d3plus__
            ? d.rotateAnchor
            : (d.data as DataPoint).rotateAnchor) as unknown as [
            number,
            number,
          ],
      )
      .select(
        elem(`g.d3plus-${this._name}-text`, {
          parent: this._group,
          update: {opacity: this._active ? this._activeOpacity : 1},
        }).node(),
      )
      .config(configPrep.bind(this)(this._labelConfig))
      .render();
  }

  /**
      Renders the current Shape to the page. If a *callback* is specified, it will be called once the shapes are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    if (this._select === void 0) {
      this.select(
        select("body")
          .append("svg")
          .style("width", `${window.innerWidth}px`)
          .style("height", `${window.innerHeight}px`)
          .style("display", "block")
          .node(),
      );
    }

    this._transition = transition(this._uuid).duration(this._duration);

    let data: DataPoint[] & {key?: AccessorFn} = this._data,
      key: AccessorFn = this._id;
    if (this._dataFilter) {
      data = this._dataFilter(data) as DataPoint[] & {key?: AccessorFn};
      if (data.key) key = data.key;
    }

    if (this._sort) {
      data = data.sort((a: DataPoint, b: DataPoint) => {
        while (a.__d3plusShape__ || a.__d3plus__) a = a.data as DataPoint;
        while (b.__d3plusShape__ || b.__d3plus__) b = b.data as DataPoint;
        return this._sort!(a, b);
      });
    }

    const textureSet = unique(
      data.map(
        this._getTextureKey.bind(this) as (
          d: DataPoint,
          i: number,
        ) => string | false,
      ),
    ).filter(Boolean) as string[];

    const existingTextureDefs = Object.keys(this._textureDefs);

    existingTextureDefs.forEach(key => {
      if (!textureSet.includes(key)) {
        select(
          (this._select as any)
            .select(
              `pattern#${(this._textureDefs[key] as Record<string, unknown> & {id: () => string}).id()}`,
            )
            .node().parentNode,
        ).remove();
        delete this._textureDefs[key];
      }
    });

    textureSet.forEach((key: string) => {
      if (!existingTextureDefs.includes(key)) {
        const config = JSON.parse(key);
        const textureClass = config.texture;
        delete config.texture;
        const t = (textures as any)[textureClass]();
        for (const k in config) {
          if ({}.hasOwnProperty.call(t, k) && k in t) {
            if (k === "d" && typeof k === "function") t[k](() => config[k]);
            else
              config[k] instanceof Array
                ? t[k].apply(null, config[k])
                : t[k](config[k]);
          }
        }
        this._select.call(t);
        this._textureDefs[key] = t;
      }
    });

    selectAll(
      `g.d3plus-${this._name}-hover > *, g.d3plus-${this._name}-active > *`,
    ).each(function (this: Element, d: DataPoint) {
      if (d && d.parentNode)
        (d.parentNode as unknown as Node).appendChild(this);
      else this.parentNode!.removeChild(this);
    });

    // Makes the update state of the group selection accessible.
    this._group = elem(`g.d3plus-${this._name}-group`, {parent: this._select});
    const update = (this._update = elem(`g.d3plus-${this._name}-shape`, {
      parent: this._group,
      update: {opacity: this._active ? this._activeOpacity : 1},
    })
      .selectAll(`.d3plus-${this._name}`)
      .data(data, key as never));

    // Orders and transforms the updating Shapes.
    update.order();
    if (this._duration) {
      update.transition(this._transition).call(this._applyTransform.bind(this));
    } else {
      update.call(this._applyTransform.bind(this));
    }

    // Makes the enter state of the group selection accessible.
    const enter = (this._enter = update
      .enter()
      .append(this._tagName)
      .attr(
        "class",
        (d: DataPoint, i: number) =>
          `d3plus-Shape d3plus-${this._name} d3plus-id-${strip(this._nestWrapper(this._id)(d, i) as string)}`,
      )
      .call(this._applyTransform.bind(this))
      .attr("aria-label", this._ariaLabel as never)
      .attr("role", this._role as never)
      .attr("opacity", this._nestWrapper(this._opacity) as never));

    const enterUpdate = enter.merge(update);

    let enterUpdateRender = enterUpdate.attr(
      "shape-rendering",
      this._nestWrapper(this._shapeRendering) as never,
    );

    if (this._duration) {
      enterUpdateRender = enterUpdateRender
        .attr("pointer-events", "none")
        .transition(this._transition)
        .transition()
        .delay(100)
        .attr(
          "pointer-events",
          this._pointerEvents as never,
        ) as unknown as D3Selection;
    }

    enterUpdateRender.attr(
      "opacity",
      this._nestWrapper(this._opacity) as never,
    );

    // Makes the exit state of the group selection accessible.
    const exit = (this._exit = update.exit());
    if (this._duration) exit.transition().delay(this._duration).remove();
    else exit.remove();

    this._renderImage();
    this._renderLabels();

    this._hoverGroup = elem(`g.d3plus-${this._name}-hover`, {
      parent: this._group,
    });
    this._activeGroup = elem(`g.d3plus-${this._name}-active`, {
      parent: this._group,
    });

    const hitAreas = this._group
      .selectAll(".d3plus-HitArea")
      .data(
        this._hitArea && Object.keys(this._on).length ? data : [],
        key as never,
      );

    hitAreas.order().call(this._applyTransform.bind(this));

    const isLine = this._name === "Line";

    if (isLine) {
      const curve = this._curve.bind(this)(
        this.config() as DataPoint,
      ) as string;
      isLine &&
        (this._path as any)
          .curve(
            (paths as any)[
              `curve${curve.charAt(0).toUpperCase()}${curve.slice(1)}`
            ],
          )
          .defined(this._defined)
          .x(this._x)
          .y(this._y);
    }

    const hitEnter = hitAreas
      .enter()
      .append(isLine ? "path" : "rect")
      .attr(
        "class",
        (d: DataPoint, i: number) =>
          `d3plus-HitArea d3plus-id-${strip(this._nestWrapper(this._id)(d, i) as string)}`,
      )
      .attr("fill", "black")
      .attr("stroke", "black")
      .attr("pointer-events", "painted")
      .attr("opacity", 0)
      .call(this._applyTransform.bind(this));

    const that = this;

    const hitUpdates = hitAreas.merge(hitEnter).each(function (
      this: Element,
      d: DataPoint,
    ) {
      const i = that._data.indexOf(d);
      const h = that._hitArea!(d, i, that._aes(d, i));
      return h &&
        !(
          that._name === "Line" &&
          parseFloat(that._strokeWidth(d, i) as string) > 10
        )
        ? select(this).call(
            attrize,
            h as Record<string, string | number | boolean>,
          )
        : select(this).remove();
    });

    hitAreas.exit().remove();

    this._applyEvents(this._hitArea ? hitUpdates : enterUpdate);

    setTimeout(() => {
      if (this._active) this._renderActive();
      else if (this._hover) this._renderHover();
      if (callback) callback();
    }, this._duration + 100);

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
    if (this._group) {
      // this._renderImage();
      // this._renderLabels();
      this._renderActive();
    }
    return this;
  }

  /**
      When shapes are active, this is the opacity of any shape that is not active.
*/
  backgroundImage(): AccessorFn;
  backgroundImage(_: AccessorFn | string): this;
  backgroundImage(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._backgroundImage = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._fill = typeof _ === "function" ? _ : constant(_)), this)
      : this._fill;
  }

  /**
      Defines the "fill-opacity" attribute for the shapes.
*/
  fillOpacity(): AccessorFn;
  fillOpacity(_: AccessorFn | number): this;
  fillOpacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._fillOpacity = typeof _ === "function" ? _ : constant(_)), this)
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
    if (this._group) {
      // this._renderImage();
      // this._renderLabels();
      this._renderHover();
    }
    return this;
  }

  /**
      The style to apply to hovered shapes.
*/
  hoverStyle(): Record<string, unknown>;
  hoverStyle(_: Record<string, unknown>): this;
  hoverStyle(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._hoverStyle = assign({}, this._hoverStyle, _)), this)
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
      ? ((this._hitArea = typeof _ === "function" ? _ : constant(_)), this)
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
      ? ((this._labelBounds = typeof _ === "function" ? _ : constant(_)), this)
      : this._labelBounds;
  }

  /**
      A pass-through to the config method of the TextBox class used to create a shape's labels.
*/
  labelConfig(): Record<string, unknown>;
  labelConfig(_: Record<string, unknown>): this;
  labelConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._labelConfig = assign(this._labelConfig, _)), this)
      : this._labelConfig;
  }

  /**
      The opacity accessor for each shape.
*/
  opacity(): AccessorFn;
  opacity(_: AccessorFn | number): this;
  opacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._opacity = typeof _ === "function" ? _ : constant(_)), this)
      : this._opacity;
  }

  /**
      The pointer-events CSS property for each shape.
*/
  pointerEvents(): AccessorFn;
  pointerEvents(_: AccessorFn | string): this;
  pointerEvents(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._pointerEvents = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._role = typeof _ === "function" ? _ : constant(_)), this)
      : this._role;
  }

  /**
      The rotation angle in degrees for each shape.
*/
  rotate(): AccessorFn;
  rotate(_: AccessorFn | number): this;
  rotate(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._rotate = typeof _ === "function" ? _ : constant(_)), this)
      : this._rotate;
  }

  /**
      Defines the "rx" attribute for the shapes.
*/
  rx(): AccessorFn;
  rx(_: AccessorFn | number): this;
  rx(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._rx = typeof _ === "function" ? _ : constant(_)), this)
      : this._rx;
  }

  /**
      Defines the "rx" attribute for the shapes.
*/
  ry(): AccessorFn;
  ry(_: AccessorFn | number): this;
  ry(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._ry = typeof _ === "function" ? _ : constant(_)), this)
      : this._ry;
  }

  /**
      The scale transform accessor for each shape.
*/
  scale(): AccessorFn;
  scale(_: AccessorFn | number): this;
  scale(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._scale = typeof _ === "function" ? _ : constant(_)), this)
      : this._scale;
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
      ? ((this._shapeRendering = typeof _ === "function" ? _ : constant(_)),
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
    return arguments.length ? ((this._sort = _), this) : this._sort;
  }

  /**
      The stroke color accessor for each shape.
*/
  stroke(): AccessorFn;
  stroke(_: AccessorFn | string): this;
  stroke(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._stroke = typeof _ === "function" ? _ : constant(_)), this)
      : this._stroke;
  }

  /**
      Defines the "stroke-dasharray" attribute for the shapes.
*/
  strokeDasharray(): AccessorFn;
  strokeDasharray(_: AccessorFn | string): this;
  strokeDasharray(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._strokeDasharray = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._strokeLinecap = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._strokeOpacity = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._strokeWidth = typeof _ === "function" ? _ : constant(_)), this)
      : this._strokeWidth;
  }

  /**
      The text-anchor.
*/
  textAnchor(): AccessorFn;
  textAnchor(_: AccessorFn | string): this;
  textAnchor(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._textAnchor = typeof _ === "function" ? _ : constant(_)), this)
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
      ? ((this._textureDefault = assign(this._textureDefault, _)), this)
      : this._textureDefault;
  }

  /**
      The vector-effect.
*/
  vectorEffect(): AccessorFn;
  vectorEffect(_: AccessorFn | string): this;
  vectorEffect(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._vectorEffect = typeof _ === "function" ? _ : constant(_)), this)
      : this._vectorEffect;
  }

  /**
      The vertical alignment.
*/
  verticalAlign(): AccessorFn;
  verticalAlign(_: AccessorFn | string): this;
  verticalAlign(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._verticalAlign = typeof _ === "function" ? _ : constant(_)),
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
      ? ((this._x = typeof _ === "function" ? _ : constant(_)), this)
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
      ? ((this._y = typeof _ === "function" ? _ : constant(_)), this)
      : this._y;
  }
}
