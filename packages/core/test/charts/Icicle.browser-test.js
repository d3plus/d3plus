import assert from "assert";
import {colorLighter} from "@d3plus/color";
import {render, closeBrowser} from "../playwright.js";

// The Viz render pipeline awaits browser layout that never resolves under
// jsdom, so the chart is rendered in a headless browser instead.
after(async () => {
  await closeBrowser();
});

const data = [
  {area: "Frontend", module: "Components", file: "Button", size: 120},
  {area: "Frontend", module: "Components", file: "Table", size: 410},
  {area: "Frontend", module: "Pages", file: "Dashboard", size: 520},
  {area: "Frontend", module: "Pages", file: "Settings", size: 180},
  {area: "Backend", module: "API", file: "Users", size: 330},
  {area: "Backend", module: "API", file: "Orders", size: 460},
  {area: "Backend", module: "Database", file: "Models", size: 290},
  {area: "Backend", module: "Jobs", file: "Email", size: 20},
  {area: "Docs", module: "Guides", file: "Theming", size: 40},
  {area: "Docs", module: "Reference", file: "API Reference", size: 260},
];

/** In-page helpers shared by every test: build + render an Icicle, and route a scene event at a node. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.Icicle()
      .select("#viz")
      .data(window.DATA.map(d => ({...d})))
      .groupBy(opts.groupBy || ["area", "module", "file"])
      .sum("size")
      .duration(0)
      .width(500).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.rects = chart => chart._chartScene.filter(n => n.type === "rect" && n.key && n.key.startsWith("icicle-") && n.datum);
  window.rectFor = (chart, path) => window.rects(chart).find(n => n.key === "icicle-" + JSON.stringify(path));
  window.route = (chart, type, node) => chart._routeSceneEvent({
    type,
    point: [1, 1],
    pick: {node, datum: node.datum, index: node.index},
    nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
  });
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.box = n => ({x: n.x, y: n.y, width: n.width, height: n.height});
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:500px;height:400px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

it("Icicle: draws one rect per node, one band per level from the left edge", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({groupBy: ["area", "module"]});
    const rects = window.rects(chart);
    return {
      svgRects: document.querySelectorAll(
        "#viz svg.d3plus-render-svg rect[data-key^='icicle-']",
      ).length,
      count: rects.length,
      bands: [...new Set(rects.map(n => Math.round(n.x)))].sort((a, b) => a - b),
      widths: [...new Set(rects.map(n => Math.round(n.width)))],
      frontend: window.box(window.rectFor(chart, ["Frontend"])),
      pages: window.box(window.rectFor(chart, ["Frontend", "Pages"])),
    };
  });
  assert.strictEqual(out.count, 3 + 7, "3 areas + 7 modules");
  assert.strictEqual(out.svgRects, out.count, "every rect reached the SVG");
  assert.strictEqual(out.bands.length, 2);
  assert.strictEqual(out.bands[0], 0, "the first level starts at the root edge");
  assert.strictEqual(out.widths.length, 1, "every band is equally deep");
  assert.strictEqual(out.pages.x, out.frontend.x + out.frontend.width);
  assert.ok(
    out.pages.y >= out.frontend.y - 1e-6 &&
      out.pages.y + out.pages.height <= out.frontend.y + out.frontend.height + 1e-6,
    "a child stays within its parent's breadth",
  );
});

it("Icicle: orient vertical runs the levels top-down", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({config: {orient: "vertical"}});
    const rects = window.rects(chart);
    return {
      tops: [...new Set(rects.map(n => Math.round(n.y)))].length,
      first: rects.filter(n => n.key.split(",").length === 1).map(n => n.y),
      fullWidth: rects
        .filter(n => n.key.split(",").length === 1)
        .reduce((acc, n) => acc + n.width, 0),
    };
  });
  assert.strictEqual(out.tops, 3);
  assert.ok(out.first.every(y => y === 0), "the first level sits on top");
  assert.ok(out.fullWidth > 400, "the first level spans the width");
});

it("Icicle: shades each level a step lighter; shade(false) and custom colors draw as given", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const fills = async config => {
      const chart = await window.build({config});
      return ["Frontend", "Frontend|Pages", "Frontend|Pages|Settings"].map(
        p => window.rectFor(chart, p.split("|")).paint.fill,
      );
    };
    return {
      shaded: await fills({}),
      off: await fills({shade: false}),
      color: await fills({color: () => "#2f9e44"}),
      rectFill: await fills({shapeConfig: {Rect: {fill: "#ae3ec9"}}}),
      weak: await fills({shadeConfig: {step: 0.1}}),
    };
  });
  assert.strictEqual(out.shaded[1], colorLighter(out.shaded[0], 0.22));
  assert.strictEqual(out.shaded[2], colorLighter(out.shaded[0], 0.44));
  assert.strictEqual(new Set(out.off).size, 1, "shade(false)");
  assert.deepStrictEqual(out.color, ["#2f9e44", "#2f9e44", "#2f9e44"]);
  assert.deepStrictEqual(out.rectFill, ["#ae3ec9", "#ae3ec9", "#ae3ec9"]);
  assert.strictEqual(out.weak[2], colorLighter(out.weak[0], 0.2));
});

it("Icicle: labels sit inside their rects, upright or turned up narrow ones, in whole words", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const collect = chart =>
      chart._chartScene
        .filter(n => n.type === "text")
        .map(n => {
          const rect = window
            .rects(chart)
            .find(r => n.key && n.key.startsWith(r.key + "_"));
          const t = n.transform || {};
          return {
            rect: rect ? window.box(rect) : null,
            x: t.x ?? n.x,
            y: t.y ?? n.y,
            rotate: t.rotate || 0,
            lines: (n.lines || []).map(l => l.text ?? ""),
          };
        });
    const horizontal = collect(await window.build());
    const vertical = collect(await window.build({config: {orient: "vertical"}}));
    return {horizontal, vertical};
  });
  const words = new Set(
    data.flatMap(d => [d.area, d.module, d.file]).flatMap(t => t.split(" ")),
  );
  for (const labels of [out.horizontal, out.vertical]) {
    assert.ok(labels.length > 5, "labels drawn");
    for (const l of labels) {
      assert.ok(l.rect, "every label pairs with its rect");
      assert.ok([0, -90].includes(l.rotate), `rotate ${l.rotate}`);
      for (const line of l.lines)
        for (const w of line.split(/\s+/).filter(Boolean))
          assert.ok(words.has(w) || w.endsWith("..."), `whole word: ${w}`);
    }
  }
  assert.ok(out.vertical.some(l => l.rotate === -90), "narrow columns turn their labels");
});

it("Icicle: a click zooms into a node (it fills the root band) and the root band zooms back out", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({config: {duration: 0}});
    window.route(chart, "click", window.rectFor(chart, ["Backend"]));
    await window.wait(150);
    const zoomed = window.rects(chart);
    const root = window.rectFor(chart, ["Backend"]);
    const result = {
      history: chart._history.length,
      root: window.box(root),
      area: chart.ctx.icicleHeight,
      drawn: zoomed.map(n => n.key),
    };
    window.route(chart, "click", root);
    await window.wait(150);
    result.after = chart._history.length;
    result.returning = window
      .rects(chart)
      .filter(n => n.enterRect)
      .map(n => n.key);
    return result;
  });
  assert.strictEqual(out.history, 1);
  assert.deepStrictEqual(
    [out.root.x, out.root.y, out.root.height],
    [0, 0, out.area],
    "the focus fills the root band's full breadth",
  );
  assert.ok(out.drawn.every(k => k.includes("Backend")), "only Backend's subtree");
  assert.strictEqual(out.after, 0);
  assert.ok(
    out.returning.some(k => k.includes("Frontend")),
    "returning rects grow in from the zoomed view",
  );
});

it("Icicle: renders and zooms on the canvas renderer", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({renderer: "canvas"});
    const canvas = document.querySelector("#viz canvas");
    const count = window.rects(chart).length;
    window.route(chart, "click", window.rectFor(chart, ["Frontend"]));
    await window.wait(150);
    return {canvas: Boolean(canvas), count, history: chart._history.length};
  });
  assert.ok(out.canvas);
  assert.strictEqual(out.count, 3 + 7 + 10);
  assert.strictEqual(out.history, 1);
});

it("Icicle: draws small multiples with facet", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({
      groupBy: ["module", "file"],
      config: {facet: "area"},
    });
    const all = [];
    const walk = nodes =>
      nodes.forEach(n => {
        if (n.type === "rect" && n.datum && /icicle-/.test(n.key)) all.push(n.key);
        if (n.children) walk(n.children);
      });
    walk(chart._chartScene);
    return {count: all.length, keys: all};
  });
  assert.strictEqual(out.count, 7 + 10, "every module and file across the panels");
});

it("Icicle: shapeConfig texture and backgroundImage reach every rect and legend swatch, on SVG and Canvas", async function () {
  this.timeout(60000);
  for (const renderer of ["svg", "canvas"]) {
    const out = await page(async r => {
      const image = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%2F%3E";
      const chart = await window.build({
        renderer: r,
        config: {shapeConfig: {texture: "lines", backgroundImage: image}},
      });
      const leaves = [];
      const walk = (n, anc) =>
        n.type === "group"
          ? (n.children || []).forEach(c => walk(c, `${anc}>${n.key || ""}`))
          : leaves.push({...n, anc});
      walk(chart._lastSceneRendered.root, "");
      const images = new Set(leaves.filter(n => n.type === "image").map(n => n.key));
      const mark = n => ({
        key: n.key,
        textured: String(n.paint.fill).startsWith("pattern:"),
        image: images.has(`${n.key}-bgimage-img`),
      });
      const rects = leaves.filter(n => n.type === "rect" && n.datum && /^icicle-/.test(n.key));
      const swatches = leaves.filter(n =>
        ["rect", "circle", "path"].includes(n.type) && n.datum && n.anc.includes("viz-legend") &&
        !String(n.key).endsWith("::hit") && n.paint && n.paint.fill && n.paint.fill !== "none");
      const svg = document.querySelector("#viz svg");
      return {
        rects: rects.map(mark),
        swatches: swatches.map(mark),
        dom: svg ? {patterns: svg.querySelectorAll("[fill^='url(#']").length, images: svg.querySelectorAll("image").length} : null,
      };
    }, renderer);
    assert.strictEqual(out.rects.length, 3 + 7 + 10, `${renderer}: every node`);
    assert.deepStrictEqual(out.rects.filter(m => !m.textured || !m.image), [], `${renderer}: every rect takes both`);
    assert.strictEqual(out.swatches.length, 3, `${renderer}: one swatch per area`);
    assert.deepStrictEqual(out.swatches.filter(m => !m.textured || !m.image), [], `${renderer}: every swatch takes both`);
    if (renderer === "svg") {
      assert.ok(out.dom.patterns >= 23, `the DOM fills ${out.dom.patterns} shapes with patterns`);
      assert.ok(out.dom.images >= 23, `the DOM draws ${out.dom.images} images`);
    }
  }
});
