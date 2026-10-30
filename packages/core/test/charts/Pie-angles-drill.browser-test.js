import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {findNode, sceneNodes} from "~test/browser/helpers.js";
import {render} from "~test/browser/render.js";

/**
    A half Donut's drill-down morph keeps to its own sweep: drilling in, the
    children start confined to the clicked wedge's angles; going back, the
    reappearing parent starts as the whole half ring, not a full circle; and
    every wedge carries the sweep so plain enters and exits grow from, and
    shrink into, its ends. Its body rect is the half ring's own footprint.
*/

const data = [
  {category: "Fruit", id: "Apple", value: 30},
  {category: "Fruit", id: "Banana", value: 22},
  {category: "Fruit", id: "Cherry", value: 18},
  {category: "Vegetable", id: "Carrot", value: 20},
  {category: "Vegetable", id: "Pea", value: 12},
  {category: "Vegetable", id: "Kale", value: 8},
];

const drill = async ({data, renderer}) => {
  const chart = new window.d3plus.Donut()
    .select("#viz")
    .config({
      data,
      groupBy: ["category", "id"],
      value: "value",
      startAngle: -90,
      endAngle: 90,
    })
    .renderer(renderer)
    .depth(0)
    .width(400)
    .height(300)
    .duration(0);
  await new Promise(resolve => chart.render(resolve));
  const wedges = scene =>
    sceneNodes(scene)
      .filter(n => n.type === "path" && n.shapeType === "Pie")
      .map(n => ({
        id: n.datum.id || n.datum.category,
        arc: n.arc,
        sweep: n.sweep,
        flipFromArc: n.flipFromArc,
        reunionFromArc: n.reunionFromArc,
      }));
  const before = wedges(chart._chartScene);
  const bodyRect = chart._bodyRect;
  const node = findNode(
    chart._chartScene,
    n => n.shapeType === "Pie" && n.datum && n.datum.category === "Fruit",
  );
  chart._routeSceneEvent({
    type: "click",
    point: [1, 1],
    pick: {node, datum: node.datum, index: node.index},
    nativeEvent: {stopPropagation() {}},
  });
  await new Promise(resolve => window.setTimeout(resolve, 50));
  const drilled = wedges(chart._chartScene);
  document.querySelector("#viz .back-control").click();
  await new Promise(resolve => window.setTimeout(resolve, 50));
  const back = wedges(chart._chartScene);
  return {
    before,
    bodyRect,
    parent: {start: node.startAngle, end: node.endAngle},
    drilled,
    back,
  };
};

for (const renderer of ["svg", "canvas"]) {
  it(`Donut ${renderer}: a half donut's drill-down morph stays within its sweep`, async () => {
    const r = await render(
      "<div id='viz' style='width:400px;height:300px'></div>",
      drill,
      {data, renderer},
    );
    const half = {startAngle: -Math.PI / 2, endAngle: Math.PI / 2};
    const eps = 1e-9;

    assert.strictEqual(r.before.length, 2, "two top-level wedges");
    for (const w of r.before)
      assert.deepStrictEqual(w.sweep, half, `${w.id} carries the sweep`);
    const outer = r.before[0].arc.outerRadius;
    assert.ok(
      Math.abs(r.bodyRect.width - outer * 2) < 1e-6 &&
        Math.abs(r.bodyRect.height - outer) < 1e-6 &&
        Math.abs(r.bodyRect.y + outer) < 1e-6,
      `the body rect is the half ring (${JSON.stringify(r.bodyRect)})`,
    );

    assert.strictEqual(r.drilled.length, 3, "three Fruit wedges");
    const lo = Math.min(r.parent.start, r.parent.end);
    const hi = Math.max(r.parent.start, r.parent.end);
    for (const w of r.drilled) {
      assert.ok(w.flipFromArc, `${w.id} has a confined start`);
      for (const a of [w.flipFromArc.startAngle, w.flipFromArc.endAngle])
        assert.ok(
          a >= lo - eps && a <= hi + eps,
          `${w.id}'s start ${a} is inside the parent's ${lo}..${hi}`,
        );
    }
    const starts = r.drilled.map(w => w.flipFromArc.startAngle);
    const ends = r.drilled.map(w => w.flipFromArc.endAngle);
    assert.ok(Math.abs(Math.min(...starts) - lo) < eps, "fills from the start");
    assert.ok(Math.abs(Math.max(...ends) - hi) < eps, "to the end");

    const reunion = r.back.filter(w => w.reunionFromArc);
    assert.ok(reunion.length > 0, "the parents reappear from the ring");
    for (const w of reunion) {
      assert.ok(
        Math.abs(w.reunionFromArc.startAngle - half.startAngle) < eps &&
          Math.abs(w.reunionFromArc.endAngle - half.endAngle) < eps,
        `${w.id} starts as the whole half ring`,
      );
    }
  });
}
