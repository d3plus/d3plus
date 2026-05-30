import {max, min, sum} from "d3-array";
import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {fontExists, parseSides, rtl as detectRTL, textWidth} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {
  fontFamily,
  strip,
  textSplit,
  textWrap,
} from "@d3plus/text";
import {SvgRenderer} from "@d3plus/render";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {accessor, BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

const defaultHtmlLookup: Record<string, string> = {
  i: "font-style: italic;",
  em: "font-style: italic;",
  b: "font-weight: bold;",
  strong: "font-weight: bold;",
};

/** A parsed inline run (segment of a wrapped line with optional bold/italic). */
interface LineRun {
  text: string;
  style?: {weight?: number | string; style?: "normal" | "italic"};
}

/** Internal shape produced by the data reduce in render(). */
interface TextBoxDatum {
  aH: string;
  data: DataPoint;
  i: number;
  lines: string[];
  /** Per-line parsed runs when `_html` is configured; null when plain text. */
  lineRuns: LineRun[][] | null;
  fC: string;
  fStroke: string;
  fSW: number;
  fF: string;
  fO: number;
  fW: number | string;
  id: string;
  pE: string;
  tA: string;
  vA: string;
  widths: number[];
  fS: number;
  lH: number;
  w: number;
  h: number;
  r: number;
  x: number;
  y: number;
}

/** Parses a "style: foo; …" string from defaultHtmlLookup into TextRun style. */
function parseStyleString(
  styleStr: string,
): {weight?: number | string; style?: "normal" | "italic"} | undefined {
  const out: {weight?: number | string; style?: "normal" | "italic"} = {};
  for (const decl of styleStr.split(";")) {
    const [k, v] = decl.split(":").map(s => s.trim());
    if (!k || !v) continue;
    if (k === "font-weight") out.weight = /^\d+$/.test(v) ? Number(v) : v;
    else if (k === "font-style") out.style = v === "italic" ? "italic" : "normal";
  }
  return out.weight === undefined && out.style === undefined ? undefined : out;
}

/**
    Walks one wrapped line, applies the regex cleanup (closing dangling
    open tags, opening trailing closing tags), then splits it into runs by the
    configured htmlLookup. Returns the new openTag state for the next line so a
    multi-line bold/italic continues to style subsequent lines.
*/
function lineToRuns(
  raw: string,
  htmlLookup: Record<string, string>,
  openTag: string | false,
): {runs: LineRun[]; openTag: string | false} {
  // textContent escaping: keep entity escaping in sync with render()
  // so SVG output stays identical.
  let cleaned = raw
    .trimEnd()
    .replace(/&([^;&]*)/g, (str, a) => (a === "amp" ? str : `&amp;${a}`))
    .replace(/<([^A-z^/]+)/g, (_str, a) => `&lt;${a}`)
    .replace(/<$/g, "&lt;")
    .replace(
      /(<[^>^/]+>)([^<^>]+)$/g,
      (_str, a, b) => `${a}${b}${a.replace("<", "</")}`,
    )
    .replace(
      /^([^<^>]+)(<\/[^>]+>)/g,
      (_str, a, b) => `${b.replace("</", "<")}${a}${b}`,
    );

  // If we're already inside an open tag from a previous line, prefix this
  // line with the opening tag so the same tag closes within the line.
  let nextOpenTag: string | false = openTag;
  if (nextOpenTag && !cleaned.startsWith("<")) {
    cleaned = `<${nextOpenTag}>${cleaned}`;
    if (!cleaned.includes(`</${nextOpenTag}>`)) cleaned += `</${nextOpenTag}>`;
  }

  const tagRegex = /<([A-z]+)[^>]*>([^<^>]+)<\/[^>]+>/g;
  const runs: LineRun[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(cleaned)) !== null) {
    if (m.index > lastIndex) runs.push({text: cleaned.slice(lastIndex, m.index)});
    const tag = m[1];
    const inner = m[2];
    const styleStr = htmlLookup[tag];
    if (styleStr) {
      // If the original raw line contains a closing tag, the tag has terminated.
      if (raw.includes(`</${tag}>`)) nextOpenTag = false;
      else nextOpenTag = tag;
      runs.push({text: inner, style: parseStyleString(styleStr)});
    } else {
      runs.push({text: inner});
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < cleaned.length) runs.push({text: cleaned.slice(lastIndex)});

  // If the raw line never opened a tag but we already had openTag set, the
  // line is fully inside that tag — wrap it.
  if (!runs.length && cleaned) runs.push({text: cleaned});

  return {runs, openTag: nextOpenTag};
}

/** TextBox's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const textBoxSchema: ConfigField[] = [
  {key: "ariaHidden", coerce: "const", default: constant("false")},
  {key: "delay", coerce: "identity", default: 0},
  {key: "duration", coerce: "identity", default: 0},
  {key: "ellipsis", coerce: "const", default: (text: string, line: number) => line ? `${text.replace(/\.|,$/g, "")}...` : ""},
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
  {key: "id", coerce: "const", default: (d: DataPoint, i: number) => (d.id as string) || `${i}`},
  {key: "lineHeight", coerce: "const"},
  {key: "maxLines", coerce: "const", default: constant(null)},
  {key: "overflow", coerce: "const", default: constant(false)},
  {key: "padding", coerce: "const", default: constant(0)},
  {key: "pointerEvents", coerce: "const", default: constant("auto")},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "rotate", coerce: "const", default: constant(0)},
  {key: "rotateAnchor", coerce: "const", default: (d: TextBoxDatum) => [d.w / 2, d.h / 2]},
  {key: "split", coerce: "identity", default: textSplit},
  {key: "text", coerce: "const", default: accessor("text")},
  {key: "textAnchor", coerce: "const", default: constant("start")},
  {key: "verticalAlign", coerce: "const", default: constant("top")},
  {key: "width", coerce: "const", default: accessor("width", 200)},
  {key: "x", coerce: "const", default: accessor("x", 0)},
  {key: "y", coerce: "const", default: accessor("y", 0)},
];

/**
    Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.
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
    this.schema.lineHeight = (d: DataPoint, i?: number) => this.schema.fontSize(d, i) * 1.2;
    this.schema.html = defaultHtmlLookup;
  }

  /**
      Computes the laid-out text boxes (wrapping, font sizing, per-box position)
      for the current data. Shared by render() and toScene() so both produce
      identical layout.
      @private
*/
  _textData(): TextBoxDatum[] {
    const that = this;
    return this._data.reduce((arr: TextBoxDatum[], d: DataPoint, i: number) => {
      let t = this.schema.text(d, i);
      if (t === void 0) return arr;
      t = `${t}`.trim();

      const resize = this.schema.fontResize(d, i);
      const lHRatio = this.schema.lineHeight(d, i) / this.schema.fontSize(d, i);

      let fS = resize ? this.schema.fontMax(d, i) : this.schema.fontSize(d, i),
        lH = resize ? fS * lHRatio : this.schema.lineHeight(d, i),
        line = 1,
        lineData: string[] = [],
        sizes: number[],
        wrapResults: { lines: string[]; truncated: boolean; widths: number[] } = { lines: [], truncated: false, widths: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const style: Record<string, any> = {
        "font-family": fontExists(this.schema.fontFamily(d, i)),
        "font-size": fS,
        "font-weight": this.schema.fontWeight(d, i),
        "line-height": lH,
      };

      const padding = parseSides(this.schema.padding(d, i));

      const h = this.schema.height(d, i) - (padding.top + padding.bottom),
        w = this.schema.width(d, i) - (padding.left + padding.right);

      const wrapper = textWrap()
        .fontFamily(style["font-family"])
        .fontSize(fS)
        .fontWeight(style["font-weight"])
        .lineHeight(lH)
        .maxLines(this.schema.maxLines(d, i))
        .height(h)
        .overflow(this.schema.overflow(d, i))
        .width(w)
        .split(this.schema.split);

      const fMax = this.schema.fontMax(d, i),
        fMin = this.schema.fontMin(d, i),
        vA = this.schema.verticalAlign(d, i),
        words = this.schema.split(t, i);

      /**
        Figures out the lineData to be used for wrapping.
        @private
*/
      function checkSize(): void {
        const truncate = () => {
          if (line < 1) lineData = [that.schema.ellipsis("", line)];
          else lineData[line - 1] = that.schema.ellipsis(lineData[line - 1], line);
        };

        // Constraint the font size
        fS = max([fS, fMin])!;
        fS = min([fS, fMax])!;

        if (resize) {
          lH = fS * lHRatio;
          wrapper.fontSize(fS).lineHeight(lH);
          style["font-size"] = fS;
          style["line-height"] = lH;
        }

        wrapResults = wrapper(t!);
        lineData = wrapResults.lines.filter((l: string) => l !== "");
        line = lineData.length;

        if (wrapResults.truncated) {
          if (resize) {
            fS--;
            if (fS < fMin) {
              fS = fMin;
              truncate();
              return;
            } else checkSize();
          } else truncate();
        }
      }

      if (w > fMin && (h > lH || (resize && h > fMin * lHRatio))) {
        if (resize) {
          sizes = textWidth(words, style) as unknown as number[];

          const areaMod = 1.165 + (w / h) * 0.1,
            boxArea = w * h,
            maxWidth = max(sizes) as number,
            textArea = sum(sizes, (d: number) => d * lH) * areaMod;

          if (maxWidth > w || textArea > boxArea) {
            const areaRatio = Math.sqrt(boxArea / textArea),
              widthRatio = w / maxWidth;
            const sizeRatio = min([areaRatio, widthRatio])!;
            fS = Math.floor(fS * sizeRatio);
          }

          const heightMax = Math.floor(h * 0.8);
          if (fS > heightMax) fS = heightMax;
        }

        checkSize();
      }

      if (lineData.length) {
        const tH = line * lH;
        const r = this.schema.rotate(d, i);
        let yP =
          r === 0
            ? vA === "top"
              ? 0
              : vA === "middle"
                ? h / 2 - tH / 2
                : h - tH
            : 0;
        yP -= lH * 0.1;

        // Pre-compute per-line runs from HTML markup, carrying open-tag state
        // across lines so a multi-line <b> continues to bold subsequent lines.
        let lineRuns: LineRun[][] | null = null;
        if (this.schema.html) {
          const lookup = this.schema.html as Record<string, string>;
          let openTag: string | false = false;
          const out: LineRun[][] = [];
          let hasStyle = false;
          for (const ln of lineData) {
            const {runs, openTag: next} = lineToRuns(ln, lookup, openTag);
            out.push(runs);
            openTag = next;
            if (runs.some(r => r.style)) hasStyle = true;
          }
          // Only emit runs when at least one line carries a style; otherwise
          // leave runs unset so the renderer emits a single text node.
          if (hasStyle) lineRuns = out;
        }

        arr.push({
          aH: this.schema.ariaHidden(d, i),
          data: d,
          i,
          lines: lineData,
          lineRuns,
          fC: this.schema.fontColor(d, i),
          fStroke: this.schema.fontStroke(d, i),
          fSW: this.schema.fontStrokeWidth(d, i),
          fF: style["font-family"] as string,
          fO: this.schema.fontOpacity(d, i),
          fW: style["font-weight"],
          id: this.schema.id(d, i),
          pE: this.schema.pointerEvents(d, i),
          tA: this.schema.textAnchor(d, i),
          vA: this.schema.verticalAlign(d, i),
          widths: wrapResults.widths,
          fS,
          lH,
          w,
          h,
          r,
          x: this.schema.x(d, i) + padding.left,
          y: this.schema.y(d, i) + yP + padding.top,
        });
      }

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
      const anchor = d.tA === "middle" ? "middle" : d.tA === "end" ? "end" : "start";
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
              ? (d.h + d.fS) / 2 - (d.lH - d.fS) + (i - d.lines.length / 2 + 0.5) * d.lH
              : d.h - 2 * (d.lH - d.fS) - (d.lines.length - (i + 1)) * d.lH + 2 * Math.cos((Math.PI * d.r) / 180);
        const width = d.widths ? d.widths[i] ?? 0 : 0;
        const runs = d.lineRuns ? d.lineRuns[i] : undefined;
        return runs ? {text, x: lineX, y, width, runs} : {text, x: lineX, y, width};
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
          ...(d.fStroke && d.fStroke !== "transparent" ? {stroke: d.fStroke} : {}),
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
        while (node.firstChild) node.removeChild(node.firstChild);
        const scene = {root: this.toScene(), width, height};
        const renderer = new SvgRenderer();
        renderer.mount({container: node, width, height});
        renderer.drawScene(scene);
        (this as unknown as {_sceneRenderer?: SvgRenderer})._sceneRenderer = renderer;
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
