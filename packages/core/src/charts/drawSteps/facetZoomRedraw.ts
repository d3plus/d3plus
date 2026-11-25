/**
    Redraws small multiples for a new window (see `Plot/facetZoom.ts`), once
    per animation frame however many windows arrive in it.

    @module
*/
import type {FacetZoom} from "../Plot/facetZoom.js";
import type {VizInstance} from "../viz/vizTypes.js";

const ZERO = {top: 0, right: 0, bottom: 0, left: 0};

// The pipeline registers itself here (see `runVizPipeline.ts`), since
// importing it would close a cycle through the top-left controls.
let runPipeline: (viz: VizInstance) => void = () => undefined;

/**
    Sets the function that redraws a chart's pipeline.
    @param fn The pipeline runner.
*/
export function registerFacetZoomPipeline(
  fn: (viz: VizInstance) => void,
): void {
  runPipeline = fn;
}

/**
    Sets the window small multiples show and redraws them: without motion
    for `duration` 0 (a window following a gesture in a linked chart).
    @param viz The chart.
    @param zoom The window, or undefined for each panel's natural view.
    @param duration The transition's length.
*/
export function setFacetZoom(
  viz: VizInstance,
  zoom: FacetZoom | undefined,
  duration: number,
): void {
  viz._facetZoom = zoom;
  if (typeof requestAnimationFrame !== "function") return;
  if (viz._facetZoomFrame !== undefined)
    cancelAnimationFrame(viz._facetZoomFrame);
  viz._facetZoomFrame = requestAnimationFrame(() => {
    viz._facetZoomFrame = undefined;
    if (!viz._facetPanels) return;
    viz._margin = {...ZERO};
    viz._padding = {...ZERO};
    if (!duration) viz._instantNextDraw = true;
    try {
      runPipeline(viz);
    } finally {
      viz._instantNextDraw = false;
    }
  });
}
