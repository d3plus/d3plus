/**
    The config Geomap's links add: `links` and how they are sized, curved,
    colored, labeled, and pointed, and the tooltips that read them.
*/

import type {ConfigField} from "../../fluent.js";
import constant from "../../utils/constant.js";
import {linkStyleFields} from "../features/linkFields.js";
import {linkTooltipConfig} from "../features/linkInteraction.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Geomap's link fields. */
export function geomapLinkFields(): ConfigField[] {
  return [
    /**
        Draws arrowheads on the links: `true` (or `"target"`) at each link's
        target end, `"source"` at its source end, `"both"`, or `false` for
        none. Also accepts an accessor function returning one of those per
        link.
        @type {boolean | "target" | "source" | "both" | function}
    */
    {key: "arrows", default: false},
    /**
        The arrowhead size in pixels, or an accessor function returning one
        per link. Defaults to three times the link's stroke width (at least 6).
        @type {number | function}
    */
    {key: "arrowSize"},
    ...linkStyleFields(),
    {key: "links", default: []},
    /**
        How far each link bows into an arc, as a share of the distance
        between its ends: `0` draws the plain great-circle path, and the
        default `0.2` lifts its middle by a fifth of that distance, to the
        left of the link's direction (a negative value bows to the right),
        so links running both ways between two places stay apart. A link
        the projection cuts (across the antimeridian, or past the edge of
        the projection) is drawn without the lift.
        @type {number}
    */
    {key: "linkCurve", default: 0.2},
    /**
        The thickness of each link: a pixel number used for every link, or
        an accessor function whose values are scaled between `linkSizeMin`
        and `linkSizeMax` (see `linkSizeScale`). The function receives each
        link, with `source` and `target` set to the data at its ends, and
        its index in `links`.
        @type {number | function}
    */
    {
      key: "linkSize",
      default: constant(2),
      coerce: v => (typeof v === "function" ? v : constant(v as number)),
    },
    /** The widest link, in pixels, when `linkSize` values differ. */
    {key: "linkSizeMax", default: 10},
    /** The thinnest link, in pixels, when `linkSize` values differ. */
    {key: "linkSizeMin", default: 1},
    /**
        The type of [continuous d3-scale](https://github.com/d3/d3-scale#continuous-scales)
        used to size links (e.g. `"linear"`, `"sqrt"`, `"log"`).
    */
    {key: "linkSizeScale", default: "sqrt"},
    /**
        How many links a point's or shape's tooltip lists under its number
        of connections, strongest first: a number, or `false` for none.
        Defaults to 3 when the links differ in `linkSize`, and none
        otherwise.
        @type {number | false}
    */
    {key: "nodeTooltipLinks"},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => linkTooltipConfig(viz),
    },
  ];
}
