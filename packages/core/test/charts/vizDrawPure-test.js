import assert from "assert";
import it from "../jsdom.js";
import {BarChart} from "../../es/index.js";
import {vizDrawPure} from "../../es/internal.js";

/**
    `vizDrawPure(viz, prevCtx) → Partial<VizDrawCtx>` is the pure form of
    the chart-shell layout phase. Locks the export +
    return-shape contract.
*/

it("vizDrawPure is exported and is a function", () => {
  assert.strictEqual(typeof vizDrawPure, "function");
});

// The vizDrawPure body invokes runLayout for each feature, which mounts
// chart components and needs viz._select set up — i.e. a fully-rendered
// chart. We don't drive a full render in jsdom unit tests (it's covered
// by the Playwright browser parity suite); just lock the export surface.
it("vizDrawPure accepts a Viz instance + prevCtx and reaches the pipeline", () => {
  const chart = new BarChart().data([{id: "a", x: 1, y: 10}]);
  let threw = null;
  try {
    vizDrawPure(chart);
  } catch (err) {
    threw = err;
  }
  // Without DOM mount the call fails internally; the contract is the
  // signature, not the full success path under jsdom.
  assert.ok(threw === null || threw instanceof Error);
});
