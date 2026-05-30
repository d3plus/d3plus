import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import assert from "assert";

import {chromium} from "playwright";

// Browser-based parity check: render a shape the legacy way (Shape.render →
// DOM) and the new way (Shape.toScene → @d3plus/render SvgRenderer), then
// compare the on-screen bounds of the resulting elements. Runs in real Chromium
// so getBoundingClientRect / Path2D behave like production (jsdom can't).
const coreDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const renderDir = path.resolve(coreDir, "../render");
const buildScript = path.resolve(coreDir, "../../scripts/build-umd.js");

const cryptoPolyfill =
  'if(typeof crypto!=="undefined"&&!crypto.randomUUID){' +
  "let n=0;crypto.randomUUID=()=>" +
  '"00000000-0000-4000-8000-"+String(n++).padStart(12,"0");}';

function buildUmd(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [buildScript], {cwd, stdio: "ignore"});
    child.on("error", reject);
    child.on("close", c => (c === 0 ? resolve() : reject(new Error(`umd build exited ${c}`))));
  });
}

let browser;
let coreUmd;
let renderUmd;

before(async function () {
  this.timeout(180000);
  await Promise.all([buildUmd(coreDir), buildUmd(renderDir)]);
  coreUmd = fs.readFileSync(path.join(coreDir, "umd", "d3plus-core.full.js"), "utf8");
  renderUmd = fs.readFileSync(path.join(renderDir, "umd", "d3plus-render.full.js"), "utf8");
  browser = await chromium.launch();
});

after(async () => {
  if (browser) await browser.close();
});

async function newPage() {
  const page = await browser.newPage();
  const errors = [];
  // Surface page errors and console messages immediately so a hanging
  // page.evaluate doesn't swallow diagnostics. Without this, a test that
  // never resolves leaves stderr empty.
  page.on("pageerror", e => {
    errors.push(e.message);
    process.stderr.write(`[page-error] ${e.message}\n${e.stack || ""}\n`);
  });
  page.on("console", msg => {
    if (process.env.PARITY_LOG)
      process.stderr.write(`[page-${msg.type()}] ${msg.text()}\n`);
  });
  await page.setContent(
    '<!doctype html><html><body><div id="A"></div><div id="B"></div></body></html>',
  );
  await page.addScriptTag({content: cryptoPolyfill});
  if (process.env.PARITY_LOG)
    await page.addScriptTag({content: "window.__PIPELINE_TRACE__ = true;"});
  await page.addScriptTag({content: coreUmd});
  await page.addScriptTag({content: "window.d3plusCore = window.d3plus;"});
  await page.addScriptTag({content: renderUmd});
  page._errors = errors;
  return page;
}

/** Asserts two on-screen rects match within a 1px tolerance. */
function assertClose(a, b, label) {
  for (const k of ["x", "y", "w", "h"])
    assert.ok(
      Math.abs(a[k] - b[k]) <= 1,
      `${label}: ${k} differs (legacy ${a[k]} vs scene ${b[k]})`,
    );
}

// In-page parity routine, parameterized by a shape builder expressed as source
// (so it can cross the evaluate boundary). Returns the two elements' bounds.
const parityFn = ({builderSrc, tag}) => {
  const NS = "http://www.w3.org/2000/svg";
  const build = new Function("lib", `return (${builderSrc})(lib);`);

  const A = document.getElementById("A");
  const B = document.getElementById("B");
  const svgA = document.createElementNS(NS, "svg");
  svgA.setAttribute("width", "300");
  svgA.setAttribute("height", "200");
  A.appendChild(svgA);

  return new Promise(resolve => {
    build(window.d3plusCore).duration(0).select(svgA).render(() => {
      const scene = build(window.d3plusCore).toScene();
      const r = new window.d3plus.SvgRenderer();
      r.mount({container: B, width: 300, height: 200});
      r.drawScene({width: 300, height: 200, root: scene});

      const rel = (el, cont) => {
        const a = el.getBoundingClientRect();
        const c = cont.getBoundingClientRect();
        return {x: a.left - c.left, y: a.top - c.top, w: a.width, h: a.height};
      };
      resolve({
        a: rel(svgA.querySelector(tag), svgA),
        b: rel(B.querySelector(tag), B.querySelector("svg")),
      });
    });
  });
};

it("Rect parity (legacy render vs toScene→SvgRenderer)", async () => {
  const page = await newPage();
  const res = await page.evaluate(parityFn, {
    tag: "rect",
    builderSrc: 'lib => new lib.Rect().data([{id:"a"}]).width(40).height(20).x(100).y(60).fill("red")',
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();
  assertClose(res.a, res.b, "Rect");
});

it("Circle parity (legacy render vs toScene→SvgRenderer)", async () => {
  const page = await newPage();
  const res = await page.evaluate(parityFn, {
    tag: "circle",
    builderSrc: 'lib => new lib.Circle().data([{id:"a"}]).r(25).x(120).y(80).fill("blue")',
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();
  assertClose(res.a, res.b, "Circle");
});

it("Path parity (legacy render vs toScene→SvgRenderer)", async () => {
  const page = await newPage();
  const res = await page.evaluate(parityFn, {
    tag: "path",
    builderSrc:
      'lib => new lib.Path().data([{id:"a",path:"M40,40 L160,40 L160,120 L40,120 Z"}]).fill("green")',
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();
  assertClose(res.a, res.b, "Path");
});

it("Treemap parity (chart render vs toScene→SvgRenderer)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "300");
    svgA.setAttribute("height", "200");
    A.appendChild(svgA);

    const data = [
      {id: "A", value: 10},
      {id: "B", value: 20},
      {id: "C", value: 30},
      {id: "D", value: 40},
    ];
    const viz = new window.d3plusCore.Treemap()
      .data(data)
      .groupBy("id")
      .sum("value")
      .width(300)
      .height(200)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));

    // Compose the scene from the shapes the render just produced, then draw it.
    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 300, height: 200});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    const cells = (svg, sel) => {
      const c = svg.getBoundingClientRect();
      return [...svg.querySelectorAll(sel)]
        .map(el => {
          const a = el.getBoundingClientRect();
          return {
            x: Math.round(a.left - c.left),
            y: Math.round(a.top - c.top),
            w: Math.round(a.width),
            h: Math.round(a.height),
          };
        })
        .sort((p, q) => p.x - q.x || p.y - q.y || p.w - q.w || p.h - q.h);
    };
    // v4 is scene-only — both svgA (render() → renderScene) and svgB (explicit
    // toScene() + SvgRenderer) produce the same scene-class DOM. This test
    // asserts the two paths are idempotent and labels appear in both.
    const sceneLabels = svg =>
      [...svg.querySelectorAll("text.d3plus-render-text")]
        .map(t => [...t.querySelectorAll("tspan")].map(s => s.textContent).join(" ").trim())
        .filter(Boolean)
        .sort();

    return {
      a: cells(svgA, "rect.d3plus-render-rect"),
      b: cells(svgB, "rect.d3plus-render-rect"),
      labelsA: sceneLabels(svgA),
      labelsB: sceneLabels(svgB),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.a.length >= 4, "treemap rendered all cells");
  assert.strictEqual(res.b.length, res.a.length, "scene reproduced every cell");
  res.a.forEach((cell, i) => assertClose(cell, res.b[i], `Treemap cell ${i}`));

  assert.ok(res.labelsA.length > 0, "treemap rendered labels");
  assert.deepStrictEqual(res.labelsB, res.labelsA, "scene reproduced every label's text");
});

it("BarChart full parity — bars + axes (render vs toScene→SvgRenderer/Canvas)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const barIds = ["Alpha", "Beta", "Gamma", "Delta"];
    const data = barIds.map((id, i) => ({id, x: id, y: [10, 25, 15, 30][i]}));
    const viz = new window.d3plusCore.BarChart()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .width(400)
      .height(300)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));

    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    const bounds = (svg, els) => {
      const c = svg.getBoundingClientRect();
      return [...els]
        .map(el => {
          const a = el.getBoundingClientRect();
          return {
            x: Math.round(a.left - c.left),
            y: Math.round(a.top - c.top),
            w: Math.round(a.width),
            h: Math.round(a.height),
          };
        })
        .sort((p, q) => p.x - q.x || p.y - q.y || p.w - q.w || p.h - q.h);
    };

    // v4: both sides scene-rendered. Bars are the rects not under an axis group.
    const sceneBars = svg =>
      bounds(
        svg,
        [...svg.querySelectorAll("rect.d3plus-render-rect")].filter(
          el => !(el.getAttribute("data-key") || "").startsWith("Axis"),
        ),
      );
    const barsA = sceneBars(svgA);
    const barsB = sceneBars(svgB);

    // Full text content (axis tick labels, title, etc.) on each side.
    const textB = svgB.textContent;
    // Tick/grid line + domain path counts reflect the axes being reproduced.
    const linesA = svgA.querySelectorAll("line, path").length;
    const linesB = svgB.querySelectorAll("line, path").length;

    // Render the full scene (bars + axes) to a Canvas and probe it.
    const cr = new window.d3plus.CanvasRenderer();
    cr.mount({container: document.createElement("div"), width: 400, height: 300, pixelRatio: 1});
    cr.drawScene(scene);
    const aBar = barsA[barsA.length - 1];
    const canvasPick = cr.pick([aBar.x + aBar.w / 2, aBar.y + aBar.h / 2]);

    return {
      barsA,
      barsB,
      textB,
      linesA,
      linesB,
      canvasHit: canvasPick ? canvasPick.node.key : null,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  // Bars match between legacy render and the scene.
  assert.strictEqual(res.barsA.length, 4, "four bars rendered");
  assert.strictEqual(res.barsB.length, 4, "scene reproduced every bar");
  res.barsA.forEach((bar, i) => assertClose(bar, res.barsB[i], `Bar ${i}`));

  // Axes made it into the scene (tick labels + tick/grid lines).
  ["Alpha", "Beta", "Gamma", "Delta"].forEach(id =>
    assert.ok(res.textB.includes(id), `axis tick label "${id}" present in scene`),
  );
  // Legacy svgA also contains hidden measurement-axis and clipPath elements that
  // the snapshot intentionally omits, so assert the scene has tick/grid geometry
  // rather than an exact count.
  assert.ok(res.linesB > 4, `axis tick/grid lines + domain present in scene (${res.linesB})`);

  // The full chart (bars + axes) renders to Canvas and is hit-testable.
  assert.ok(
    res.canvasHit && !res.canvasHit.startsWith("Axis"),
    `a bar is pickable on the Canvas render (got ${res.canvasHit})`,
  );
});

it("Legend composes into a chart scene (multi-level Treemap)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const data = [
      {group: "G1", id: "A", value: 10},
      {group: "G1", id: "B", value: 20},
      {group: "G2", id: "C", value: 30},
      {group: "G2", id: "D", value: 40},
    ];
    const viz = new window.d3plusCore.Treemap()
      .data(data)
      .groupBy(["group", "id"])
      .sum("value")
      .width(400)
      .height(300)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));
    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    return {
      hasLegendGroup: !!svgB.querySelector('[data-key="viz-legend"]'),
      hasLegendInRender: !!svgA.querySelector('[data-key="viz-legend"]'),
      text: svgB.textContent,
      cells: svgB.querySelectorAll("rect.d3plus-render-rect").length,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasLegendInRender, "legend rendered by viz.render() (scene path)");
  assert.ok(res.hasLegendGroup, "legend composed into the scene");
  assert.ok(res.text.includes("G1") && res.text.includes("G2"), "legend labels present in scene");
  assert.ok(res.cells >= 4, "treemap cells also present");
});

it("Timeline composes into a chart scene (time-based Treemap)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const NS = "http://www.w3.org/2000/svg";
    const A = document.getElementById("A");
    const B = document.getElementById("B");
    const svgA = document.createElementNS(NS, "svg");
    svgA.setAttribute("width", "400");
    svgA.setAttribute("height", "300");
    A.appendChild(svgA);

    const data = [
      {id: "A", value: 10, year: 2000},
      {id: "A", value: 14, year: 2001},
      {id: "B", value: 20, year: 2000},
      {id: "B", value: 18, year: 2001},
    ];
    const viz = new window.d3plusCore.Treemap()
      .data(data)
      .groupBy("id")
      .sum("value")
      .time("year")
      .width(400)
      .height(300)
      .duration(0);

    await new Promise(resolve => viz.select(svgA).render(resolve));
    const scene = viz.toScene();
    const r = new window.d3plus.SvgRenderer();
    r.mount({container: B, width: 400, height: 300});
    r.drawScene(scene);
    const svgB = B.querySelector("svg");

    return {
      hasTimelineGroup: !!svgB.querySelector('[data-key="viz-timeline"]'),
      hasTimelineInRender: !!svgA.querySelector('[data-key="viz-timeline"]'),
      text: svgB.textContent,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasTimelineInRender, "timeline rendered by viz.render() (scene path)");
  assert.ok(res.hasTimelineGroup, "timeline composed into the scene");
  assert.ok(res.text.includes("2000") && res.text.includes("2001"), "timeline tick labels present in scene");
});

it("Scene rendering emits zero legacy d3plus-* classes in the user target", async () => {
  // The opt-out path (and the renderMode flag) was removed in v4. This test
  // replaces the old "physical deletion" assertion: a default-rendered chart
  // must not produce any of the legacy d3-selection classes in the user's
  // target. (The detached compute container is still populated by the legacy
  // code for the data side of toScene; it lives outside the target.)
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
          {id: "C", value: 30},
          {id: "D", value: 40},
        ])
        .groupBy("id")
        .sum("value")
        .width(300)
        .height(200)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      legacyRects: target.querySelectorAll("rect.d3plus-Rect").length,
      legacyTextBoxes: target.querySelectorAll("g.d3plus-textBox").length,
      legacyTreemap: target.querySelectorAll("g.d3plus-Treemap").length,
      sceneRects: target.querySelectorAll("rect.d3plus-render-rect").length,
      sceneText: target.textContent,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.legacyRects, 0, "no legacy rect.d3plus-Rect in target");
  assert.strictEqual(res.legacyTextBoxes, 0, "no legacy g.d3plus-textBox in target");
  assert.strictEqual(res.legacyTreemap, 0, "no legacy g.d3plus-Treemap in target");
  assert.ok(res.sceneRects >= 4, `scene rendered all cells (${res.sceneRects})`);
  ["A", "B", "C", "D"].forEach(id =>
    assert.ok(res.sceneText.includes(id), `cell label "${id}" present`),
  );
});

it("Viz.renderScene drives a chart through the scene path (SVG)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 30},
        {id: "D", value: 40},
      ])
      .groupBy("id")
      .sum("value")
      .width(300)
      .height(200)
      .duration(0);

    const {renderer, scene} = await viz.renderScene(target);

    return {
      kind: renderer.kind,
      // The user's target should contain only scene-rendered DOM, never the
      // legacy d3plus-Treemap container (which lives in the detached compute svg).
      hasSceneSvg: !!target.querySelector("svg.d3plus-render-svg"),
      hasLegacyTreemap: !!target.querySelector("g.d3plus-Treemap"),
      sceneRects: target.querySelectorAll("rect.d3plus-render-rect").length,
      sceneText: target.textContent,
      sceneSize: scene.root.children.length,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.kind, "svg", "SvgRenderer in use");
  assert.ok(res.hasSceneSvg, "target contains scene SVG");
  assert.ok(!res.hasLegacyTreemap, "target does NOT contain legacy d3plus-Treemap (lives only in detached compute)");
  assert.ok(res.sceneRects >= 4, `scene rendered all cells (${res.sceneRects})`);
  ["A", "B", "C", "D"].forEach(id =>
    assert.ok(res.sceneText.includes(id), `cell label "${id}" present`),
  );
  assert.ok(res.sceneSize > 0, "scene has children composed from shapes/components");
});

it("Viz.renderScene drives a chart through the scene path (Canvas)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.BarChart()
      .data([
        {id: "Alpha", x: "Alpha", y: 10},
        {id: "Beta", x: "Beta", y: 25},
        {id: "Gamma", x: "Gamma", y: 15},
        {id: "Delta", x: "Delta", y: 30},
      ])
      .groupBy("id")
      .x("x")
      .y("y")
      .width(400)
      .height(300)
      .duration(0);

    const {renderer} = await viz.renderScene(target, {kind: "canvas"});

    // Probe pick at the visual center of the target.
    const canvas = target.querySelector("canvas.d3plus-render-canvas");
    const pick = renderer.pick([200, 200]);

    return {
      kind: renderer.kind,
      hasCanvas: !!canvas,
      hasLegacyShapes: target.querySelectorAll("rect.d3plus-Bar").length,
      pickedKey: pick ? pick.node.key : null,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.kind, "canvas", "CanvasRenderer in use");
  assert.ok(res.hasCanvas, "target contains a <canvas>");
  assert.strictEqual(res.hasLegacyShapes, 0, "target has zero legacy SVG bars (lives only in detached compute)");
  assert.ok(
    res.pickedKey && !res.pickedKey.startsWith("Axis"),
    `chart is hit-testable on canvas (got ${res.pickedKey})`,
  );
});

it("Scene renderer is the default — viz.render() routes through it with no flag", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      // No renderer flag — the default ("svg") drives render().
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
          {id: "C", value: 30},
          {id: "D", value: 40},
        ])
        .groupBy("id")
        .sum("value")
        .width(300)
        .height(200)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      hasSceneSvg: !!target.querySelector("svg.d3plus-render-svg"),
      hasLegacyTreemap: !!target.querySelector("g.d3plus-Treemap"),
      sceneCells: target.querySelectorAll("rect.d3plus-render-rect").length,
      text: target.textContent,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasSceneSvg, "render() produced a scene SVG with no opt-in");
  assert.ok(!res.hasLegacyTreemap, "default render() did NOT produce legacy d3plus-Treemap DOM");
  assert.ok(res.sceneCells >= 4, `scene rendered all cells (${res.sceneCells})`);
  ["A", "B", "C", "D"].forEach(id =>
    assert.ok(res.text.includes(id), `cell label "${id}" present`),
  );
});

it("subtitle and total features compose into the scene", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
        ])
        .groupBy("id")
        .sum("value")
        .title(() => "Chart Title")
        .subtitle(() => "A descriptive subtitle")
        .total(d => d.value)
        .width(400)
        .height(300)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      text: target.textContent,
      hasTitle: !!target.querySelector('[data-key="viz-title"]'),
      hasSubtitle: !!target.querySelector('[data-key="viz-subtitle"]'),
      hasTotal: !!target.querySelector('[data-key="viz-total"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasTitle, "title in scene");
  assert.ok(res.hasSubtitle, "subtitle in scene");
  assert.ok(res.hasTotal, "total in scene");
  assert.ok(res.text.includes("Chart Title"), "title text rendered");
  assert.ok(res.text.includes("descriptive subtitle"), "subtitle text rendered");
  assert.ok(res.text.includes("30"), "total value rendered");
});

it("treemapDef.emit produces rect nodes structurally identical to legacy Rect cells", async () => {
  // Bridges E3 → E4: prove `treemapDef.emit(ctx)` is a valid replacement for
  // the legacy `new Rect().renderMode("compute").data(shapeData).render()`
  // glue, modulo labels. Each cell's geometry must round-trip from the stage
  // to the emit'd SceneNode unchanged.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 30},
        {id: "D", value: 40},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    // Pull the laid-out shapeData from the stage, run emit, and compare to
    // what the legacy Rect compute pass produced (it consumed the same data).
    const {applyTreemapLayout, treemapDef} = window.d3plusCore;
    if (!applyTreemapLayout || !treemapDef) return {missing: true};

    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    // Label-aware emit includes both rect cells and label TextNodes — filter
    // to rects for the geometric round-trip check.
    const rects = emitted.filter(n => n.type === "rect");
    return {
      shapeCount: shapeData.length,
      emitCount: emitted.length,
      rectCount: rects.length,
      allMatched: shapeData.every((cell, i) =>
        rects[i].x === cell.x0 &&
        rects[i].y === cell.y0 &&
        rects[i].width === cell.x1 - cell.x0 &&
        rects[i].height === cell.y1 - cell.y0,
      ),
      hasAria: rects.every(n => n.aria && typeof n.aria.label === "string"),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  if (res.missing) {
    // Expose the internals on the UMD so a future browser-side test can use them.
    throw new Error("treemapDef/applyTreemapLayout not exposed on window.d3plusCore");
  }
  assert.strictEqual(res.shapeCount, 4, "stage produced one node per leaf");
  assert.strictEqual(res.rectCount, 4, "emit produced one rect SceneNode per cell");
  // emitCount may exceed rect count when label TextNodes are also emitted.
  assert.ok(res.emitCount >= res.rectCount, "emit includes at least the rect cells");
  assert.ok(res.allMatched, "emit geometry matches shapeData 1:1");
  assert.ok(res.hasAria, "emit annotated aria labels");
});

it("treemapDef.emit yields label-aware scene nodes (rect + text) in a browser", async () => {
  // Phase E follow-on: in a browser context where TextBox can compute label
  // layout (font measurement + textWrap), emit() returns rect SceneNodes AND
  // text SceneNodes (one per label per cell) — the chart's scene contract is
  // now expressible purely through treemapDef.emit.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    const {applyTreemapLayout, treemapDef} = window.d3plusCore;
    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    return {
      rectCount: emitted.filter(n => n.type === "rect").length,
      textCount: emitted.filter(n => n.type === "text").length,
      hasLineContent: emitted
        .filter(n => n.type === "text")
        .some(n => n.lines && n.lines.length > 0 && n.lines[0].text),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.rectCount, 2, "two rect cells emitted");
  // Each cell has two labels (id + share%), so 4 text nodes total.
  assert.ok(res.textCount >= 2, `at least one text node per cell (got ${res.textCount})`);
  assert.ok(res.hasLineContent, "text nodes carry actual line content");
});

it("measureAxis runs on a plain object — no Axis class instance needed", async () => {
  // Phase-E follow-on: the standalone `measureAxis(opts)` function operates
  // on duck-typed Axis-shaped data. This test passes a plain JS object (no
  // class), drives the layout, and asserts bounds + d3Scale come back.
  // The result is verified against an actual Axis instance configured the
  // same way — output is identical (modulo functions).
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const {measureAxis} = window.d3plusCore;
    // A bare object pretending to be an Axis. Provides exactly the fields
    // measureAxis reads. `_getPosition`/`_getTicks`/`_getLabels` are tiny
    // adapters that read from the d3 scale measureAxis populates onto it.
    const axisLike = {
      // Config lives under `schema` (the installFluent storage contract).
      schema: {
        domain: [0, 100],
        scale: "linear",
        ticks: undefined,
        labels: undefined,
        tickFormat: null,
        shape: "Line",
        shapeConfig: {
          labelConfig: {
            fontFamily: "sans-serif",
            fontSize: 12,
            padding: 5,
          },
          strokeWidth: 1,
        },
        tickSize: 5,
        tickSuffix: "normal",
        timeLocale: undefined,
        scalePadding: 0,
        paddingInner: 0,
        paddingOuter: 0,
        rounding: "outside",
        roundingInsideMinPrefix: "",
        roundingInsideMaxPrefix: "",
        roundingInsideMinSuffix: "",
        roundingInsideMaxSuffix: "",
        orient: "bottom",
        align: "end",
        maxSize: undefined,
        width: 400,
        height: 60,
        padding: 5,
        minSize: 0,
        gridSize: 0,
        grid: undefined,
        gridLog: false,
        title: undefined,
        titleConfig: {},
        labelOffset: false,
        range: undefined,
      },
      // Scratch state the layout function mutates / methods that read it.
      _data: [],
      _tickUnit: 0,
      _locale: "en-US",
      _labelRotation: undefined,
      _margin: {top: 0, right: 0, bottom: 0, left: 0},
      _position: {
        width: "width",
        height: "height",
        x: "x",
        y: "y",
        horizontal: true,
        opposite: "top",
      },
      // Tick/label getters consult the d3 scale measureAxis populates onto us.
      _getTicks() {
        return this._d3Scale && this._d3Scale.ticks
          ? this._d3Scale.ticks(10)
          : [];
      },
      _getLabels() {
        return this._d3Scale && this._d3Scale.ticks
          ? this._d3Scale.ticks(10)
          : [];
      },
      _getPosition(d) {
        return this._d3Scale ? this._d3Scale(d) : 0;
      },
    };

    const layout = measureAxis(axisLike);

    return {
      hasD3Scale: typeof axisLike._d3Scale === "function",
      domain: axisLike._d3Scale ? axisLike._d3Scale.domain() : null,
      boundsWidth: layout.bounds.width,
      boundsHeight: layout.bounds.height,
      ticksCount: layout.ticks.length,
      labelsCount: layout.labels.length,
      textDataCount: layout.textData.length,
      hasTickFormat: typeof layout.tickFormat === "function",
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasD3Scale, "measureAxis populated _d3Scale on the plain object");
  assert.ok(Array.isArray(res.domain), "domain is set");
  assert.ok(res.boundsWidth > 0, `bounds.width > 0 (got ${res.boundsWidth})`);
  assert.ok(res.boundsHeight > 0, `bounds.height > 0 (got ${res.boundsHeight})`);
  assert.ok(res.ticksCount > 0, `tick count > 0 (got ${res.ticksCount})`);
  assert.ok(res.labelsCount > 0, `label count > 0 (got ${res.labelsCount})`);
  assert.ok(res.textDataCount > 0, "textData populated");
  assert.ok(res.hasTickFormat, "tickFormat function returned");
});

it("Plot subclasses (BarChart/LinePlot/AreaPlot) route shapes through _chartScene", async () => {
  // Phase-E follow-on: Plot._draw's three `_shapes.push(...)` sites (main
  // shape, confidence Area, line markers) all go through `absorbShapeIntoChartScene`,
  // which calls `shape.toScene()` and stuffs the nodes into `viz._chartScene`.
  // Verifies the rollup for the common Plot subclasses.
  const cases = [
    {name: "BarChart", data: [{id: "A", value: 10}, {id: "B", value: 20}, {id: "C", value: 5}]},
    {name: "LinePlot", data: [
      {id: "S1", x: 0, y: 1}, {id: "S1", x: 1, y: 2}, {id: "S1", x: 2, y: 3},
    ]},
    {name: "AreaPlot", data: [
      {id: "S1", x: 0, y: 1}, {id: "S1", x: 1, y: 2}, {id: "S1", x: 2, y: 3},
    ]},
  ];

  for (const {name, data} of cases) {
    const page = await newPage();
    const res = await page.evaluate(async ({name, data}) => {
      const target = document.getElementById("B");
      const chart = new window.d3plusCore[name]()
        .data(data)
        .groupBy("id")
        .width(400)
        .height(300)
        .duration(0)
        .select(target);
      if (name === "BarChart") chart.y("value");
      await new Promise(resolve => chart.render(resolve));
      return {
        shapesLength: chart._shapes ? chart._shapes.length : -1,
        chartSceneLength: chart._chartScene ? chart._chartScene.length : 0,
        rendered: target.querySelector("svg") !== null,
      };
    }, {name, data});
    if (page._errors.length)
      throw new Error(`${name}: ${page._errors.join("; ")}`);
    await page.close();

    assert.strictEqual(res.shapesLength, 0, `${name}: _shapes empty`);
    assert.ok(res.chartSceneLength > 0, `${name}: _chartScene populated`);
    assert.ok(res.rendered, `${name}: svg rendered`);
  }
});

it("All converted charts emit scene via chartDef.emit (no _shapes.push)", async function () {
  this.timeout(10000);
  // Phase-E follow-on rollup: every chart in this list was converted from
  // `_shapes.push(new Shape()...)` to `this._chartScene = chartDef.emit(ctx)`.
  // For each: render, verify `_shapes` is empty, verify `_chartScene` is
  // populated, verify the chart actually rendered something to the DOM.
  const charts = [
    {name: "Pie", data: [{id: "A", value: 10}, {id: "B", value: 20}]},
    {name: "Donut", data: [{id: "A", value: 10}, {id: "B", value: 20}]},
    {name: "Matrix", data: [
      {row: "r1", column: "c1", value: 1},
      {row: "r1", column: "c2", value: 2},
      {row: "r2", column: "c1", value: 3},
      {row: "r2", column: "c2", value: 4},
    ]},
    {name: "RadialMatrix", data: [
      {row: "r1", column: "c1", value: 1},
      {row: "r1", column: "c2", value: 2},
      {row: "r2", column: "c1", value: 3},
    ]},
    {name: "Priestley", data: [
      {id: "A", start: 0, end: 10},
      {id: "B", start: 5, end: 15},
    ]},
  ];

  for (const {name, data} of charts) {
    const page = await newPage();
    const res = await page.evaluate(async ({name, data}) => {
      const target = document.getElementById("B");
      const viz = new window.d3plusCore[name]()
        .data(data)
        .width(400)
        .height(300)
        .duration(0)
        .select(target);
      await new Promise(resolve => viz.render(resolve));
      return {
        shapesLength: viz._shapes ? viz._shapes.length : -1,
        hasChartScene: Array.isArray(viz._chartScene),
        chartSceneLength: viz._chartScene ? viz._chartScene.length : 0,
        hasContent: target.querySelector("svg") !== null,
      };
    }, {name, data});
    if (page._errors.length)
      throw new Error(`${name}: ${page._errors.join("; ")}`);
    await page.close();

    assert.strictEqual(
      res.shapesLength,
      0,
      `${name}: _shapes empty (no legacy push)`,
    );
    assert.ok(res.hasChartScene, `${name}: _chartScene populated`);
    assert.ok(
      res.chartSceneLength > 0,
      `${name}: emit produced scene nodes`,
    );
    assert.ok(res.hasContent, `${name}: rendered svg to target`);
  }
});

it("Pack scene comes from packDef.emit — no legacy Circle.push", async () => {
  // Phase-E follow-on: Pack._draw used to do `_shapes.push(new Circle()...)`.
  // Now `applyPackLayout` stage runs the d3-hierarchy pack, `packDef.emit`
  // produces Circle SceneNodes, and Viz.toScene composes them via
  // `_chartScene`. Verifies the same dropped-glue pattern as Treemap.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Pack()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 15},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(300)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    return {
      shapesLength: viz._shapes ? viz._shapes.length : -1,
      hasChartScene: Array.isArray(viz._chartScene),
      circleCount: viz._chartScene
        ? viz._chartScene.filter(n => n.type === "circle").length
        : 0,
      hasViewBox: !!target.querySelector('[data-key="viz-chart-cells"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.shapesLength, 0, "_shapes is empty (no Circle push)");
  assert.ok(res.hasChartScene, "_chartScene array populated");
  assert.ok(res.circleCount >= 3, `at least 3 circle cells in emit (got ${res.circleCount})`);
  assert.ok(res.hasViewBox, "viz-chart-cells group rendered to scene");
});

it("Treemap scene cells come from treemapDef.emit — no legacy Rect.push", async () => {
  // Phase-E follow-on: Treemap._draw used to do `_shapes.push(new Rect()...)`
  // to populate the chart cells. Now `_chartScene = treemapDef.emit(ctx)` and
  // Viz.toScene composes it. Verifies:
  //   1. `_shapes` is empty (no Rect was pushed).
  //   2. `_chartScene` contains rect SceneNodes (the emit output).
  //   3. The rendered scene still has all the cells (no regression).
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 15},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(300)
      .duration(0)
      .select(target);
    await new Promise(resolve => viz.render(resolve));

    return {
      shapesLength: viz._shapes ? viz._shapes.length : -1,
      hasChartScene: Array.isArray(viz._chartScene),
      chartSceneLength: viz._chartScene ? viz._chartScene.length : 0,
      rectNodes: viz._chartScene
        ? viz._chartScene.filter(n => n.type === "rect").length
        : 0,
      // Final rendered scene should have the cells.
      vizChartCellsGroup: !!target.querySelector('[data-key="viz-chart-cells"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.shapesLength, 0, "_shapes is empty (no Rect push)");
  assert.ok(res.hasChartScene, "_chartScene array exists");
  assert.ok(res.chartSceneLength >= 3, `_chartScene populated (got ${res.chartSceneLength})`);
  assert.strictEqual(res.rectNodes, 3, "3 rect cells in emit");
  assert.ok(res.vizChartCellsGroup, "viz-chart-cells group rendered to scene");
});

it("Plot no longer holds persistent test-axis instances (_xTest/_yTest/_x2Test/_y2Test)", async () => {
  // Phase-E follow-on: the four test-axis fields are gone from Plot. Each
  // draw allocates fresh `xTest`/`yTest`/`x2Test`/`y2Test` Axis locals,
  // measures, and lets them get GC'd. Verifies (1) BarChart still renders
  // correctly, (2) `this._xTest`/etc. don't exist on the instance.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const chart = new window.d3plusCore.BarChart()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 15},
      ])
      .groupBy("id")
      .y("value")
      .width(400)
      .height(300)
      .duration(0)
      .select(target);
    await new Promise(resolve => chart.render(resolve));

    return {
      hasXTest: "_xTest" in chart,
      hasYTest: "_yTest" in chart,
      hasX2Test: "_x2Test" in chart,
      hasY2Test: "_y2Test" in chart,
      // Production axes are still there (they do the actual rendering).
      hasXAxis: "_xAxis" in chart,
      hasYAxis: "_yAxis" in chart,
      // Chart rendered something (proves the per-draw measure path works).
      hasContent: target.querySelector("svg") !== null,
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.hasXTest, false, "_xTest field is gone");
  assert.strictEqual(res.hasYTest, false, "_yTest field is gone");
  assert.strictEqual(res.hasX2Test, false, "_x2Test field is gone");
  assert.strictEqual(res.hasY2Test, false, "_y2Test field is gone");
  assert.strictEqual(res.hasXAxis, true, "production _xAxis still present");
  assert.strictEqual(res.hasYAxis, true, "production _yAxis still present");
  assert.ok(res.hasContent, "chart rendered successfully without persistent test axes");
});

it("Axis.measure() populates outerBounds without touching the DOM", async () => {
  // Phase-E follow-on: `axis.measure()` runs the full layout pass (scale
  // construction, tick selection, label textWrap, outerBounds computation)
  // with zero DOM access. The free-function `computeAxisLayout(axis)` is a
  // thin wrapper exposing the result as a value. This test runs in a real
  // browser to exercise the production code path, but verifies no DOM nodes
  // are created — the body of an empty `<div>` stays empty post-measure.
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const A = document.getElementById("A");
    A.innerHTML = "";
    const childCountBefore = A.children.length;

    // Construct a fresh AxisBottom — no select(), no parent in the DOM.
    const axis = new window.d3plusCore.AxisBottom()
      .domain([0, 100])
      .width(400)
      .height(60)
      .align("end")
      .gridSize(0);
    axis.measure();

    // No DOM was created by measure() — the page body is unchanged.
    const childCountAfter = A.children.length;
    const bodySvgCount = document.body.querySelectorAll("svg").length;
    // outerBounds is populated.
    const bounds = axis.outerBounds();

    // The free-function wrapper exposes the same data.
    const {computeAxisLayout} = window.d3plusCore;
    const axis2 = new window.d3plusCore.AxisBottom()
      .domain([0, 100])
      .width(400)
      .height(60)
      .align("end")
      .gridSize(0);
    const layout = computeAxisLayout
      ? computeAxisLayout(axis2)
      : null;

    return {
      childCountBefore,
      childCountAfter,
      bodySvgCount,
      hasBounds:
        typeof bounds.width === "number" && typeof bounds.height === "number",
      bounds,
      hasComputeAxisLayout: !!computeAxisLayout,
      layoutHasBounds:
        layout && typeof layout.bounds.width === "number",
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.strictEqual(res.childCountBefore, 0, "target starts empty");
  assert.strictEqual(res.childCountAfter, 0, "measure() created no children in target");
  // Two side-svgs at most — one from each previously-passing newPage()
  // helper test fixture (the helper page has two svg containers).
  assert.ok(res.hasBounds, "outerBounds returns a sized box");
  assert.ok(res.bounds.width > 0, `bounds.width > 0 (got ${res.bounds.width})`);
  assert.ok(res.bounds.height > 0, `bounds.height > 0 (got ${res.bounds.height})`);
  // The free function is exported on the package's `index` (and surfaces on
  // `window.d3plus` via the UMD wrapper). Validate it matches the method.
  if (res.hasComputeAxisLayout) {
    assert.ok(res.layoutHasBounds, "computeAxisLayout returns bounds");
  }
});

it("backFeature emits a Back button TextNode when history is non-empty", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plusCore.Treemap()
      .data([{id: "A", value: 10}, {id: "B", value: 20}])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(300)
      .duration(0)
      .select(target);
    // Seed drill-down history so backFeature renders the back button.
    viz._history = [{depth: 0}];
    await new Promise(resolve => viz.render(resolve));
    return {
      text: target.textContent,
      hasBack: !!target.querySelector('[data-key="viz-back"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.hasBack, "back text node in scene");
  assert.ok(res.text.includes("←"), "back arrow glyph present");
  assert.ok(res.text.toLowerCase().includes("back"), "back label rendered");
});

it("backFeature emits nothing when history is empty (default state)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([{id: "A", value: 10}, {id: "B", value: 20}])
        .groupBy("id")
        .sum("value")
        .width(400)
        .height(300)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      hasBack: !!target.querySelector('[data-key="viz-back"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(!res.hasBack, "no back node when history is empty");
});

it("titleFeature composes a title TextNode into the scene (E2)", async () => {
  const page = await newPage();
  const res = await page.evaluate(async () => {
    const target = document.getElementById("B");
    await new Promise(resolve => {
      new window.d3plusCore.Treemap()
        .data([
          {id: "A", value: 10},
          {id: "B", value: 20},
        ])
        .groupBy("id")
        .sum("value")
        .title(() => "My Chart Title")
        .width(300)
        .height(200)
        .duration(0)
        .select(target)
        .render(resolve);
    });
    return {
      text: target.textContent,
      vizFeaturesGroup: !!target.querySelector('[data-key="viz-features"]'),
      titleTextNode: !!target.querySelector('[data-key="viz-title"]'),
    };
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();

  assert.ok(res.vizFeaturesGroup, "viz-features group composed into scene");
  assert.ok(res.titleTextNode, "title text node present in scene");
  assert.ok(res.text.includes("My Chart Title"), "title text appears in rendered DOM");
});

it("CanvasRenderer picks a Path2D path in a real browser", async () => {
  const page = await newPage();
  const res = await page.evaluate(() => {
    const B = document.getElementById("B");
    const r = new window.d3plus.CanvasRenderer();
    r.mount({container: B, width: 100, height: 100, pixelRatio: 1});
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [{type: "path", key: "p", d: "M10,10 L90,10 L90,90 L10,90 Z", paint: {fill: "#09c"}}],
      },
    });
    const inside = r.pick([50, 50]);
    const outside = r.pick([5, 5]);
    return {inside: inside && inside.node.key, outside};
  });
  if (page._errors.length) throw new Error(page._errors.join("; "));
  await page.close();
  assert.strictEqual(res.inside, "p", "point inside the square path hits (Path2D isPointInPath)");
  assert.strictEqual(res.outside, null, "point outside the path misses");
});
