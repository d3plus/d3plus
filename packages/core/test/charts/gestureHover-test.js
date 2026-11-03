import {it} from "vitest";
import assert from "assert";

import {
  clientPoint,
  gestureHolds,
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
  gestureMoves,
} from "../../src/charts/drawSteps/gestureHover.ts";

const mouse = (type, clientX, clientY) => ({type, clientX, clientY});

it("clientPoint: reads a mouse, wheel, or touch event's client position", () => {
  assert.deepStrictEqual(clientPoint(mouse("mousedown", 3, 4)), [3, 4]);
  assert.deepStrictEqual(clientPoint(mouse("wheel", 5, 6)), [5, 6]);
  assert.deepStrictEqual(
    clientPoint({type: "touchstart", touches: [{clientX: 7, clientY: 8}]}),
    [7, 8],
  );
  assert.deepStrictEqual(
    clientPoint({
      type: "touchend",
      touches: [],
      changedTouches: [{clientX: 1, clientY: 2}],
    }),
    [1, 2],
  );
  assert.strictEqual(clientPoint(null), null);
  assert.strictEqual(clientPoint({type: "keydown"}), null);
});

it("gestureMoves: wheels, touch moves, and mouse moves off the press move the chart", () => {
  const press = [10, 20];
  assert.strictEqual(gestureMoves(press, mouse("mousemove", 11, 20)), true);
  assert.strictEqual(gestureMoves(press, mouse("mousemove", 10, 20)), false);
  assert.strictEqual(gestureMoves(null, mouse("mousemove", 10, 20)), true);
  assert.strictEqual(gestureMoves(null, mouse("wheel", 0, 0)), true);
  assert.strictEqual(gestureMoves(press, {type: "touchmove"}), true);
  assert.strictEqual(gestureMoves(press, mouse("mousedown", 10, 20)), false);
  assert.strictEqual(gestureMoves(press, mouse("dblclick", 30, 20)), false);
  assert.strictEqual(gestureMoves(press, null), false);
});

it("gestureHolds: only a moving gesture holds pointer events", () => {
  assert.strictEqual(gestureHolds({}), false);
  assert.strictEqual(
    gestureHolds({_gestureHover: {press: null, moving: false}}),
    false,
  );
  assert.strictEqual(
    gestureHolds({_gestureHover: {press: null, moving: true}}),
    true,
  );
});

/** A stand-in chart recording the leaves it is sent and its tooltip's data. */
function fakeViz() {
  const routed = [];
  let tip = [{id: "a"}];
  const tooltip = {
    data: d => {
      if (d === undefined) return tip;
      tip = d;
      return tooltip;
    },
    render: () => tooltip,
  };
  const node = {getBoundingClientRect: () => ({left: 100, top: 50})};
  return {
    routed,
    tip: () => tip,
    viz: {
      _nearestHover: {key: "mark-a"},
      _routeSceneEvent: e => routed.push(e),
      _tooltipClass: tooltip,
      _zoomEventTarget: {node: () => node},
    },
  };
}

it("gestureHoverStart: records the press, not yet moving", () => {
  const {viz} = fakeViz();
  gestureHoverStart(viz, {sourceEvent: mouse("mousedown", 120, 80)});
  assert.deepStrictEqual(viz._gestureHover, {press: [120, 80], moving: false});
  gestureHoverStart(viz, {sourceEvent: null});
  assert.deepStrictEqual(viz._gestureHover, {press: null, moving: false});
});

it("gestureHoverMove: the first move leaves the hovered mark and hides the tooltip", () => {
  const {viz, routed, tip} = fakeViz();
  gestureHoverStart(viz, {sourceEvent: mouse("mousedown", 120, 80)});
  // A move that stays on the press is still a click.
  gestureHoverMove(viz, {sourceEvent: mouse("mousemove", 120, 80)});
  assert.strictEqual(routed.length, 0);
  assert.strictEqual(gestureHolds(viz), false);

  const move = mouse("mousemove", 125, 82);
  gestureHoverMove(viz, {sourceEvent: move});
  assert.strictEqual(gestureHolds(viz), true);
  assert.strictEqual(viz._nearestHover.key, null, "forgets the hovered mark");
  assert.deepStrictEqual(tip(), [], "the tooltip hides");
  assert.strictEqual(routed.length, 1);
  assert.strictEqual(routed[0].type, "mouseleave");
  assert.strictEqual(routed[0].pick, null);
  assert.strictEqual(routed[0].nativeEvent, move);
  assert.deepStrictEqual(routed[0].point, [25, 32], "in surface pixels");

  // Later moves send nothing more.
  gestureHoverMove(viz, {sourceEvent: mouse("mousemove", 140, 90)});
  assert.strictEqual(routed.length, 1);
});

it("gestureHoverMove: ignores a zoom with no gesture or no source event", () => {
  const {viz, routed} = fakeViz();
  gestureHoverMove(viz, {sourceEvent: mouse("mousemove", 1, 1)});
  gestureHoverStart(viz, {sourceEvent: null});
  gestureHoverMove(viz, {sourceEvent: null});
  assert.strictEqual(routed.length, 0);
  assert.strictEqual(gestureHolds(viz), false);
});

it("gestureHoverEnd: releases the hold", () => {
  const {viz} = fakeViz();
  gestureHoverStart(viz, {sourceEvent: mouse("wheel", 0, 0)});
  gestureHoverMove(viz, {sourceEvent: mouse("wheel", 0, 0)});
  assert.strictEqual(gestureHolds(viz), true);
  gestureHoverEnd(viz);
  assert.strictEqual(viz._gestureHover, undefined);
  assert.strictEqual(gestureHolds(viz), false);
});
