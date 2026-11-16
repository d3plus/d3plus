import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import lesmis from "../../dev/charts/Network/lesmis.json";

/**
    Network node labels in Chromium, on SVG and Canvas: a label that fits
    neither inside its node nor on a side of it slides along a side, so Les
    Misérables at the SymmetricGraphs dev page's size names most of its
    nodes, every label clear of the nodes, the other labels and the chart's
    edges, and the same on every draw. A frame redraw (a live layout's tick,
    a drag) keeps each label where it was while it still fits there.
*/

const body = `
  <div id="viz" style="width:618px;height:480px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Runs in the page: draws Les Misérables and reads its nodes and labels. */
const draw = async ({graph, renderer, twice}) => {
  const make = async () => {
    document.querySelector("#viz").innerHTML = "";
    const viz = new window.d3plus.Network()
      .select("#viz")
      .renderer(renderer)
      .config({duration: 0, forceLive: false})
      .nodes(graph.nodes)
      .links(graph.links)
      .linkSize(d => d.value);
    await new Promise(resolve => viz.render(resolve));
    const flat = list =>
      list.flatMap(n => (n.children ? [n, ...flat(n.children)] : [n]));
    const all = flat(viz._chartScene || []);
    return {
      width: viz.schema.width - viz._margin.left - viz._margin.right,
      height: viz.schema.height - viz._margin.top - viz._margin.bottom,
      circles: all
        .filter(n => n.type === "circle" && /^network-Circle-/.test(n.key))
        .map(n => ({cx: n.cx, cy: n.cy, r: n.r})),
      labels: all
        .filter(n => n.type === "text" && /^network-label-/.test(n.key))
        .map(n => ({
          key: n.key,
          x: n.transform?.x ?? n.x,
          y: n.transform?.y ?? n.y,
          width: n.width,
          height: n.height,
        })),
    };
  };
  const first = await make();
  return twice ? {first, second: await make()} : first;
};

/** Whether two boxes overlap by more than rounding. */
const overlap = (a, b) =>
  a.x < b.x + b.width - 0.5 &&
  b.x < a.x + a.width - 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  b.y < a.y + a.height - 0.5;

/** Whether a box overlaps a circle by more than rounding. */
const hits = (box, c) => {
  const dx = Math.max(box.x - c.cx, 0, c.cx - (box.x + box.width));
  const dy = Math.max(box.y - c.cy, 0, c.cy - (box.y + box.height));
  return Math.hypot(dx, dy) < c.r - 0.5;
};

/**
    Runs in the page: draws Les Misérables, nudges every node a pixel or so
    and redraws it the way a live layout's frame does, then draws it afresh
    at the nudged positions. Returns how many labels changed slot each way.
*/
const nudge = async ({graph, renderer}) => {
  const viz = new window.d3plus.Network()
    .select("#viz")
    .renderer(renderer)
    .config({duration: 0, forceLive: false})
    .nodes(graph.nodes)
    .links(graph.links)
    .linkSize(d => d.value);
  await new Promise(resolve => viz.render(resolve));
  const state = viz.ctx.networkLive;
  const slots = () =>
    new Map(
      [...state.labelSlots].map(([id, s]) => [id, `${s.side} ${s.slide}`]),
    );
  const changed = (a, b) =>
    [...new Set([...a.keys(), ...b.keys()])].filter(
      id => a.get(id) !== b.get(id),
    ).length;
  const before = slots();
  let k = 0;
  for (const [id, p] of state.positions) {
    k++;
    state.pinned.set(id, {
      x: p.x + (k % 2 ? 1.5 : -1.5),
      y: p.y + (k % 3 ? 1 : -1),
    });
  }
  window.d3plus.redrawPositions(viz);
  const framed = slots();
  await new Promise(resolve => viz.render(resolve));
  const fresh = slots();
  return {
    shown: before.size,
    framed: framed.size,
    held: changed(before, framed),
    moved: changed(before, fresh),
  };
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] Les Misérables names most nodes, every label clear`, async () => {
    const {width, height, circles, labels} = await render(body, draw, {
      graph: lesmis,
      renderer,
    });
    assert.strictEqual(circles.length, 58);
    assert.ok(labels.length >= 40, `${labels.length} labels`);
    labels.forEach((a, i) => {
      assert.ok(
        a.x >= -0.5 &&
          a.y >= -0.5 &&
          a.x + a.width <= width + 0.5 &&
          a.y + a.height <= height + 0.5,
        `${a.key} in the chart`,
      );
      for (const c of circles)
        assert.ok(!hits(a, c), `${a.key} clear of nodes`);
      for (const b of labels.slice(i + 1))
        assert.ok(!overlap(a, b), `${a.key} clear of ${b.key}`);
    });
  });

  it(`[${renderer}] the labels land the same way on every draw`, async () => {
    const {first, second} = await render(body, draw, {
      graph: lesmis,
      renderer,
      twice: true,
    });
    assert.deepStrictEqual(second.labels, first.labels);
  });

  it(`[${renderer}] a frame redraw keeps each label's slot`, async () => {
    const {shown, framed, held, moved} = await render(body, nudge, {
      graph: lesmis,
      renderer,
    });
    assert.ok(framed >= shown - 2, `${framed} labels after, ${shown} before`);
    // Drawn afresh, the nudge sends many labels to another slot; a frame
    // redraw moves only the ones whose slot closed.
    assert.ok(held < moved, `${held} held vs ${moved} fresh`);
    assert.ok(held <= shown / 8, `${held} of ${shown} moved`);
  });
}
