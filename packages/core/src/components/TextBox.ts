import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {rtl as detectRTL} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {fontFamily, strip, textSplit} from "@d3plus/text";
import {SvgRenderer} from "@d3plus/render";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {accessor, BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";
import {computeTextBoxDatum} from "./textBoxLayout.js";
import type {TextBoxDatum} from "./textBoxLayout.js";

const defaultHtmlLookup: Record<string, string> = {
  i: "font-style: italic;",
  em: "font-style: italic;",
  b: "font-weight: bold;",
  strong: "font-weight: bold;",
};

/** TextBox's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const textBoxSchema: ConfigField[] = [
  {key: "ariaHidden", coerce: "const", default: constant("false")},
  {key: "delay", coerce: "identity", default: 0},
  {key: "duration", coerce: "identity", default: 0},
  {
    key: "ellipsis",
    coerce: "const",
    default: (text: string, line: number) =>
      line ? `${text.replace(/\.|,$/g, "")}...` : "",
  },
  {key: "fontColor", coerce: "const", default: constant("black")},
  {key: "fontFamily", coerce: "const", default: constant(fontFamily)},
  {key: "fontMax", coerce: "const", default: constant(50)},
  {key: "fontMin", coerce: "const", default: constant(8)},
  {key: "fontOpacity", coerce: "const", default: constant(1)},
  {key: "fontResize", coerce: "const", default: constant(false)},
  {key: "fontSize", coerce: "const", default: constant(10)},
  {key: "fontStroke", coerce: "const", default: constant("transparent")},
  {key: "fontStrokeWidth", coerce: "const", default: constant(0)},
  {key: "fontWeight", coerce: "const", default: constant(400)},
  {key: "height", coerce: "const", default: accessor("height", 200)},
  {
    key: "id",
    coerce: "const",
    default: (d: DataPoint, i: number) => (d.id as string) || `${i}`,
  },
  {key: "lineHeight", coerce: "const"},
  {key: "maxLines", coerce: "const", default: constant(null)},
  {key: "overflow", coerce: "const", default: constant(false)},
  {key: "padding", coerce: "const", default: constant(0)},
  {key: "pointerEvents", coerce: "const", default: constant("auto")},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "rotate", coerce: "const", default: constant(0)},
  {
    key: "rotateAnchor",
    coerce: "const",
    default: (d: TextBoxDatum) => [d.w / 2, d.h / 2],
  },
  // Bounding shape for wrapping: "square" (default) fills the full width on
  // every line; "circle" treats width/height as the diameter and shortens
  // lines near the top and bottom to keep text inside the circle. Defaults to
  // the label record's namespaced `__d3plusWrapShape__` (stamped from a shape's
  // `labelBounds`) so Circle labels wrap to the circle without callers
  // configuring anything, while a caller's own `shape` data field is ignored.
  {
    key: "shape",
    coerce: "const",
    default: (d: DataPoint) => (d.__d3plusWrapShape__ as string) ?? "square",
  },
  {key: "split", coerce: "identity", default: textSplit},
  {key: "text", coerce: "const", default: accessor("text")},
  {key: "textAnchor", coerce: "const", default: constant("start")},
  {key: "verticalAlign", coerce: "const", default: constant("top")},
  {key: "width", coerce: "const", default: accessor("width", 200)},
  {key: "x", coerce: "const", default: accessor("x", 0)},
  {key: "y", coerce: "const", default: accessor("y", 0)},
];

/**
    Creates a wrapped text box for each point in an array of data.
*/
export default class TextBox extends BaseClass {
  // installFluent generates the config accessors (text, fontSize, x, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _select!: D3Selection;
  _data!: DataPoint[];

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, textBoxSchema);
    this.schema.lineHeight = (d: DataPoint, i?: number) =>
      this.schema.fontSize(d, i) * 1.2;
    this.schema.html = defaultHtmlLookup;
  }

  /**
      Computes the laid-out text boxes (wrapping, font sizing, per-box position)
      for the current data. Shared by render() and toScene() so both produce
      identical layout.
      @private
*/
  _textData(): TextBoxDatum[] {
    return this._data.reduce((arr: TextBoxDatum[], d: DataPoint, i: number) => {
      const datum = computeTextBoxDatum(this, d, i);
      if (datum) arr.push(datum);
      return arr;
    }, []);
  }

  /**
      Produces a backend-agnostic scene graph for the text boxes, reusing the same
      layout (_textData) and per-line positioning render() applies to the DOM.
*/
  toScene(): GroupNode {
    const rtl = detectRTL();
    const children: SceneNode[] = this._textData().map(d => {
      const anchor =
        d.tA === "middle" ? "middle" : d.tA === "end" ? "end" : "start";
      const lineX =
        d.tA === "middle"
          ? d.w / 2
          : rtl
            ? d.tA === "start"
              ? d.w
              : 0
            : d.tA === "end"
              ? d.w
              : 2 * Math.sin((Math.PI * d.r) / 180);
      const lines = d.lines.map((text, i) => {
        const y =
          d.r === 0 || d.vA === "top"
            ? (i + 1) * d.lH - (d.lH - d.fS)
            : d.vA === "middle"
              ? (d.h + d.fS) / 2 -
                (d.lH - d.fS) +
                (i - d.lines.length / 2 + 0.5) * d.lH
              : d.h -
                2 * (d.lH - d.fS) -
                (d.lines.length - (i + 1)) * d.lH +
                2 * Math.cos((Math.PI * d.r) / 180);
        const width = d.widths ? (d.widths[i] ?? 0) : 0;
        const runs = d.lineRuns ? d.lineRuns[i] : undefined;
        return runs
          ? {text, x: lineX, y, width, runs}
          : {text, x: lineX, y, width};
      });
      const rotateAnchor = this.schema.rotateAnchor(d, d.i);
      const ariaHidden = d.aH === "true" || (d.aH as unknown) === true;
      const interactive = d.pE !== "none";
      return {
        type: "text",
        key: d.id,
        id: `d3plus-textBox-${strip(d.id)}`,
        datum: d.data,
        index: d.i,
        x: 0,
        y: 0,
        width: d.w,
        height: d.h,
        lines,
        font: {
          family: d.fF,
          size: d.fS,
          weight: d.fW,
          anchor,
          baseline: "alphabetic",
          dir: rtl ? "rtl" : "ltr",
        },
        paint: {
          fill: d.fC,
          opacity: d.fO,
          ...(d.fStroke && d.fStroke !== "transparent"
            ? {stroke: d.fStroke}
            : {}),
          ...(d.fSW ? {strokeWidth: d.fSW} : {}),
        },
        transform: {x: d.x, y: d.y, rotate: d.r, rotateAnchor},
        aria: ariaHidden ? {hidden: true} : undefined,
        interactive,
      } as SceneNode;
    });
    return {type: "group", key: "textBox-group", children};
  }

  /**
      Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    if (this.schema.renderMode === "compute") {
      // A Viz pipeline (or parent shape) is driving this TextBox — it will
      // compose the scene itself, so we only need _textData to be reachable.
      if (callback) setTimeout(callback, 0);
      return this;
    }

    // Standalone use: route toScene() through SvgRenderer. Mirrors Shape.render
    // so `new TextBox().render()` works without a d3-selection body.
    if (this._select === undefined && typeof document !== "undefined") {
      const svgNode = select("body")
        .append("svg")
        .style("width", `${window.innerWidth}px`)
        .style("height", `${window.innerHeight}px`)
        .node() as unknown as HTMLElement;
      this.select(svgNode);
    }

    if (this._select) {
      const sel = this._select;
      const node: Element | null =
        sel && typeof sel.node === "function"
          ? (sel.node() as Element | null)
          : (sel as unknown as Element | null);
      if (node) {
        const root = this.toScene();
        // `width`/`height`/`x` are per-box accessors, not canvas dimensions, so
        // size the surface to the laid-out content extent (max box edge) — and
        // also to the container's rendered box, so it fills a sized container.
        // `getBoundingClientRect` is used because the React wrapper sets
        // `width`/`height="100%"`, which `Number("100%")` can't parse (→ NaN,
        // which previously fell back to a hard-coded 400 and cropped boxes).
        type Edge = {
          transform?: {x?: number; y?: number};
          width?: number;
          height?: number;
        };
        const contentW = root.children.reduce(
          (m, c) =>
            Math.max(
              m,
              ((c as Edge).transform?.x ?? 0) + ((c as Edge).width ?? 0),
            ),
          0,
        );
        const contentH = root.children.reduce(
          (m, c) =>
            Math.max(
              m,
              ((c as Edge).transform?.y ?? 0) + ((c as Edge).height ?? 0),
            ),
          0,
        );
        const rect =
          typeof node.getBoundingClientRect === "function"
            ? node.getBoundingClientRect()
            : null;
        const boxW =
          (rect && rect.width) ||
          Number(node.getAttribute("width")) ||
          (node as HTMLElement).clientWidth ||
          0;
        const boxH =
          (rect && rect.height) ||
          Number(node.getAttribute("height")) ||
          (node as HTMLElement).clientHeight ||
          0;
        const width = Math.max(boxW, contentW) || 400;
        const height = Math.max(boxH, contentH) || 300;
        while (node.firstChild) node.removeChild(node.firstChild);
        const scene = {root, width, height};
        const renderer = new SvgRenderer();
        renderer.mount({container: node, width, height});
        renderer.drawScene(scene);
        (this as unknown as {_sceneRenderer?: SvgRenderer})._sceneRenderer =
          renderer;
      }
    }

    if (callback) setTimeout(callback, 0);
    return this;
  }

  /**
      The data array used to draw text boxes. A text box will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles
*/
  html(): Record<string, string> | false;
  html(_: Record<string, string> | boolean): this;
  html(_?: Record<string, string> | boolean): unknown {
    return arguments.length
      ? ((this.schema.html =
          typeof _ === "boolean" ? (_ ? defaultHtmlLookup : false) : _!),
        this)
      : this.schema.html;
  }

  /**
      The SVG container element as a d3 selector or DOM element. If not specified, an SVG element will be added to the page.
*/
  select(): D3Selection;
  select(_: string | HTMLElement): this;
  select(_?: string | HTMLElement): unknown {
    return arguments.length
      ? ((this._select = select(_ as never) as unknown as D3Selection), this)
      : this._select;
  }
}
