import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

it("shapeConfig.texture paints patterns on Plot and data-driven charts", async function () {
  this.timeout(120000);

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

it("a per-shape texture (shapeConfig[ShapeKey].texture) paints every data-driven emit", async function () {
  this.timeout(120000);

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

it("a texture fills nodes but leaves links and lines unfilled", async function () {
  this.timeout(120000);

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
