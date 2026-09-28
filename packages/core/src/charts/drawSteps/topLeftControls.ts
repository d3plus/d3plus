/**
    @name topLeftControlsFeature
    Shared top-left corner control panel — mirrors the top-right
    zoom-controls panel's "N buttons, one flex-row `htmlOverlay` panel"
    composition (`zoomControls.ts`/`zoomControlsMarkup.ts`), except fed by
    independent contributor functions (`backContribution`,
    `tableViewContribution`) rather than one feature's own fixed button set.
    A downstream branch adding a new top-left control (search) appends its
    own contributor function to `TOP_LEFT_CONTRIBUTORS` — a one-line diff,
    not a dynamic registry.

    Runs as a post-draw `FeatureModule` (see `runVizPipeline`), the same
    slot as `zoomFeature`/`attributionFeature`: it claims zero margin and
    floats over whatever the chart already rendered. Content that needs to
    avoid it (title/subtitle/total/legend) insets around the whole panel via
    `topLeftControlsInset` (`topLeftControlsMarkup.ts`), the same way they
    already inset around the zoom panel via `zoomControlsInset`.

    @module
*/
import type {FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";
import {backContribution} from "./backControl.js";
import {tableViewContribution} from "./tableViewControl.js";
import {buildTopLeftPanel, type Contribution} from "./topLeftControlsMarkup.js";

export type {Contribution};

/**
    Ordered list of contributors to the shared top-left panel. Order is
    visual order (left to right).
*/
export const TOP_LEFT_CONTRIBUTORS: Array<(viz: Viz) => Contribution | null> = [
  backContribution,
  tableViewContribution,
];

/** The current, non-null contributions for a chart — computed once per layout/measurement. */
export function getTopLeftContributions(viz: Viz): Contribution[] {
  const contributions: Contribution[] = [];
  for (const fn of TOP_LEFT_CONTRIBUTORS) {
    const c = fn(viz);
    if (c) contributions.push(c);
  }
  return contributions;
}

export const topLeftControlsFeature: FeatureModule = {
  name: "topLeftControls",
  layout: ({viz}) => {
    const contributions = getTopLeftContributions(viz);
    if (!contributions.length) return {panel: null, margin: {}};
    return {panel: buildTopLeftPanel(viz, contributions), margin: {}};
  },
};
