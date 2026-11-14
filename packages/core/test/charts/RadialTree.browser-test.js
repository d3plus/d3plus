import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    RadialTree (and Tree's `orient: "radial"`) draws the tree around a
    circle: the root at the center, the leaves on the outer ring, links
    curving radially between them, and labels turned along their spokes.
    Hover, keyboard navigation, drilling down a level, and switching the
    orient back all work on both renderers.
*/

const body = `
  <div id="viz" style="width:600px;height:500px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

const rows = [];
["North", "South", "East"].forEach(region =>
  ["one", "two", "three", "four"].forEach(n =>
    rows.push({world: "World", region, id: `${region} ${n}`}),
  ),
);

/** Draws a chart, then runs `steps` (a function source) and returns what it collects. */
const draw = async ({chart, config, renderer, steps}) => {
  const viz = new window.d3plus[chart]()
    .config({duration: 0, legend: false, ...config})
    .renderer(renderer)
    .select("#viz");
  await new Promise(resolve => viz.render(resolve));
  const scene = () => {
    const nodes = [];
    const walk = list =>
      list.forEach(n => {
        nodes.push(n);
        if (n.children) walk(n.children);
      });
    walk(viz._chartScene);
    return nodes;
  };
  const sceneOf = s => {
    const nodes = [];
    const walk = list =>
      list.forEach(n => {
        nodes.push(n);
        if (n.children) walk(n.children);
      });
    walk(s.root ? [s.root] : s.children);
    return nodes;
  };
  const summary = (fromScene = false) => {
    const nodes = fromScene ? sceneOf(viz.toScene()) : scene();
    return {
      circles: nodes
        .filter(n => n.type === "circle")
        .map(n => ({
          key: n.key,
          cx: n.cx,
          cy: n.cy,
          opacity: n.paint?.opacity,
        })),
      links: nodes
        .filter(n => n.type === "path" && `${n.key}`.startsWith("tree-link"))
        .map(n => ({key: n.key, d: n.d, transform: n.transform})),
      labels: nodes
        .filter(n => n.type === "text")
        .map(n => ({
          text: n.lines.map(l => l.text).join(" "),
          transform: n.transform,
          halo: !!n.halo,
          key: n.key,
        })),
    };
  };
  const settle = () =>
    new Promise(resolve =>
      requestAnimationFrame(() => setTimeout(resolve, 60)),
    );
  const ctx = {viz, summary, settle};
  const extra = steps
    ? await new Function("ctx", `return (${steps})(ctx)`)(ctx)
    : {};
  return {...summary(), ...extra, orient: viz.orient()};
};

const centerOf = circles => {
  const root = circles.find(c => c.key === "tree-Circle-World");
  return [root.cx, root.cy];
};

for (const renderer of ["svg", "canvas"]) {
  it(`RadialTree (${renderer}): root at the center, leaves on one ring, labels along spokes`, async () => {
    const drawn = await render(body, draw, {
      chart: "RadialTree",
      config: {data: rows, groupBy: ["world", "region", "id"]},
      renderer,
    });
    assert.strictEqual(drawn.orient, "radial");
    assert.strictEqual(drawn.circles.length, 16);
    const [cx, cy] = centerOf(drawn.circles);
    const leaves = drawn.circles.filter(c => / /.test(c.key));
    const dist = c => Math.hypot(c.cx - cx, c.cy - cy);
    const ring = dist(leaves[0]);
    assert.ok(ring > 100, `ring radius ${ring}`);
    assert.ok(
      leaves.every(c => Math.abs(dist(c) - ring) < 1e-6),
      "every leaf on one ring",
    );
    const branches = drawn.circles.filter(c =>
      ["North", "South", "East"].some(r => c.key === `tree-Circle-${r}`),
    );
    assert.ok(branches.every(c => dist(c) > 0 && dist(c) < ring));
    // Links curve (a cubic) and start at their child's outline.
    assert.strictEqual(drawn.links.length, 15);
    assert.ok(drawn.links.every(l => /C/.test(l.d)));
    // Every node is labelled; leaves turn along their spokes, past the ring.
    const texts = drawn.labels.map(l => l.text).sort();
    assert.ok(
      texts.includes("World") && texts.includes("North one"),
      texts.join(),
    );
    const leafLabels = drawn.labels.filter(l => / /.test(l.text));
    assert.ok(leafLabels.length >= 10, `${leafLabels.length} leaf labels`);
    assert.ok(
      leafLabels.some(l => l.transform?.rotate),
      "leaf labels are rotated",
    );
    assert.ok(
      leafLabels.every(l => !l.halo),
      "no halo past the circle",
    );
    const branchLabel = drawn.labels.find(l => l.text === "North");
    assert.ok(branchLabel && branchLabel.halo, "a branch label over a halo");
  });

  it(`RadialTree (${renderer}): hover dims the rest, keyboard focus reads the node`, async () => {
    const drawn = await render(body, draw, {
      chart: "RadialTree",
      config: {data: rows, groupBy: ["world", "region", "id"]},
      renderer,
      steps: `async ({viz, summary, settle}) => {
        viz.hover(d => d.region === "North");
        await settle();
        const hovered = summary(true).circles;
        viz.hover(false);
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        host.focus();
        await settle();
        const live = host.querySelector("[aria-live]").textContent;
        return {hovered, live};
      }`,
    });
    const north = drawn.hovered.find(c => c.key === "tree-Circle-North one");
    const south = drawn.hovered.find(c => c.key === "tree-Circle-South one");
    assert.ok((north.opacity ?? 1) > (south.opacity ?? 1), "the rest dims");
    assert.ok(drawn.live.length > 0, `announced: ${drawn.live}`);
  });

  it(`RadialTree (${renderer}): clicking a node at depth(0) drills into it, centered`, async () => {
    const drawn = await render(body, draw, {
      chart: "RadialTree",
      config: {data: rows, depth: 0, groupBy: ["region", "id"]},
      renderer,
      steps: `async ({viz, summary}) => {
        const before = summary().circles.length;
        const nodes = [];
        const walk = l => l.forEach(n => { nodes.push(n); if (n.children) walk(n.children); });
        walk(viz._chartScene);
        const north = nodes.find(n => n.key === "tree-Circle-North");
        await new Promise(resolve => {
          viz.schema.on["click.shape"].call(viz, north.datum, 0, north.datum, new MouseEvent("click"));
          setTimeout(resolve, 300);
        });
        return {before, after: summary().circles};
      }`,
    });
    assert.strictEqual(drawn.before, 3, "depth(0) draws the regions");
    const keys = drawn.after.map(c => c.key).sort();
    assert.deepStrictEqual(keys, [
      "tree-Circle-North",
      "tree-Circle-North four",
      "tree-Circle-North one",
      "tree-Circle-North three",
      "tree-Circle-North two",
    ]);
    const root = drawn.after.find(c => c.key === "tree-Circle-North");
    assert.ok(Math.abs(root.cx - 300) < 1 && root.cy > 150 && root.cy < 350);
  });

  it(`Tree (${renderer}): orient("radial") and nodeHeight, then back to vertical`, async () => {
    const heights = {World: 4, North: 1, South: 3, East: 2};
    const drawn = await render(body, draw, {
      chart: "Tree",
      config: {
        data: rows,
        groupBy: ["world", "region", "id"],
        orient: "radial",
        nodeHeight: undefined,
      },
      renderer,
      steps: `async ({viz, summary}) => {
        await new Promise(r => viz.config({nodeHeight: (d, i, n) => (${JSON.stringify(heights)})[n.id]}).render(r));
        const dendrogram = summary().circles;
        await new Promise(r => viz.orient("vertical").render(r));
        return {dendrogram, vertical: summary()};
      }`,
    });
    const [cx, cy] = centerOf(drawn.dendrogram);
    const dist = key => {
      const c = drawn.dendrogram.find(n => n.key === `tree-Circle-${key}`);
      return Math.hypot(c.cx - cx, c.cy - cy);
    };
    const ring = dist("North one");
    assert.ok(Math.abs(dist("South four") - ring) < 1e-6, "leaves line up");
    assert.ok(Math.abs(dist("North") / ring - 0.75) < 1e-6, "North by height");
    assert.ok(Math.abs(dist("South") / ring - 0.25) < 1e-6, "South by height");
    // Back to vertical: the leaves share one row, under the root.
    const v = drawn.vertical.circles;
    const leafY = v.filter(c => / /.test(c.key)).map(c => c.cy);
    assert.ok(leafY.every(y => Math.abs(y - leafY[0]) < 1e-6));
    assert.ok(v.find(c => c.key === "tree-Circle-World").cy < leafY[0]);
    assert.ok(
      drawn.vertical.labels.every(l => !l.transform?.rotate),
      "no rotated labels",
    );
  });
}
