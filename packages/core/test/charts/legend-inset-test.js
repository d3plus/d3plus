import assert from "assert";

import {closeBrowser, render} from "../playwright.js";

/**
    Legends drawn inside a chart's negative space (#72): after layout, the
    first of the size legend / legend / colorScale that fits in the open
    space around the marks is drawn there over a translucent box, claiming
    no margin; the rest keep their margins.
*/

after(async () => {
  await closeBrowser();
});

/** Renders the chart `builderSrc` returns and reports its inset placement against its marks. */
const probe = (builderSrc, {width = 800, height = 500} = {}) =>
  render(`<div id="viz" style="width:${width}px;height:${height}px"></div>`, src =>
    new Promise((resolve, reject) => {
      const lib = window.d3plus;
      const viz = new Function("lib", `return (${src})(lib);`)(lib).duration(0).select("#viz");
      viz.render(() => {
        try {
          const nodes = [];
          const walk = (n, path) => {
            nodes.push({n, path});
            (n.children || []).forEach(c => walk(c, path.concat(n.key)));
          };
          walk(viz.toScene().root, []);
          const background = nodes.find(({n}) => n.key === "viz-inset-background");
          const marks = viz._chartScene ? lib.markBoxes(viz._chartScene, viz._chartTransform) : [];
          resolve({
            placement: viz._insetPlacement || null,
            margin: viz._margin,
            background: background ? {...background.n, path: background.path} : null,
            marks,
            legendData: (viz._legendClass._data || []).length,
            sizeBox: viz._bottomRightBox ? {inset: !!viz._bottomRightBox.inset} : null,
          });
        } catch (e) {
          reject(e);
        }
      });
    }), builderSrc);

const overlaps = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// Three color groups in the top half and bottom-left: the bottom-right is open.
const scatter = (extra = "") => `lib => new lib.Plot()
  .data([
    {id: "a", x: 1, y: 9, value: 10}, {id: "a", x: 2, y: 10, value: 20},
    {id: "b", x: 9, y: 9, value: 15}, {id: "b", x: 10, y: 10, value: 40},
    {id: "c", x: 1, y: 1, value: 30}, {id: "c", x: 2, y: 2, value: 25},
  ].map((d, i) => ({...d, key: i})))
  .groupBy(["id", "key"]).x("x").y("y")${extra}`;

it("Plot draws the legend in an empty quadrant and claims no margin for it", async () => {
  const r = await probe(scatter());
  assert.ok(r.placement, "placed inside the plot");
  assert.strictEqual(r.placement.key, "legend");
  assert.ok(r.background, "draws a background box");
  assert.ok(r.background.path.includes("viz-legend"), "box sits in the legend group");
  assert.ok(r.background.paint.fillOpacity < 1, "box is translucent");
  for (const m of r.marks) assert.ok(!overlaps(r.placement, m), "clear of every mark");
  assert.ok(r.margin.right < 60, `no right legend margin (${r.margin.right})`);
  assert.ok(r.placement.x > 400 && r.placement.y > 250, "in the bottom-right quadrant");
});

it("legendInset(false) keeps the legend in its margin", async () => {
  const on = await probe(scatter());
  const off = await probe(scatter(".legendInset(false)"));
  assert.strictEqual(off.placement, null);
  assert.strictEqual(off.background, null);
  assert.ok(off.margin.right > on.margin.right, "the legend claims its margin again");
});

it("an explicit legendPosition is honored", async () => {
  const r = await probe(scatter(`.legendPosition("bottom")`));
  assert.strictEqual(r.placement, null);
});

it("the size legend is tried first; the legend falls back to its margin", async () => {
  const r = await probe(scatter(`.size("value")`));
  assert.ok(r.placement, "placed");
  assert.strictEqual(r.placement.key, "sizeLegend");
  assert.ok(r.sizeBox && r.sizeBox.inset, "size legend panel drawn inset");
  assert.ok(r.background.path.includes("viz-bottomRight"), "box sits in the size legend panel");
  for (const m of r.marks) assert.ok(!overlaps(r.placement, m), "clear of every mark");
});

it("never uses the space enclosed by the marks", async () => {
  const ring = `lib => new lib.Plot()
    .data(Array.from({length: 24}, (_, i) => ({
      id: i % 3 ? "a" : "b", key: i,
      x: Math.cos(i / 24 * Math.PI * 2), y: Math.sin(i / 24 * Math.PI * 2),
    })))
    .groupBy(["id", "key"]).x("x").y("y")`;
  const r = await probe(ring);
  if (r.placement) {
    const xs = r.marks.map(m => m.x + m.width / 2), ys = r.marks.map(m => m.y + m.height / 2);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const center = {x: cx - 5, y: cy - 5, width: 10, height: 10};
    assert.ok(!overlaps(r.placement, center), "not in the hole in the middle");
  }
});

it("charts without negative space keep their margins (BarChart, Treemap)", async () => {
  const bars = await probe(`lib => new lib.BarChart()
    .data([{id: "a", x: "a", y: 10}, {id: "b", x: "b", y: 9}, {id: "c", x: "c", y: 10}])
    .x("x").y("y")`);
  assert.strictEqual(bars.placement, null);
  const tree = await probe(`lib => new lib.Treemap()
    .data([{id: "a", value: 10}, {id: "b", value: 9}, {id: "c", value: 10}])
    .sum("value")`);
  assert.strictEqual(tree.placement, null);
});

it("Network draws the legend in a corner around a clustered layout", async () => {
  const r = await probe(`lib => new lib.Network()
    .data([{id: "a", group: "x"}, {id: "b", group: "y"}, {id: "c", group: "z"}, {id: "d", group: "x"}])
    .nodes([{id: "a", x: 0, y: 0}, {id: "b", x: 1, y: 0}, {id: "c", x: 0, y: 1}, {id: "d", x: 1, y: 1}])
    .links([{source: "a", target: "b"}, {source: "b", target: "d"}, {source: "c", target: "d"}])
    .groupBy("group")`);
  if (r.placement) for (const m of r.marks) assert.ok(!overlaps(r.placement, m), "clear of every node");
});

it("clicking a swatch in an inset legend still hides its group", async () => {
  const r = await render(`<div id="viz" style="width:800px;height:500px"></div>`, src =>
    new Promise((resolve, reject) => {
      const lib = window.d3plus;
      const viz = new Function("lib", `return (${src})(lib);`)(lib).duration(0).select("#viz");
      viz.render(() => {
        try {
          const p = viz._insetPlacement;
          const {margin} = lib.insetStyle(viz);
          // The first swatch sits just inside the box's top-left content corner.
          const rect = document.querySelector("#viz svg").getBoundingClientRect();
          const target = document.elementFromPoint(rect.left + p.x + margin + 8, rect.top + p.y + margin + 8);
          target.dispatchEvent(new MouseEvent("click", {bubbles: true}));
          window.setTimeout(() => resolve({key: p.key, hidden: viz._hidden.slice()}), 300);
        } catch (e) {
          reject(e);
        }
      });
    }), scatter());
  assert.strictEqual(r.key, "legend");
  assert.deepStrictEqual(r.hidden, [0, 1], "the first swatch hides group a (keys 0 and 1)");
});
