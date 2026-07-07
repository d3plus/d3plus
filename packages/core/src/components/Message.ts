import {select} from "d3-selection";

import {stylize} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

interface HideOptions {
  duration?: number;
  callback?: (() => void) | null;
}

interface RenderOptions {
  callback?: (() => void) | null;
  container?: string;
  duration?: number;
  html?: string;
  mask?: string | false;
   
  style?: Record<string, unknown>;
}

/**
    Displays a message using plain HTML.
    @private
*/
export default class Message {
  _isVisible: boolean;
  mask!: D3Selection;
  elem!: D3Selection;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    this._isVisible = false;
  }

  /**
      Removes the message from the page.
  */
  exit(elem: D3Selection, duration: number): void {
    elem
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .transition()
      .remove();

    this._isVisible = false;
  }

  /**
      Removes the message from the page.
  */
  hide({duration = 600, callback}: HideOptions = {}): this {
    this.mask.call(this.exit.bind(this), duration);
    this.elem.call(this.exit.bind(this), duration);

    if (callback) setTimeout(callback, duration + 100);

    this._isVisible = false;

    return this;
  }

  /**
      Draws the message given the specified configuration.
*/
  render({
    callback,
    container = "body",
    duration = 600,
    html = "Please Wait",
    mask = "rgba(0, 0, 0, 0.05)",
    style = {},
  }: RenderOptions = {}): this {
    const parent = select(container);

    this.mask = parent
      .selectAll("div.d3plus-Mask")
      .data(mask ? [mask] : []) as unknown as D3Selection;

    this.mask = this.mask
      .enter()
      .append("div")
      .attr("class", "d3plus-Mask")
      .style("opacity", 1)
      .merge(this.mask as never) as unknown as D3Selection;

    this.mask.exit().call(this.exit.bind(this), duration);

    stylize(this.mask, {
      "background-color": "transparent",
      bottom: "0px",
      left: "0px",
      position: "absolute",
      right: "0px",
      top: "0px",
    });

    this.elem = parent
      .selectAll("div.d3plus-Message")
      .data([html]) as unknown as D3Selection;

    this.elem = (
      this.elem
        .enter()
        .append("div")
        .attr("class", "d3plus-Message")
        .style("opacity", 1)
        .merge(this.elem as never) as unknown as D3Selection
    ).html(String);

    stylize(this.elem, style as Record<string, string | number | boolean | null>);

    if (callback) setTimeout(callback, 100);

    this._isVisible = true;

    return this;
  }
}
