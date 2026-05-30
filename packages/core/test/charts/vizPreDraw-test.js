import assert from "assert";
import it from "../jsdom.js";
import {vizPreDraw} from "../../es/index.js";

/**
    `vizPreDraw(viz)` is the architectural seam for the
    Viz pre-draw phase (drawDepth resolution, id/ids/drawLabel accessor
    synthesis, timeFilter defaulting, filteredData + legendData rollup,
    dataCutoff hover/duration overrides, no-data messaging) — extracted
    from `Viz._preDraw` so callers can drive pre-draw without going
    through the class method. `Viz._preDraw` is now a thin shim that
    delegates here, so behavior is unchanged. This locks the export
    surface; full pipeline coverage lives in the existing Viz/Plot test
    suites.
*/

it("vizPreDraw is exported and is a function", () => {
  assert.strictEqual(typeof vizPreDraw, "function");
});
