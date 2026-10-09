import {formatAbbreviate} from "@d3plus/format";

import {TextBox, Timeline, Tooltip} from "../../components/index.js";
import {constant} from "../../utils/index.js";
import {backgroundInk} from "./backgroundInk.js";
import type Viz from "./Viz.js";

/**
 * Default padding logic that will return false if the screen is less than 600 pixels wide.
 * @private
 */
export function defaultPadding(): boolean {
  return typeof window !== "undefined" ? window.innerWidth > 600 : true;
}

/**
    Subtitle, title, timeline, threshold, tooltip, and total label defaults.
    @private
*/
export function initLabelDefaults(viz: Viz): void {
  viz._subtitleClass = new TextBox();
  viz.schema.subtitleConfig = {
    ariaHidden: true,
    fontColor: () => backgroundInk(viz),
    fontSize: 12,
    padding: 5,
    textAnchor: "middle",
  };
  viz.schema.subtitlePadding = defaultPadding;

  viz.schema.svgDesc = "";
  viz.schema.svgTitle = "";

  viz.schema.timeline = true;
  viz._timelineClass = new Timeline().align("end");
  viz.schema.timelineConfig = {
    padding: 5,
  };
  viz.schema.timelinePadding = defaultPadding;

  viz.schema.threshold = constant(0.0001);
  viz.schema.thresholdKey = undefined;
  viz.schema.thresholdName = () => viz.schema.translate("Values");

  viz._titleClass = new TextBox();
  viz.schema.titleConfig = {
    ariaHidden: true,
    fontColor: () => backgroundInk(viz),
    fontSize: 16,
    padding: 5,
    textAnchor: "middle",
  };
  viz.schema.titlePadding = defaultPadding;

  viz.schema.tooltip = constant(true);
  viz._tooltipClass = new Tooltip();
  viz.schema.tooltipConfig = {
    pointerEvents: "none",
    titleStyle: {
      "max-width": "200px",
    },
  };

  viz._totalClass = new TextBox();
  viz.schema.totalConfig = {
    fontColor: () => backgroundInk(viz),
    fontSize: 10,
    padding: 5,
    textAnchor: "middle",
  };
  viz.schema.totalFormat = (d: number) =>
    `${viz.schema.translate("Total")}: ${formatAbbreviate(d, viz.schema.locale)}`;
  viz.schema.totalPadding = defaultPadding;
}
