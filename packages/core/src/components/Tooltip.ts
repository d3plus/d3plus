import {select} from "d3-selection";
import {createPopper} from "@popperjs/core";

import {colorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {elem, prefix, stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {accessor, BaseClass, constant} from "../utils/index.js";

/**
 * Creates a reference element for popper.
 * @param {Number[]} position
 * @private
*/
function generateReference(
  position: number[] = [0, 0],
): () => Record<string, number> {
  return () => ({
    width: 0,
    height: 0,
    top: position[1],
    right: position[0],
    bottom: position[1],
    left: position[0],
  });
}

/**
    Creates HTML tooltips in the body of a webpage.
*/
export default class Tooltip extends BaseClass {
  _arrow: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _arrowStyle: Record<string, string>;
  _background: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _body: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _bodyStyle: Record<string, string>;
  _border: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _borderRadius: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _className: string;
  _data: DataPoint[];
  _footer: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _footerStyle: Record<string, string>;
  _height: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _id: (d: DataPoint, i: number) => string;
   
  _offset: (d: DataPoint, i?: number) => any;
  _padding: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _pointerEvents: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _popperClasses: Record<string, ReturnType<typeof createPopper>>;
  _position: (d: DataPoint, i?: number) => number[] | HTMLElement;
  _prefix: string;
  _tableStyle: Record<string, string>;
  _tbody: unknown[];
  _tbodyStyle: Record<string, string>;
  _thead: unknown[];
  _theadStyle: Record<string, string>;
  _title: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  _titleStyle: Record<string, string>;
  _tooltipStyle: Record<string, string>;
   
  _trStyle: Record<string, any>;
  _tdStyle: Record<string, string>;
  _width: (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();

    this._arrow = accessor("arrow", "");
    this._arrowStyle = {
      content: "",
      background: "inherit",
      border: "inherit",
      "border-width": "0 1px 1px 0",
      height: "10px",
      position: "absolute",
      transform: "rotate(45deg)",
      width: "10px",
      "z-index": "-1",
    };
    this._background = constant(colorDefaults.light);
    this._body = accessor("body", "");
    this._bodyStyle = {
      "font-size": "12px",
      "font-weight": "400",
      "z-index": "1",
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
      "z-index": "1",
    };
    this._height = constant("auto");
    this._id = (d: DataPoint, i: number) => `${i}`;
    this._offset = constant(5);
    this._padding = constant("10px");
    this._pointerEvents = constant("auto");
    this._popperClasses = {};
    this._position = (d: DataPoint) => [d.x as number, d.y as number];
    this._prefix = prefix();
    this._tableStyle = {
      "border-collapse": "collapse",
      "border-spacing": "0",
      width: "100%",
    };
    this._tbody = [];
    this._tbodyStyle = {
      "font-size": "12px",
      "text-align": "center",
    };
    this._thead = [];
    this._theadStyle = {
      "font-size": "12px",
      "font-weight": "600",
      "text-align": "center",
    };
    this._title = accessor("title", "");
    this._titleStyle = {
      "font-size": "14px",
      "font-weight": "600",
      "margin-bottom": "5px",
    };
    this._tooltipStyle = {
      "box-shadow": "0 1px 5px rgba(0, 0, 0, 0.25)",
      color: colorDefaults.dark,
      "font-family": fontFamilyStringify(fontFamily),
    };
    this._trStyle = {
      "border-top": (d: unknown, i: number) =>
        i ? "1px solid rgba(0, 0, 0, 0.1)" : "none",
    };
    this._tdStyle = {};
    this._width = constant("150px");
  }

  /**
      The inner return object and draw function that gets assigned the public methods.
      @private
*/
  render(callback?: Function): this {
    const that = this;

    const portal = elem("div#d3plus-portal");
    const tooltips = portal
      .selectAll(`.${this._className}`)
      .data(this._data, this._id);

    const enter = tooltips.enter().append("div").attr("class", this._className);

    const update = tooltips.merge(enter);
    stylize(update, this._tooltipStyle);

    /**
        Creates DIV elements with a unique class and styles.
        @private
*/
    function divElement(cat: string): void {
      enter
        .append("div")
        .attr("class", `d3plus-tooltip-${cat}`)
        .attr(
          "id",
          (d: DataPoint, i: number) =>
            `d3plus-tooltip-${cat}-${d ? that._id(d, i) : ""}`,
        );

      const div = update
        .select(`.d3plus-tooltip-${cat}`)
        .html(
          (d: DataPoint, i: number) =>
            (
              that as unknown as Record<
                string,
                (d: DataPoint, i: number) => unknown
              >
            )[`_${cat}`](d, i) as string,
        )
        .style("display", (d: DataPoint, i: number) => {
          const val = (
            that as unknown as Record<
              string,
              (d: DataPoint, i: number) => unknown
            >
          )[`_${cat}`](d, i);
          const visible = val !== false && val !== undefined && val !== null;
          return visible ? "block" : "none";
        });

      stylize(
        div,
        (that as unknown as Record<string, Record<string, string>>)[
          `_${cat}Style`
        ],
      );
    }

    /**
        Fetches table contents given functions or values.
        @private
*/
    function cellContent(this: HTMLElement, d: unknown): string {
      if (typeof d === "function") {
        const datum = select(
          this.parentNode!.parentNode! as Element,
        ).datum() as DataPoint;
        return d(datum, that._data.indexOf(datum)) as string;
      } else return d as string;
    }

    /**
        Sets styles for both enter and update.
        @private
*/
    function boxStyles(box: D3Selection): void {
      box
        .style("background", that._background as never)
        .style(`${that._prefix}border-radius`, that._borderRadius as never)
        .style("pointer-events", that._pointerEvents as never)
        .style("padding", that._padding as never)
        .style("width", that._width as never)
        .style("height", that._height as never)
        .style("border", that._border as never);
    }

    divElement("title");
    divElement("body");

    const tableEnter = enter
      .append("table")
      .attr("class", "d3plus-tooltip-table");
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
    th.enter()
      .append("th")
      .merge(th as never)
      .html(cellContent as never);
    th.exit().remove();

    tableEnter.append("tbody").attr("class", "d3plus-tooltip-tbody");
    const tableBody = update.select(".d3plus-tooltip-tbody");
    stylize(tableBody, this._tbodyStyle);
    const tr = tableBody.selectAll("tr").data(this._tbody);
    const trEnter = tr.enter().append("tr");
    tr.exit().remove();
    const trUpdate = tr.merge(trEnter);
    stylize(trUpdate, this._trStyle);
    const td = trUpdate.selectAll("td").data((d: unknown) => d as unknown[]);
    td.enter()
      .append("td")
      .merge(td as never)
      .html(cellContent as never);
    stylize(td, this._tdStyle);

    divElement("footer");

    divElement("arrow");

    enter
      .attr(
        "id",
        (d: DataPoint, i: number) =>
          `d3plus-tooltip-${d ? this._id(d, i) : ""}`,
      )
      .call(boxStyles)
      .each((d: DataPoint, i: number) => {
        const id = that._id(d, i);
        const tooltip = document.getElementById(`d3plus-tooltip-${id}`);
        const arrow = document.getElementById(`d3plus-tooltip-arrow-${id}`);
        const arrowHeight = arrow!.offsetHeight;
        const arrowDistance = arrow!.getBoundingClientRect().height / 2;
        arrow!.style.bottom = `-${arrowHeight / 2}px`;

        const position = that._position(d, i);

         
        const referenceObject: any = Array.isArray(position)
          ? {
              getBoundingClientRect: generateReference(position),
            }
          : position;

        this._popperClasses[id] = createPopper(referenceObject, tooltip!, {
          placement: "top",
          modifiers: [
            {
              name: "arrow",
              options: {
                element: arrow,
              },
            },
            {
              name: "offset",
              options: {
                offset: [0, that._offset(d, i) + arrowDistance],
              },
            },
            {
              name: "preventOverflow",
              options: {
                boundary: "scrollParent",
                padding: 5,
              },
            },
            {
              name: "flip",
              options: {
                behavior: "flip",
                boundary: "viewport",
                fallbackPlacements: ["bottom"],
                padding: 5,
              },
            },
            {
              name: "update",
              enabled: true,
              phase: "afterWrite",
               
              fn(x: {state: any}) {
                const {state} = x;
                const arrowElement = state.elements.arrow;
                const arrowStyles = state.styles.arrow;
                const flipped = state.modifiersData.flip._skip;
                const border = parseFloat(arrowElement.style.borderRightWidth);
                if (flipped) {
                  arrowElement.style.transform = `${arrowStyles.transform}rotate(225deg)`;
                  arrowElement.style.top = `-${arrowHeight / 2 + border}px`;
                } else {
                  arrowElement.style.transform = `${arrowStyles.transform}rotate(45deg)`;
                  arrowElement.style.bottom = `-${arrowHeight / 2 + border}px`;
                }
              },
            },
          ],
          removeOnDestroy: true,
        } as Parameters<typeof createPopper>[2]);
      });

    update
      .each((d: DataPoint, i: number) => {
        const id = that._id(d, i);
        const position = that._position(d, i);
        const instance = this._popperClasses[id];

        if (instance) {
           
          (instance as any).state.elements.reference.getBoundingClientRect =
            Array.isArray(position)
              ? generateReference(position as number[])
              : position;
          instance.update();
        }
      })
      .call(boxStyles);

    tooltips
      .exit()
      .each((d: DataPoint, i: number) => {
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
   The inner HTML content of the arrow element, empty by default.

@example <caption>default accessor</caption>
   function value(d) {
  return d.arrow || "";
}
*/
  arrow(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  arrow(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  arrow(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._arrow = typeof _ === "function" ? _ : constant(_)), this)
      : this._arrow;
  }

  /**
   CSS styles applied to the arrow element.

@example <caption>default styles</caption>
   {
     "content": "",
     "border-width": "10px",
     "border-style": "solid",
     "border-color": "rgba(255, 255, 255, 0.75) transparent transparent transparent",
     "position": "absolute"
   }
*/
  arrowStyle(): Record<string, string>;
  arrowStyle(_: Record<string, string>): this;
  arrowStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._arrowStyle = Object.assign(this._arrowStyle, _)), this)
      : this._arrowStyle;
  }

  /**
      The background color accessor for each tooltip.
*/
  background(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  background(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  background(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._background = typeof _ === "function" ? _ : constant(_)), this)
      : this._background;
  }

  /**
      The body content accessor for each tooltip.

@example <caption>default accessor</caption>
function value(d) {
  return d.body || "";
}
*/
  body(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  body(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  body(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._body = typeof _ === "function" ? _ : constant(_)), this)
      : this._body;
  }

  /**
      CSS styles applied to the body element.

@example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "400"
}
*/
  bodyStyle(): Record<string, string>;
  bodyStyle(_: Record<string, string>): this;
  bodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._bodyStyle = Object.assign(this._bodyStyle, _)), this)
      : this._bodyStyle;
  }

  /**
      The border accessor for each tooltip.
*/
  border(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  border(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  border(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._border = typeof _ === "function" ? _ : constant(_)), this)
      : this._border;
  }

  /**
      The border-radius accessor for each tooltip.
*/
  borderRadius(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  borderRadius(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  borderRadius(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._borderRadius = typeof _ === "function" ? _ : constant(_)), this)
      : this._borderRadius;
  }

  /**
      The CSS class name applied to the tooltip container.
*/
  className(): string;
  className(_: string): this;
  className(_?: string): any {
    return arguments.length ? ((this._className = _!), this) : this._className;
  }

  /**
      The data array used to create tooltips.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The footer content accessor for each tooltip.

@example <caption>default accessor</caption>
function value(d) {
  return d.footer || "";
}
*/
  footer(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  footer(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  footer(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._footer = typeof _ === "function" ? _ : constant(_)), this)
      : this._footer;
  }

  /**
      CSS styles applied to the footer element.

@example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "400"
}
*/
  footerStyle(): Record<string, string>;
  footerStyle(_: Record<string, string>): this;
  footerStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._footerStyle = Object.assign(this._footerStyle, _)), this)
      : this._footerStyle;
  }

  /**
      The height accessor for each tooltip.
*/
  height(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  height(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  height(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._height = typeof _ === "function" ? _ : constant(_)), this)
      : this._height;
  }

  /**
      The unique id accessor for each tooltip.

@example <caption>default accessor</caption>
function value(d, i) {
  return d.id || "" + i;
}
*/
  id(): (d: DataPoint, i: number) => string;
  id(_: ((d: DataPoint, i: number) => string) | string): this;
  id(_?: ((d: DataPoint, i: number) => string) | string): unknown {
    return arguments.length
      ? ((this._id = typeof _ === "function" ? _ : constant(_)), this)
      : this._id;
  }

  /**
      The pixel offset between the tooltip and its anchor point.
*/
  offset(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  offset(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | number,
  ): this;
  offset(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | number,
  ): unknown {
    return arguments.length
      ? ((this._offset = typeof _ === "function" ? _ : constant(_)), this)
      : this._offset;
  }

  /**
      The inner padding of each tooltip.
*/
  padding(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  padding(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  padding(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._padding = typeof _ === "function" ? _ : constant(_)), this)
      : this._padding;
  }

  /**
      The pointer-events CSS property for each tooltip.
*/
  pointerEvents(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  pointerEvents(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  pointerEvents(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._pointerEvents = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._pointerEvents;
  }

  /**
      The position of each tooltip. Can be an HTMLElement to anchor to, a selection string, or coordinate points in reference to the client viewport (not the overall page).

@example <caption>default accessor</caption>
   function value(d) {
    return [d.x, d.y];
  }
*/
  position(): (d: DataPoint, i?: number) => number[] | HTMLElement;
  position(
    _:
      | ((d: DataPoint, i?: number) => number[] | HTMLElement)
      | number[]
      | HTMLElement
      | string,
  ): this;
  position(
    _?:
      | ((d: DataPoint, i?: number) => number[] | HTMLElement)
      | number[]
      | HTMLElement
      | string,
  ): unknown {
    return arguments.length
      ? ((this._position =
          typeof _ === "string"
            ? (constant((select(_).node() || [0, 0]) as HTMLElement) as (
                d: DataPoint,
                i?: number,
              ) => number[] | HTMLElement)
            : typeof _ === "function"
              ? _
              : (constant(_) as (
                  d: DataPoint,
                  i?: number,
                ) => number[] | HTMLElement)),
        this)
      : this._position;
  }

  /**
      CSS styles applied to the table element.

@example <caption>default styles</caption>
{
  "border-collapse": "collapse",
  "border-spacing": "0",
  "width": "100%"
}
*/
  tableStyle(): Record<string, string>;
  tableStyle(_: Record<string, string>): this;
  tableStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._tableStyle = Object.assign(this._tableStyle, _)), this)
      : this._tableStyle;
  }

  /**
      The table body contents as an array of functions or strings.
*/
  tbody(): unknown[];
  tbody(_: unknown[]): this;
  tbody(_?: unknown[]): unknown {
    return arguments.length ? ((this._tbody = _!), this) : this._tbody;
  }

  /**
      CSS styles applied to the table body element.

@example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
*/
  tbodyStyle(): Record<string, string>;
  tbodyStyle(_: Record<string, string>): this;
  tbodyStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._tbodyStyle = Object.assign(this._tbodyStyle, _)), this)
      : this._tbodyStyle;
  }

  /**
      The table head contents as an array of functions or strings.
*/
  thead(): unknown[];
  thead(_: unknown[]): this;
  thead(_?: unknown[]): unknown {
    return arguments.length ? ((this._thead = _!), this) : this._thead;
  }

  /**
      CSS styles applied to the table head element.

@example <caption>default styles</caption>
{
  "font-size": "12px",
  "font-weight": "600",
  "text-align": "center"
}
*/
  theadStyle(): Record<string, string>;
  theadStyle(_: Record<string, string>): this;
  theadStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._theadStyle = Object.assign(this._theadStyle, _)), this)
      : this._theadStyle;
  }

  /**
      The title content accessor for each tooltip.

@example <caption>default accessor</caption>
function value(d) {
  return d.title || "";
}
*/
  title(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  title(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  title(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._title = typeof _ === "function" ? _ : constant(_)), this)
      : this._title;
  }

  /**
      CSS styles applied to the title element.

@example <caption>default styles</caption>
{
  "font-size": "14px",
  "font-weight": "600",
  "padding-bottom": "5px"
}
*/
  titleStyle(): Record<string, string>;
  titleStyle(_: Record<string, string>): this;
  titleStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._titleStyle = Object.assign(this._titleStyle, _)), this)
      : this._titleStyle;
  }

  /**
      Overall CSS styles applied to the tooltip container.

@example <caption>default styles</caption>
{
  "font-family": "'Inter', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif",
  "font-size": "14px",
  "font-weight": "600",
  "padding-bottom": "5px"
}
*/
  tooltipStyle(): Record<string, string>;
  tooltipStyle(_: Record<string, string>): this;
  tooltipStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._tooltipStyle = Object.assign(this._tooltipStyle, _)), this)
      : this._tooltipStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <tr> elements inside of each <tbody>.

@example <caption>default styles</caption>
  {
    "border-top": "1px solid rgba(0, 0, 0, 0.1)"
  }
*/
   
  trStyle(): Record<string, any>;
   
  trStyle(_: Record<string, any>): this;
   
  trStyle(_?: Record<string, any>): unknown {
    return arguments.length
      ? ((this._trStyle = Object.assign(this._trStyle, _)), this)
      : this._trStyle;
  }

  /**
      An object with CSS keys and values to be applied to all <td> elements inside of each <tr>.
*/
  tdStyle(): Record<string, string>;
  tdStyle(_: Record<string, string>): this;
  tdStyle(_?: Record<string, string>): unknown {
    return arguments.length
      ? ((this._tdStyle = Object.assign(this._tdStyle, _)), this)
      : this._tdStyle;
  }

  /**
      The width accessor for each tooltip.
*/
  width(): (d: DataPoint, i?: number) => DataPoint[keyof DataPoint];
  width(
    _: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): this;
  width(
    _?: ((d: DataPoint, i?: number) => DataPoint[keyof DataPoint]) | string,
  ): unknown {
    return arguments.length
      ? ((this._width = typeof _ === "function" ? _ : constant(_)), this)
      : this._width;
  }
}
