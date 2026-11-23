/* global MouseEvent */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A data-driven chart's marks report their row's position to handlers as
    `i`, as a Plot mark does: a Pie wedge or Treemap tile its row's position
    in the data, a Network or Sankey node its position in the nodes; a
    mark's label reports the same `i`; a Pack group circle, which draws no
    single row, reports -1.
*/

const rows = [
  {id: "alpha", value: 30},
  {id: "beta", value: 50},
  {id: "gamma", value: 20},
];
const nodes = [{id: "alpha"}, {id: "beta"}, {id: "gamma"}];
const links = [
  {source: "alpha", target: "beta", value: 5},
  {source: "alpha", target: "gamma", value: 3},
];

const charts = {
  Pie: {
    mark: /^pie-[a-z]+$/,
    src: `new lib.Pie().data(rows).groupBy("id").value("value")`,
  },
  Treemap: {
    mark: /^treemap-/,
    src: `new lib.Treemap().data(rows).groupBy("id").sum("value")`,
  },
  Network: {
    mark: /^network-Circle-/,
    src: `new lib.Network()
      .nodes(nodes.map((d, k) => ({...d, x: k * 2, y: k % 2})))
      .links(links).size(() => 1).sizeMin(40).sizeMax(40)`,
  },
  Sankey: {
    mark: /^sankey-Rect-/,
    src: `new lib.Sankey().nodes(nodes).links(links)`,
  },
};

const probe = async ([src, markKey, renderer, rows, nodes, links]) => {
  const target = document.getElementById("viz");
  const calls = [];
  const viz = new Function("lib", "rows", "nodes", "links", `return ${src};`)(
    window.d3plus,
    rows,
    nodes,
    links,
  )
    .duration(0)
    .width(500)
    .height(400)
    .legend(false)
    .on("click.shape", (d, i) => calls.push({id: d && d.id, i}));
  await new Promise(r => viz.select(target).renderer(renderer).render(r));
  const host = target.querySelector(renderer === "canvas" ? "canvas" : "svg");
  const rect = host.getBoundingClientRect();
  const pick = (x, y) => viz._sceneRenderer.pick([x, y])?.node;
  const inside = (n, x, y, r) =>
    [-r, 0, r].every(dx => [-r, 0, r].every(dy => pick(x + dx, y + dy) === n));
  const spots = new Map();
  for (let y = 2; y < 400; y += 2)
    for (let x = 2; x < 500; x += 2) {
      const n = pick(x, y);
      if (!n || spots.has(n.key)) continue;
      const kind = new RegExp(markKey).test(String(n.key))
        ? "mark"
        : n.type === "text" && n.datum && !n.interactionGroup
          ? "label"
          : null;
      if (kind && inside(n, x, y, kind === "mark" ? 3 : 1))
        spots.set(n.key, {kind, x, y});
    }
  const out = [];
  for (const [key, {kind, x, y}] of spots) {
    calls.length = 0;
    const clientX = rect.left + x,
      clientY = rect.top + y;
    const el =
      renderer === "canvas"
        ? host
        : document.elementFromPoint(clientX, clientY);
    el.dispatchEvent(
      new MouseEvent("click", {bubbles: true, clientX, clientY}),
    );
    if (calls.length) out.push({key, kind, ...calls[0]});
  }
  return out;
};

for (const [name, {mark, src}] of Object.entries(charts))
  for (const renderer of ["svg", "canvas"])
    it(`${name} (${renderer}): marks and their labels report the row's index`, async () => {
      const out = await render(
        '<div id="viz" style="width:500px;height:400px"></div>',
        probe,
        [src, mark.source, renderer, rows, nodes, links],
      );
      const list = name === "Network" || name === "Sankey" ? nodes : rows;
      const marks = out.filter(c => c.kind === "mark");
      const labels = out.filter(c => c.kind === "label");
      assert.strictEqual(
        marks.length,
        3,
        `clicked every mark (${marks.length})`,
      );
      assert.ok(labels.length >= 2, `clicked the labels (${labels.length})`);
      for (const c of out)
        assert.strictEqual(
          c.i,
          list.findIndex(r => r.id === c.id),
          `${c.kind} ${c.key} (${c.id})`,
        );
    });

it("Pack: a group circle, which draws no single row, reports -1", async () => {
  const out = await render(
    '<div id="viz" style="width:500px;height:400px"></div>',
    async () => {
      const calls = [];
      const data = [
        {group: "A", id: "a1", value: 10},
        {group: "A", id: "a2", value: 20},
        {group: "B", id: "b1", value: 15},
        {group: "B", id: "b2", value: 25},
      ];
      const viz = new window.d3plus.Pack()
        .data(data)
        .groupBy(["group", "id"])
        .sum("value")
        .duration(0)
        .legend(false)
        .on("click.shape", (d, i) => calls.push({id: d.id, group: d.group, i}));
      await new Promise(r =>
        viz.select("#viz").width(500).height(400).render(r),
      );
      const scene = viz._paintedScene.root;
      const found = [];
      const walk = n => {
        if (n.shapeType === "Pack") found.push(n);
        (n.children || []).forEach(walk);
      };
      walk(scene);
      return {
        data: data.map(d => d.id),
        marks: found.map(n => ({key: n.key, index: n.index, id: n.datum.id})),
      };
    },
  );
  const groups = out.marks.filter(m => /pack-(group|root)/.test(m.key));
  const leaves = out.marks.filter(m => /pack-leaf/.test(m.key));
  assert.ok(groups.length >= 2, "drew group circles");
  for (const g of groups) assert.strictEqual(g.index, -1, g.key);
  assert.strictEqual(leaves.length, 4);
  for (const l of leaves)
    assert.strictEqual(l.index, out.data.indexOf(l.id), l.key);
});
