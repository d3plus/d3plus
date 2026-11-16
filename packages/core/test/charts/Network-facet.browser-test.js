import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Small multiples of the node-link charts in Chromium, on SVG and Canvas:
    when every panel shares the same `nodes` and `links`, each panel draws
    only its own rows' nodes, and only the links between two of them.
*/

const body = `
  <div id="viz" style="width:800px;height:420px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Two groups of four, ringed, plus links across the groups. */
const rows = ["a", "b"].flatMap(g =>
  [0, 1, 2, 3].map(i => ({id: `${g}${i}`, group: g})),
);
const links = [
  ...["a", "b"].flatMap(g =>
    [0, 1, 2, 3].map(i => ({source: `${g}${i}`, target: `${g}${(i + 1) % 4}`})),
  ),
  {source: "a0", target: "b0"},
  {source: "a2", target: "b3"},
];

/** Draws a faceted chart and reads each panel's node ids and link ends. */
const draw = async ({chart, config, renderer}) => {
  const viz = new window.d3plus[chart]()
    .config({duration: 0, legend: false, forceLive: false, ...config})
    .facet(d => d.group)
    .renderer(renderer)
    .select("#viz");
  await new Promise(resolve => viz.render(resolve));
  const flat = list =>
    list.flatMap(n => (n.children ? [n, ...flat(n.children)] : [n]));
  const panels = {};
  for (const node of flat(viz._chartScene || [])) {
    const key = `${node.key ?? ""}`;
    const at = key.indexOf("/");
    if (at < 0) continue;
    const panel = key.slice(0, at);
    const own = key.slice(at + 1);
    panels[panel] ??= {nodes: new Set(), links: new Set()};
    const shape = /(?:-Circle|-Rect|arc-node)-([ab]\d)$/.exec(own);
    if (shape && node.type !== "group") panels[panel].nodes.add(shape[1]);
    const link = /link-([ab]\d)-([ab]\d)/.exec(own);
    if (link) panels[panel].links.add(`${link[1]}-${link[2]}`);
  }
  return Object.values(panels).map(p => ({
    nodes: [...p.nodes].sort(),
    links: [...p.links].sort(),
  }));
};

const own = (panel, group) =>
  panel.nodes.every(id => id[0] === group) &&
  panel.links.every(l => l[0] === group && l[3] === group);

for (const renderer of ["svg", "canvas"]) {
  for (const [name, config] of [
    ["data, nodes, and links", {data: rows, nodes: rows, links}],
    ["data and links", {data: rows, links}],
  ]) {
    it(`[${renderer}] a faceted Network draws each panel's own nodes (${name})`, async () => {
      const panels = await render(body, draw, {
        chart: "Network",
        config,
        renderer,
      });
      const withNodes = panels.filter(p => p.nodes.length);
      assert.strictEqual(withNodes.length, 2, JSON.stringify(panels));
      const [a, b] = ["a", "b"].map(g =>
        withNodes.find(p => p.nodes.some(id => id[0] === g)),
      );
      assert.deepStrictEqual(a.nodes, ["a0", "a1", "a2", "a3"]);
      assert.deepStrictEqual(b.nodes, ["b0", "b1", "b2", "b3"]);
      assert.ok(own(a, "a") && own(b, "b"), JSON.stringify(panels));
      assert.strictEqual(a.links.length, 4, JSON.stringify(a.links));
      assert.strictEqual(b.links.length, 4, JSON.stringify(b.links));
    });
  }

  it(`[${renderer}] a faceted ArcDiagram draws each panel's own nodes`, async () => {
    const panels = await render(body, draw, {
      chart: "ArcDiagram",
      config: {data: rows, nodes: rows, links},
      renderer,
    });
    const withNodes = panels.filter(p => p.nodes.length);
    assert.strictEqual(withNodes.length, 2, JSON.stringify(panels));
    for (const p of withNodes) {
      const g = p.nodes[0][0];
      assert.strictEqual(p.nodes.length, 4, JSON.stringify(p));
      assert.ok(own(p, g), JSON.stringify(p));
    }
  });
}
