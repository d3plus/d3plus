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
    Walks one wrapped line, applies the legacy regex cleanup (closing dangling
    open tags, opening trailing closing tags), then splits it into runs by the
    configured htmlLookup. Returns the new openTag state for the next line so a
    multi-line bold/italic continues to style subsequent lines.
*/
function lineToRuns(
  raw: string,
  htmlLookup: Record<string, string>,
  openTag: string | false,
): {runs: LineRun[]; openTag: string | false} {
  // Match the legacy textContent escaping: keep entity escaping in sync with
  // existing render() behavior so SVG output stays identical.
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

/**
    Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.
*/
export default class TextBox extends BaseClass {
  _select!: D3Selection;

  _data!: DataPoint[];
  _renderMode: "full" | "compute";

  _ariaHidden: (d: DataPoint, i?: number) => string;
  _delay: number;
  _duration: number;
  _ellipsis: (text: string, line: number) => string;

  _fontColor: (d: DataPoint, i?: number) => string;

  _fontFamily: (d: DataPoint, i?: number) => string;

  _fontMax: (d: DataPoint, i?: number) => number;

  _fontMin: (d: DataPoint, i?: number) => number;

  _fontOpacity: (d: DataPoint, i?: number) => number;

  _fontResize: (d: DataPoint, i?: number) => boolean;

  _fontSize: (d: DataPoint, i?: number) => number;

  _fontStroke: (d: DataPoint, i?: number) => string;

  _fontStrokeWidth: (d: DataPoint, i?: number) => number;

  _fontWeight: (d: DataPoint, i?: number) => number | string;

  _height: (d: DataPoint, i?: number) => number;

  _html: Record<string, string> | false;
  _id: (d: DataPoint, i: number) => string;
  _lineHeight: (d: DataPoint, i?: number) => number;

  _maxLines: (d: DataPoint, i?: number) => number | null;

  _on: Record<string, (...args: unknown[]) => unknown>;

  _overflow: (d: DataPoint, i?: number) => boolean;

  _padding: (d: DataPoint, i?: number) => number | string;

  _pointerEvents: (d: DataPoint, i?: number) => string;

  _rotate: (d: DataPoint, i?: number) => number;
  _rotateAnchor: (d: TextBoxDatum, i?: number) => [number, number];

  _split: (text: string, i?: number) => string[];

  _text: (d: DataPoint, i?: number) => string | undefined;

  _textAnchor: (d: DataPoint, i?: number) => string;

  _verticalAlign: (d: DataPoint, i?: number) => string;

  _width: (d: DataPoint, i?: number) => number;

  _x: (d: DataPoint, i?: number) => number;

  _y: (d: DataPoint, i?: number) => number;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._renderMode = "full";
    this._ariaHidden = constant("false");
    this._delay = 0;
    this._duration = 0;
    this._ellipsis = (text: string, line: number) =>
      line ? `${text.replace(/\.|,$/g, "")}...` : "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontColor = constant("black") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontFamily = constant(fontFamily) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontMax = constant(50) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontMin = constant(8) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontOpacity = constant(1) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontResize = constant(false) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontSize = constant(10) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontStroke = constant("transparent") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontStrokeWidth = constant(0) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._fontWeight = constant(400) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._height = accessor("height", 200) as any;
    this._html = defaultHtmlLookup;
    this._id = (d: DataPoint, i: number) => (d.id as string) || `${i}`;
    this._lineHeight = (d: DataPoint, i?: number) => this._fontSize(d, i) * 1.2;
    this._maxLines = constant(null);
    this._on = {};
    this._overflow = constant(false);
    this._padding = constant(0);
    this._pointerEvents = constant("auto");
    this._rotate = constant(0);
    this._rotateAnchor = (d: TextBoxDatum) => {
      return [d.w / 2, d.h / 2];
    };
    this._split = textSplit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._text = accessor("text") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._textAnchor = constant("start") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._verticalAlign = constant("top") as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._width = accessor("width", 200) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._x = accessor("x", 0) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._y = accessor("y", 0) as any;
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
      let t = this._text(d, i);
      if (t === void 0) return arr;
      t = `${t}`.trim();

      const resize = this._fontResize(d, i);
      const lHRatio = this._lineHeight(d, i) / this._fontSize(d, i);

      let fS = resize ? this._fontMax(d, i) : this._fontSize(d, i),
        lH = resize ? fS * lHRatio : this._lineHeight(d, i),
        line = 1,
        lineData: string[] = [],
        sizes: number[],
        wrapResults: { lines: string[]; truncated: boolean; widths: number[] } = { lines: [], truncated: false, widths: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const style: Record<string, any> = {
        "font-family": fontExists(this._fontFamily(d, i)),
        "font-size": fS,
        "font-weight": this._fontWeight(d, i),
        "line-height": lH,
      };

      const padding = parseSides(this._padding(d, i));

      const h = this._height(d, i) - (padding.top + padding.bottom),
        w = this._width(d, i) - (padding.left + padding.right);

      const wrapper = textWrap()
        .fontFamily(style["font-family"])
        .fontSize(fS)
        .fontWeight(style["font-weight"])
        .lineHeight(lH)
        .maxLines(this._maxLines(d, i))
        .height(h)
        .overflow(this._overflow(d, i))
        .width(w)
        .split(this._split);

      const fMax = this._fontMax(d, i),
        fMin = this._fontMin(d, i),
        vA = this._verticalAlign(d, i),
        words = this._split(t, i);

      /**
        Figures out the lineData to be used for wrapping.
        @private
*/
      function checkSize(): void {
        const truncate = () => {
          if (line < 1) lineData = [that._ellipsis("", line)];
          else lineData[line - 1] = that._ellipsis(lineData[line - 1], line);
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
          sizes = textWidth(words, style) as number[];

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
        const r = this._rotate(d, i);
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
        if (this._html) {
          const lookup = this._html as Record<string, string>;
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
          aH: this._ariaHidden(d, i),
          data: d,
          i,
          lines: lineData,
          lineRuns,
          fC: this._fontColor(d, i),
          fStroke: this._fontStroke(d, i),
          fSW: this._fontStrokeWidth(d, i),
          fF: style["font-family"] as string,
          fO: this._fontOpacity(d, i),
          fW: style["font-weight"],
          id: this._id(d, i),
          pE: this._pointerEvents(d, i),
          tA: this._textAnchor(d, i),
          vA: this._verticalAlign(d, i),
          widths: wrapResults.widths,
          fS,
          lH,
          w,
          h,
          r,
          x: this._x(d, i) + padding.left,
          y: this._y(d, i) + yP + padding.top,
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
      const rotateAnchor = this._rotateAnchor(d, d.i);
      const ariaHidden = d.aH === "true" || d.aH === true;
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
    if (this._renderMode === "compute") {
      // A Viz pipeline (or parent shape) is driving this TextBox — it will
      // compose the scene itself, so we only need _textData to be reachable.
      if (callback) setTimeout(callback, 0);
      return this;
    }

    // Standalone use: route toScene() through SvgRenderer. Mirrors Shape.render
    // so `new TextBox().render()` works without the legacy d3-selection body.
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
      The aria-hidden attribute.
*/
  ariaHidden(): (d: DataPoint, i?: number) => string;
  ariaHidden(_: string | ((d: DataPoint, i?: number) => string)): this;
  ariaHidden(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return _ !== undefined
      ? ((this._ariaHidden = typeof _ === "function" ? _ : constant(_)), this)
      : this._ariaHidden;
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
      The animation delay in milliseconds.
*/
  delay(): number;
  delay(_: number): this;
  delay(_?: number): number | this {
    return arguments.length ? ((this._delay = _!), this) : this._delay;
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
      The function that handles truncated lines. It should return the new value for the line, and is passed 2 arguments: the String of text for the line in question, and the number of the line. By default, an ellipsis is added to the end of any line except if it is the first word that cannot fit (in that case, an empty string is returned).

@example <caption>default accessor</caption>
function(text, line) {
  return line ? text.replace(/\.|,$/g, "") + "..." : "";
}
*/
  ellipsis(): (text: string, line: number) => string;
  ellipsis(_: ((text: string, line: number) => string) | string): this;
  ellipsis(_?: ((text: string, line: number) => string) | string): unknown {
    return arguments.length
      ? ((this._ellipsis = typeof _ === "function" ? _ : constant(_!)), this)
      : this._ellipsis;
  }

  /**
      The font color as an accessor function or static string. Inferred from the [DOM selection](#textBox.select) by default.
*/
  fontColor(): (d: DataPoint, i?: number) => string;
  fontColor(_: string | ((d: DataPoint, i?: number) => string)): this;
  fontColor(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._fontColor = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontColor;
  }

  /**
      Defines the font-family to be used. The value passed can be either a *String* name of a font, a comma-separated list of font-family fallbacks, an *Array* of fallbacks, or a *Function* that returns either a *String* or an *Array*. If supplying multiple fallback fonts, the [fontExists](#fontExists) function will be used to determine the first available font on the client's machine.
*/
  fontFamily(): (d: DataPoint, i?: number) => string;
  fontFamily(_: string | ((d: DataPoint, i?: number) => string)): this;
  fontFamily(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._fontFamily = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontFamily;
  }

  /**
      The maximum font size in pixels, used when [dynamically resizing fonts](#textBox.fontResize).
*/
  fontMax(): (d: DataPoint, i?: number) => number;
  fontMax(_: number | ((d: DataPoint, i?: number) => number)): this;
  fontMax(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._fontMax = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontMax;
  }

  /**
      The minimum font size in pixels, used when [dynamically resizing fonts](#textBox.fontResize).
*/
  fontMin(): (d: DataPoint, i?: number) => number;
  fontMin(_: number | ((d: DataPoint, i?: number) => number)): this;
  fontMin(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._fontMin = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontMin;
  }

  /**
      The font opacity as an accessor function or static number between 0 and 1.
*/
  fontOpacity(): (d: DataPoint, i?: number) => number;
  fontOpacity(_: number | ((d: DataPoint, i?: number) => number)): this;
  fontOpacity(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._fontOpacity = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontOpacity;
  }

  /**
      Toggles font resizing, which can either be defined as a static boolean for all data points, or an accessor function that returns a boolean. See [this example](http://d3plus.org/examples/d3plus-text/resizing-text/) for a side-by-side comparison.
*/
  fontResize(): (d: DataPoint, i?: number) => boolean;
  fontResize(_: boolean | ((d: DataPoint, i?: number) => boolean)): this;
  fontResize(_?: boolean | ((d: DataPoint, i?: number) => boolean)): unknown {
    return arguments.length
      ? ((this._fontResize = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontResize;
  }

  /**
      The font size in pixels. Inferred from the [DOM selection](#textBox.select) by default.
*/
  fontSize(): (d: DataPoint, i?: number) => number;
  fontSize(_: number | ((d: DataPoint, i?: number) => number)): this;
  fontSize(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._fontSize = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontSize;
  }

  /**
      The font stroke color for the rendered text.
*/
  fontStroke(): (d: DataPoint, i?: number) => string;
  fontStroke(_: string | ((d: DataPoint, i?: number) => string)): this;
  fontStroke(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._fontStroke = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontStroke;
  }

  /**
      The font stroke width for the rendered text.
*/
  fontStrokeWidth(): (d: DataPoint, i?: number) => number;
  fontStrokeWidth(_: number | ((d: DataPoint, i?: number) => number)): this;
  fontStrokeWidth(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._fontStrokeWidth = typeof _ === "function" ? _ : constant(_!)),
        this)
      : this._fontStrokeWidth;
  }

  /**
      The font weight. Inferred from the [DOM selection](#textBox.select) by default.
*/
  fontWeight(): (d: DataPoint, i?: number) => number | string;
  fontWeight(_: number | string | ((d: DataPoint, i?: number) => number | string)): this;
  fontWeight(_?: number | string | ((d: DataPoint, i?: number) => number | string)): unknown {
    return arguments.length
      ? ((this._fontWeight = typeof _ === "function" ? _ : constant(_!)), this)
      : this._fontWeight;
  }

  /**
      The height for each text box.

@example <caption>default accessor</caption>
function(d) {
  return d.height || 200;
}
*/
  height(): (d: DataPoint, i?: number) => number;
  height(_: number | ((d: DataPoint, i?: number) => number)): this;
  height(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._height = typeof _ === "function" ? _ : constant(_!)), this)
      : this._height;
  }

  /**
      Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles
*/
  html(): Record<string, string> | false;
  html(_: Record<string, string> | boolean): this;
  html(_?: Record<string, string> | boolean): unknown {
    return arguments.length
      ? ((this._html =
          typeof _ === "boolean" ? (_ ? defaultHtmlLookup : false) : _!),
        this)
      : this._html;
  }

  /**
      The unique id for each text box.

@example <caption>default accessor</caption>
function(d, i) {
  return d.id || i + "";
}
*/
  id(): (d: DataPoint, i: number) => string;
  id(_: string | ((d: DataPoint, i: number) => string)): this;
  id(_?: string | ((d: DataPoint, i: number) => string)): unknown {
    return arguments.length
      ? ((this._id = typeof _ === "function" ? _ : constant(_!)), this)
      : this._id;
  }

  /**
      The line height, which is 1.2 times the [font size](#textBox.fontSize) by default.
*/
  lineHeight(): (d: DataPoint, i?: number) => number;
  lineHeight(_: ((d: DataPoint, i?: number) => number) | number): this;
  lineHeight(_?: ((d: DataPoint, i?: number) => number) | number): unknown {
    return arguments.length
      ? ((this._lineHeight = typeof _ === "function" ? _ : constant(_!)), this)
      : this._lineHeight;
  }

  /**
      Restricts the maximum number of lines to wrap onto, which is null (unlimited) by default.
*/
  maxLines(): (d: DataPoint, i?: number) => number | null;
  maxLines(_: number | null | ((d: DataPoint, i?: number) => number | null)): this;
  maxLines(_?: number | null | ((d: DataPoint, i?: number) => number | null)): unknown {
    return arguments.length
      ? ((this._maxLines = typeof _ === "function" ? _ : constant(_!)), this)
      : this._maxLines;
  }

  /**
      Whether text is allowed to overflow its bounding box.
*/
  overflow(): (d: DataPoint, i?: number) => boolean;
  overflow(_: boolean | ((d: DataPoint, i?: number) => boolean)): this;
  overflow(_?: boolean | ((d: DataPoint, i?: number) => boolean)): unknown {
    return arguments.length
      ? ((this._overflow = typeof _ === "function" ? _ : constant(_!)), this)
      : this._overflow;
  }

  /**
      The padding as a CSS shorthand string or number. Defaults to 0.
*/
  padding(): (d: DataPoint, i?: number) => number | string;
  padding(_: number | string | ((d: DataPoint, i?: number) => number | string)): this;
  padding(_?: number | string | ((d: DataPoint, i?: number) => number | string)): unknown {
    return arguments.length
      ? ((this._padding = typeof _ === "function" ? _ : constant(_!)), this)
      : this._padding;
  }

  /**
      The pointer-events CSS property for each text box.
*/
  pointerEvents(): (d: DataPoint, i?: number) => string;
  pointerEvents(_: string | ((d: DataPoint, i?: number) => string)): this;
  pointerEvents(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._pointerEvents = typeof _ === "function" ? _ : constant(_!)),
        this)
      : this._pointerEvents;
  }

  /**
      The rotation angle in degrees for each text box.
*/
  rotate(): (d: DataPoint, i?: number) => number;
  rotate(_: number | ((d: DataPoint, i?: number) => number)): this;
  rotate(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._rotate = typeof _ === "function" ? _ : constant(_!)), this)
      : this._rotate;
  }

  /**
      The anchor point around which to rotate the text box.
*/
  rotateAnchor(): (d: DataPoint, i?: number) => [number, number];
  rotateAnchor(
    _: ((d: DataPoint, i?: number) => [number, number]) | [number, number],
  ): this;
  rotateAnchor(
    _?: ((d: DataPoint, i?: number) => [number, number]) | [number, number],
  ): unknown {
    return arguments.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((this._rotateAnchor = (typeof _ === "function" ? _ : constant(_!)) as any), this)
      : this._rotateAnchor;
  }

  /**
      Controls whether render() does the full DOM work ("full") or only the
      compute step toScene()/`_textData` needs ("compute"). See Shape.renderMode.
*/
  renderMode(): "full" | "compute";
  renderMode(_: "full" | "compute"): this;
  renderMode(_?: "full" | "compute"): "full" | "compute" | this {
    if (!arguments.length) return this._renderMode;
    this._renderMode = _!;
    return this;
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

  /**
      The word split function, which when passed a string is expected to return that string split into an array of words.
*/
  split(): (text: string, i?: number) => string[];
  split(_: (text: string, i?: number) => string[]): this;
  split(_?: (text: string, i?: number) => string[]): unknown {
    return arguments.length ? ((this._split = _!), this) : this._split;
  }

  /**
      The text content for each box.

@example <caption>default accessor</caption>
function(d) {
  return d.text;
}
*/
  text(): (d: DataPoint, i?: number) => string | undefined;
  text(_: string | ((d: DataPoint, i?: number) => string | undefined)): this;
  text(_?: string | ((d: DataPoint, i?: number) => string | undefined)): unknown {
    return arguments.length
      ? ((this._text = typeof _ === "function" ? _ : constant(_!)), this)
      : this._text;
  }

  /**
      The horizontal text anchor, analagous to the SVG [text-anchor](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor) property.
*/
  textAnchor(): (d: DataPoint, i?: number) => string;
  textAnchor(_: string | ((d: DataPoint, i?: number) => string)): this;
  textAnchor(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._textAnchor = typeof _ === "function" ? _ : constant(_!)), this)
      : this._textAnchor;
  }

  /**
      The vertical alignment. Accepts `"top"`, `"middle"`, and `"bottom"`.
*/
  verticalAlign(): (d: DataPoint, i?: number) => string;
  verticalAlign(_: string | ((d: DataPoint, i?: number) => string)): this;
  verticalAlign(_?: string | ((d: DataPoint, i?: number) => string)): unknown {
    return arguments.length
      ? ((this._verticalAlign = typeof _ === "function" ? _ : constant(_!)),
        this)
      : this._verticalAlign;
  }

  /**
      The width for each text box.

@example <caption>default accessor</caption>
function(d) {
  return d.width || 200;
}
*/
  width(): (d: DataPoint, i?: number) => number;
  width(_: number | ((d: DataPoint, i?: number) => number)): this;
  width(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._width = typeof _ === "function" ? _ : constant(_!)), this)
      : this._width;
  }

  /**
      The x position for each text box. The number given should correspond to the left side of the textBox.

@example <caption>default accessor</caption>
function(d) {
  return d.x || 0;
}
*/
  x(): (d: DataPoint, i?: number) => number;
  x(_: number | ((d: DataPoint, i?: number) => number)): this;
  x(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._x = typeof _ === "function" ? _ : constant(_!)), this)
      : this._x;
  }

  /**
      The y position for each text box. The number given should correspond to the top side of the textBox.

@example <caption>default accessor</caption>
function(d) {
  return d.y || 0;
}
*/
  y(): (d: DataPoint, i?: number) => number;
  y(_: number | ((d: DataPoint, i?: number) => number)): this;
  y(_?: number | ((d: DataPoint, i?: number) => number)): unknown {
    return arguments.length
      ? ((this._y = typeof _ === "function" ? _ : constant(_!)), this)
      : this._y;
  }
}
