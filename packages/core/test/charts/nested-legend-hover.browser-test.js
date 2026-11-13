import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Hovering a mark below the legend's level (a nested node, a group row, a
    node of a merged cluster entry) keeps the legend entry it belongs to lit
    while the other entries dim, on SVG and Canvas.
*/

const data = [
  {area: "Frontend", module: "Components", file: "Button", size: 120},
  {area: "Frontend", module: "Components", file: "Table", size: 410},
  {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
  {area: "Backend", module: "API", file: "Users", size: 330},
  {area: "Backend", module: "API", file: "Orders", size: 460},
  {area: "Backend", module: "Database", file: "Models", size: 290},
  {area: "Docs", module: "Guides", file: "Theming", size: 140},
  {area: "Docs", module: "Reference", file: "API Reference", size: 260},
];

const box = "<div id='viz' style='width:600px;height:450px'></div>";

/** In-page helpers: unwrap a datum, walk a scene, and read the legend's painted opacities. */
const helpers = `
  window.unwrap = d => { while (d && d.__d3plus__ && d.data) d = d.data; return d; };
  window.walk = (node, out, keep) => {
    if (keep(node)) out.push(node);
    (node.children || []).forEach(c => window.walk(c, out, keep));
    return out;
  };
  window.legendOpacity = (viz, label) => {
    const legend = window.walk(viz._paintedScene.root, [], n => n.key === "viz-legend")[0];
    const out = {};
    window
      .walk(legend, [], n => ["rect", "circle"].includes(n.type) && n.datum)
      .forEach(n => {
        const opacity = n.paint && typeof n.paint.opacity === "number" ? n.paint.opacity : 1;
        out[label(window.unwrap(n.datum))] = opacity;
      });
    return out;
  };
  window.route = (viz, type, node) => viz._routeSceneEvent({
    type,
    point: [1, 1],
    pick: node ? {node, datum: node.datum, index: node.index} : null,
    nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
  });
  window.settle = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
`;

/**
    Runs in the page: draws a three-level chart, hovers the mark each target
    picks, and reads the legend's opacities, keyed by area, after each.
*/
const hoverNested = new Function(
  "arg",
  `${helpers}; return (${async ({chart, renderer, data, targets}) => {
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .data(data.map(d => ({...d})))
      .groupBy(["area", "module", "file"])
      .sum("size")
      .duration(0)
      .renderer(renderer);
    await new Promise(resolve => viz.render(resolve));
    const marks = window.walk(
      {children: viz._chartScene},
      [],
      n => n.datum && n.type !== "text" && n.type !== "group",
    );
    const out = {};
    for (const [name, [field, value, nested]] of Object.entries(targets)) {
      const node = marks.find(n => {
        const row = window.unwrap(n.datum);
        return (
          row &&
          row[field] === value &&
          Array.isArray(row[nested]) === Boolean(nested)
        );
      });
      if (!node) {
        out[name] = "no mark";
        continue;
      }
      window.route(viz, "mouseenter", node);
      window.route(viz, "mousemove", node);
      await window.settle();
      out[name] = window.legendOpacity(viz, row => row.area);
      window.route(viz, "mouseleave", null);
      viz.hover(false);
      await window.settle();
    }
    out.cleared = window.legendOpacity(viz, row => row.area);
    return out;
  }})(arg);`,
);

// Each target: the field and value its mark's row holds, and the deeper
// field a group row merges into an array (a leaf has none).
const targets = {
  leaf: ["file", "Orders"],
  branch: ["module", "API", "file"],
  group: ["area", "Backend", "module"],
};

for (const chart of ["Sunburst", "Icicle", "Pack"]) {
  for (const renderer of ["svg", "canvas"]) {
    it(`${chart} ${renderer}: hovering a nested node lights its group's legend entry`, async () => {
      const out = await render(box, hoverNested, {
        chart,
        renderer,
        data,
        targets,
      });
      for (const name of Object.keys(targets)) {
        const legend = out[name];
        assert.ok(typeof legend === "object", `${name}: ${legend}`);
        assert.strictEqual(
          legend.Backend,
          1,
          `${name}: Backend stays lit ${JSON.stringify(legend)}`,
        );
        assert.ok(
          legend.Frontend < 1 && legend.Docs < 1,
          `${name}: the other entries dim ${JSON.stringify(legend)}`,
        );
      }
      assert.deepStrictEqual(
        out.cleared,
        {Frontend: 1, Backend: 1, Docs: 1},
        "leaving restores every entry",
      );
    });
  }
}

it("Sunburst canvas: a real pointer over an outer arc lights its group's legend entry", async () => {
  const out = await render(
    box,
    new Function(
      "arg",
      `${helpers}; return (${async ({data}) => {
        const viz = new window.d3plus.Sunburst()
          .select("#viz")
          .data(data.map(d => ({...d})))
          .groupBy(["area", "module", "file"])
          .sum("size")
          .duration(0)
          .renderer("canvas");
        await new Promise(resolve => viz.render(resolve));
        const arc = viz._chartScene.find(
          n => n.key === 'sunburst-["Backend","API","Orders"]',
        );
        const canvas = document.querySelector(
          "#viz canvas.d3plus-render-canvas",
        );
        const t = viz._chartTransform;
        const mid = (arc.arc.startAngle + arc.arc.endAngle) / 2;
        const r = (arc.arc.innerRadius + arc.arc.outerRadius) / 2;
        const rect = canvas.getBoundingClientRect();
        canvas.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: rect.left + t.x + r * Math.sin(mid),
            clientY: rect.top + t.y - r * Math.cos(mid),
            bubbles: true,
          }),
        );
        await window.settle();
        return window.legendOpacity(viz, row => row.area);
      }})(arg);`,
    ),
    {data},
  );
  assert.strictEqual(out.Backend, 1, JSON.stringify(out));
  assert.ok(out.Frontend < 1 && out.Docs < 1, JSON.stringify(out));
});

// Two five-node cliques joined by one link: two clusters, so the legend
// lists each cluster as one entry merging its nodes.
const ring = names =>
  names.map((id, k) => ({
    id,
    x: 90 * Math.cos((k * 2 * Math.PI) / names.length),
    y: 90 * Math.sin((k * 2 * Math.PI) / names.length),
  }));
const groups = [
  ["Ada", "Ben", "Cleo", "Dev", "Eli"],
  ["Fay", "Gus", "Hana", "Ivo", "Jun"],
];
const nodes = [
  ...ring(groups[0]),
  ...ring(groups[1]).map(n => ({...n, x: n.x + 400})),
];
const links = [
  ...groups.flatMap(g =>
    g.flatMap((a, i) => g.slice(i + 1).map(b => ({source: a, target: b}))),
  ),
  {source: "Eli", target: "Fay"},
];

for (const [chart, renderer] of [
  ["Network", "svg"],
  ["Network", "canvas"],
  ["ArcDiagram", "svg"],
]) {
  it(`${chart} ${renderer}: hovering a node lights its cluster's legend entry`, async () => {
    const out = await render(
      "<div id='viz' style='width:900px;height:560px'></div>",
      new Function(
        "arg",
        `${helpers}; return (${async ({chart, renderer, nodes, links}) => {
          const viz = new window.d3plus[chart]()
            .select("#viz")
            .renderer(renderer)
            .duration(0)
            .nodes(nodes)
            .links(links);
          await new Promise(resolve => viz.render(resolve));
          const node = window
            .walk(
              {children: viz._chartScene},
              [],
              n => n.datum && n.type !== "text",
            )
            .find(n => {
              const row = window.unwrap(n.datum);
              return (
                row && row.id === "Ada" && !window.d3plus.isLinkDatum(n.datum)
              );
            });
          window.route(viz, "mouseenter", node);
          window.route(viz, "mousemove", node);
          await window.settle();
          return window.legendOpacity(viz, row =>
            [].concat(row.id).includes("Ada") ? "ada" : "other",
          );
        }})(arg);`,
      ),
      {chart, renderer, nodes, links},
    );
    assert.strictEqual(out.ada, 1, JSON.stringify(out));
    assert.ok(out.other < 1, JSON.stringify(out));
  });
}
