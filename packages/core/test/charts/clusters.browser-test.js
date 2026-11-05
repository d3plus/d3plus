import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Cluster colors in Chromium, on SVG and Canvas: an uncolored Network or
    ArcDiagram colors its nodes by cluster, the legend lists the clusters
    (from `nodes` alone), `cluster: false` and a user `color` keep their own
    colors, clicking a cluster's legend entry focuses it, and a Network
    writes each cluster's name clear of its nodes, in the theme's ink.
*/

/** Three rings of five nodes, each ring's nodes all linked, one link between rings. */
const ring = (cx, cy, names) =>
  names.map((id, k) => ({
    id,
    x: cx + 90 * Math.cos((k * 2 * Math.PI) / names.length),
    y: cy + 90 * Math.sin((k * 2 * Math.PI) / names.length),
  }));
const groups = [
  ["Ada", "Ben", "Cleo", "Dev", "Eli"],
  ["Fay", "Gus", "Hana", "Ivo", "Jun"],
  ["Kai", "Lea", "Mo", "Nia", "Omar"],
];
const nodes = [
  ...ring(0, 0, groups[0]).map(n => ({...n, team: "red"})),
  ...ring(400, 0, groups[1]).map(n => ({...n, team: "blue"})),
  ...ring(200, 320, groups[2]).map(n => ({...n, team: "red"})),
];
const links = [
  ...groups.flatMap(g =>
    g.flatMap((a, i) => g.slice(i + 1).map(b => ({source: a, target: b}))),
  ),
  // Each ring's first node has one more link, so it names its cluster.
  {source: "Ada", target: "Fay"},
  {source: "Fay", target: "Kai"},
  {source: "Kai", target: "Ada"},
];

const box = "<div id='viz' style='width:900px;height:560px'></div>";

/**
    Runs in the page: draws the chart and reads back each node's fill and
    circle, the cluster name text (with its line boxes), the legend's
    entries, and what clicking the first legend entry focuses.
*/
const draw = ([chart, config, renderer]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .nodes(nodes)
      .links(links)
      .config(config);
    viz.render(() => {
      const fills = {};
      const circles = [];
      const names = [];
      const walk = n => {
        (n.children ?? []).forEach(walk);
        const key = String(n.key);
        if (
          n.type === "circle" &&
          /^(network-Circle|arc-node)-/.test(key) &&
          n.datum
        ) {
          fills[n.datum.id] = n.paint.fill;
          circles.push({id: n.datum.id, x: n.cx, y: n.cy, r: n.r});
        }
        if (n.type === "text" && key.startsWith("network-cluster-label-"))
          names.push({
            text: n.lines.map(l => l.text).join(" "),
            fill: n.paint.fill,
            halo: n.paint.stroke,
            interactive: n.interactive,
            boxes: window.d3plus.textLineBoxes([n]),
          });
      };
      walk(viz._paintedScene.root);
      const entries = viz._legendClass._data || [];
      const legend = entries.map((d, i) => ({
        label: viz.schema.legendConfig.label(d, i),
        fill: viz.schema.shapeConfig.fill(d, i),
      }));
      let focused = [];
      if (entries.length) {
        const event = new MouseEvent("click", {clientX: 20, clientY: 20});
        viz.schema.on["click.legend"](entries[0], 0, undefined, event);
        focused =
          typeof viz._active === "function"
            ? nodes.filter((d, i) => viz._active(d, i)).map(d => d.id)
            : [];
      }
      resolve({fills, circles, names, legend, focused});
    });
  });

/** The distinct fills among `ids`. */
const fillsOf = (fills, ids) => new Set(ids.map(id => fills[id]));

for (const renderer of ["svg", "canvas"]) {
  it(`Network ${renderer}: no color config colors each cluster, and the legend lists them from nodes alone`, async () => {
    const r = await render(box, draw, ["Network", {}, renderer]);
    // Equal sizes: the legend lists them by name.
    assert.deepStrictEqual(
      r.legend.map(e => e.label),
      ["Ada cluster", "Fay cluster", "Kai cluster"],
    );
    for (const g of groups)
      assert.strictEqual(fillsOf(r.fills, g).size, 1, `${g[0]}'s cluster`);
    assert.strictEqual(
      fillsOf(
        r.fills,
        groups.map(g => g[0]),
      ).size,
      3,
      "three cluster colors",
    );
    assert.deepStrictEqual(r.legend.map(e => e.label).sort(), [
      "Ada cluster",
      "Fay cluster",
      "Kai cluster",
    ]);
    for (const e of r.legend) {
      const hub = e.label.split(" ")[0];
      assert.strictEqual(e.fill, r.fills[hub], `${e.label} swatch`);
    }
    // Clicking a cluster's entry focuses (and zooms to) its nodes.
    const first = r.legend[0].label.split(" ")[0];
    const members = groups.find(g => g[0] === first);
    assert.deepStrictEqual([...r.focused].sort(), [...members].sort());
  });

  it(`Network ${renderer}: each cluster's name is drawn inert, clear of every node`, async () => {
    const r = await render(box, draw, ["Network", {}, renderer]);
    assert.deepStrictEqual(r.names.map(n => n.text).sort(), [
      "Ada cluster",
      "Fay cluster",
      "Kai cluster",
    ]);
    for (const name of r.names) {
      assert.strictEqual(name.interactive, false);
      for (const b of name.boxes)
        for (const c of r.circles) {
          const dx =
            c.x - Math.max(b.x - b.width / 2, Math.min(c.x, b.x + b.width / 2));
          const dy =
            c.y -
            Math.max(b.y - b.height / 2, Math.min(c.y, b.y + b.height / 2));
          assert.ok(
            dx * dx + dy * dy >= c.r * c.r,
            `${name.text} covers ${c.id}`,
          );
        }
    }
    const light = r.names[0];
    const dark = (
      await render(box, draw, ["Network", {theme: "dark"}, renderer])
    ).names[0];
    assert.notStrictEqual(light.fill, dark.fill, "names take the theme's ink");
    assert.notStrictEqual(light.halo, dark.halo, "halos take the background");
  });

  it(`Network ${renderer}: cluster false, a user color, and labelConfig false`, async () => {
    const off = await render(box, draw, [
      "Network",
      {cluster: false},
      renderer,
    ]);
    assert.strictEqual(
      fillsOf(
        off.fills,
        nodes.map(n => n.id),
      ).size,
      nodes.length,
      "one color per node",
    );
    assert.strictEqual(off.names.length, 0);
    const team = await render(box, draw, [
      "Network",
      {color: "team"},
      renderer,
    ]);
    assert.strictEqual(
      fillsOf(
        team.fills,
        nodes.map(n => n.id),
      ).size,
      2,
    );
    assert.strictEqual(
      team.fills.Ada,
      team.fills.Kai,
      "Ada and Kai share a team",
    );
    assert.strictEqual(team.names.length, 0);
    const quiet = await render(box, draw, [
      "Network",
      {clusterConfig: {labelConfig: false}},
      renderer,
    ]);
    assert.strictEqual(quiet.names.length, 0);
    assert.strictEqual(quiet.legend.length, 3, "the legend still names them");
  });

  it(`Network ${renderer}: the cluster legend lists the largest cluster first`, async () => {
    const r = await render(box, draw, [
      "Network",
      {
        nodes: [
          ...nodes,
          {id: "Zed", x: 420, y: 60},
          {id: "Yan", x: 380, y: 80},
        ],
        links: [
          ...links,
          {source: "Zed", target: "Fay"},
          {source: "Zed", target: "Gus"},
          {source: "Yan", target: "Gus"},
          {source: "Yan", target: "Hana"},
        ],
      },
      renderer,
    ]);
    const labels = r.legend.map(e => e.label);
    assert.strictEqual(labels.length, 3);
    assert.ok(/^(Fay|Gus) cluster$/.test(labels[0]), labels.join());
    assert.deepStrictEqual(labels.slice(1), ["Ada cluster", "Kai cluster"]);
  });

  it(`ArcDiagram ${renderer}: clusters in its colors and legend, with no names on the chart`, async () => {
    const r = await render(box, draw, [
      "ArcDiagram",
      {nodeSort: "group"},
      renderer,
    ]);
    for (const g of groups) assert.strictEqual(fillsOf(r.fills, g).size, 1);
    assert.deepStrictEqual(r.legend.map(e => e.label).sort(), [
      "Ada cluster",
      "Fay cluster",
      "Kai cluster",
    ]);
    assert.strictEqual(r.names.length, 0);
    const first = r.legend[0].label.split(" ")[0];
    const members = groups.find(g => g[0] === first);
    assert.deepStrictEqual([...r.focused].sort(), [...members].sort());
  });
}
