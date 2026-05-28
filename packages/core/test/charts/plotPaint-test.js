import assert from "assert";
import it from "../jsdom.js";
import {plotPaint} from "../../es/index.js";

/**
    `plotPaint(viz, pCtx)` is the v4 RFC §3.1 architectural seam for the
    Plot paint phase (production axis rendering, shape buffer setup,
    shape emission with event handlers) — extracted from `Plot._paint`
    so callers can drive paint without going through the class method.
    `Plot._paint` is now a thin shim that delegates here, so behavior is
    unchanged. This locks the export surface; full pipeline coverage
    lives in the existing BarChart/Plot test suites.
*/

it("plotPaint is exported and is a function", () => {
  assert.strictEqual(typeof plotPaint, "function");
});
