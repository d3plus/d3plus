import {it} from "vitest";
import {CanvasRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

it("shapeConfig.texture paints patterns on Plot and data-driven charts", {timeout: 120000}, async function () {
  const out = await render(
    '<div id="s" style="width:500px;height:400px;"></div>',
    async charts => {
      const data = [
        {id: "a", x: 1, y: 5},
        {id: "a", x: 2, y: 6},
        {id: "b", x: 1, y: 3},
        {id: "b", x: 2, y: 4},
      ];
      const results = {};
      for (const name of charts) {
        document.querySelector("#s").innerHTML = "";
        const viz = new window.d3plus[name]().select("#s").duration(0).config({
          data,
          groupBy: "id",
          x: "x",
          y: "y",
          sum: "y",
          shapeConfig: {texture: "lines"},
        });
        await new Promise(resolve => viz.render(resolve));
        const patterns = [...document.querySelectorAll("#s pattern")];
        results[name] = {
          patterns: patterns.length,
          strokes: patterns.flatMap(p =>
            [...p.querySelectorAll("[stroke]")].map(e => e.getAttribute("stroke")),
          ),
          patternFills: [...document.querySelectorAll("#s svg [fill^='url(']")].length,
        };
      }
      return results;
    },
    ["BarChart", "AreaPlot", "Pie", "Treemap", "Pack"],
  );

  for (const [name, r] of Object.entries(out)) {
    assert.ok(r.patterns > 0, `${name}: defines texture patterns`);
    assert.ok(r.patternFills > 0, `${name}: shapes fill with a pattern`);
    for (const s of r.strokes)
      assert.ok(!s.includes("object"), `${name}: pattern stroke "${s}" is a color`);
  }
});

it("a per-shape texture (shapeConfig[ShapeKey].texture) paints every data-driven emit", {timeout: 120000}, async function () {
  const out = await render(
    '<div id="s" style="width:500px;height:400px;"></div>',
    async () => {
      const flat = [{id: "a", value: 5}, {id: "b", value: 3}];
      const grid = [
        {row: "r1", column: "c1", id: "a", value: 1},
        {row: "r1", column: "c2", id: "b", value: 2},
        {row: "r2", column: "c1", id: "c", value: 3},
      ];
      const cases = {
        Pie: ["Path", {data: flat}],
        Treemap: ["Rect", {data: flat, sum: "value"}],
        Pack: ["Circle", {data: flat, sum: "value"}],
        Matrix: ["Rect", {data: grid, row: "row", column: "column"}],
        RadialMatrix: ["Path", {data: grid, row: "row", column: "column"}],
        Priestley: ["Rect", {data: [{id: "a", start: 2000, end: 2005}, {id: "b", start: 2002, end: 2008}], start: "start", end: "end"}],
      };
      const results = {};
      for (const [name, [shape, cfg]] of Object.entries(cases)) {
        document.querySelector("#s").innerHTML = "";
        const viz = new window.d3plus[name]()
          .select("#s")
          .duration(0)
          .config({...cfg, shapeConfig: {[shape]: {texture: "lines"}}});
        await new Promise(resolve => viz.render(resolve));
        results[name] = document.querySelectorAll("#s svg [fill^='url(']").length;
      }
      return results;
    },
  );

  for (const [name, count] of Object.entries(out))
    assert.ok(count > 0, `${name}: per-shape texture fills shapes with a pattern`);
});

it("a texture fills nodes but leaves links and lines unfilled", {timeout: 120000}, async function () {
  const out = await render(
    '<div id="s" style="width:500px;height:400px;"></div>',
    async () => {
      const nodes = [{id: "a"}, {id: "b"}, {id: "c"}];
      const links = [{source: "a", target: "b"}, {source: "a", target: "c"}];
      const cases = {
        Network: {nodes, links},
        Rings: {links, center: "a"},
        Tree: {data: [{p: "x", id: "a"}, {p: "x", id: "b"}, {p: "y", id: "c"}], groupBy: ["p", "id"]},
        LinePlot: {data: [{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 3}], groupBy: "id", x: "x", y: "y"},
      };
      const results = {};
      for (const [name, cfg] of Object.entries(cases)) {
        document.querySelector("#s").innerHTML = "";
        const viz = new window.d3plus[name]()
          .select("#s")
          .duration(0)
          .config({...cfg, shapeConfig: {texture: "lines"}});
        await new Promise(resolve => viz.render(resolve));
        results[name] = {
          patternPaths: [...document.querySelectorAll("#s svg path[fill^='url(']")].length,
          patternNodes: [...document.querySelectorAll("#s svg circle[fill^='url('], #s svg rect[fill^='url(']")].length,
        };
      }
      return results;
    },
  );

  for (const name of ["Network", "Rings", "Tree", "LinePlot"])
    assert.strictEqual(out[name].patternPaths, 0, `${name}: link/line paths stay unfilled`);
  for (const name of ["Network", "Rings", "Tree"])
    assert.ok(out[name].patternNodes > 0, `${name}: nodes are textured`);
});

it("CanvasRenderer paints a real texture pattern, not the solid fallback", async () => {
  const res = await render('<div id="B"></div>', async () => {
    const B = document.getElementById("B");
    const r = new CanvasRenderer();
    r.mount({container: B, width: 100, height: 100, pixelRatio: 1});
    // A high-contrast lines texture: red background (== the solid fallback the
    // first frame paints) with thick blue diagonal lines. Blue pixels can only
    // appear once the SVG tile rasterizes into a real CanvasPattern.
    const token =
      "pattern:" +
      JSON.stringify({texture: "lines", background: "#ff0000", stroke: "#0000ff", strokeWidth: 4, size: 10});
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [{type: "rect", key: "a", x: 0, y: 0, width: 100, height: 100, paint: {fill: token}}],
      },
    });
    const canvas = B.querySelector("canvas.d3plus-render-canvas");
    const ctx = canvas.getContext("2d");
    const sample = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0, blue = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 150 && data[i + 2] < 100) red++;
        if (data[i + 2] > 150 && data[i] < 100) blue++;
      }
      return {red, blue};
    };
    // Poll until the async tile rasterizes and the renderer repaints (≤ ~1s).
    for (let k = 0; k < 40; k++) {
      const s = sample();
      if (s.blue > 0 && s.red > 0) return s;
      await new Promise(done => window.setTimeout(done, 25));
    }
    return sample();
  });
  assert.ok(res.red > 0, "tile background (red) painted");
  assert.ok(res.blue > 0, "tile stroke lines (blue) painted — a real CanvasPattern tiled, not the solid fallback");
});
