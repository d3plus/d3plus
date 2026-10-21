import {it} from "vitest";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";
import {overlaps} from "~test/helpers.js";

/**
    Legends drawn inside a chart's negative space (#72): after layout, the
    first of the size legend / legend / colorScale that fits in the open
    space around the marks is drawn there over a translucent box, claiming
    no margin; the rest keep their margins.
*/

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
            legend: viz._legendClass.outerBounds(),
            sizeBox: viz._bottomRightBox ? {inset: !!viz._bottomRightBox.inset} : null,
          });
        } catch (e) {
          reject(e);
        }
      });
    }), builderSrc);

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

it("legendPosition(\"auto\") places the legend inside the chart, like the default", async () => {
  const def = await probe(scatter());
  const auto = await probe(scatter(`.legendPosition("auto")`));
  assert.ok(auto.placement, "placed inside the plot");
  assert.strictEqual(auto.placement.key, "legend");
  assert.deepStrictEqual(auto.placement, def.placement);
  assert.deepStrictEqual(auto.margin, def.margin);
});

it("an explicit side keeps the legend in that margin, never inside the chart", async () => {
  // The legend's box hugs the side it was given, in an 800×500 chart.
  const hugs = {
    top: b => b.y < 50,
    right: b => b.x > 700,
    bottom: b => b.y > 450,
    left: b => b.x + b.width < 100,
  };
  for (const side of ["top", "right", "bottom", "left"]) {
    const r = await probe(scatter(`.legendPosition("${side}")`));
    assert.strictEqual(r.placement, null, `${side}: not inset`);
    assert.strictEqual(r.background, null, `${side}: no inset box`);
    assert.strictEqual(r.legendData, 3, `${side}: shown`);
    assert.ok(hugs[side](r.legend), `${side}: drawn on that side (${JSON.stringify(r.legend)})`);
  }
  const hidden = await probe(scatter(".legendPosition(false)"));
  assert.strictEqual(hidden.placement, null, "false: not inset");
  assert.strictEqual(hidden.legendData, 0, "false: hidden");
});

it("an \"auto\" legend that isn't inset goes right on wide charts and bottom on others", async () => {
  for (const extra of ["", `.legendPosition("auto")`]) {
    const src = scatter(`.legendInset(false)${extra}`);
    const wide = await probe(src, {width: 800, height: 500});
    assert.ok(wide.margin.right > wide.margin.bottom, `wide${extra}: right (${JSON.stringify(wide.margin)})`);
    const tall = await probe(src, {width: 500, height: 700});
    assert.ok(tall.margin.bottom > tall.margin.right, `tall${extra}: bottom (${JSON.stringify(tall.margin)})`);
  }
  // A chart with no room inside (Treemap) resolves "auto" the same way.
  const tree = `lib => new lib.Treemap()
    .data([{g: "x", id: "a", value: 10}, {g: "y", id: "b", value: 9}, {g: "z", id: "c", value: 10}, {g: "x", id: "d", value: 5}])
    .groupBy(["g", "id"]).sum("value").legendPosition("auto")`;
  const wideTree = await probe(tree, {width: 800, height: 500});
  assert.strictEqual(wideTree.placement, null);
  assert.ok(wideTree.margin.right > wideTree.margin.bottom, "wide Treemap: right");
  const tallTree = await probe(tree, {width: 500, height: 700});
  assert.ok(tallTree.margin.bottom > tallTree.margin.right, "tall Treemap: bottom");
});

it("colorScalePosition(\"auto\") may be inset, and an explicit side never is", async () => {
  const colored = extra => `lib => new lib.Plot()
    .data([
      {id: "a", x: 1, y: 9, value: 10}, {id: "b", x: 2, y: 10, value: 20},
      {id: "c", x: 9, y: 9, value: 15}, {id: "d", x: 10, y: 10, value: 40},
      {id: "e", x: 1, y: 1, value: 30}, {id: "f", x: 2, y: 2, value: 25},
    ])
    .groupBy("id").x("x").y("y").colorScale("value")${extra}`;
  const def = await probe(colored(""));
  const auto = await probe(colored(`.colorScalePosition("auto")`));
  assert.ok(def.placement, "the default colorScale is placed inside the plot");
  assert.strictEqual(def.placement.key, "colorScale");
  assert.deepStrictEqual(auto.placement, def.placement);
  const right = await probe(colored(`.colorScalePosition("right")`));
  assert.strictEqual(right.placement, null);
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
          window.setTimeout(() => resolve({
            key: p.key,
            hidden: viz._hidden.slice(),
            drawn: [...new Set(viz._filteredData.map(d => d.id))].sort(),
          }), 300);
        } catch (e) {
          reject(e);
        }
      });
    }), scatter());
  assert.strictEqual(r.key, "legend");
  assert.deepStrictEqual(r.hidden, ["0", "1"], "the first swatch hides group a (keys 0 and 1)");
  assert.deepStrictEqual(r.drawn, ["b", "c"], "group a's points are gone");
});
