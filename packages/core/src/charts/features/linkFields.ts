/**
    The link color and label config the node-link charts (Network, Rings,
    Sankey, ArcDiagram) share.
*/

import type {ConfigField} from "../../fluent.js";
import {optionalAccessor} from "../viz/vizFields.js";
import {coerceLinkColor} from "./linkColor.js";
import {LINK_LABEL_DEFAULTS} from "./linkLabels.js";

/** The `linkColor`, `linkLabel`, and `linkLabelConfig` fields. */
export function linkStyleFields(): ConfigField[] {
  return [
    /**
        Colors each link: `"source"` or `"target"` takes that end node's
        color, and a key or accessor function reads a value from each link
        (receiving the link and its index in `links`). A number is colored
        on the chart's colorScale, which then shows the links' values; a
        string is a color when it parses as one, or else a category in the
        chart's palette. `false` (the default) draws every link in the
        theme's link gray.
        @type {false | "source" | "target" | string | function}
    */
    {key: "linkColor", default: false, coerce: coerceLinkColor},
    /**
        Text drawn at the middle of each link: a key or accessor function
        (receiving the link and its index in `links`). Numbers are
        abbreviated in the chart's locale. Labels that would cover a node
        or another label are hidden. Defaults to none.
        @type {string | function}
    */
    {key: "linkLabel", coerce: optionalAccessor},
    /**
        Styles the link labels: `rotate`, `"along"` (the default) to run
        text along its link, kept upright, or `"horizontal"`; `fontSize`
        (10); `padding`, the pad around the text (2); `backgroundOpacity`,
        the opacity of that pad in the chart's background color (0.85); and
        any other TextBox setting, such as `fontColor`, `fontFamily`, or
        `fontWeight`.
    */
    {key: "linkLabelConfig", merge: true, default: {...LINK_LABEL_DEFAULTS}},
  ];
}
