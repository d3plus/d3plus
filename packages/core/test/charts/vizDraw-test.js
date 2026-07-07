import assert from "assert";
import it from "../jsdom.js";
import {vizDraw} from "../../es/internal.js";

/**
    `vizDraw(viz)` is the architectural seam for the Viz
    draw phase (feature panel reset, legend/colorScale margin claims,
    title/subtitle/total layout, timeline + top/bottom legend & colorScale
    claims) — extracted from `Viz._draw` so callers can drive the step
    without going through the class method. `Viz._draw` is now a thin
    shim that delegates here, so behavior is unchanged (and subclass
    overrides — Plot, Treemap, Pack, … — keep working through their
    own `_draw` calling `super._draw(callback)`, which still hits the
    shim). This locks the export surface; full pipeline coverage lives
    in the existing Viz/Plot/Treemap test suites.
*/

it("vizDraw is exported and is a function", () => {
  assert.strictEqual(typeof vizDraw, "function");
});
