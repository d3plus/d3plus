import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Hovering a Network's (and an ArcDiagram's) legend in Chromium, on SVG
    and Canvas: a cluster's
    entry highlights its nodes and the links among them, and leaving clears
    it; an entry merging several nodes highlights each of them.
*/

const ring = (cx, cy, names) =>
  names.map((id, k) => ({
    id,
    x: cx + 90 * Math.cos((k * 2 * Math.PI) / names.length),
    y: cy + 90 * Math.sin((k * 2 * Math.PI) / names.length),
  }));
const groups = [
  ["Ada", "Ben", "Cleo", "Dev", "Eli"],
  ["Fay", "Gus", "Hana", "Ivo", "Jun"],
];
const nodes = [
  ...ring(0, 0, groups[0]).map(n => ({...n, team: "red"})),
  ...ring(400, 0, groups[1]).map(n => ({...n, team: "blue"})),
];
nodes[1].team = "blue";
const links = [
  ...groups.flatMap(g =>
    g.flatMap((a, i) => g.slice(i + 1).map(b => ({source: a, target: b}))),
  ),
  {source: "Ada", target: "Fay"},
];

const box = "<div id='viz' style='width:900px;height:560px'></div>";

/**
    Runs in the page: draws the chart, routes a hover over the first legend
    swatch the way the pointer does, and reads back which nodes and links the
    hover keeps lit, then which stay lit once the pointer leaves.
*/
const hoverLegend = ([renderer, config, chart = "Network"]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .nodes(nodes)
      .links(links)
      .config(config);
    viz.render(() => {
      let swatch;
      // A link's hit path shares its datum.
      const linkData = new Set();
      const walk = (n, legend) => {
        const inLegend = legend || n.key === "viz-legend";
        if (
          inLegend &&
          ["rect", "circle"].includes(n.type) &&
          n.datum &&
          !swatch
        )
          swatch = n;
        if (!inLegend && window.d3plus.isLinkDatum(n.datum))
          linkData.add(n.datum);
        (n.children ?? []).forEach(c => walk(c, inLegend));
      };
      walk(viz._paintedScene.root, false);
      const route = type =>
        viz._routeSceneEvent({
          type,
          point: [0, 0],
          pick: {node: swatch, datum: swatch.datum, index: swatch.index},
          nativeEvent: new MouseEvent(type),
        });
      const lit = () => {
        const hover = viz._hover;
        if (typeof hover !== "function") return {nodes: [], links: 0};
        return {
          nodes: nodes.filter((d, i) => hover(d, i)).map(d => d.id),
          links: [...linkData].filter((d, i) => hover(d, i)).length,
        };
      };
      route("mouseenter");
      route("mousemove");
      const hovered = lit();
      const {d, i} = viz._lastScenePick;
      const entryIds = [].concat(viz._id(d, i)).map(String);
      viz._routeSceneEvent({
        type: "mouseleave",
        point: [0, 0],
        pick: null,
        nativeEvent: new MouseEvent("mouseleave"),
      });
      // The leave clears the hover a macrotask later.
      setTimeout(
        () =>
          resolve({
            label: `${viz.schema.legendConfig.label(swatch.datum, 0)}`,
            hovered,
            entryIds,
            left: lit(),
            linkCount: linkData.size,
          }),
        20,
      );
    });
  });

for (const [chart, renderer] of [
  ["Network", "svg"],
  ["Network", "canvas"],
  ["ArcDiagram", "svg"],
]) {
  it(`${chart} ${renderer}: hovering a cluster's legend entry highlights its nodes and their links`, async () => {
    const r = await render(box, hoverLegend, [renderer, {}, chart]);
    assert.ok(r.label.endsWith(" cluster"), r.label);
    const hub = r.label.split(" ")[0];
    const members = groups.find(g => g[0] === hub);
    assert.deepStrictEqual([...r.hovered.nodes].sort(), [...members].sort());
    // Every link within the five-node ring, and not the one leaving it.
    assert.strictEqual(r.hovered.links, 10);
    assert.ok(r.linkCount > 10, `${r.linkCount} links drawn`);
    assert.deepStrictEqual(r.left, {nodes: [], links: 0}, "leaving clears it");
  });

  it(`${chart} ${renderer}: hovering an entry of a legend colored by category highlights its nodes`, async () => {
    const data = nodes.map(({id, team}) => ({id, team}));
    const r = await render(box, hoverLegend, [
      renderer,
      {color: "team", data, legend: true},
      chart,
    ]);
    assert.ok(r.entryIds.length > 1, `${r.entryIds}`);
    assert.deepStrictEqual([...r.hovered.nodes].sort(), [...r.entryIds].sort());
  });
}
