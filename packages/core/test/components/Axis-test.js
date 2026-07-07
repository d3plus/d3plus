import assert from "assert";
import {Axis} from "../../es/index.js";
import it from "../jsdom.js";

it("Axis", () => {
  // jsdom does not implement SVG path geometry, used when drawing the bar.
  window.SVGElement.prototype.getTotalLength = () => 0;
  window.SVGElement.prototype.getPointAtLength = () => ({x: 0, y: 0});

  // issue #789: a zero-extent domain (e.g. [0, 0]) with rounding enabled used
  // to compute a NaN rounding factor and throw "Invalid array length".
  for (const rounding of ["outside", "inside"]) {
    assert.doesNotThrow(
      () => new Axis().domain([0, 0]).rounding(rounding).render(),
      `renders zero-extent domain [0, 0] with rounding="${rounding}"`,
    );
  }

  const zeroAxis = new Axis().domain([0, 0]).rounding("outside").render();
  assert.deepStrictEqual(
    zeroAxis._d3Scale.domain(),
    [0, 0],
    "leaves a zero-extent domain unchanged",
  );

  // sanity check: rounding still expands a normal domain outward
  const roundedAxis = new Axis().domain([12, 488]).rounding("outside").render();
  assert.deepStrictEqual(
    roundedAxis._d3Scale.domain(),
    [10, 490],
    "rounding still expands a normal domain outward",
  );
});

it("standalone Axis mounts a single <svg>", () => {
  // A plain Axis paints through paintComponentScene, whose renderer creates the
  // <svg>; the standalone fallback must mount into a <div>, not its own <svg>,
  // or the two nest. (Timeline manages its own paint and keeps the <svg> — see
  // Timeline-test.)
  new Axis().domain([0, 10]).render();
  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "exactly one <svg> (no nested renderer svg)",
  );
});
