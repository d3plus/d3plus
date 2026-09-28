import assert from "assert";
import {resolveDrillMorph} from "../../es/src/charts/pipeline/drillMorph.js";

/**
    `resolveDrillMorph(viz)` resolves the one-shot drill-down morph state
    armed by clickShape (forward) or a Back click (backward) into the
    `_resolvedEnterFrom`/`_resolvedExitTo` boxes `_drawSceneToTarget` passes
    to `drawScene` — see charts/pipeline/drillMorph.ts.
*/

it("resolveDrillMorph denormalizes a pending enter origin against the current _bodyRect", () => {
  const viz = {
    _bodyRect: {x: 0, y: 0, width: 200, height: 100},
    _pendingEnterOrigin: {fx: 0.1, fy: 0.2, fw: 0.3, fh: 0.4},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(
    viz._resolvedEnterFrom,
    {x: 20, y: 20, width: 60, height: 40},
    "fractions scale against the current body rect",
  );
  assert.strictEqual(viz._pendingEnterOrigin, undefined, "pending origin cleared (one-shot)");
  assert.strictEqual(viz._resolvedExitTo, undefined, "no exit reunion was pending");
});

it("resolveDrillMorph denormalizes against a body rect with a non-zero origin", () => {
  const viz = {
    _bodyRect: {x: 40, y: 10, width: 200, height: 100},
    _pendingEnterOrigin: {fx: 0.5, fy: 0.5, fw: 0.1, fh: 0.1},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(
    viz._resolvedEnterFrom,
    {x: 40 + 100, y: 10 + 50, width: 20, height: 10},
    "the body rect's own origin offsets the resolved box",
  );
});

it("resolveDrillMorph does nothing when no origin is pending, or _bodyRect is missing", () => {
  const noOrigin = {_bodyRect: {x: 0, y: 0, width: 100, height: 100}};
  resolveDrillMorph(noOrigin);
  assert.strictEqual(noOrigin._resolvedEnterFrom, undefined);

  const noBody = {_pendingEnterOrigin: {fx: 0, fy: 0, fw: 1, fh: 1}};
  resolveDrillMorph(noBody);
  assert.strictEqual(noBody._resolvedEnterFrom, undefined, "no body rect to denormalize against");
  assert.strictEqual(noBody._pendingEnterOrigin, undefined, "still cleared even when unresolved");
});

it("resolveDrillMorph finds the reunion rect node matching groupId at groupDepth", () => {
  const viz = {
    schema: {groupBy: [d => d.region]},
    _chartScene: [
      {type: "rect", x: 10, y: 20, width: 30, height: 40, datum: {region: "USA"}, index: 0},
      {type: "rect", x: 100, y: 20, width: 30, height: 40, datum: {region: "Canada"}, index: 1},
    ],
    _pendingExitReunion: {groupId: "USA", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(viz._resolvedExitTo, {x: 10, y: 20, width: 30, height: 40});
  assert.strictEqual(viz._pendingExitReunion, undefined, "pending reunion cleared (one-shot)");
});

it("resolveDrillMorph converts a matching circle node to its bounding box", () => {
  const viz = {
    schema: {groupBy: [d => d.id]},
    _chartScene: [{type: "circle", cx: 50, cy: 50, r: 20, datum: {id: "root"}, index: 0}],
    _pendingExitReunion: {groupId: "root", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(viz._resolvedExitTo, {x: 30, y: 30, width: 40, height: 40});
});

it("resolveDrillMorph skips a same-datum label/text node in favor of the actual shape node", () => {
  const viz = {
    schema: {groupBy: [d => d.id]},
    _chartScene: [
      {type: "text", datum: {id: "root"}, index: 0, lines: [], font: {}, x: 0, y: 0},
      {type: "rect", x: 5, y: 5, width: 10, height: 10, datum: {id: "root"}, index: 0},
    ],
    _pendingExitReunion: {groupId: "root", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(viz._resolvedExitTo, {x: 5, y: 5, width: 10, height: 10}, "the rect is matched, not the text node sharing its datum");
});

it("resolveDrillMorph searches inside nested groups (Plot's plot-zoom-content wrapper), not just the top level", () => {
  const viz = {
    schema: {groupBy: [d => d.id]},
    _chartScene: [
      {type: "group", key: "plot-zoom-content", children: [
        {type: "group", key: "Bar-group", children: [
          {type: "rect", x: 1, y: 2, width: 3, height: 4, datum: {id: "A"}, index: 0},
        ]},
      ]},
      {type: "group", key: "plot-x-axis", children: []},
    ],
    _pendingExitReunion: {groupId: "A", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(viz._resolvedExitTo, {x: 1, y: 2, width: 3, height: 4}, "found the bar nested two groups deep");
});

it("resolveDrillMorph unwraps a Plot-style {data, i} datum before applying the groupBy accessor", () => {
  const viz = {
    schema: {groupBy: [d => d.group]},
    _chartScene: [
      // A Plot shape's raw scene datum is the wrapped record {data, i, ...
      // internal fields} — notably, the wrapper can carry its OWN unrelated
      // "group" field (Plot's internal row-grouping bookkeeping), so reading
      // n.datum.group directly (instead of n.datum.data.group) would silently
      // match the wrong value instead of the real row's group.
      {
        type: "rect", x: 7, y: 8, width: 9, height: 10, index: 99,
        datum: {data: {group: "A", value: 30}, i: 0, group: "unrelated-internal-value"},
      },
    ],
    _pendingExitReunion: {groupId: "A", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.deepStrictEqual(viz._resolvedExitTo, {x: 7, y: 8, width: 9, height: 10}, "matched via the unwrapped .data.group, not the wrapper's own .group");
});

it("resolveDrillMorph degrades to no resolved exit box when the reunion node can't be found", () => {
  const viz = {
    schema: {groupBy: [d => d.id]},
    _chartScene: [{type: "rect", x: 0, y: 0, width: 10, height: 10, datum: {id: "root"}, index: 0}],
    _pendingExitReunion: {groupId: "thresholded-away", groupDepth: 0},
  };
  resolveDrillMorph(viz);
  assert.strictEqual(viz._resolvedExitTo, undefined, "no matching node — falls back to a plain fade, never throws");
});
