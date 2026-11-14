import type {DataPoint} from "@d3plus/data";
import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {groupDepthOf, groupNarrows, groupPath} from "../viz/groupRow.js";
import {appendThresholdMembers} from "../features/thresholdMembers.js";
import {appendPointConfidence} from "../Plot/confidenceTooltip.js";
import {leadWithColorScaleRows} from "../features/colorScaleTooltip.js";
import {keyTooltipAnchor} from "../features/keyTooltip.js";
import {leadTitleWithSwatch, pickSwatch} from "../features/tooltipSwatch.js";
import {pointTooltipAnchor} from "../viz/pointTooltipAnchor.js";
import {setCursor} from "../viz/setCursor.js";
import {tooltipEnabled} from "../viz/tooltipEnabled.js";
import {hasOwnClick, hasUserClick} from "../viz/userClick.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    @module mouseMoveShape
    Tooltip logic for a specified data point.
    @param config Optional configuration methods for the Tooltip class.
    @private
*/
export default function (
  this: Viz,
  d: DataPoint,
  i: number,
  x: DataPoint,
  event: MouseEvent & TouchEvent,
): void {
  if (!d) return;
  // does the shape have any user-defined click events?
  const userClick = hasUserClick(this, "click.shape");

  // does the shape still have our default "click.shape" event?
  // (if the user only sets "click", both functions will fire)
  const hasDefaultClick = hasOwnClick(this, "click.shape");

  // can the viz show deeper data? A group row zooms into its group.
  const groupDepth = groupDepthOf(d);
  const hasDeeperLevel =
    groupDepth === undefined
      ? this._drawDepth < this.schema.groupBy.length - 1
      : groupNarrows(
          this.schema.groupBy,
          groupPath(this.schema.groupBy, d, groupDepth),
          this._filteredData ?? [],
        );

  // only show the hand cursor when the shape has a click event, whether or
  // not it shows a tooltip
  setCursor(
    this,
    userClick || (hasDefaultClick && hasDeeperLevel) ? "pointer" : "auto",
  );

  if (!tooltipEnabled(this, d, i)) return;

  // Plot's snapped hover (shared or single) owns the tooltip while active.
  if (this._sharedHoverActive) return;

  // A point mark's tooltip points at the mark, wherever the pointer is
  // within reach of it, and a colorScale swatch's opens beside the key;
  // anything else follows the pointer.
  const node = this._lastScenePick?.node;
  const position =
    pointTooltipAnchor(this as unknown as VizInstance, node) ??
    keyTooltipAnchor(this as unknown as VizInstance, node) ??
    (event.touches
      ? [event.touches[0].clientX, event.touches[0].clientY]
      : [event.clientX, event.clientY]);

  // Unwrap to the underlying source row so tooltip cell accessors (e.g.
  // the Treemap "share" column) resolve regardless of whether the hovered
  // scene node was the shape (datum = row) or its text label (datum = a
  // wrapper whose `.data` chain leads back to the row).
  let tooltipDatum = (x || d) as DataPoint & {
    __d3plus__?: boolean;
    data?: DataPoint;
  };
  while (tooltipDatum && tooltipDatum.__d3plus__ && tooltipDatum.data)
    tooltipDatum = tooltipDatum.data as typeof tooltipDatum;

  this._tooltipClass
    .data([tooltipDatum])
    .footer(
      hasDefaultClick && hasDeeperLevel
        ? this.schema.translate("Click to Expand")
        : false,
    )
    .title((dd: DataPoint, ii: number) => this._drawLabel(dd, ii))
    .titleSwatch(true)
    .position(position)
    .config(
      configPrep.bind(this as unknown as ConfigPrepHost)(
        this.schema.tooltipConfig,
      ),
    );
  // The row's colorScale value (or a bivariate colorScale's two) leads
  // the rows.
  leadWithColorScaleRows(
    this._tooltipClass,
    this as unknown as VizInstance,
    tooltipDatum,
    i,
  );
  // A Plot's point lists its `confidence` bounds.
  appendPointConfidence(
    this._tooltipClass,
    this as unknown as VizInstance,
    tooltipDatum,
    i,
    this._lastScenePick?.node?.shapeType,
  );
  // A threshold bucket lists what it holds.
  appendThresholdMembers(
    this._tooltipClass,
    this as unknown as VizInstance,
    tooltipDatum,
  );
  // The title leads with a swatch of the hovered mark, as in the legend.
  leadTitleWithSwatch(
    this._tooltipClass,
    pickSwatch(this as unknown as VizInstance, this._lastScenePick),
  ).render();
}
