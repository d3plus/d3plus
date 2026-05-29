import {max, sum} from "d3-array";
import {select} from "d3-selection";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {assign, backgroundColor, elem, rtl as detectRTL, textWidth} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {textWrap} from "@d3plus/text";
import type {GroupNode, SceneNode, Transform} from "@d3plus/render";

import {TextBox} from "../components/index.js";
import * as shapes from "../shapes/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

const padding = 5;

/** Legend's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const legendSchema: ConfigField[] = [
  {key: "align", coerce: "identity", default: "center"},
  {key: "direction", coerce: "identity", default: "row"},
  {key: "duration", coerce: "identity", default: 600},
  {key: "height", coerce: "identity", default: 200},
  {key: "id", coerce: "identity", default: accessor("id")},
  {key: "label", coerce: "const", default: accessor("id")},
  {key: "padding", coerce: "identity", default: 5},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "shape", coerce: "const", default: constant("Rect")},
  {key: "title", coerce: "identity"},
  {key: "verticalAlign", coerce: "identity", default: "middle"},
  {key: "width", coerce: "identity", default: 400},
];

/**
    Creates an SVG legend based on an array of data.
*/
export default class Legend extends BaseClass {
  // installFluent generates the config accessors (align, width, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _titleClass: TextBox;
  _data: DataPoint[];
  _lineData: Record<string, unknown>[];
  _outerBounds: Record<string, number>;
  _select!: D3Selection;
  _shapes: unknown[];
  _rtl: boolean;
  _group!: D3Selection;
  _titleGroup!: D3Selection;
  _shapeGroup!: D3Selection;
  _titleHeight: number;
  _titleWidth: number;
  _wrapLines: (() => void) | undefined;
  _wrapRows: (() => void) | undefined;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, legendSchema);

    this._titleClass = new TextBox();

    this._data = [];
    this._lineData = [];
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._shapes = [];
    this.schema.shapeConfig = {
      fill: accessor("color"),
      height: constant(12),
      hitArea: (dd: DataPoint, i: number) => {
        const d = this._lineData[i],
          h = max([d.height as number, d.shapeHeight as number]);
        return {
          width: (d.width as number) + (d.shapeWidth as number),
          height: h,
          x: -(d.shapeWidth as number) / 2,
          y: -h! / 2,
        };
      },
      labelBounds: (dd: DataPoint, i: number) => {
        const d = this._lineData[i];
        let x = (d.shapeWidth as number) / 2;
        if (d.shape === "Circle") x -= (d.shapeR as number) / 2;
        const height = max([d.shapeHeight as number, d.height as number]);
        const rtlMod = this._rtl
          ? (d.shapeWidth as number) + (d.width as number) + this.schema.padding * 2
          : 0;
        return {
          width: d.width as number,
          height,
          x: x + padding - rtlMod,
          y: -height! / 2,
        };
      },
      labelConfig: {
        fontColor: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
        fontFamily: this._titleClass.fontFamily(),
        fontResize: false,
        fontSize: constant(10),
        verticalAlign: "middle",
      },
      opacity: 1,
      r: constant(6),
      width: constant(12),
      x: (d: DataPoint, i: number) => {
        const datum = this._lineData[i];
        const y = datum.y;
        const pad =
          this.schema.align === "left" ||
          (this.schema.align === "right" && this.schema.direction === "column")
            ? 0
            : this.schema.align === "center"
              ? (this._outerBounds.width -
                  this._rowWidth(
                    this._lineData.filter(
                      (l: Record<string, unknown>) => y === l.y,
                    ),
                  )) /
                2
              : this._outerBounds.width -
                this._rowWidth(
                  this._lineData.filter((l: Record<string, unknown>) => y === l.y),
                );
        const prevWords = this._lineData
          .slice(0, i)
          .filter((l: Record<string, unknown>) => y === l.y);
        const rtlMod = this._rtl ? (datum.width as number) + this.schema.padding : 0;
        return (
          this._rowWidth(prevWords) +
          this.schema.padding * (prevWords.length ? (datum.sentence ? 2 : 1) : 0) +
          this._outerBounds.x +
          (datum.shapeWidth as number) / 2 +
          pad +
          rtlMod
        );
      },
      y: (d: DataPoint, i: number) => {
        const ld = this._lineData[i];
        return (
          (ld.y as number) +
          this._titleHeight +
          this._outerBounds.y +
          max(
            this._lineData
              .filter((l: Record<string, unknown>) => ld.y === l.y)
              .map((l: Record<string, unknown>) => l.height as number)
              .concat(
                this._data.map((l: DataPoint, x: number) =>
                  this._fetchConfig("height", l, x) as number,
                ),
              ),
          )! /
            2
        );
      },
    };
    this.schema.titleConfig = {
      fontSize: 12,
    };
    this._rtl = false;
    this._titleHeight = 0;
    this._titleWidth = 0;
  }

  /**
    @param key The configuration key.
    @param d The data point.
    @param i The data index.
    @private
  */
  _fetchConfig(key: string, d: DataPoint, i: number): unknown {
    const labelConfig = this.schema.shapeConfig.labelConfig as Record<string, unknown> | undefined;
    const val =
      this.schema.shapeConfig[key] !== undefined
        ? this.schema.shapeConfig[key]
        : labelConfig?.[key];
    if (!val && key === "lineHeight")
      return (this._fetchConfig("fontSize", d, i) as number) * 1.4;
    return typeof val === "function" ? (val as (d: DataPoint, i: number) => unknown)(d, i) : val;
  }

  /**
    @param row The legend row data.
    @private
  */
  _rowHeight(row: Record<string, unknown>[]): number {
    return (
      max(
        row
          .map((d: Record<string, unknown>) => d.height as number)
          .concat(row.map((d: Record<string, unknown>) => d.shapeHeight as number)),
      )! + this.schema.padding
    );
  }

  /**
    @param row The legend row data.
    @private
  */
  _rowWidth(row: Record<string, unknown>[]): number {
    return sum(
      row.map((d: Record<string, unknown>, i: number) => {
        const p = this.schema.padding * (i === row.length - 1 ? 0 : d.width ? 2 : 1);
        return (d.shapeWidth as number) + (d.width as number) + p;
      }),
    );
  }

  /**
      Produces a backend-agnostic scene graph for this legend with no DOM dependency:
      the title is composed from its TextBox.toScene(), and each swatch group is
      composed from the stored Shape instances' toScene() (positions resolve through
      the x/y accessors against this._lineData / this._outerBounds).
*/
  toScene(): GroupNode {
    const children: SceneNode[] = [];

    if (
      this._titleClass &&
      typeof (this._titleClass as {toScene?: unknown}).toScene === "function" &&
      (this._titleClass as {_data?: unknown[]})._data &&
      ((this._titleClass as {_data?: unknown[]})._data as unknown[]).length
    ) {
      children.push((this._titleClass as {toScene: () => GroupNode}).toScene());
    }

    (this._shapes || []).forEach((shape: unknown) => {
      const s = shape as {
        toScene?: () => GroupNode;
        _data?: unknown[];
        _labelClass?: {toScene?: () => GroupNode; _data?: unknown[]};
      };
      if (s && typeof s.toScene === "function" && s._data && s._data.length) {
        children.push(s.toScene());
        // Shape.toScene no longer includes labels (collectComputed is
        // the canonical aggregator); legend composes labels per shape
        // here so swatch text still appears.
        const lbl = s._labelClass;
        if (lbl && typeof lbl.toScene === "function" && lbl._data && lbl._data.length) {
          const lblScene = lbl.toScene();
          if (lblScene && Array.isArray(lblScene.children))
            children.push(...(lblScene.children as SceneNode[]));
        }
      }
    });

    // Preserve the placement of the legend container the caller positioned.
    let transform: Transform | undefined;
    const node =
      this._select && typeof this._select.node === "function"
        ? (this._select.node() as Element | null)
        : null;
    if (node && typeof node.getAttribute === "function") {
      const attr = node.getAttribute("transform");
      if (attr) {
        const m = /translate\(\s*([-\d.eE]+)[\s,]+([-\d.eE]+)/.exec(attr);
        if (m) transform = {x: Number(m[1]), y: Number(m[2])};
      }
    }

    return {
      type: "group",
      key: `Legend-${this._uuid.slice(0, 8)}`,
      ...(transform ? {transform} : {}),
      children,
    };
  }

  /**
      Renders the current Legend to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    // Skip the body-svg fallback in compute mode — the caller intends
    // a DOM-free snapshot via `toScene()`. Mirrors Axis.render's
    // standalone-compute branch so Legend doesn't leak <svg>s into
    // <body> on every render() call when used as a scene-emitter.
    if (this._select === void 0 && this.schema.renderMode !== "compute")
      this.select(
        select("body")
          .append("svg")
          .attr("width", `${this.schema.width}px`)
          .attr("height", `${this.schema.height}px`)
          .node(),
      );

    // Legend Container <g> Groups
    this._group = elem("g.d3plus-Legend", {parent: this._select});
    this._titleGroup = elem("g.d3plus-Legend-title", {parent: this._group});
    this._shapeGroup = elem("g.d3plus-Legend-shape", {parent: this._group});

    let availableHeight = this.schema.height;
    this._titleHeight = 0;
    this._titleWidth = 0;
    if (this.schema.title) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (this.schema.titleConfig.fontFamily || (this._titleClass.fontFamily() as any)()) as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s = (this.schema.titleConfig.fontSize || (this._titleClass.fontSize() as any)()) as number;
      let lH = (this.schema.titleConfig.lineHeight || this._titleClass.lineHeight()) as ((...args: unknown[]) => number) | number | undefined;
      lH = typeof lH === "function" ? lH() : (lH ?? s * 1.4);

      const res = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(lH)
        .width(this.schema.width)
        .height(this.schema.height)(this.schema.title);
      this._titleHeight = lH + res.lines.length + this.schema.padding;
      this._titleWidth = max(res.widths)!;
      availableHeight -= this._titleHeight;
    }

    // Calculate Text Sizes
    this._lineData = this._data.map((d: DataPoint, i: number) => {
      const label = this.schema.label(d, i);
      const shape = this.schema.shape(d, i);
      const r = this._fetchConfig("r", d, i) as number;

      let res: Record<string, unknown> = {
        data: d,
        i,
        id: this.schema.id(d, i),
        shape,
        shapeR: r,
        shapeWidth:
          shape === "Circle" ? r * 2 : this._fetchConfig("width", d, i),
        shapeHeight:
          shape === "Circle" ? r * 2 : this._fetchConfig("height", d, i),
        y: 0,
      };

      if (!label) {
        res.sentence = false;
        res.words = [];
        res.height = 0;
        res.width = 0;
        return res;
      }

      const f = this._fetchConfig("fontFamily", d, i) as string,
        lh = this._fetchConfig("lineHeight", d, i) as number,
        s = this._fetchConfig("fontSize", d, i) as number;

      const h = availableHeight - (this._data.length + 1) * this.schema.padding,
        w = this.schema.width;

      const newRes = textWrap()
        .fontFamily(f)
        .fontSize(s)
        .lineHeight(lh)
        .width(w)
        .height(h)(label as string);

      res = Object.assign(res, newRes);

      res.width =
        Math.ceil(
          max(
            (res.lines as string[]).map((t: string) =>
              textWidth(t, {"font-family": f, "font-size": s}),
            ),
          ) as unknown as number,
        ) +
        padding * 2;
      res.height = Math.ceil((res.lines as string[]).length * (lh + 1));
      res.og = {height: res.height, width: res.width};
      res.f = f;
      res.s = s;
      res.lh = lh;

      return res;
    });

    let spaceNeeded: number;
    const availableWidth = this.schema.width - this.schema.padding * 2;
    spaceNeeded = this._rowWidth(this._lineData);

    if (this.schema.direction === "column" || spaceNeeded > availableWidth) {
      let lines = 1,
        newRows: Record<string, unknown>[][] = [];

      const maxLines = max(
        this._lineData.map((d: Record<string, unknown>) => (d.words as unknown[]).length),
      );
      this._wrapLines = function (this: Legend) {
        lines++;

        if (lines > maxLines!) return;

        const wrappable =
          lines === 1
            ? this._lineData.slice()
            :
              this._lineData
                .filter(
                  (d: Record<string, unknown>) =>
                    (d.width as number) + (d.shapeWidth as number) + this.schema.padding * (d.width ? 2 : 1) >
                      availableWidth && (d.words as unknown[]).length >= lines,
                )
                .sort(
                  (a: Record<string, unknown>, b: Record<string, unknown>) =>
                    (b.sentence as string).length - (a.sentence as string).length,
                );

        if (wrappable.length && availableHeight > (wrappable[0].height as number) * lines) {
          let truncated = false;
          for (let x = 0; x < wrappable.length; x++) {
            const label = wrappable[x];
            const og = label.og as Record<string, number>;
            const h = og.height * lines,
              w = og.width * (1.5 * (1 / lines));
            const res = textWrap()
              .fontFamily(label.f as string)
              .fontSize(label.s as number)
              .lineHeight(label.lh as number)
              .width(w)
              .height(h)(label.sentence as string);
            if (!res.truncated) {
              label.width =
                Math.ceil(
                  max(
                    res.lines.map((t: string) =>
                      textWidth(t, {
                        "font-family": label.f as string,
                        "font-size": label.s as number,
                      }),
                    ),
                  )!,
                ) + (label.s as number);
              label.height = res.lines.length * ((label.lh as number) + 1);
            } else {
              truncated = true;
              break;
            }
          }
          if (!truncated) this._wrapRows!();
        } else {
          newRows = [];
          return;
        }
      };

      this._wrapRows = function (this: Legend) {
        newRows = [];
        let row = 1,
          rowWidth = 0;
        for (let i = 0; i < this._lineData.length; i++) {
          const d = this._lineData[i],
            w = (d.width as number) + this.schema.padding * (d.width ? 2 : 1) + (d.shapeWidth as number);
          if (
            sum(
              newRows.map((row: Record<string, unknown>[]) =>
                max(row, (d: Record<string, unknown>) =>
                  max([d.height as number, d.shapeHeight as number]),
                ),
              ),
            ) > availableHeight
          ) {
            newRows = [];
            break;
          }
          if (w > availableWidth) {
            newRows = [];
            this._wrapLines!();
            break;
          } else if (rowWidth + w < availableWidth) {
            rowWidth += w;
          } else if (this.schema.direction !== "column") {
            rowWidth = w;
            row++;
          }
          if (!newRows[row - 1]) newRows[row - 1] = [];
          newRows[row - 1].push(d);
          if (this.schema.direction === "column") {
            rowWidth = 0;
            row++;
          }
        }
      };

      this._wrapRows();

      if (
        !newRows.length ||
        sum(newRows, this._rowHeight.bind(this)) + this.schema.padding >
          availableHeight
      ) {
        spaceNeeded =
          sum(
            this._lineData.map(
              (d: Record<string, unknown>) => (d.shapeWidth as number) + this.schema.padding,
            ),
          ) - this.schema.padding;
        for (let i = 0; i < this._lineData.length; i++) {
          this._lineData[i].width = 0;
          this._lineData[i].height = 0;
        }
        this._wrapRows();
      }

      if (
        newRows.length &&
        sum(newRows, this._rowHeight.bind(this)) + this.schema.padding <
          availableHeight
      ) {
        newRows.forEach((row: Record<string, unknown>[], i: number) => {
          row.forEach((d: Record<string, unknown>) => {
            if (i) {
              d.y = sum(newRows.slice(0, i), this._rowHeight.bind(this));
            }
          });
        });
        spaceNeeded = max(
          newRows,
          this._rowWidth.bind(this),
        ) as unknown as number;
      }
    }

    const innerHeight =
        max(
          this._lineData,
          (d: Record<string, unknown>, i: number) =>
            max([d.height as number, this._fetchConfig("height", d.data as DataPoint, i) as number])! + (d.y as number),
        )! + this._titleHeight,
      innerWidth = max([spaceNeeded, this._titleWidth])!;

    this._outerBounds.width = innerWidth;
    this._outerBounds.height = innerHeight;

    let xOffset = this.schema.padding,
      yOffset = this.schema.padding;
    if (this.schema.align === "center") xOffset = (this.schema.width - innerWidth) / 2;
    else if (this.schema.align === "right")
      xOffset = this.schema.width - this.schema.padding - innerWidth;
    if (this.schema.verticalAlign === "middle")
      yOffset = (this.schema.height - innerHeight) / 2;
    else if (this.schema.verticalAlign === "bottom")
      yOffset = this.schema.height - this.schema.padding - innerHeight;
    this._outerBounds.x = xOffset;
    this._outerBounds.y = yOffset;

    this._titleClass
      .renderMode("compute")
      .data(this.schema.title ? [{text: this.schema.title}] : [])
      .duration(this.schema.duration)
      .select(this._titleGroup.node())
      .textAnchor(({left: "start", center: "middle", right: "end"} as Record<string, string>)[this.schema.align])
      .width(this.schema.width - this.schema.padding * 2)
      .x(this.schema.padding)
      .y(this._outerBounds.y)
      .config(this.schema.titleConfig)
      .render();

    this._shapes = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseConfig = configPrep.bind(this as any)(this.schema.shapeConfig, "legend"),
      config = {
        id: (d: Record<string, unknown>) => d.id,
        label: (d: Record<string, unknown>) => d.label,
        lineHeight: (d: Record<string, unknown>) => d.lH,
      };

    const data = this._data.map((d: DataPoint, i: number) => {
      const obj: Record<string, unknown> = {
        __d3plus__: true,
        data: d,
        i,
        id: this.schema.id(d, i),
        label: this._lineData[i].width ? this.schema.label(d, i) : false,
        lH: this._fetchConfig("lineHeight", d, i),
        shape: this.schema.shape(d, i),
      };

      return obj;
    });

    // Legend Shapes
    this._shapes = [];
    (["Circle", "Rect"] as const).forEach((Shape: string) => {
      this._shapes.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (shapes as Record<string, new () => any>)[Shape]()
          // v4: child shapes are always compute-only — Legend composes the
          // swatches into its own toScene; sub-shapes never auto-render their
          // own <svg>.
          .renderMode("compute")
          .parent(this)
          .data(data.filter((d: Record<string, unknown>) => d.shape === Shape))
          .duration(this.schema.duration)
          .labelConfig({padding: 0})
          .select(this._shapeGroup.node())
          .verticalAlign("top")
          .config(assign({}, baseConfig, config))
          .render(),
      );
    });

    if (callback) setTimeout(callback, this.schema.duration + 100);

    return this;
  }

  /**
      The active method for all shapes.
*/
  active(_: unknown): this {
    this._shapes.forEach((s: unknown) =>
      (s as Record<string, (...args: unknown[]) => unknown>).active(_),
    );
    return this;
  }

  /**
      The data array used to create shapes. A shape key will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The hover method for all shapes.
*/
  hover(_: unknown): this {
    this._shapes.forEach((s: unknown) =>
      (s as Record<string, (...args: unknown[]) => unknown>).hover(_),
    );
    return this;
  }

  /**
      Returns the outer bounds of the legend content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      The SVG container element as a d3 selector or DOM element.
*/
  select(): D3Selection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(_: any): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(_?: any): D3Selection | this {
    if (arguments.length) {
      this._select = select(_);
      this._rtl = detectRTL();
      return this;
    }
    return this._select;
  }

  /**
      Methods that correspond to the key/value pairs for each shape.
*/
  shapeConfig(): Record<string, unknown>;
  shapeConfig(_: Record<string, unknown>): this;
  shapeConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.shapeConfig = assign(this.schema.shapeConfig, _!)), this)
      : this.schema.shapeConfig;
  }

  /**
      Title configuration of the legend.
*/
  titleConfig(): Record<string, unknown>;
  titleConfig(_: Record<string, unknown>): this;
  titleConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this.schema.titleConfig = assign(this.schema.titleConfig, _!)), this)
      : this.schema.titleConfig;
  }
}
