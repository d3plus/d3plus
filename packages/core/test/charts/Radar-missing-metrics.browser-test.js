import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Each Radar vertex sits on its own metric's spoke, whatever order a
    group's rows list the metrics in, and a metric a group has no value for
    has no vertex rather than shifting the rest onto the wrong spokes.
*/

it("Radar puts every vertex on its metric's spoke", async function () {
  const out = await render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    async () => {
      const metrics = ["Speed", "Power", "Range", "Comfort"];
      const rows = [
        ...metrics.map((axis, i) => ({id: "A", axis, value: 2 + i})),
        // B has no Power.
        {id: "B", axis: "Speed", value: 4},
        {id: "B", axis: "Range", value: 3},
        {id: "B", axis: "Comfort", value: 5},
        // C lists its metrics backwards.
        ...metrics
          .slice()
          .reverse()
          .map((axis, i) => ({id: "C", axis, value: 1 + i})),
      ];
      const viz = new window.d3plus.Radar()
        .select("#viz")
        .duration(0)
        .data(rows)
        .groupBy("id")
        .metric("axis")
        .value("value");
      await new Promise(r => viz.render(r));
      const TAU = Math.PI * 2;
      return viz.ctx.groupData.map(g => ({
        id: g.id,
        spokes: g.points.map(p => {
          const a = (Math.atan2(p.y, p.x) + TAU) % TAU;
          return Math.round(a / (TAU / metrics.length)) % metrics.length;
        }),
        metrics: g.arr.map(d => d.axis),
        closed: g.d.startsWith(`M ${g.points[0].x} ${g.points[0].y}`),
      }));
    },
  );
  const byId = Object.fromEntries(out.map(g => [g.id, g]));
  assert.deepStrictEqual(byId.A.spokes, [0, 1, 2, 3]);
  assert.deepStrictEqual(byId.B.spokes, [0, 2, 3], "no vertex for Power");
  assert.deepStrictEqual(byId.B.metrics, ["Speed", "Range", "Comfort"]);
  assert.deepStrictEqual(byId.C.spokes, [0, 1, 2, 3], "spoke order");
  assert.deepStrictEqual(byId.C.metrics, [
    "Speed",
    "Power",
    "Range",
    "Comfort",
  ]);
  assert.ok(out.every(g => g.closed));
});
