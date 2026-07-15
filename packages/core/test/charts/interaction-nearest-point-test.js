import assert from "assert";
import it from "../jsdom.js";
import {LinePlot} from "../../es/index.js";

// #786: for a multi-point shape (Line/Area) every mouse event should report the
// point nearest the cursor along the discrete axis — not the whole-series
// aggregate, and not (the old bug) the first point. `_interactionDatum` is the
// single resolver `_routeSceneEvent` runs for tooltip/click/user handlers.

/** A wrapped Plot point + its scene interaction entry at content-x `px`. */
function point(px, k, year, value) {
  return {x: px, y: 0, index: k, datum: {data: {id: "a", year, value}, i: k}};
}

function makePlot() {
  const plot = new LinePlot();
  plot.schema.discrete = "x";
  plot._zoomTransform = undefined;
  return plot;
}

// interactionPoints for series "a": present at content-x 0/100/200 (years
// 2010/2011/2012). Note there is NO point at the far right beyond 200 — the
// #786 case of a series missing its last x.
const points = [point(0, 0, 2010, 10), point(100, 1, 2011, 20), point(200, 2, 2012, 30)];
const pick = {node: {interactionPoints: points}, datum: {data: {agg: true}, i: 9}, index: 0};

it("reports the point nearest the cursor's discrete position", () => {
  const plot = makePlot();
  const near = plot._interactionDatum(pick, {point: [195, 999]});
  assert.strictEqual(near.d.year, 2012, "cursor at the right edge → last real point");
  assert.strictEqual(near.i, 2, "index is the nearest point's index, not the aggregate's");

  const first = plot._interactionDatum(pick, {point: [-5, 0]});
  assert.strictEqual(first.d.year, 2010, "cursor at the left edge → first point");

  const mid = plot._interactionDatum(pick, {point: [60, 0]});
  assert.strictEqual(mid.d.year, 2011, "cursor mid-range → nearest interior point");
});

it("un-zooms the cursor before matching", () => {
  const plot = makePlot();
  // content-x 100 renders at screen 50 + 2*100 = 250 under this transform.
  plot._zoomTransform = {x: 50, y: 0, scale: 2};
  const z = plot._interactionDatum(pick, {point: [250, 0]});
  assert.strictEqual(z.d.year, 2011, "screen 250 un-zooms to content 100 → middle point");
});

it("falls back to the aggregate for legend nodes and non-nested shapes", () => {
  const plot = makePlot();

  const legend = plot._interactionDatum(
    {node: {interactionPoints: points, interactionGroup: "legend"}, datum: {data: {agg: true}, i: 9}, index: 0},
    {point: [195, 0]},
  );
  assert.strictEqual(legend.d.agg, true, "legend node keeps the aggregate datum");
  assert.strictEqual(legend.i, 9, "…and the aggregate index");

  const plain = plot._interactionDatum(
    {node: {}, datum: {data: {agg: true}, i: 4}, index: 0},
    {point: [195, 0]},
  );
  assert.strictEqual(plain.d.agg, true, "a node with no interactionPoints keeps the aggregate datum");
});
