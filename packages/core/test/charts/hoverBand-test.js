import {it} from "vitest";
import assert from "assert";
import {
  drawsBands,
  hoverBandRow,
  leaveMark,
  syncHoverBand,
} from "../../src/charts/viz/hoverBand.ts";

/**
    The hover band follows the row the pointer or keyboard rests on (never a
    legend entry's), repainting a chart whose scene draws bands when it
    changes. Leaving a mark drops it at once, without a repaint while a
    transition runs.
*/

const banded = () => [
  {type: "group", key: "g", children: [{type: "rect", hoverPaint: {}}]},
];

/** A chart stand-in counting its repaints. */
const chart = (scene = banded()) => {
  const viz = {
    schema: {},
    _chartScene: scene,
    _lastScenePick: null,
    repaints: 0,
    _scheduleSceneRepaint: () => viz.repaints++,
  };
  return viz;
};

it("drawsBands: finds a hoverPaint anywhere in a scene", () => {
  assert.strictEqual(drawsBands(banded()), true);
  assert.strictEqual(drawsBands([{type: "rect"}]), false);
  assert.strictEqual(drawsBands(undefined), false);
});

it("hoverBandRow: the picked mark's row, not a legend entry's", () => {
  const row = {id: "a"};
  assert.strictEqual(hoverBandRow({_lastScenePick: {d: row}}), row);
  assert.strictEqual(
    hoverBandRow({_lastScenePick: {d: row, isLegend: true}}),
    undefined,
  );
  assert.strictEqual(hoverBandRow({_lastScenePick: null}), undefined);
});

it("syncHoverBand: records the row and repaints on a change", () => {
  const viz = chart();
  const row = {id: "a"};
  viz._lastScenePick = {d: row};
  syncHoverBand(viz);
  syncHoverBand(viz);
  assert.strictEqual(viz._hoverBandRow, row);
  assert.strictEqual(viz.repaints, 1, "once per change");
  const plain = chart([{type: "rect"}]);
  plain._lastScenePick = {d: row};
  syncHoverBand(plain);
  assert.strictEqual(plain.repaints, 0, "no bands, no repaint");
});

it("leaveMark: drops the band, repainting unless a transition runs", () => {
  const viz = chart();
  viz._select = {style: (_k, v) => (viz.cursor = v)};
  viz._hoverBandRow = {id: "a"};
  leaveMark(viz);
  assert.strictEqual(viz._hoverBandRow, undefined);
  assert.strictEqual(viz.cursor, "auto");
  assert.strictEqual(viz.repaints, 1);
  viz._hoverBandRow = {id: "b"};
  viz._transitionEndsAt = Date.now() + 1000;
  leaveMark(viz);
  assert.strictEqual(viz._hoverBandRow, undefined);
  assert.strictEqual(viz.repaints, 1, "mid-transition");
});
