import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(closeBrowser);

/**
    `shapeConfig.backgroundImage` draws inside every chart's shapes, on SVG and
    Canvas: each image is clipped to its shape, paints over the shape's fill and
    under its label, and leaves hover + tooltips on the shape beneath it.

    Each datum gets a solid-color SVG data-URI image (no network), so a pixel
    tells which shape's image painted there. Probe points come from the SVG
    render: points well inside a shape's fill (where that shape is the topmost
    element) must show its image color, and points inside the shape's bounding
    box but outside its outline must not. The same points are then read from
    the Canvas render.
*/

/** Builds every case inside the page (accessors can't cross into it). */
const pageCases = () => {
  const colors = ["#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#8000ff", "#ff0080", "#80ff00", "#0080ff"];
  const images = colors.map(c => `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="${c}"/></svg>`,
  )}`);
  const ids = {};
  const image = d => {
    const id = String(d.id);
    if (!(id in ids)) ids[id] = Object.keys(ids).length % images.length;
    return images[ids[id]];
  };
  const flat = [{id: "alpha", value: 29}, {id: "beta", value: 18}, {id: "gamma", value: 12}];
  const grid = [
    {row: "r1", column: "c1", id: "a", value: 1},
    {row: "r1", column: "c2", id: "b", value: 2},
    {row: "r2", column: "c1", id: "c", value: 3},
    {row: "r2", column: "c2", id: "d", value: 4},
  ];
  const nodes = [
    {id: "alpha", x: 1, y: 1}, {id: "beta", x: 3, y: 1}, {id: "gamma", x: 2, y: 3},
  ];
  const links = [{source: "alpha", target: "beta"}, {source: "beta", target: "gamma"}];
  const radar = ["alpha", "beta"].flatMap((id, g) =>
    ["Speed", "Power", "Range", "Comfort", "Safety"].map((metric, m) => ({id, metric, value: 40 + ((m * 13 + g * 31) % 50)})));
  const topojson = {
    type: "Topology",
    objects: {c: {type: "GeometryCollection", geometries: [{type: "Polygon", arcs: [[0]], id: "x"}]}},
    arcs: [[[-10, 40], [10, 40], [10, 60], [-10, 60], [-10, 40]]],
  };
  return {
    images,
    cases: {
      Treemap: {data: flat, groupBy: "id", sum: "value", shapeConfig: {backgroundImage: image}},
      Pack: {data: flat.map(d => ({...d, parent: "root"})), groupBy: ["parent", "id"], sum: "value", shapeConfig: {Circle: {backgroundImage: image}}},
      Pie: {data: flat, groupBy: "id", value: "value", shapeConfig: {backgroundImage: image}},
      Donut: {data: flat, groupBy: "id", value: "value", shapeConfig: {Path: {backgroundImage: image}}},
      Network: {nodes, links, shapeConfig: {backgroundImage: image, labelConfig: {fontMin: 8}}, size: () => 10, sizeMin: 40, sizeMax: 40},
      Matrix: {data: grid, row: "row", column: "column", shapeConfig: {Rect: {backgroundImage: image}}},
      RadialMatrix: {data: grid, row: "row", column: "column", shapeConfig: {backgroundImage: image}},
      Radar: {data: radar, groupBy: "id", metric: "metric", value: "value", shapeConfig: {backgroundImage: image}},
      BarChart: {data: flat, groupBy: "id", x: "id", y: "value", shapeConfig: {backgroundImage: image}},
      Plot: {data: flat.map((d, i) => ({...d, x: i, y: d.value})), groupBy: "id", x: "x", y: "y", size: "value", sizeMin: 30, sizeMax: 50, shapeConfig: {backgroundImage: image}},
      Priestley: {data: [{id: "a", start: 2000, end: 2005}, {id: "b", start: 2002, end: 2008}], start: "start", end: "end", shapeConfig: {backgroundImage: image}},
      Sankey: {links: [{source: "alpha", target: "beta", value: 5}, {source: "alpha", target: "gamma", value: 3}], shapeConfig: {Rect: {backgroundImage: image}}},
      Rings: {links, center: "beta", shapeConfig: {backgroundImage: image}},
      Tree: {data: [{p: "x", id: "a"}, {p: "x", id: "b"}, {p: "y", id: "c"}], groupBy: ["p", "id"], shapeConfig: {backgroundImage: image}},
      Chord: {links: [{source: "alpha", target: "beta", value: 5}, {source: "beta", target: "gamma", value: 3}, {source: "gamma", target: "alpha", value: 4}], shapeConfig: {backgroundImage: image}},
      Geomap: {data: [{id: "x", value: 3}], tiles: false, topojson, shapeConfig: {Path: {backgroundImage: image}}},
      Gauge: {data: [{id: "Speed", value: 72}], domain: [0, 100], indicator: "progress", shapeConfig: {backgroundImage: image}},
    },
  };
};

/**
    Renders one case on SVG and Canvas and returns the per-image findings: the
    SVG structure (clip + order around its shape and labels), pixel colors at
    inside/outside probes for both backends, and the hover behavior.
*/
const probe = async ({name, pageCasesSrc}) => {
  const {cases, images} = new Function(`return (${pageCasesSrc})();`)();
  const config = cases[name];
  const hexOf = href => /fill%3D%22(%23[0-9a-f]{6})/i.exec(href)?.[1].replace("%23", "#");
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));

  const mount = () => {
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;left:0;top:0;width:500px;height:400px;";
    document.body.appendChild(el);
    return el;
  };
  const draw = async (el, renderer) => {
    const viz = new window.d3plus[name]().select(el).config(config).renderer(renderer).duration(0);
    await new Promise(r => viz.render(r));
    if (viz._sceneRenderer && viz._sceneRenderer.whenSettled) await viz._sceneRenderer.whenSettled();
    await frame();
    return viz;
  };

  // --- SVG: structure + probe points -------------------------------------
  const svgEl = mount();
  await draw(svgEl, "svg");
  const root = svgEl.querySelector("svg.d3plus-render-svg");
  // A nested <svg> reports its content bounds, so measure the mount instead.
  const box = svgEl.getBoundingClientRect();
  const groups = [...root.querySelectorAll("g[data-key$='-bgimage']")];
  const texts = [...root.querySelectorAll("text")];
  const found = groups.map(g => {
    const key = g.getAttribute("data-key").replace(/-bgimage$/, "");
    const shape = root.querySelector(`[data-key="${CSS.escape(key)}"]:not(g)`);
    const img = g.querySelector("image");
    const href = img.getAttribute("href");
    const clipId = /url\(#([^)]+)\)/.exec(g.getAttribute("clip-path") || "")?.[1];
    const clip = clipId ? root.querySelector(`#${CSS.escape(clipId)}`) : null;
    const shapeBox = shape.getBoundingClientRect();
    // Labels drawn over this shape must come after its image in paint order.
    const overText = texts.filter(t => {
      const r = t.getBoundingClientRect();
      return r.width && r.height && r.left < shapeBox.right && r.right > shapeBox.left &&
        r.top < shapeBox.bottom && r.bottom > shapeBox.top;
    });
    const before = n => Boolean(n.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING);
    // Probe a grid over the shape's box: "in" points sit 3px clear of the
    // outline with this shape topmost; "out" points are 3px clear outside it.
    const ctm = shape.getScreenCTM();
    const inside = (x, y) => {
      const p = new DOMPoint(x, y).matrixTransform(ctm.inverse());
      return shape.isPointInFill(p);
    };
    const pts = {in: [], out: []};
    const step = Math.max(3, Math.min(shapeBox.width, shapeBox.height) / 12);
    for (let y = shapeBox.top + 1; y < shapeBox.bottom; y += step)
      for (let x = shapeBox.left + 1; x < shapeBox.right; x += step) {
        const ring = [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3], [-3, 3]];
        const states = ring.map(([dx, dy]) => inside(x + dx, y + dy));
        const pt = [x - box.left, y - box.top];
        if (states.every(Boolean)) {
          const top = ring.every(([dx, dy]) => document.elementFromPoint(x + dx, y + dy) === shape);
          if (top) pts.in.push(pt);
        }
        else if (!states.some(Boolean)) pts.out.push(pt);
      }
    return {
      key,
      shapeTag: shape.tagName,
      // Legend swatches draw the image too; the chart's own marks live here.
      inChart: Boolean(g.closest('[data-key="viz-chart-cells"]')),
      // A translucent shape (like Pack's parent circles) fades its image too.
      opaque: Number(shape.getAttribute("opacity") ?? 1) === 1,
      color: hexOf(href),
      hrefIsImage: images.includes(href),
      interactive: g.getAttribute("pointer-events") === "none" && img.getAttribute("pointer-events") === "none",
      clipTag: clip ? clip.firstElementChild?.tagName : null,
      afterShape: Boolean(shape.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING),
      overText: overText.length,
      labelsAbove: overText.every(t => !before(t)),
      pts,
    };
  });

  // Rasterize the SVG scene to read its pixels.
  const svgPixels = await new Promise((resolve, reject) => {
    const src = new XMLSerializer().serializeToString(root);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 500;
      c.height = 400;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({ctx, scale: 1});
    };
    img.onerror = () => reject(new Error("svg rasterization failed"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`;
  });
  await frame();

  // Hover the first probed shape: the shape (not its image) takes the event,
  // a tooltip opens, and other shapes' images dim with their shapes.
  const hoverAt = (target, x, y) => {
    for (const type of ["mouseover", "mouseenter", "mousemove"])
      target.dispatchEvent(new MouseEvent(type, {clientX: box.left + x, clientY: box.top + y, bubbles: true}));
  };
  const tooltip = () => {
    const t = document.querySelector(".d3plus-tooltip");
    return t && getComputedStyle(t).visibility !== "hidden" && getComputedStyle(t).display !== "none"
      ? (t.querySelector(".d3plus-tooltip-title")?.textContent ?? "")
      : null;
  };
  const hovered = found.find(f => f.pts.in.length && f.opaque);
  const hover = {};
  if (hovered) {
    const [x, y] = hovered.pts.in[0];
    const target = document.elementFromPoint(box.left + x, box.top + y);
    hover.svgTargetIsShape = target.getAttribute("data-key") === hovered.key;
    hoverAt(target, x, y);
    await frame();
    hover.svgTooltip = tooltip();
    const opacity = key => Number(root.querySelector(`[data-key="${CSS.escape(key)}"]`)?.getAttribute("opacity") ?? 1);
    hover.opacities = found.map(f => ({key: f.key, shape: opacity(f.key), image: opacity(`${f.key}-bgimage`)}));
    target.dispatchEvent(new MouseEvent("mouseleave", {bubbles: true}));
    target.dispatchEvent(new MouseEvent("mouseout", {bubbles: true}));
  }
  svgEl.remove();
  document.querySelectorAll(".d3plus-tooltip").forEach(t => t.remove());

  // --- Canvas: same probes -----------------------------------------------
  const canvasEl = mount();
  await draw(canvasEl, "canvas");
  const canvas = canvasEl.querySelector("canvas.d3plus-render-canvas");
  const cbox = canvas.getBoundingClientRect();
  const canvasPixels = {ctx: canvas.getContext("2d"), scale: canvas.width / cbox.width};
  const match = ({ctx, scale}, [x, y], hex) => {
    const [r, g, b] = ctx.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data;
    const [er, eg, eb] = rgb(hex);
    return Math.abs(r - er) < 40 && Math.abs(g - eg) < 40 && Math.abs(b - eb) < 40;
  };
  const share = (px, list, hex) => (list.length ? list.filter(p => match(px, p, hex)).length / list.length : null);
  const results = found.map(f => ({
    ...f,
    pts: undefined,
    inCount: f.pts.in.length,
    outCount: f.pts.out.length,
    svgIn: share(svgPixels, f.pts.in, f.color),
    svgOut: share(svgPixels, f.pts.out, f.color),
    canvasIn: share(canvasPixels, f.pts.in, f.color),
    canvasOut: share(canvasPixels, f.pts.out, f.color),
  }));

  if (hovered) {
    const [x, y] = hovered.pts.in[0];
    for (const type of ["mouseover", "mouseenter", "mousemove"])
      canvas.dispatchEvent(new MouseEvent(type, {clientX: cbox.left + x, clientY: cbox.top + y, bubbles: true}));
    await frame();
    hover.canvasTooltip = tooltip();
  }

  canvasEl.remove();
  return {results, hover};
};

const run = name => render("", probe, {name, pageCasesSrc: pageCases.toString()});

/** Charts whose shapes are probed pixel by pixel on both backends. */
const pixelCharts = ["Treemap", "Pack", "Pie", "Donut", "Network", "Matrix", "RadialMatrix", "Radar", "BarChart", "Plot", "Priestley", "Sankey", "Chord", "Gauge"];
/** Charts checked for image structure (their shapes are small or framed by other marks). */
const structureCharts = ["Rings", "Tree", "Geomap"];
/** Charts whose data labels sit over their shapes. */
const labelledCharts = ["Treemap", "Pack", "Pie", "Network"];
/** Charts that dim unhovered shapes. */
const dimCharts = ["Treemap", "Pack", "Pie", "Network", "Radar", "BarChart"];
/** Charts whose shapes open a tooltip on hover. */
const hoverCharts = ["Treemap", "Pack", "Pie", "Network", "Matrix", "Radar", "BarChart"];

for (const name of [...pixelCharts, ...structureCharts]) {
  it(`${name}: shapeConfig.backgroundImage draws inside its shapes on SVG and Canvas`, async function () {
    this.timeout(120000);
    const {results, hover} = await run(name);
    assert.ok(results.some(r => r.inChart), "the chart's shapes draw background images");
    for (const r of results) {
      const label = `${name} ${r.key}`;
      assert.ok(r.hrefIsImage, `${label}: image href is the datum's URL`);
      assert.ok(r.interactive, `${label}: image ignores pointer events`);
      // Rects clip to a rect; circles, arcs, and polygons to their outline path.
      assert.strictEqual(r.clipTag, r.shapeTag === "rect" ? "rect" : "path", `${label}: clipped to the shape`);
      assert.ok(r.afterShape, `${label}: image paints over its shape`);
      // Data labels paint over the image (axis and dial text sits under all marks).
      if (labelledCharts.includes(name)) assert.ok(r.labelsAbove, `${label}: labels paint over the image`);
    }
    if (labelledCharts.includes(name))
      assert.ok(results.some(r => r.overText > 0), `${name}: a label sits over an image`);
    if (pixelCharts.includes(name)) {
      const probed = results.filter(r => r.inCount && r.opaque);
      assert.ok(probed.length > 0, `${name}: some shape has probe points`);
      for (const r of probed) {
        const label = `${name} ${r.key}`;
        assert.ok(r.svgIn >= 0.9, `${label}: SVG image fills the shape (${r.svgIn})`);
        assert.ok(r.canvasIn >= 0.9, `${label}: Canvas image fills the shape (${r.canvasIn})`);
        if (r.outCount) {
          assert.ok(r.svgOut <= 0.05, `${label}: SVG image is clipped to the shape (${r.svgOut})`);
          assert.ok(r.canvasOut <= 0.05, `${label}: Canvas image is clipped to the shape (${r.canvasOut})`);
        }
      }
    }
    if (hoverCharts.includes(name)) {
      assert.ok(hover.svgTargetIsShape, `${name}: the shape under its image takes the pointer`);
      assert.ok(hover.svgTooltip, `${name}: SVG hover opens a tooltip`);
      assert.ok(hover.canvasTooltip, `${name}: Canvas hover opens a tooltip`);
      for (const o of hover.opacities)
        assert.strictEqual(o.image, o.shape, `${name} ${o.key}: the image dims with its shape`);
      if (dimCharts.includes(name))
        assert.ok(hover.opacities.some(o => o.image < 1), `${name}: images of unhovered shapes dim`);
    }
  });
}

it("draws no background images when backgroundImage is unset", async function () {
  this.timeout(120000);
  const counts = await render("", async ({pageCasesSrc}) => {
    const {cases} = new Function(`return (${pageCasesSrc})();`)();
    const out = {};
    for (const [name, config] of Object.entries(cases)) {
      const el = document.createElement("div");
      el.style.cssText = "width:500px;height:400px;";
      document.body.appendChild(el);
      const viz = new window.d3plus[name]().select(el).config({...config, shapeConfig: {}}).duration(0);
      await new Promise(r => viz.render(r));
      out[name] = el.querySelectorAll("image, g[data-key$='-bgimage']").length;
      el.remove();
    }
    return out;
  }, {pageCasesSrc: pageCases.toString()});
  for (const [name, n] of Object.entries(counts)) assert.strictEqual(n, 0, `${name}: no images`);
});
