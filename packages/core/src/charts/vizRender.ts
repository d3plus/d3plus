import {range} from "d3-array";
import {select} from "d3-selection";

import {inViewport} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";

import {runVizPipeline} from "./runVizPipeline.js";
import touchstartBody from "./events/touchstart.body.js";
import type {VizInstance} from "./vizTypes.js";
import type Viz from "./Viz.js";

/**
    Appends a fullscreen SVG to the BODY if a container has not been provided
    through `.select()`, then points `_select` at the resolved svg node.
    @private
*/
function ensureSvgSelect(viz: Viz): void {
  if (
    viz._select === void 0 ||
    viz._select.node().tagName.toLowerCase() !== "svg"
  ) {
    const parent =
      viz._select === void 0
        ? select("body")
            .insert("div", "#d3plus-portal")
            .style("height", "100dvh")
            .style("width", "100%")
            .style("min-height", "150px")
        : viz._select;
    const svg = parent.select(".d3plus-viz").size()
      ? parent.select(".d3plus-viz")
      : parent.append("svg");
    viz.select(svg.node());
  }
}

/**
    v4: scope this chart's tooltip to its own parent (instead of the global
    body-level #d3plus-portal). Multiple charts on a page now don't fight over a
    shared portal, and tooltips are GC'd cleanly when the parent goes away.
    @private
*/
function scopeTooltip(viz: Viz): void {
  if (viz._tooltipClass && viz._select?.node) {
    const tooltipParent = viz._select.node()?.parentNode as HTMLElement | null;
    if (tooltipParent) viz._tooltipClass.parent(tooltipParent);
  }
}

/**
    Calculates the width and/or height of the Viz from `_select` when either has
    not been defined.
    @private
*/
function autoSize(viz: Viz): void {
  if (
    (!viz.schema.width || !viz.schema.height) &&
    (!viz.schema.detectVisible || inViewport(viz._select.node()))
  ) {
    viz._autoWidth = viz.schema.width === undefined;
    viz._autoHeight = viz.schema.height === undefined;
    viz._setSVGSize();
  }
}

/**
    Applies the root SVG attributes/transition, parent positioning, opacity, and
    the accessibility `<title>`/`<desc>` tags.
    @private
*/
function applyRootAttributes(viz: Viz, parent: ReturnType<typeof select>): void {
  viz._select
    .attr("class", "d3plus-viz")
    .attr("aria-hidden", viz.schema.ariaHidden)
    .attr("aria-labelledby", `${viz._uuid}-title ${viz._uuid}-desc`)
    .attr("role", "img")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
    .style("position", "absolute")
    .style("top", parent.style("padding-top"))
    .style("left", parent.style("padding-left"))
    .transition()
    .duration(viz.schema.duration)
    .style(
      "width",
      viz.schema.width !== undefined ? `${viz.schema.width}px` : undefined,
    )
    .style(
      "height",
      viz.schema.height !== undefined ? `${viz.schema.height}px` : undefined,
    )
    .attr("width", viz.schema.width !== undefined ? `${viz.schema.width}px` : undefined)
    .attr(
      "height",
      viz.schema.height !== undefined ? `${viz.schema.height}px` : undefined,
    );

  // sets "position: relative" on the SVG parent if currently undefined
  const position = parent.style("position");
  if (position === "static") parent.style("position", "relative");
  parent.style("font-family", fontFamilyStringify(viz.schema.fontFamily));

  // sets initial opacity to 1, if it has not already been set
  if (viz._select.attr("opacity") === null) viz._select.attr("opacity", 1);

  // Updates the <title> tag if already exists else creates a new <title> tag on viz.select.
  const svgTitle = viz._select.selectAll("title").data([0]);
  const svgTitleEnter = svgTitle
    .enter()
    .append("title")
    .attr("id", `${viz._uuid}-title`);
  svgTitle.merge(svgTitleEnter).text(viz.schema.svgTitle);

  // Updates the <desc> tag if already exists else creates a new <desc> tag on viz.select.
  const svgDesc = viz._select.selectAll("desc").data([0]);
  const svgDescEnter = svgDesc
    .enter()
    .append("desc")
    .attr("id", `${viz._uuid}-desc`);
  svgDesc.merge(svgDescEnter).text(viz.schema.svgDesc);
}

/**
    Clears the visibility/resize/scroll poll timers and scroll listener so a
    re-render doesn't stack duplicate timers.
    @private
*/
function resetPolls(viz: Viz): void {
  viz._visiblePoll = clearInterval(viz._visiblePoll);
  viz._resizePoll = clearTimeout(viz._resizePoll);
  viz._scrollPoll = clearTimeout(viz._scrollPoll);
  select(viz.schema.scrollContainer).on(`scroll.${viz._uuid}`, null);
}

/**
    Installs the visibility/scroll detection that defers rendering until the
    chart is on-screen. Returns true when a detection branch took ownership of
    the render (so the caller skips the immediate draw).
    @private
*/
function setupDetection(viz: Viz, callback?: () => void): boolean {
  if (viz.schema.detectVisible && viz._select.style("visibility") === "hidden") {
    viz._visiblePoll = setInterval(() => {
      if (viz._select.style("visibility") !== "hidden") {
        viz._visiblePoll = clearInterval(viz._visiblePoll);
        viz.render(callback);
      }
    }, viz.schema.detectVisibleInterval);
    return true;
  } else if (
    viz.schema.detectVisible &&
    viz._select.style("display") === "none"
  ) {
    viz._visiblePoll = setInterval(() => {
      if (viz._select.style("display") !== "none") {
        viz._visiblePoll = clearInterval(viz._visiblePoll);
        viz.render(callback);
      }
    }, viz.schema.detectVisibleInterval);
    return true;
  } else if (viz.schema.detectVisible && !inViewport(viz._select.node())) {
    select(viz.schema.scrollContainer).on(`scroll.${viz._uuid}`, () => {
      if (!viz._scrollPoll) {
        viz._scrollPoll = setTimeout(() => {
          if (inViewport(viz._select.node())) {
            select(viz.schema.scrollContainer).on(`scroll.${viz._uuid}`, null);
            viz.render(callback);
          }
          viz._scrollPoll = clearTimeout(viz._scrollPoll);
        }, viz.schema.detectVisibleInterval);
      }
    });
    return true;
  }
  return false;
}

/**
    Drains the data-loading queue, returning the in-flight promises. Cache hits
    are applied synchronously and never produce a promise.
    @private
*/
function queuePromises(viz: Viz): Promise<void>[] {
  const promises: Promise<void>[] = [];
  viz._queue.forEach(
    (
      p: [
        (...args: unknown[]) => void,
        string,
        ((data: unknown) => unknown) | undefined,
        string,
      ],
    ) => {
      const cache = viz.schema.cache
        ? viz._lrucache.get(`${p[3]}_${p[1]}`)
        : undefined;
      if (!cache) {
        promises.push(
          new Promise<void>(resolve => {
            p[0](p[1], p[2], p[3], (err: unknown) => {
              if (err) console.error(err);
              resolve();
            });
          }),
        );
      } else {
        const val = p[2] ? p[2](cache) : cache;
        if (`_${p[3]}` in viz) viz[`_${p[3]}`] = val;
        else viz.schema[p[3]] = val;
      }
    },
  );
  viz._queue = [];
  return promises;
}

/**
    Builds a data table as DOM elements inside the SVG for accessibility, only
    when `schema.ariaHidden` is false and data is present.
    @private
*/
function buildDataTable(viz: Viz): void {
  const columns =
    viz._data instanceof Array && viz._data.length > 0
      ? Object.keys(viz._data[0])
      : [];
  const svgTable = viz._select
    .selectAll("g.data-table")
    .data(
      !viz.schema.ariaHidden &&
        viz._data instanceof Array &&
        viz._data.length
        ? [0]
        : [],
    );
  const svgTableEnter = svgTable
    .enter()
    .append("g")
    .attr("class", "data-table")
    .attr("role", "table");
  svgTable.exit().remove();
  const rows = svgTable
    .merge(svgTableEnter)
    .selectAll("text")
    .data(viz._data instanceof Array ? range(0, viz._data.length + 1) : []);
  rows.exit().remove();
  const cells = rows
    .merge(rows.enter().append("text").attr("role", "row"))
    .selectAll("tspan")
    .data((d: number, i: number) =>
      columns.map((c: string) => ({
        role: i ? "cell" : "columnheader",
        text: i ? viz._data[i - 1][c] : c,
      })),
    );
  cells.exit().remove();
  cells
    .merge(cells.enter().append("tspan"))
    .attr("role", (d: {role: string; text: string}) => d.role)
    .attr("dy", "-1000px")
    .html((d: {role: string; text: string}) => d.text);
}

/**
    Runs the chart pipeline once data has loaded, hides the loading message,
    (re)attaches the resize observer, and fires the user callback.
    @private
*/
function finishDraw(viz: Viz, callback?: () => void): void {
  buildDataTable(viz);

  // Run the chart pipeline. Extracted to a free function so the
  // "transform data → scene" boundary is callable without holding a
  // Viz instance. Lifecycle (DOM setup, viewport detection, data
  // loading, callback timing) stays on the class because it's
  // inherently instance-bound.
  runVizPipeline(viz as unknown as VizInstance);

  if (
    viz._messageClass._isVisible &&
    (!viz.schema.noDataMessage || viz._filteredData.length)
  ) {
    viz._messageClass.hide();
    if (viz._select.attr("opacity") === "0")
      viz._select
        .transition()
        .duration(viz.schema.duration)
        .attr("opacity", 1);
  }

  if (viz.schema.detectResize && (viz._autoWidth || viz._autoHeight)) {
    viz._resizeObserver.observe(viz._select.node().parentNode);
  } else {
    viz._resizeObserver.unobserve(viz._select.node().parentNode);
  }

  if (callback)
    setTimeout(() => {
      callback();
      viz._callback = undefined;
    }, viz.schema.duration + 100);
}

/**
    Loads any queued data (showing the loading message while in flight) then
    draws the chart.
    @private
*/
function loadAndDraw(viz: Viz, callback?: () => void): void {
  const promises = queuePromises(viz);

  if (viz.schema.loadingMessage && promises.length) {
    viz._messageClass.render({
      container: viz._select.node().parentNode,
      html: viz.schema.loadingHTML(viz),
      mask: viz._filteredData ? viz.schema.messageMask : false,
      style: viz.schema.messageStyle,
    });
  }

  Promise.all(promises).then(() => finishDraw(viz, callback));
}

/**
    Draws the visualization given the specified configuration.
    @param viz The Viz instance to render.
    @param callback Optional callback invoked after rendering completes.
    @private
*/
export function vizRender(viz: Viz, callback?: () => void): Viz {
  viz._callback = callback;
  // Resets margins and padding
  viz._margin = {bottom: 0, left: 0, right: 0, top: 0};
  viz._padding = {bottom: 0, left: 0, right: 0, top: 0};

  ensureSvgSelect(viz);
  scopeTooltip(viz);
  autoSize(viz);

  const parent = select(viz._select.node().parentNode);
  applyRootAttributes(viz, parent);

  resetPolls(viz);
  if (!setupDetection(viz, callback)) loadAndDraw(viz, callback);

  // Attaches touchstart event listener to the BODY to hide the tooltip when the user touches any element without data
  select("body").on(`touchstart.${viz._uuid}`, touchstartBody.bind(viz));

  return viz;
}
