import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Plot whose `xDomain`/`yDomain` cuts its data off clips its data marks to
    the plot area on both backends: a line that dips below the domain stops
    at the x axis, a point sitting on the domain's edge still draws whole,
    the clipped-away parts take no pointer events, each small-multiples panel
    clips to its own plot, and a chart whose domains cover its data (or a
    BarChart, whose bars clamp) draws exactly as before.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

// Page-side helpers: sample data (a series that dips well below 980 and peaks
// at exactly 1040), a render promise, the painted clip groups and data marks
// in surface pixels, and a pixel counter over either backend's output.
const PRELUDE = `
  const values = [1000, 1012, 995, 940, 900, 990, 1024, 1040, 1018, 930, 1003, 1030];
  const rows = [];
  ["Alpha", "Beta"].forEach((id, s) => values.forEach((v, i) => rows.push({id, x: i, value: s ? v - 10 : v})));
  const alpha = rows.filter(d => d.id === "Alpha");
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const scene = chart => chart._sceneRenderer._scene.root.children;
  const isClip = n => n.type === "group" && /(^|\\/)plot-domain-clip-\\d+$/.test(String(n.key));
  const walk = (nodes, fn, o = {x: 0, y: 0, k: 1}) => nodes.forEach(n => {
    const t = n.transform || {};
    const next = {x: o.x + (t.x || 0) * o.k, y: o.y + (t.y || 0) * o.k, k: o.k * (t.scale ?? 1)};
    fn(n, next);
    if (n.children) walk(n.children, fn, next);
  });
  const clips = chart => {
    const out = [];
    walk(scene(chart), (n, o) => {
      if (isClip(n) && n.clip) out.push({
        key: String(n.key), x: o.x + n.clip.x * o.k, y: o.y + n.clip.y * o.k,
        width: n.clip.width * o.k, height: n.clip.height * o.k,
      });
    });
    return out;
  };
  const plotRect = chart => {
    const a = chart._plotArea, t = chart._chartTransform || {x: 0, y: 0};
    return {x: t.x + a.x, y: t.y + a.y, width: a.width, height: a.height};
  };
  const surface = chart => document.querySelector(
    chart._renderer === "canvas" ? "#viz canvas.d3plus-render-canvas" : "#viz svg.d3plus-render-svg");
  // The surface's size in scene pixels.
  const size = chart => {
    const el = surface(chart);
    return chart._renderer === "canvas"
      ? {width: parseFloat(el.style.width), height: parseFloat(el.style.height)}
      : {width: Number(el.getAttribute("width")), height: Number(el.getAttribute("height"))};
  };
  const pixels = async chart => {
    const el = surface(chart);
    const rect = size(chart);
    let canvas = el;
    if (chart._renderer !== "canvas") {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(el));
      await img.decode();
      canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.getContext("2d").drawImage(img, 0, 0, rect.width, rect.height);
    }
    const ratio = canvas.width / rect.width;
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    return (area, test) => {
      let n = 0;
      const x0 = Math.max(0, Math.floor(area.x * ratio)), x1 = Math.min(canvas.width, Math.ceil((area.x + area.width) * ratio));
      const y0 = Math.max(0, Math.floor(area.y * ratio)), y1 = Math.min(canvas.height, Math.ceil((area.y + area.height) * ratio));
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i + 3] > 128 && test(data[i], data[i + 1], data[i + 2])) n++;
        }
      return n;
    };
  };
  const red = (r, g, b) => r > 180 && g < 90 && b < 90;
  const green = (r, g, b) => g > 120 && r < 90 && b < 90;
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] LinePlot with yDomain([980]) draws nothing below the x axis`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(alpha).groupBy("id").x("x").y("value")
        .yDomain([980]).legend(false).lineMarkers(true)
        .shapeConfig({Line: {stroke: "#ff0000", strokeWidth: 3}})
        .lineMarkerConfig({fill: "#ff0000", r: 4})
        .renderer(arg);
      await done(chart);
      const plot = plotRect(chart);
      const count = await pixels(chart);
      const bottom = plot.y + plot.height;
      const svgHeight = size(chart).height;
      return {
        clips: clips(chart).map(c => c.y + c.height - bottom),
        below: count({x: 0, y: bottom + 8, width: 640, height: svgHeight}, red),
        inside: count(plot, red),
      };
    `,
      renderer,
    );
    assert.ok(r.clips.length >= 1, "the cut-off marks are clipped");
    r.clips.forEach(over =>
      assert.ok(
        over >= 0 && over <= 7,
        `a clip reaches ${over}px past the axis`,
      ),
    );
    assert.strictEqual(r.below, 0, "no line pixels below the x axis");
    assert.ok(r.inside > 100, "the line still draws inside the plot");
  });

  it(`[${renderer}] a point on the domain's edge draws whole`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(alpha).groupBy("id").x("x").y("value")
        .yDomain([980, 1040]).legend(false).lineMarkers(true)
        .shapeConfig({Line: {stroke: "#ff0000", strokeWidth: 2}})
        .lineMarkerConfig({fill: "#00b000", stroke: "#00b000", r: 6})
        .renderer(arg);
      await done(chart);
      const plot = plotRect(chart);
      const count = await pixels(chart);
      return {
        clips: clips(chart).length,
        above: count({x: plot.x, y: plot.y - 6, width: plot.width, height: 5}, green),
        below: count({x: plot.x, y: plot.y + 1, width: plot.width, height: 5}, green),
      };
    `,
      renderer,
    );
    assert.ok(r.clips >= 1, "the dips below 980 are clipped");
    assert.ok(
      r.above > 20,
      `the max point's top half draws above the plot (${r.above}px)`,
    );
    assert.ok(
      Math.abs(r.above - r.below) < r.below * 0.5,
      "about as much of it above the edge as below",
    );
  });

  it(`[${renderer}] the clipped-away part of a line takes no pointer events`, async () => {
    const r = await page(
      `
      // A flat dip just below the domain, so the clipped stretch of line
      // still lies on the surface (between x ticks, clear of their labels).
      const dip = [1000, 1012, 990, 975, 975, 975, 1024, 1040, 1018, 1003, 1030]
        .map((value, x) => ({id: "Alpha", x, value}));
      const chart = new d3plus.LinePlot()
        .data(dip).groupBy("id").x("x").y("value")
        .yDomain([980]).legend(false)
        .renderer(arg);
      await done(chart);
      // The series line (interaction points sit in its parent's space).
      let line, at;
      walk(scene(chart), (n, o) => {
        if (n.shapeType === "Line" && n.key === "Alpha") {
          const t = n.transform || {};
          [line, at] = [n, {x: o.x - (t.x || 0) * o.k / (t.scale ?? 1), y: o.y - (t.y || 0) * o.k / (t.scale ?? 1), k: o.k / (t.scale ?? 1)}];
        }
      });
      const bottom = plotRect(chart).y + plotRect(chart).height;
      const {height} = size(chart);
      const points = line.interactionPoints.map(p => [at.x + p.x * at.k, at.y + p.y * at.k]);
      // Midway between neighboring points, clear of the x tick labels.
      const mids = points.slice(1).map((p, i) => [(p[0] + points[i][0]) / 2, (p[1] + points[i][1]) / 2]);
      const pickLine = p => {
        const pick = chart._sceneRenderer.pick(p);
        return !!pick && pick.node.shapeType === "Line";
      };
      const outside = mids.filter(p => p[1] > bottom + 10 && p[1] < height - 2);
      // Points well inside the plot, away from the axes drawn over its edges.
      const plot = plotRect(chart);
      const inside = points.filter(p => p[0] > plot.x + 10 && p[0] < plot.x + plot.width - 10 &&
        p[1] > plot.y + 10 && p[1] < bottom - 10);
      return {outside: outside.map(pickLine), inside: inside.map(pickLine)};
    `,
      renderer,
    );
    assert.ok(
      r.outside.length >= 2,
      "the dip lies on the surface below the plot",
    );
    assert.deepStrictEqual(
      r.outside,
      r.outside.map(() => false),
      "the line below the axis doesn't pick",
    );
    assert.ok(r.inside.length >= 2, "and some of it inside the plot");
    assert.ok(r.inside.every(Boolean), "which still picks");
  });

  it(`[${renderer}] each small-multiples panel clips to its own plot`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(rows).groupBy("id").x("x").y("value")
        .yDomain([980]).legend(false).facet("id")
        .shapeConfig({Line: {stroke: "#ff0000", strokeWidth: 3}})
        .renderer(arg);
      await done(chart);
      const count = await pixels(chart);
      const {height} = size(chart);
      return clips(chart).map(c => ({
        panel: c.key.split("/")[0],
        x: c.x,
        inside: count(c, red),
        below: count({x: c.x, y: c.y + c.height + 2, width: c.width, height}, red),
      }));
    `,
      renderer,
    );
    const panels = new Set(r.map(c => c.panel));
    assert.strictEqual(panels.size, 2, "both panels clip");
    const lefts = [...new Set(r.map(c => Math.round(c.x)))];
    assert.strictEqual(lefts.length, 2, "at their own positions");
    r.forEach(c => {
      assert.ok(c.inside > 50, `${c.panel} draws its line`);
      assert.strictEqual(c.below, 0, `${c.panel} draws nothing below its plot`);
    });
  });
}

it("a chart whose domains cover its data, and a BarChart, add no clip", async () => {
  const r = await page(`
    const counts = [];
    for (const chart of [
      new d3plus.LinePlot().data(rows).groupBy("id").x("x").y("value").lineMarkers(true),
      new d3plus.AreaPlot().data(rows).groupBy("id").x("x").y("value"),
      new d3plus.LinePlot().data(rows).groupBy("id").x("x").y("value").yDomain([880, 1040]),
      new d3plus.BarChart().data(alpha).groupBy("id").x("x").y("value").yDomain([980]),
      new d3plus.BarChart().data(alpha).groupBy("id").x("x").y("value").yDomain([980]).renderer("canvas"),
    ]) {
      await done(chart);
      counts.push(clips(chart).length);
      document.querySelector("#viz").innerHTML = "";
    }
    return counts;
  `);
  assert.deepStrictEqual(r, [0, 0, 0, 0, 0]);
});

it("a zoomable plot still measures its clipped marks for the automatic zoomMax", async () => {
  const r = await page(`
    const chart = new d3plus.LinePlot().data(rows).groupBy("id").x("x").y("value").yDomain([980]).zoom(true);
    await done(chart);
    const shapes = chart._zoomShapes || [];
    return {
      clips: clips(chart).length,
      lines: shapes.filter(n => n.shapeType === "Line" && !String(n.key).endsWith("::hit")).length,
      groups: shapes.filter(isClip).length,
    };
  `);
  assert.ok(r.clips >= 1, "the lines are clipped");
  assert.strictEqual(r.lines, 2, "both lines are measured");
  assert.strictEqual(r.groups, 0, "not their clip group");
});

it("a zoomed plot leaves its marks to the zoom's own clip", async () => {
  const r = await page(`
    const chart = new d3plus.LinePlot().data(rows).groupBy("id").x("x").y("value").yDomain([980]).zoom(true);
    await done(chart);
    const before = clips(chart).length;
    chart._zoomRescale({k: 2, x: -200, y: -100});
    const content = chart._chartScene.find(n => n.key === "plot-zoom-content");
    const lines = content.children.filter(n => n.shapeType === "Line" && !String(n.key).endsWith("::hit"));
    let groups = 0;
    walk(chart._chartScene, n => { if (isClip(n)) groups++; });
    return {before, zoomClip: !!content.clip, lines: lines.length, groups};
  `);
  assert.ok(r.before >= 1, "clipped at its natural scale");
  assert.ok(r.zoomClip, "the zoomed content is clipped");
  assert.strictEqual(
    r.lines,
    2,
    "the lines sit directly in it, so the zoom's frames tween",
  );
  assert.strictEqual(r.groups, 0, "with no clip group of their own");
});
