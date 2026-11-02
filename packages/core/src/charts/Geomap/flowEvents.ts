/**
    Geomap's link interaction. Hovering a link emphasizes it and the marks
    at its ends; hovering a point or shape that ends a link emphasizes its
    links. Clicking a link focuses it (the rest of the map dims) and zooms
    to it; clicking it again, any other mark, or the open ocean clears the
    focus. Also installs `links`, which loads its rows like `topojson`.
*/

import {addToQueue} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {
  clearLinkFocus,
  focusLink,
  installFocusBackgroundClick,
} from "../features/linkFocus.js";
import type {FocusBox} from "../features/linkFocus.js";
import {
  isLinkDatum,
  linkHighlight,
  linkMeta,
  nodeHighlight,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import {simpleHover} from "../viz/simpleHover.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {FlowLink} from "./flowLinks.js";

type Handler = (d: DataPoint, i: number, x: unknown, event: Event) => unknown;
type GeomapLinks = VizInstance & {
  links: (data?: unknown, formatter?: unknown) => unknown;
};

/** The box around a drawn link, or null when it isn't drawn. */
export function flowLinkBox(viz: VizInstance, d: LinkDatum): FocusBox | null {
  const index = linkMeta(d)?.index;
  const links =
    (viz.ctx.geomapCtx as {flowLinks?: FlowLink[]} | undefined)?.flowLinks ??
    [];
  const link = links.find(l => l.index === index);
  return link ? link.box : null;
}

/**
    What hovering `d` emphasizes: a link and its two ends, or a mark that
    ends links and those links. Null for anything else.
*/
export function flowHoverPredicate(
  viz: VizInstance,
  d: DataPoint,
): ((h: DataPoint, i: number) => boolean) | null {
  const nodeKey = (h: DataPoint, hi: number) => `${viz._id(h, hi)}`;
  if (isLinkDatum(d)) return linkHighlight(viz, d, nodeKey);
  return nodeHighlight(viz, d, nodeKey);
}

/** Installs `links` and the link hover, click, and focus handlers. */
export function setupGeomapLinks(viz: VizInstance): void {
  const v = viz as GeomapLinks;
  /**
      Lines between places on the map, each drawn along the great circle
      between its two ends (lifted into an arc by `linkCurve`). Each link's
      `source` and `target` is a `[longitude, latitude]` coordinate, or the
      id of a row in the data (or of a topojson feature): a row with a
      coordinate `point` links from that point, and any other id from the
      centroid of its topojson shape. Accepts an array of links, or a
      URL/filepath to load them from, with an optional formatting function
      as a second argument.
      @type {object[] | string}
  */
  v.links = function (this: VizInstance, _?: unknown, f?: unknown) {
    if (arguments.length) {
      (addToQueue as unknown as (...a: unknown[]) => void).bind(this)(
        _,
        f,
        "links",
      );
      return this;
    }
    return this.schema.links;
  };

  installFocusBackgroundClick(viz);
  const on = viz.schema.on as Record<string, Handler | undefined>;
  let hovering = false;
  const move = on["mousemove.shape"];
  on["mousemove.shape"] = (d, i, x, event) => {
    move?.(d, i, x, event);
    const predicate = flowHoverPredicate(viz, d);
    if (predicate) {
      hovering = true;
      // Geomap's own hover is off (`hoverOpacity: 1`), so set the predicate
      // directly; the scene emphasizes the matches.
      simpleHover.call(viz, predicate);
    }
  };
  const leave = on["mouseleave.shape"];
  on["mouseleave.shape"] = (d, i, x, event) => {
    leave?.(d, i, x, event);
    if (!hovering) return;
    hovering = false;
    simpleHover.call(viz, false);
  };
  const click = on["click.shape"];
  on["click.shape"] = (d, i, x, event) => {
    if (isLinkDatum(d)) {
      event?.stopPropagation?.();
      focusLink(viz, d, {
        nodeKey: (h, hi) => `${viz._id(h, hi)}`,
        box: flowLinkBox(viz, d),
      });
      return;
    }
    if (clearLinkFocus(viz)) return;
    return click?.(d, i, x, event);
  };

  // The ocean beneath an SVG map takes the clicks between marks.
  const draw = viz._draw.bind(viz);
  viz._draw = function (callback?: () => void) {
    const result = draw(callback);
    viz._container
      ?.select("rect.d3plus-geomap-ocean")
      .on("click.linkFocus", () => clearLinkFocus(viz));
    return result;
  };
}
