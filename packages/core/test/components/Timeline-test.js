import assert from "assert";
import {Timeline} from "../../es/index.js";
import it from "../jsdom.js";

it("Timeline", function* () {
  yield cb => {
    new Timeline().render(cb);
  };

  assert.ok(
    document.getElementsByTagName("svg").length >= 1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.querySelectorAll("[id^='d3plus-Axis-']").length,
    1,
    "created axis container element",
  );
  // Standalone Timelines paint their own axis scene (ticks/track/labels)
  // beneath the brush DOM; inside a Viz the parent composes it instead.
  assert.strictEqual(
    document.querySelectorAll(".d3plus-render-svg").length,
    1,
    "painted the axis scene for standalone use",
  );
});

it("Timeline brushing:false snaps the brush visual to a single period on release", function* () {
  const tl = new Timeline().domain([2012, 2020]).brushing(false).width(400).height(100);
  yield cb => tl.render(cb);

  // Spy on the brush's programmatic move — the release handler must snap the
  // dragged range back to the committed single period. Before the fix,
  // brushing:false + snapping:true skipped this move, leaving the drag's range
  // rectangle painted (the control appeared to brush despite brushing:false).
  let moved = false;
  const realMove = tl._brush.move;
  tl._brush.move = function (...args) {
    moved = true;
    return realMove.apply(this, args);
  };

  // Simulate d3-brush's "end" after a drag: a real sourceEvent + a pixel-range
  // selection. brushing:false collapses this to a single period in _updateDomain.
  tl._brushEnd({sourceEvent: {clientX: 200, clientY: 50}, selection: [80, 320]});

  assert.ok(moved, "brush.move called on release to snap the visual to one period");
});

it("Timeline brushing:false shows a single handle, not a resizable range", function* () {
  // Force ticks mode (jsdom measures text at 0 width, which would otherwise
  // resolve to buttons mode where both handles are hidden).
  const tl = new Timeline()
    .domain([2012, 2020]).brushing(false).buttonBehavior("ticks").width(400).height(100);
  yield cb => tl.render(cb);

  const w = document.querySelector(".handle--w");
  const e = document.querySelector(".handle--e");
  assert.ok(w && e, "both d3-brush handle elements exist");
  // The west handle is hidden via inline style so a single period reads as one
  // marker rather than the two handles of a draggable range.
  assert.strictEqual(w.style.display, "none", "west handle hidden");
  assert.notStrictEqual(e.style.display, "none", "east handle shown");

  // The blue range fill is hidden too — the handle is the single-period marker,
  // and a filled bar would read (and grow while dragging) as a range.
  const selection = document.querySelector(".selection");
  assert.strictEqual(selection.style.display, "none", "range fill hidden");
});
