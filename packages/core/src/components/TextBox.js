import {max, min, sum} from "d3-array";
import {select} from "d3-selection";

// leave this import in here!
import {transition} from "d3-transition";

import {fontExists, parseSides, rtl as detectRTL, textWidth} from "@d3plus/dom";
import {strip, textSplit, textWrap, trim, trimRight} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";

const defaultHtmlLookup = {
  i: "font-style: italic;",
  em: "font-style: italic;",
  b: "font-weight: bold;",
  strong: "font-weight: bold;"
};

/**
    @class TextBox
    @extends BaseClass
    @desc Creates a wrapped text box for each point in an array of data. See [this example](https://d3plus.org/examples/d3plus-text/getting-started/) for help getting started using the TextBox class.
*/
export default class TextBox extends BaseClass {

  /**
      @memberof TextBox
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._ariaHidden = constant("false");
    this._delay = 0;
    this._duration = 0;
    this._ellipsis = (text, line) => line ? `${text.replace(/\.|,$/g, "")}...` : "";
    this._fontColor = constant("black");
    this._fontFamily = constant(["Roboto", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]);
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
    this._id = (d, i) => d.id || `${i}`;
    this._lineHeight = (d, i) => this._fontSize(d, i) * 1.2;
    this._maxLines = constant(null);
    this._on = {};
    this._overflow = constant(false);
    this._padding = constant(0);
    this._pointerEvents = constant("auto");
    this._rotate = constant(0);
    this._rotateAnchor = d => [d.w / 2, d.h / 2];
    this._split = textSplit;
    this._text = accessor("text");
    this._textAnchor = constant("start");
    this._verticalAlign = constant("top");
    this._width = accessor("width", 200);
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
  }

  /**
      @memberof TextBox
      @desc Renders the text boxes. If a *callback* is specified, it will be called once the shapes are done drawing.
      @param {Function} [*callback* = undefined]
  */
  render(callback) {

    if (this._select === void 0) this.select(select("body").append("svg").style("width", `${window.innerWidth}px`).style("height", `${window.innerHeight}px`).node());

    const that = this;

    const boxes = this._select.selectAll(".d3plus-textBox").data(this._data.reduce((arr, d, i) => {

      let t = this._text(d, i);
      if (t === void 0) return arr;
      t = trim(t);

      const resize = this._fontResize(d, i);
      const lHRatio = this._lineHeight(d, i) / this._fontSize(d, i);

      let fS = resize ? this._fontMax(d, i) : this._fontSize(d, i),
          lH = resize ? fS * lHRatio : this._lineHeight(d, i),
          line = 1,
          lineData = [],
          sizes,
          wrapResults;

      const style = {
        "font-family": fontExists(this._fontFamily(d, i)),
        "font-size": fS,
        "font-weight": this._fontWeight(d, i),
        "line-height": lH
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
      function checkSize() {
        const truncate = () => {
          if (line < 1) lineData = [that._ellipsis("", line)];
          else lineData[line - 1] = that._ellipsis(lineData[line - 1], line);
        };

        // Constraint the font size
        fS = max([fS, fMin]);
        fS = min([fS, fMax]);

        if (resize) {
          lH = fS * lHRatio;
          wrapper
            .fontSize(fS)
            .lineHeight(lH);
          style["font-size"] = fS;
          style["line-height"] = lH;
        }

        wrapResults = wrapper(t);
        lineData = wrapResults.lines.filter(l => l !== "");
        line = lineData.length;

        if (wrapResults.truncated) {
          if (resize) {
            fS--;
            if (fS < fMin) {
              fS = fMin;
              truncate();
              return;
            }
            else checkSize();
          }
          else truncate();
        }
      }

      if (w > fMin && (h > lH || resize && h > fMin * lHRatio)) {

        if (resize) {

          sizes = textWidth(words, style);

          const areaMod = 1.165 + w / h * 0.1,
                boxArea = w * h,
                maxWidth = max(sizes),
                textArea = sum(sizes, d => d * lH) * areaMod;

          if (maxWidth > w || textArea > boxArea) {
            const areaRatio = Math.sqrt(boxArea / textArea),
                  widthRatio = w / maxWidth;
            const sizeRatio = min([areaRatio, widthRatio]);
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
        let yP = r === 0 ? vA === "top" ? 0 : vA === "middle" ? h / 2 - tH / 2 : h - tH : 0;
        yP -= lH * 0.1;

        arr.push({
          aH: this._ariaHidden(d, i),
          data: d,
          i,
          lines: lineData,
          fC: this._fontColor(d, i),
          fStroke: this._fontStroke(d, i),
          fSW: this._fontStrokeWidth(d, i),
          fF: style["font-family"],
          fO: this._fontOpacity(d, i),
          fW: style["font-weight"],
          id: this._id(d, i),
          tA: this._textAnchor(d, i),
          vA: this._verticalAlign(d, i),
          widths: wrapResults.widths,
          fS, lH, w, h, r,
          x: this._x(d, i) + padding.left,
          y: this._y(d, i) + yP + padding.top
        });

      }

      return arr;

    }, []), d => this._id(d.data, d.i));

    const t = this._select.transition().duration(this._duration);

    if (this._duration === 0) {

      boxes.exit().remove();

    }
    else {

      boxes.exit().transition().delay(this._duration).remove();

      boxes.exit().selectAll("text").transition(t)
        .attr("opacity", 0)
        .style("opacity", 0);

    }

    /**
     * Applies translate and rotate to a text element.
     * @param {D3Selection} text
     * @private
     */
    function rotate(text) {
      text.attr("transform", (d, i) => {
        const rotateAnchor = that._rotateAnchor(d, i);
        return `translate(${d.x}, ${d.y}) rotate(${d.r}, ${rotateAnchor[0]}, ${rotateAnchor[1]})`;
      });
    }

    const update = boxes.enter().append("g")
        .attr("class", "d3plus-textBox")
        .attr("id", d => `d3plus-textBox-${strip(d.id)}`)
        .call(rotate)
      .merge(boxes);

    const rtl = detectRTL();

    update
      .order()
      .style("pointer-events", d => this._pointerEvents(d.data, d.i))
      .each(function(d) {

        /**
            Sets the inner text content of each <text> element.
            @private
        */
        function textContent(text) {

          let tag = false;

          text[that._html ? "html" : "text"](t => {

            let cleaned = trimRight(t)
              .replace(/&([^;&]*)/g, (str, a) => a === "amp" ? str : `&amp;${a}`) // replaces all non-HTML ampersands with escaped entity
              .replace(/<([^A-z^/]+)/g, (str, a) => `&lt;${a}`).replace(/<$/g, "&lt;") // replaces all non-HTML left angle brackets with escaped entity
              .replace(/(<[^>^/]+>)([^<^>]+)$/g, (str, a, b) => `${a}${b}${a.replace("<", "</")}`) // ands end tag to lines before mid-HTML break
              .replace(/^([^<^>]+)(<\/[^>]+>)/g, (str, a, b) => `${b.replace("</", "<")}${a}${b}`); // ands start tag to lines after mid-HTML break

            const tagRegex = new RegExp(/<([A-z]+)[^>]*>([^<^>]+)<\/[^>]+>/g);
            if (cleaned.match(tagRegex)) {
              cleaned = cleaned
                .replace(tagRegex, (str, a, b) => {
                  tag = that._html[a] ? a : false;
                  if (tag) {
                    const style = that._html[tag];
                    if (t.includes(`</${tag}>`)) tag = false;
                    return `<tspan style="${style}">${b}</tspan>`;
                  }
                  return b;
                });
            }
            else if (tag.length) {
              cleaned = `<tspan style="${that._html[tag]}">${cleaned}</tspan>`;
            }

            return cleaned;

          });

        }

        /**
            Styles to apply to each <text> element.
            @private
        */
        function textStyle(text) {

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
            .attr("x", `${d.tA === "middle" ? d.w / 2 : rtl ? d.tA === "start" ? d.w : 0 : d.tA === "end" ? d.w : 2 * Math.sin(Math.PI * d.r / 180)}px`)
            .attr("y", (t, i) => d.r === 0 || d.vA === "top" ? `${(i + 1) * d.lH - (d.lH - d.fS)}px`
            : d.vA === "middle"
              ? `${(d.h + d.fS) / 2 - (d.lH - d.fS) + (i - d.lines.length / 2 + 0.5) * d.lH}px`
              : `${d.h - 2 * (d.lH - d.fS) - (d.lines.length - (i + 1)) * d.lH + 2 * Math.cos(Math.PI * d.r / 180)}px`);

        }

        const texts = select(this).selectAll("text").data(d.lines);

        if (that._duration === 0) {

          texts
            .call(textContent)
            .call(textStyle);

          texts.exit().remove();

          texts.enter().append("text")
            .attr("dominant-baseline", "alphabetic")
            .style("baseline-shift", "0%")
            .attr("unicode-bidi", "bidi-override")
            .call(textContent)
            .call(textStyle)
            .attr("opacity", d.fO)
            .style("opacity", d.fO);

        }
        else {

          texts.call(textContent).transition(t).call(textStyle);

          texts.exit().transition(t)
            .attr("opacity", 0).remove();

          texts.enter().append("text")
              .attr("dominant-baseline", "alphabetic")
              .style("baseline-shift", "0%")
              .attr("opacity", 0)
              .style("opacity", 0)
              .call(textContent)
              .call(textStyle)
            .merge(texts).transition(t).delay(that._delay)
              .call(textStyle)
              .attr("opacity", d.fO)
              .style("opacity", d.fO);
        }

      })
      .transition(t).call(rotate);

    const events = Object.keys(this._on),
          on = events.reduce((obj, e) => {
            obj[e] = (d, i) => this._on[e](d.data, i);
            return obj;
          }, {});
    for (let e = 0; e < events.length; e++) update.on(events[e], on[events[e]]);

    if (callback) setTimeout(callback, this._duration + 100);

    return this;

  }

  /**
      @memberof TextBox
      @desc If *value* is specified, sets the aria-hidden attribute to the specified function or string and returns the current class instance.
      @param {Function|String} *value*
      @chainable
  */
  ariaHidden(_) {
    return _ !== undefined
      ? (this._ariaHidden = typeof _ === "function" ? _ : constant(_), this)
      : this._ariaHidden;
  }

  /**
      @memberof TextBox
      @desc Sets the data array to the specified array. A text box will be drawn for each object in the array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof TextBox
      @desc Sets the animation delay to the specified number in milliseconds.
      @param {Number} [*value* = 0]
      @chainable
  */
  delay(_) {
    return arguments.length ? (this._delay = _, this) : this._delay;
  }

  /**
      @memberof TextBox
      @desc Sets the animation duration to the specified number in milliseconds.
      @param {Number} [*value* = 0]
      @chainable
  */
  duration(_) {
    return arguments.length ? (this._duration = _, this) : this._duration;
  }

  /**
      @memberof TextBox
      @desc Sets the function that handles what to do when a line is truncated. It should return the new value for the line, and is passed 2 arguments: the String of text for the line in question, and the number of the line. By default, an ellipsis is added to the end of any line except if it is the first word that cannot fit (in that case, an empty string is returned).
      @param {Function|String} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(text, line) {
  return line ? text.replace(/\.|,$/g, "") + "..." : "";
}
  */
  ellipsis(_) {
    return arguments.length ? (this._ellipsis = typeof _ === "function" ? _ : constant(_), this) : this._ellipsis;
  }

  /**
      @memberof TextBox
      @desc Sets the font color to the specified accessor function or static string, which is inferred from the [DOM selection](#textBox.select) by default.
      @param {Function|String} [*value* = "black"]
      @chainable
  */
  fontColor(_) {
    return arguments.length ? (this._fontColor = typeof _ === "function" ? _ : constant(_), this) : this._fontColor;
  }

  /**
      @memberof TextBox
      @desc Defines the font-family to be used. The value passed can be either a *String* name of a font, a comma-separated list of font-family fallbacks, an *Array* of fallbacks, or a *Function* that returns either a *String* or an *Array*. If supplying multiple fallback fonts, the [fontExists](#fontExists) function will be used to determine the first available font on the client's machine.
      @param {Array|Function|String} [*value* = ["Roboto", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]]
      @chainable
  */
  fontFamily(_) {
    return arguments.length ? (this._fontFamily = typeof _ === "function" ? _ : constant(_), this) : this._fontFamily;
  }

  /**
      @memberof TextBox
      @desc Sets the maximum font size to the specified accessor function or static number (which corresponds to pixel units), which is used when [dynamically resizing fonts](#textBox.fontResize).
      @param {Function|Number} [*value* = 50]
      @chainable
  */
  fontMax(_) {
    return arguments.length ? (this._fontMax = typeof _ === "function" ? _ : constant(_), this) : this._fontMax;
  }

  /**
      @memberof TextBox
      @desc Sets the minimum font size to the specified accessor function or static number (which corresponds to pixel units), which is used when [dynamically resizing fonts](#textBox.fontResize).
      @param {Function|Number} [*value* = 8]
      @chainable
  */
  fontMin(_) {
    return arguments.length ? (this._fontMin = typeof _ === "function" ? _ : constant(_), this) : this._fontMin;
  }

  /**
      @memberof TextBox
      @desc Sets the font opacity to the specified accessor function or static number between 0 and 1.
      @param {Function|Number} [*value* = 1]
      @chainable
   */
  fontOpacity(_) {
    return arguments.length ? (this._fontOpacity = typeof _ === "function" ? _ : constant(_), this) : this._fontOpacity;
  }

  /**
      @memberof TextBox
      @desc Toggles font resizing, which can either be defined as a static boolean for all data points, or an accessor function that returns a boolean. See [this example](http://d3plus.org/examples/d3plus-text/resizing-text/) for a side-by-side comparison.
      @param {Function|Boolean} [*value* = false]
      @chainable
  */
  fontResize(_) {
    return arguments.length ? (this._fontResize = typeof _ === "function" ? _ : constant(_), this) : this._fontResize;
  }

  /**
      @memberof TextBox
      @desc Sets the font size to the specified accessor function or static number (which corresponds to pixel units), which is inferred from the [DOM selection](#textBox.select) by default.
      @param {Function|Number} [*value* = 10]
      @chainable
  */
  fontSize(_) {
    return arguments.length ? (this._fontSize = typeof _ === "function" ? _ : constant(_), this) : this._fontSize;
  }

  /**
      @memberof TextBox
      @desc Sets the font stroke color for the rendered text.
      @param {Function|String} [*value* = "transparent"]
      @chainable
  */
  fontStroke(_) {
    return arguments.length ? (this._fontStroke = typeof _ === "function" ? _ : constant(_), this) : this._fontStroke;
  }

  /**
      @memberof TextBox
      @desc Sets the font stroke width for the rendered text.
      @param {Function|Number} [*value* = 0]
      @chainable
  */
  fontStrokeWidth(_) {
    return arguments.length ? (this._fontStrokeWidth = typeof _ === "function" ? _ : constant(_), this) : this._fontStrokeWidth;
  }

  /**
      @memberof TextBox
      @desc Sets the font weight to the specified accessor function or static number, which is inferred from the [DOM selection](#textBox.select) by default.
      @param {Function|Number|String} [*value* = 400]
      @chainable
  */
  fontWeight(_) {
    return arguments.length ? (this._fontWeight = typeof _ === "function" ? _ : constant(_), this) : this._fontWeight;
  }

  /**
      @memberof TextBox
      @desc Sets the height for each box to the specified accessor function or static number.
      @param {Function|Number} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d) {
  return d.height || 200;
}
  */
  height(_) {
    return arguments.length ? (this._height = typeof _ === "function" ? _ : constant(_), this) : this._height;
  }

  /**
      @memberof TextBox
      @desc Configures the ability to render simple HTML tags. Defaults to supporting `<b>`, `<strong>`, `<i>`, and `<em>`, set to false to disable or provide a mapping of tags to svg styles
      @param {Object|Boolean} [*value* = {
                i: 'font-style: italic;',
                em: 'font-style: italic;',
                b: 'font-weight: bold;',
                strong: 'font-weight: bold;'
            }]
      @chainable
  */
  html(_) {
    return arguments.length ? (this._html = typeof _ === "boolean" ? _ ? defaultHtmlLookup : false : _, this) : this._html;
  }


  /**
      @memberof TextBox
      @desc Defines the unique id for each box to the specified accessor function or static number.
      @param {Function|Number} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d, i) {
  return d.id || i + "";
}
  */
  id(_) {
    return arguments.length ? (this._id = typeof _ === "function" ? _ : constant(_), this) : this._id;
  }

  /**
      @memberof TextBox
      @desc Sets the line height to the specified accessor function or static number, which is 1.2 times the [font size](#textBox.fontSize) by default.
      @param {Function|Number} [*value*]
      @chainable
  */
  lineHeight(_) {
    return arguments.length ? (this._lineHeight = typeof _ === "function" ? _ : constant(_), this) : this._lineHeight;
  }

  /**
      @memberof TextBox
      @desc Restricts the maximum number of lines to wrap onto, which is null (unlimited) by default.
      @param {Function|Number} [*value*]
      @chainable
  */
  maxLines(_) {
    return arguments.length ? (this._maxLines = typeof _ === "function" ? _ : constant(_), this) : this._maxLines;
  }

  /**
      @memberof TextBox
      @desc Sets the text overflow to the specified accessor function or static boolean.
      @param {Function|Boolean} [*value* = false]
      @chainable
  */
  overflow(_) {
    return arguments.length ? (this._overflow = typeof _ === "function" ? _ : constant(_), this) : this._overflow;
  }

  /**
      @memberof TextBox
      @desc Sets the padding to the specified accessor function, CSS shorthand string, or static number, which is 0 by default.
      @param {Function|Number|String} [*value*]
      @chainable
  */
  padding(_) {
    return arguments.length ? (this._padding = typeof _ === "function" ? _ : constant(_), this) : this._padding;
  }

  /**
      @memberof TextBox
      @desc Sets the pointer-events to the specified accessor function or static string.
      @param {Function|String} [*value* = "auto"]
      @chainable
  */
  pointerEvents(_) {
    return arguments.length ? (this._pointerEvents = typeof _ === "function" ? _ : constant(_), this) : this._pointerEvents;
  }

  /**
      @memberof TextBox
      @desc Sets the rotate percentage for each box to the specified accessor function or static string.
      @param {Function|Number} [*value* = 0]
      @chainable
  */
  rotate(_) {
    return arguments.length ? (this._rotate = typeof _ === "function" ? _ : constant(_), this) : this._rotate;
  }

  /**
      @memberof TextBox
      @desc Sets the anchor point around which to rotate the text box.
      @param {Function|Number[]}
      @chainable
   */
  rotateAnchor(_) {
    return arguments.length ? (this._rotateAnchor = typeof _ === "function" ? _ : constant(_), this) : this._rotateAnchor;
  }

  /**
      @memberof TextBox
      @desc Sets the SVG container element to the specified d3 selector or DOM element. If not explicitly specified, an SVG element will be added to the page for use.
      @param {String|HTMLElement} [*selector*]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
      @memberof TextBox
      @desc Sets the word split behavior to the specified function, which when passed a string is expected to return that string split into an array of words.
      @param {Function} [*value*]
      @chainable
  */
  split(_) {
    return arguments.length ? (this._split = _, this) : this._split;
  }

  /**
      @memberof TextBox
      @desc Sets the text for each box to the specified accessor function or static string.
      @param {Function|String} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d) {
  return d.text;
}
  */
  text(_) {
    return arguments.length ? (this._text = typeof _ === "function" ? _ : constant(_), this) : this._text;
  }

  /**
      @memberof TextBox
      @desc Sets the horizontal text anchor to the specified accessor function or static string, whose values are analagous to the SVG [text-anchor](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor) property.
      @param {Function|String} [*value* = "start"]
      @chainable
  */
  textAnchor(_) {
    return arguments.length ? (this._textAnchor = typeof _ === "function" ? _ : constant(_), this) : this._textAnchor;
  }

  /**
      @memberof TextBox
      @desc Sets the vertical alignment to the specified accessor function or static string. Accepts `"top"`, `"middle"`, and `"bottom"`.
      @param {Function|String} [*value* = "top"]
      @chainable
  */
  verticalAlign(_) {
    return arguments.length ? (this._verticalAlign = typeof _ === "function" ? _ : constant(_), this) : this._verticalAlign;
  }

  /**
      @memberof TextBox
      @desc Sets the width for each box to the specified accessor function or static number.
      @param {Function|Number} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d) {
  return d.width || 200;
}
  */
  width(_) {
    return arguments.length ? (this._width = typeof _ === "function" ? _ : constant(_), this) : this._width;
  }

  /**
      @memberof TextBox
      @desc Sets the x position for each box to the specified accessor function or static number. The number given should correspond to the left side of the textBox.
      @param {Function|Number} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d) {
  return d.x || 0;
}
  */
  x(_) {
    return arguments.length ? (this._x = typeof _ === "function" ? _ : constant(_), this) : this._x;
  }

  /**
      @memberof TextBox
      @desc Sets the y position for each box to the specified accessor function or static number. The number given should correspond to the top side of the textBox.
      @param {Function|Number} [*value*]
      @chainable
      @example <caption>default accessor</caption>
function(d) {
  return d.y || 0;
}
  */
  y(_) {
    return arguments.length ? (this._y = typeof _ === "function" ? _ : constant(_), this) : this._y;
  }

}
