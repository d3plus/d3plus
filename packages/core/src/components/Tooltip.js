import {select} from "d3-selection";
import {createPopper} from '@popperjs/core';

import {colorDefaults} from "@d3plus/color";
import {elem, prefix, stylize} from "@d3plus/dom";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";

/**
 * Creates a reference element for popper.
 * @param {Number[]} position
 * @prrivate
 */
function generateReference(position = [0, 0]) {
  return () => ({
    width: 0,
    height: 0,
    top: position[1],
    right: position[0],
    bottom: position[1],
    left: position[0]
  });
}

/**
    @class Tooltip
    @extends BaseClass
    @desc Creates HTML tooltips in the body of a webpage.
*/
export default class Tooltip extends BaseClass {

  /**
      @memberof Tooltip
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._arrow = accessor("arrow", "");
    this._arrowStyle = {
      "content": "",
      "background": "inherit",
      "border": "inherit",
      "border-width": "0 1px 1px 0",
      "height": "10px",
      "position": "absolute",
      "transform": "rotate(45deg)",
      "width": "10px",
      "z-index": "-1"
    };
    this._background = constant(colorDefaults.light);
    this._body = accessor("body", "");
    this._bodyStyle = {
      "font-size": "12px",
      "font-weight": "400",
      "z-index": "1"
    };
    this._border = constant("1px solid rgba(0, 0, 0, 0.25)");
    this._borderRadius = constant("4px");
    this._className = "d3plus-tooltip";
    this._data = [];
    this._footer = accessor("footer", "");
    this._footerStyle = {
      "font-size": "9px",
      "font-weight": "400",
      "margin-top": "5px",
      "z-index": "1"
    };
    this._height = constant("auto");
    this._id = (d, i) => `${i}`;
    this._offset = constant(5);
    this._padding = constant("10px");
    this._pointerEvents = constant("auto");
    this._popperClasses = {};
    this._position = d => [d.x, d.y];
    this._prefix = prefix();
    this._tableStyle = {
      "border-collapse": "collapse",
      "border-spacing": "0",
      "width": "100%"
    };
    this._tbody = [];
    this._tbodyStyle = {
      "font-size": "12px",
      "text-align": "center"
    };
    this._thead = [];
    this._theadStyle = {
      "font-size": "12px",
      "font-weight": "600",
      "text-align": "center"
    };
    this._title = accessor("title", "");
    this._titleStyle = {
      "font-size": "14px",
      "font-weight": "600",
      "margin-bottom": "5px"
    };
    this._tooltipStyle = {
      "box-shadow": "0 1px 5px rgba(0, 0, 0, 0.25)",
      "color": colorDefaults.dark,
      "font-family": fontFamilyStringify(fontFamily)
    };
    this._trStyle = {
      "border-top": (d, i) => i ? "1px solid rgba(0, 0, 0, 0.1)" : "none"
    };
    this._tdStyle = {};
    this._width = constant("150px");
  }

  /**
      The inner return object and draw function that gets assigned the public methods.
      @private
  */
  render(callback) {

    const that = this;

    const portal = elem("div#d3plus-portal");
    const tooltips = portal.selectAll(`.${this._className}`)
      .data(this._data, this._id);

    const enter = tooltips.enter().append("div")
      .attr("class", this._className);

    const update = tooltips.merge(enter);
    stylize(update, this._tooltipStyle);

    /**
        Creates DIV elements with a unique class and styles.
        @private
    */
    function divElement(cat) {

      enter.append("div")
        .attr("class", `d3plus-tooltip-${cat}`)
        .attr("id", (d, i) => `d3plus-tooltip-${cat}-${d ? that._id(d, i) : ""}`);

      const div = update.select(`.d3plus-tooltip-${cat}`)
        .html((d, i) => that[`_${cat}`](d, i))
        .style("display", (d, i) => {
          const val = that[`_${cat}`](d, i);
          const visible = val !== false && val !== undefined && val !== null;
          return visible ? "block" : "none";
        });

      stylize(div, that[`_${cat}Style`]);

    }

    /**
        Fetches table contents given functions or values.
        @private
    */
    function cellContent(d) {
      if (typeof d === "function") {
        const datum = select(this.parentNode.parentNode).datum();
        return d(datum, that._data.indexOf(datum));
      }
      else return d;
    }

    /**
        Sets styles for both enter and update.
        @private
    */
    function boxStyles(box) {

      box
        .style("background", that._background)
        .style(`${that._prefix}border-radius`, that._borderRadius)
        .style("pointer-events", that._pointerEvents)
        .style("padding", that._padding)
        .style("width", that._width)
        .style("height", that._height)
        .style("border", that._border);
    }

    divElement("title");
    divElement("body");

    const tableEnter = enter.append("table").attr("class", "d3plus-tooltip-table");
    const table = update.select(".d3plus-tooltip-table");
    stylize(table, this._tableStyle);

    tableEnter.append("thead").attr("class", "d3plus-tooltip-thead");
    const tableHead = update.select(".d3plus-tooltip-thead");
    stylize(tableHead, this._theadStyle);
    const theadTr = tableHead.selectAll("tr").data([0]);
    const theadTrEnter = theadTr.enter().append("tr");
    theadTr.exit().remove();
    const theadTrUpdate = theadTr.merge(theadTrEnter);
    stylize(theadTrUpdate, this._trStyle);
    const th = theadTrUpdate.selectAll("th").data(this._thead);
    th.enter().append("th").merge(th).html(cellContent);
    th.exit().remove();

    tableEnter.append("tbody").attr("class", "d3plus-tooltip-tbody");
    const tableBody = update.select(".d3plus-tooltip-tbody");
    stylize(tableBody, this._tbodyStyle);
    const tr = tableBody.selectAll("tr").data(this._tbody);
    const trEnter = tr.enter().append("tr");
    tr.exit().remove();
    const trUpdate = tr.merge(trEnter);
    stylize(trUpdate, this._trStyle);
    const td = trUpdate.selectAll("td").data(d => d);
    td.enter().append("td").merge(td).html(cellContent);
    stylize(td, this._tdStyle);

    divElement("footer");

    divElement("arrow");

    enter
      .attr("id", (d, i) => `d3plus-tooltip-${d ? this._id(d, i) : ""}`)
      .call(boxStyles)
      .each((d, i) => {

        const id = that._id(d, i);
        const tooltip = document.getElementById(`d3plus-tooltip-${id}`);
        const arrow = document.getElementById(`d3plus-tooltip-arrow-${id}`);
        const arrowHeight = arrow.offsetHeight;
        const arrowDistance = arrow.getBoundingClientRect().height / 2;
        arrow.style.bottom = `-${arrowHeight / 2}px`;

        const position = that._position(d, i);

        const referenceObject = Array.isArray(position) ? {
          getBoundingClientRect: generateReference(position)
        }
          : position;

        this._popperClasses[id] = createPopper(referenceObject, tooltip, {
          placement: "top",
          modifiers: [
            {
              name: "arrow",
              options: {
                element: arrow
              }
            },
            {
              name: "offset",
              options: {
                offset: [0, that._offset(d, i) + arrowDistance]
              }
            },
            {
              name: "preventOverflow",
              options: {
                boundary: "scrollParent",
                padding: 5
              }
            },
            {
              name: "flip",
              options: {
                behavior: "flip",
                boundary: "viewport",
                fallbackPlacements: ["bottom"],
                padding: 5
              }
            },
            {
              name: "update",
              enabled: true,
              phase: "afterWrite",
              fn(x) {
                const {state} = x;
                const arrowElement = state.elements.arrow;
                const arrowStyles = state.styles.arrow;
                const flipped = state.modifiersData.flip._skip;
                const border = parseFloat(arrowElement.style.borderRightWidth, 10);
                if (flipped) {
                  arrowElement.style.transform = `${arrowStyles.transform}rotate(225deg)`;
                  arrowElement.style.top = `-${arrowHeight / 2 + border}px`;
                }
                else {
                  arrowElement.style.transform = `${arrowStyles.transform}rotate(45deg)`;
                  arrowElement.style.bottom = `-${arrowHeight / 2 + border}px`;
                }
              }
            }
          ],
          removeOnDestroy: true
        });

      });

    update
      .each((d, i) => {
        const id = that._id(d, i);
        const position = that._position(d, i);
        const instance = this._popperClasses[id];

        if (instance) {
          instance.state.elements.reference.getBoundingClientRect = Array.isArray(position)
            ? generateReference(position)
            : position;
          instance.update();
        }

      })
      .call(boxStyles);

    tooltips.exit()
      .each((d, i) => {
        const id = that._id(d, i);
        const instance = this._popperClasses[id];
        if (instance) {
          instance.destroy();
          delete this._popperClasses[id];
        }
      })
      .remove();

    if (callback) setTimeout(callback, 100);

    return this;

  }

  /**
   @memberof Tooltip
   @desc Sets the inner HTML content of the arrow element, which by default is empty.
   @param {Function|String} [*value*]
   @example <caption>default accessor</caption>
   function value(d) {
  return d.arrow || "";
}
   */
  arrow(_) {
    return arguments.length ? (this._arrow = typeof _ === "function" ? _ : constant(_), this) : this._arrow;
  }

  /**
   @memberof Tooltip
   @desc If *value* is specified, sets the arrow styles to the specified values and returns this generator. If *value* is not specified, returns the current arrow styles.
   @param {Object} [*value*]
   @example <caption>default styles</caption>
   {
     "content": "",
     "border-width": "10px",
     "border-style": "solid",
     "border-color": "rgba(255, 255, 255, 0.75) transparent transparent transparent",
     "position": "absolute"
   }
   */
  arrowStyle(_) {
    return arguments.length ? (this._arrowStyle = Object.assign(this._arrowStyle, _), this) : this._arrowStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the background accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current background accessor.
      @param {Function|String} [*value* = colorDefaults.light]
  */
  background(_) {
    return arguments.length ? (this._background = typeof _ === "function" ? _ : constant(_), this) : this._background;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the body accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current body accessor.
      @param {Function|String} [*value*]
      @example <caption>default accessor</caption>
function value(d) {
  return d.body || "";
}
  */
  body(_) {
    return arguments.length ? (this._body = typeof _ === "function" ? _ : constant(_), this) : this._body;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the body styles to the specified values and returns this generator. If *value* is not specified, returns the current body styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "400"
}
  */
  bodyStyle(_) {
    return arguments.length ? (this._bodyStyle = Object.assign(this._bodyStyle, _), this) : this._bodyStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the border accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current border accessor.
      @param {Function|String} [*value* = "1px solid rgba(0, 0, 0, 0.1)"]
  */
  border(_) {
    return arguments.length ? (this._border = typeof _ === "function" ? _ : constant(_), this) : this._border;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the border-radius accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current border-radius accessor.
      @param {Function|String} [*value* = "2px"]
  */
  borderRadius(_) {
    return arguments.length ? (this._borderRadius = typeof _ === "function" ? _ : constant(_), this) : this._borderRadius;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the class name to the specified string and returns this generator. If *value* is not specified, returns the current class name.
      @param {String} [*value* = "d3plus-tooltip"]
  */
  className(_) {
    return arguments.length ? (this._className = _, this) : this._className;
  }

  /**
      @memberof Tooltip
      @desc If *data* is specified, sets the data array to the specified array and returns this generator. If *data* is not specified, returns the current data array.
      @param {Array} [*data* = []]
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the footer accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current footer accessor.
      @param {Function|String} [*value*]
      @example <caption>default accessor</caption>
function value(d) {
  return d.footer || "";
}
  */
  footer(_) {
    return arguments.length ? (this._footer = typeof _ === "function" ? _ : constant(_), this) : this._footer;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the footer styles to the specified values and returns this generator. If *value* is not specified, returns the current footer styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "400"
}
  */
  footerStyle(_) {
    return arguments.length ? (this._footerStyle = Object.assign(this._footerStyle, _), this) : this._footerStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the height accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current height accessor.
      @param {Function|String} [*value* = "auto"]
  */
  height(_) {
    return arguments.length ? (this._height = typeof _ === "function" ? _ : constant(_), this) : this._height;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the id accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current id accessor.
      @param {Function|String} [*value*]
      @example <caption>default accessor</caption>
function value(d, i) {
  return d.id || "" + i;
}
  */
  id(_) {
    return arguments.length ? (this._id = typeof _ === "function" ? _ : constant(_), this) : this._id;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the offset accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current offset accessor.
      @param {Function|Number} [*value* = 10]
  */
  offset(_) {
    return arguments.length ? (this._offset = typeof _ === "function" ? _ : constant(_), this) : this._offset;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the padding accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current padding accessor.
      @param {Function|String} [*value* = "5px"]
  */
  padding(_) {
    return arguments.length ? (this._padding = typeof _ === "function" ? _ : constant(_), this) : this._padding;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the pointer-events accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current pointer-events accessor.
      @param {Function|String} [*value* = "auto"]
  */
  pointerEvents(_) {
    return arguments.length ? (this._pointerEvents = typeof _ === "function" ? _ : constant(_), this) : this._pointerEvents;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the position accessor to the specified function or array and returns this generator. If *value* is not specified, returns the current position accessor. If *value* is an HTMLElement, anchors the Tooltip to that HTMLElement. If *value* is a selection string, anchors the Tooltip to the HTMLElement selected by that string. Otherwise, coordinate points must be in reference to the client viewport, not the overall page.
      @param {Function|Array|HTMLElement|String} [*value*]
      @example <caption>default accessor</caption>
   function value(d) {
    return [d.x, d.y];
  }
   */
  position(_) {
    return arguments.length ? (this._position = typeof _ === "string" ? constant(select(_).node() || [0, 0]) : typeof _ === "function" ? _ : constant(_), this) : this._position;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the table styles to the specified values and returns this generator. If *value* is not specified, returns the current table styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "border-collapse": "collapse",
  "border-spacing": "0",
  "width": "100%"
}
  */
  tableStyle(_) {
    return arguments.length ? (this._tableStyle = Object.assign(this._tableStyle, _), this) : this._tableStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the contents of the table body to the specified array of functions or strings and returns this generator. If *value* is not specified, returns the current table body data.
      @param {Array} [*value* = []]
  */
  tbody(_) {
    return arguments.length ? (this._tbody = _, this) : this._tbody;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the table body styles to the specified values and returns this generator. If *value* is not specified, returns the current table body styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
  */
  tbodyStyle(_) {
    return arguments.length ? (this._tbodyStyle = Object.assign(this._tbodyStyle, _), this) : this._tbodyStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the contents of the table head to the specified array of functions or strings and returns this generator. If *value* is not specified, returns the current table head data.
      @param {Array} [*value* = []]
  */
  thead(_) {
    return arguments.length ? (this._thead = _, this) : this._thead;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the table head styles to the specified values and returns this generator. If *value* is not specified, returns the current table head styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
  */
  theadStyle(_) {
    return arguments.length ? (this._theadStyle = Object.assign(this._theadStyle, _), this) : this._theadStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the title accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current title accessor.
      @param {Function|String} [*value*]
      @example <caption>default accessor</caption>
function value(d) {
  return d.title || "";
}
  */
  title(_) {
    return arguments.length ? (this._title = typeof _ === "function" ? _ : constant(_), this) : this._title;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the title styles to the specified values and returns this generator. If *value* is not specified, returns the current title styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-size": "14px",
  "font-weight": "600",
  "padding-bottom": "5px"
}
  */
  titleStyle(_) {
    return arguments.length ? (this._titleStyle = Object.assign(this._titleStyle, _), this) : this._titleStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the overall tooltip styles to the specified values and returns this generator. If *value* is not specified, returns the current title styles.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
{
  "font-family": "'Inter', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "14px",
  "font-weight": "600",
  "padding-bottom": "5px"
}
  */
  tooltipStyle(_) {
    return arguments.length ? (this._tooltipStyle = Object.assign(this._tooltipStyle, _), this) : this._tooltipStyle;
  }

  /**
      @memberof Tooltip
      @desc An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.
      @param {Object} [*value*]
      @example <caption>default styles</caption>
  {
    "border-top": "1px solid rgba(0, 0, 0, 0.1)"
  }
   */
  trStyle(_) {
    return arguments.length ? (this._trStyle = Object.assign(this._trStyle, _), this) : this._trStyle;
  }

  /**
      @memberof Tooltip
      @desc An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.
      @param {Object} [*value*]
   */
  tdStyle(_) {
    return arguments.length ? (this._tdStyle = Object.assign(this._tdStyle, _), this) : this._tdStyle;
  }

  /**
      @memberof Tooltip
      @desc If *value* is specified, sets the width accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current width accessor.
      @param {Function|String} [*value* = "auto"]
  */
  width(_) {
    return arguments.length ? (this._width = typeof _ === "function" ? _ : constant(_), this) : this._width;
  }

}
