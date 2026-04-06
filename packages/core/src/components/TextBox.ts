import {max, min, sum} from "d3-array";
import {select} from "d3-selection";

// side-effect import: registers .transition() on d3 selections
import "d3-transition";

import type {DataPoint} from "@d3plus/data";
import {fontExists, parseSides, rtl as detectRTL, textWidth} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {
  fontFamily,
  strip,
  textSplit,
  textWrap,
} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";

const defaultHtmlLookup: Record<string, string> = {
  i: "font-style: italic;",
  em: "font-style: italic;",
  b: "font-weight: bold;",
  strong: "font-weight: bold;",
};

/** Internal shape produced by the data reduce in render(). */
interface TextBoxDatum {
  aH: string;
  data: DataPoint;
  i: number;
  lines: string[];
  fC: string;
  fStroke: string;
  fSW: number;
  fF: string;
  fO: number;
  fW: number | string;
  id: string;
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

/**
    Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.
*/
export default class TextBox extends BaseClass {
  _select: D3Selection;

  _data!: DataPoint[];

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
  _rotateAnchor: (d: DataPoint, i?: number) => [number, number];

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

    this._ariaHidden = constant("false");
    this._delay = 0;
    this._duration = 0;
    this._ellipsis = (text: string, line: number) =>
      line ? `${text.replace(/\.|,$/g, "")}...` : "";
    this._fontColor = constant("black");
    this._fontFamily = constant(fontFamily);
    this._fontMax = constant(50);
    this._fontMin = constant(8);
    this._fontOpacity = constant(1);
    this._fontResize = constant(false);
    this._fontSize = constant(10);
    this._fontStroke = constant("transparent");
    this._fontStrokeWidth = constant(0);
    this._fontWeight = constant(400);
    this._height = accessor("height", 200);
    this._html = defaultHtmlLookup;
    this._id = (d: DataPoint, i: number) => (d.id as string) || `${i}`;
    this._lineHeight = (d: DataPoint, i?: number) => this._fontSize(d, i) * 1.2;
    this._maxLines = constant(null);
    this._on = {};
    this._overflow = constant(false);
    this._padding = constant(0);
    this._pointerEvents = constant("auto");
    this._rotate = constant(0);
    this._rotateAnchor = (d: DataPoint) => {
      const dp = d as Record<string, unknown>;
      return [(dp.w as number) / 2, (dp.h as number) / 2];
    };
    this._split = textSplit;
    this._text = accessor("text");
    this._textAnchor = constant("start");
    this._verticalAlign = constant("top");
    this._width = accessor("width", 200);
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
  }

  /**
      Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    if (this._select === void 0)
      this.select(
        select("body")
          .append("svg")
          .style("width", `${window.innerWidth}px`)
          .style("height", `${window.innerHeight}px`)
          .node() as unknown as HTMLElement,
      );

    const that = this;

    const boxes = this._select.selectAll(".d3plus-textBox").data(
      this._data.reduce((arr: TextBoxDatum[], d: DataPoint, i: number) => {
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

        const style: Record<string, string | number> = {
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

          wrapResults = wrapper(t);
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

          arr.push({
            aH: this._ariaHidden(d, i),
            data: d,
            i,
            lines: lineData,
            fC: this._fontColor(d, i),
            fStroke: this._fontStroke(d, i),
            fSW: this._fontStrokeWidth(d, i),
            fF: style["font-family"] as string,
            fO: this._fontOpacity(d, i),
            fW: style["font-weight"],
            id: this._id(d, i),
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

      }, []),
      (d: TextBoxDatum) => this._id(d.data, d.i),
    );

    const t = this._select.transition().duration(this._duration);

    if (this._duration === 0) {
      boxes.exit().remove();
    } else {
      boxes.exit().transition().delay(this._duration).remove();

      boxes
        .exit()
        .selectAll("text")
        .transition(t)
        .attr("opacity", 0)
        .style("opacity", 0);
    }

    /**
     * Applies translate and rotate to a text element.
     * @param {D3Selection} text
     * @private
*/
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function rotate(text: any): void {
      text.attr("transform", (d: TextBoxDatum, i: number) => {
        const rotateAnchor = that._rotateAnchor(d.data, i);
        return `translate(${d.x}, ${d.y}) rotate(${d.r}, ${rotateAnchor[0]}, ${rotateAnchor[1]})`;
      });
    }

    const update = boxes
      .enter()
      .append("g")
      .attr("class", "d3plus-textBox")
      .attr("id", (d: TextBoxDatum) => `d3plus-textBox-${strip(d.id)}`)
      .call(rotate)
      .merge(boxes as never);

    const rtl = detectRTL();

    update
      .order()
      .style("pointer-events", (d: TextBoxDatum) => this._pointerEvents(d.data, d.i))
      .each(function (this: SVGElement, d: TextBoxDatum) {
        /**
            Sets the inner text content of each <text> element.
            @private
*/
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function textContent(text: any): void {
          let tag: string | false = false;

          text[that._html ? "html" : "text"]((t: string) => {
            let cleaned = t.trimEnd()
              .replace(/&([^;&]*)/g, (str: string, a: string) =>
                a === "amp" ? str : `&amp;${a}`,
              ) // replaces all non-HTML ampersands with escaped entity
              .replace(/<([^A-z^/]+)/g, (_str: string, a: string) => `&lt;${a}`)
              .replace(/<$/g, "&lt;") // replaces all non-HTML left angle brackets with escaped entity
              .replace(
                /(<[^>^/]+>)([^<^>]+)$/g,
                (_str: string, a: string, b: string) =>
                  `${a}${b}${a.replace("<", "</")}`,
              ) // ands end tag to lines before mid-HTML break
              .replace(
                /^([^<^>]+)(<\/[^>]+>)/g,
                (_str: string, a: string, b: string) =>
                  `${b.replace("</", "<")}${a}${b}`,
              ); // ands start tag to lines after mid-HTML break

            const tagRegex = new RegExp(/<([A-z]+)[^>]*>([^<^>]+)<\/[^>]+>/g);
            if (cleaned.match(tagRegex)) {
              const htmlLookup = that._html as Record<string, string>;
              cleaned = cleaned.replace(
                tagRegex,
                (_str: string, a: string, b: string) => {
                  tag = htmlLookup[a] ? a : false;
                  if (tag) {
                    const style = htmlLookup[tag];
                    if (t.includes(`</${tag}>`)) tag = false;
                    return `<tspan style="${style}">${b}</tspan>`;
                  }
                  return b;
                },
              );
            } else if (tag && tag.length) {
              const htmlLookup = that._html as Record<string, string>;
              cleaned = `<tspan style="${htmlLookup[tag]}">${cleaned}</tspan>`;
            }

            return cleaned;
          });
        }

        /**
            Styles to apply to each <text> element.
            @private
*/
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function textStyle(text: any): void {
          text
            .attr("aria-hidden", d.aH)
            .attr("dir", rtl ? "rtl" : "ltr")
            .attr("fill", d.fC)
            .attr("stroke", d.fStroke)
            .attr("stroke-width", d.fSW)
            .attr("text-anchor", d.tA)
            .attr("font-family", d.fF)
            .style("font-family", d.fF)
            .attr("font-size", `${d.fS}px`)
            .style("font-size", `${d.fS}px`)
            .attr("font-weight", d.fW)
            .style("font-weight", d.fW)
            .attr(
              "x",
              `${d.tA === "middle" ? d.w / 2 : rtl ? (d.tA === "start" ? d.w : 0) : d.tA === "end" ? d.w : 2 * Math.sin((Math.PI * d.r) / 180)}px`,
            )
            .attr("y", (_t: unknown, i: number) =>
              d.r === 0 || d.vA === "top"
                ? `${(i + 1) * d.lH - (d.lH - d.fS)}px`
                : d.vA === "middle"
                  ? `${(d.h + d.fS) / 2 - (d.lH - d.fS) + (i - d.lines.length / 2 + 0.5) * d.lH}px`
                  : `${d.h - 2 * (d.lH - d.fS) - (d.lines.length - (i + 1)) * d.lH + 2 * Math.cos((Math.PI * d.r) / 180)}px`,
            );
        }

        const texts = select(this).selectAll("text").data(d.lines);

        if (that._duration === 0) {
          texts.call(textContent).call(textStyle);

          texts.exit().remove();

          texts
            .enter()
            .append("text")
            .attr("dominant-baseline", "alphabetic")
            .style("baseline-shift", "0%")
            .attr("unicode-bidi", "bidi-override")
            .call(textContent)
            .call(textStyle)
            .attr("opacity", d.fO)
            .style("opacity", d.fO);
        } else {
          texts.call(textContent).transition(t).call(textStyle);

          texts.exit().transition(t).attr("opacity", 0).remove();

          texts
            .enter()
            .append("text")
            .attr("dominant-baseline", "alphabetic")
            .style("baseline-shift", "0%")
            .attr("opacity", 0)
            .style("opacity", 0)
            .call(textContent)
            .call(textStyle)
            .merge(texts as never)
            .transition(t)
            .delay(that._delay)
            .call(textStyle)
            .attr("opacity", d.fO)
            .style("opacity", d.fO);
        }
      })
      .transition(t)
      .call(rotate);

    const events = Object.keys(this._on),
      on = events.reduce((obj: Record<string, (...args: unknown[]) => unknown>, e: string) => {
        obj[e] = (...args: unknown[]) => this._on[e]((args[0] as TextBoxDatum).data, args[1]);
        return obj;
      }, {});
    for (let e = 0; e < events.length; e++) update.on(events[e], on[events[e]]);

    if (callback) setTimeout(callback, this._duration + 100);

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
      ? ((this._rotateAnchor = typeof _ === "function" ? _ : constant(_!)), this)
      : this._rotateAnchor;
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
