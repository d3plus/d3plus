import assert from "assert";
import {applyInteractionOpacity} from "../../es/src/charts/viz/interactionOpacity.js";

// On hover, matched marks get a darker/thicker "emphasis" stroke. A Line's
// invisible hit-area path must NOT gain a visible stroke — darkening
// `transparent` formats to opaque black, which showed up as a fat black line
// behind the hovered line.
it("hover emphasis leaves an invisible hit-area path transparent", () => {
  const datum = {y: 1};
  const hit = {type: "path", datum, index: 0, paint: {fill: "none", stroke: "transparent", strokeWidth: 10}};
  const line = {type: "path", datum, index: 0, paint: {fill: "none", stroke: "black", strokeWidth: 1}};

  const viz = {
    _hover: () => true, // everything matches → emphasize
    _active: null,
    _highlight: null,
    _hoverBucket: false,
    schema: {shapeConfig: {}},
  };

  const [outHit, outLine] = applyInteractionOpacity([hit, line], viz);
  assert.strictEqual(outHit.paint.stroke, "transparent", "hit area stays invisible on hover");
  assert.strictEqual(outHit.paint.strokeWidth, 10, "hit area width is untouched (not tripled)");
  assert.notStrictEqual(outLine.paint.stroke, "black", "the visible line still gets its darker emphasis stroke");
});
