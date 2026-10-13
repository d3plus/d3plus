import assert from "assert";
import {bundle, render, closeBrowser} from "../playwright.js";

/**
    A Plot zooms a time axis the way it zooms a linear one: the zoom
    controls, a drag, and a brushed selection rescale the axis's dates in
    place, the axis re-ticks for the window it shows (in the chart's
    locale), the marks move with it, and reset restores the original view.
    Bars on a zoomed time axis widen with the zoom, also once a pan puts the
    first or last bar against the plot's edge. Both backends, and the Canvas
    backend's hit-testing follows the zoomed marks.
*/

// The first page waits on the UMD build; build it up front.
before(async function () {
  this.timeout(120000);
  await bundle();
});

after(async () => {
  await closeBrowser();
});

const box = "<div id='viz' style='width:640px;height:400px'></div>";

const DAY = 864e5;

// Page-side helpers: daily and monthly sample data, a render promise, the
// x axis's state, scene walking in surface pixels, and pointer gestures.
const PRELUDE = `
  const daily = [];
  for (let i = 0; i < 1000; i++)
    daily.push({id: "price", date: new Date(2021, 0, 1 + i), value: 100 + 30 * Math.sin(i / 45) + i / 20});
  const monthly = [];
  for (let i = 0; i < 24; i++) monthly.push({id: "sales", date: new Date(2022, i, 1), value: 20 + (i * 7) % 13});
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const domainOf = axis => axis._d3Scale.domain().map(Number);
  const walk = (nodes, fn, o = {x: 0, y: 0, k: 1}) => nodes.forEach(n => {
    const t = n.transform || {};
    const next = {x: o.x + (t.x || 0) * o.k, y: o.y + (t.y || 0) * o.k, k: o.k * (t.scale ?? 1)};
    fn(n, next);
    if (n.children) walk(n.children, fn, next);
  });
  const scene = chart => chart._sceneRenderer._scene.root.children;
  const axisLabels = (chart, key) => {
    const out = [];
    walk(scene(chart), n => {
      if (n.type === "group" && n.key === key)
        walk(n.children, m => { if (m.type === "text") out.push(m.lines.map(l => l.text).join(" ")); });
    });
    return out;
  };
  // Painted bars, in surface pixels, with the date each one plots.
  const bars = chart => {
    const out = [];
    walk(scene(chart), (n, o) => {
      if (n.type === "rect" && n.shapeType === "Bar" && !String(n.key).endsWith("::hit")) {
        out.push({
          date: +(n.datum && n.datum.data ? n.datum.data.date : n.datum.date),
          x: o.x + n.x * o.k, y: o.y + n.y * o.k, width: n.width * o.k, height: n.height * o.k,
        });
      }
    });
    return out;
  };
  const zoomSurface = chart => (chart._zoomEventTarget || chart._container).node();
  const click = cls => document.querySelector("#viz ." + cls).click();
  // A mouse drag on the zoom surface, from surface point [x, y] by [dx, dy].
  const drag = (chart, [x, y], [dx, dy]) => {
    const el = zoomSurface(chart);
    const r = el.getBoundingClientRect();
    const at = (type, px, py, target) => target.dispatchEvent(new MouseEvent(type, {
      bubbles: true, cancelable: true, view: window, button: 0,
      clientX: r.left + px, clientY: r.top + py,
    }));
    at("mousedown", x, y, el);
    at("mousemove", x + dx / 2, y + dy / 2, window);
    at("mousemove", x + dx, y + dy, window);
    at("mouseup", x + dx, y + dy, window);
  };
`;

/** Runs `body` in the page after the prelude. */
function page(body, arg) {
  return render(box, new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`), arg);
}

const span = d => Math.abs(d[1] - d[0]);
// The typical gap between ticks (the median: an axis may add its domain's ends).
const step = ticks => {
  const gaps = ticks.slice(1).map((t, i) => Math.abs(t - ticks[i])).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] zooming a time-axis LinePlot narrows its dates and re-ticks; panning shifts them; reset restores`, async () => {
    const r = await page(`
      const chart = new d3plus.LinePlot()
        .data(daily).groupBy("id").x("date").time("date").y("value")
        .timeline(false).legend(false).locale("es-ES").zoomMax(64)
        .renderer(arg);
      await done(chart);
      const state = () => ({
        domain: domainOf(chart._xAxis),
        y: domainOf(chart._yAxis),
        ticks: chart._xAxis._visibleTicks.map(Number),
        labels: axisLabels(chart, "plot-x-axis"),
        line: (() => {
          let pts;
          // The series line's points, in surface pixels.
          walk(scene(chart), (n, o) => {
            if (n.shapeType === "Line" && n.interactionPoints && (!pts || n.interactionPoints.length > pts.length)) {
              const t = n.transform || {};
              const k = o.k / (t.scale ?? 1), x = o.x - (t.x || 0) * k;
              pts = n.interactionPoints.map(p => x + p.x * k);
            }
          });
          return pts ? [Math.min(...pts), Math.max(...pts)] : null;
        })(),
      });
      const base = state();
      for (let i = 0; i < 4; i++) click("zoom-in");
      await frames();
      const zoomed = state();
      const plotWidth = chart._plotArea.width;
      drag(chart, [320, 200], [120, 0]);
      await frames();
      const panned = state();
      click("zoom-reset");
      await frames();
      const reset = state();
      return {base, zoomed, panned, reset, plotWidth, k: chart._plotZoomBase && Object.keys(chart._plotZoomBase.scales)};
    `, renderer);

    assert.deepStrictEqual(r.k, ["x", "y"], "the time x axis is zoomable, like the linear y axis");
    // 16× narrows the visible dates to a sixteenth, inside the original range.
    assert.ok(Math.abs(span(r.zoomed.domain) - span(r.base.domain) / 16) < DAY, "the date range narrows 16×");
    assert.ok(r.zoomed.domain[0] > r.base.domain[0] && r.zoomed.domain[1] < r.base.domain[1], "inside the original dates");
    assert.ok(Math.abs(span(r.zoomed.y) - span(r.base.y) / 16) < 1e-6, "the value axis zooms with it");
    // Re-ticked for the window: every tick inside it, at a finer interval.
    assert.ok(r.zoomed.ticks.length >= 3, "the zoomed axis has ticks");
    assert.ok(r.zoomed.ticks.every(t => t >= r.zoomed.domain[0] && t <= r.zoomed.domain[1]), "ticks fall inside the zoomed dates");
    assert.ok(step(r.base.ticks) >= 28 * DAY, `unzoomed ticks are months apart (${step(r.base.ticks) / DAY} days)`);
    assert.ok(step(r.zoomed.ticks) <= 7 * DAY, `zoomed ticks step down to days (${step(r.zoomed.ticks) / DAY} days)`);
    // Labels stay in the chart's locale.
    const spanish = /\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/;
    const english = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/;
    assert.ok(r.zoomed.labels.some(l => spanish.test(l)), `zoomed labels are Spanish (${r.zoomed.labels})`);
    assert.ok(!r.zoomed.labels.some(l => english.test(l)), "and not English");
    assert.notDeepStrictEqual(r.zoomed.labels, r.base.labels, "the labels re-tick");
    // The line stretches with the zoom.
    assert.ok(span(r.zoomed.line) > span(r.base.line) * 15, `the line stretches 16× ${JSON.stringify([r.base.line, r.zoomed.line])}`);
    // Dragging right by 120px shows earlier dates, by 120px worth of them.
    const shift = r.zoomed.domain[0] - r.panned.domain[0];
    const expected = 120 * span(r.zoomed.domain) / r.plotWidth;
    assert.ok(Math.abs(shift - expected) < DAY, `panning shifts the dates (${shift / DAY} vs ${expected / DAY} days)`);
    assert.ok(Math.abs(span(r.panned.domain) - span(r.zoomed.domain)) < 1, "panning keeps the window's length");
    // Reset puts everything back.
    assert.deepStrictEqual(r.reset.domain, r.base.domain, "reset restores the dates");
    assert.deepStrictEqual(r.reset.ticks, r.base.ticks, "and the ticks");
    assert.deepStrictEqual(r.reset.labels, r.base.labels, "and the labels");
  });

  it(`[${renderer}] a BarChart on a time axis widens its bars as it zooms, also at the plot's edge`, async () => {
    const r = await page(`
      const chart = new d3plus.BarChart()
        .data(monthly).groupBy("id").x("date").time("date").y("value")
        .timeline(false).legend(false).zoomMax(16)
        .renderer(arg);
      await done(chart);
      const plot = chart._plotArea, ct = chart._chartTransform;
      const inside = b => b.x + b.width > ct.x + plot.x && b.x < ct.x + plot.x + plot.width;
      const base = bars(chart).map(b => b.width);
      click("zoom-in");
      click("zoom-in");
      await frames();
      const zoomed = bars(chart).filter(inside);
      // Drag far left: the zoom stops with the last bar against the right edge.
      drag(chart, [320, 200], [-2000, 0]);
      await frames();
      const end = bars(chart).filter(inside);
      const last = end.reduce((a, b) => (b.date > a.date ? b : a));
      // Canvas and SVG alike, the zoomed bar under the pointer picks.
      const mid = end[Math.floor(end.length / 2)];
      const pick = chart._sceneRenderer.pick([mid.x + mid.width / 2, mid.y + mid.height / 2]);
      const picked = pick && pick.datum ? +(pick.datum.data ? pick.datum.data.date : pick.datum.date) : null;
      return {
        base, zoomed: zoomed.map(b => b.width), end: end.map(b => b.width),
        lastRight: last.x + last.width, plotRight: ct.x + plot.x + plot.width,
        groupPadding: chart._groupPadding, mid: mid.date, picked,
        latest: Math.max(...monthly.map(d => +d.date)), lastDate: last.date,
      };
    `, renderer);

    const base = r.base[0];
    assert.ok(r.base.every(w => Math.abs(w - base) < 0.5), "unzoomed bars share a width");
    // Bar spacing scales 4×; the group padding between bars stays fixed.
    const expected = 4 * (base + r.groupPadding) - r.groupPadding;
    assert.ok(r.zoomed.length && r.zoomed.every(w => Math.abs(w - expected) < 2), `zoomed bars widen 4× (${r.zoomed[0]} vs ${expected})`);
    assert.strictEqual(r.lastDate, r.latest, "the drag reaches the last bar");
    assert.ok(Math.abs(r.lastRight - r.plotRight) < r.end[0], "which sits against the plot's right edge");
    assert.ok(r.end.every(w => Math.abs(w - expected) < 2), "and keeps its width there");
    assert.strictEqual(r.picked, r.mid, "the zoomed bar picks");
  });

  it(`[${renderer}] brushing a time-axis selection zooms to its dates`, async () => {
    const r = await page(`
      const chart = new d3plus.LinePlot()
        .data(daily).groupBy("id").x("date").time("date").y("value")
        .timeline(false).legend(false).zoomMax(64)
        .renderer(arg);
      await done(chart);
      const base = domainOf(chart._xAxis);
      const scale = chart._xAxis._d3Scale.copy();
      const ct = chart._chartTransform, m = chart._margin;
      click("zoom-brush");
      const overlay = document.querySelector("#viz g.d3plus-zoom-brush .overlay");
      const box = overlay.getBoundingClientRect();
      // The brush group sits at the chart margin; select a quarter of the plot.
      const x0 = ct.x + scale.range()[0] + (scale.range()[1] - scale.range()[0]) * 0.25;
      const x1 = ct.x + scale.range()[0] + (scale.range()[1] - scale.range()[0]) * 0.5;
      const at = (type, x, y, target) => target.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, button: 0, detail: 1,
        clientX: box.left + x - m.left, clientY: box.top + y - m.top,
      }));
      at("mousedown", x0, 120, overlay);
      at("mousemove", x1, 160, window);
      at("mouseup", x1, 160, window);
      await new Promise(resolve => setTimeout(resolve, 100));
      await frames();
      return {
        base,
        zoomed: domainOf(chart._xAxis),
        selected: [+scale.invert(x0 - ct.x), +scale.invert(x1 - ct.x)],
        ticks: chart._xAxis._visibleTicks.map(Number),
      };
    `, renderer);

    // A brushed selection fills the chart area (as on a linear axis), which
    // takes in the axes' margins too: the plot shows nearly all of it.
    const selected = span(r.selected);
    assert.ok(span(r.zoomed) > selected * 0.8 && span(r.zoomed) < selected * 1.05, `the brushed dates fill the axis (${span(r.zoomed) / selected})`);
    const mid = (r.selected[0] + r.selected[1]) / 2;
    assert.ok(Math.abs((r.zoomed[0] + r.zoomed[1]) / 2 - mid) < selected * 0.05, "centered on the selection");
    assert.ok(r.ticks.every(t => t >= r.zoomed[0] && t <= r.zoomed[1]), "re-ticked inside the window");
  });

  it(`[${renderer}] a horizontal BarChart zooms its time y axis`, async () => {
    const r = await page(`
      const chart = new d3plus.BarChart()
        .data(monthly).groupBy("id").discrete("y").y("date").time("date").x("value")
        .timeline(false).legend(false).zoomMax(16)
        .renderer(arg);
      await done(chart);
      const base = {y: domainOf(chart._yAxis), bars: bars(chart).map(b => b.height)};
      click("zoom-in");
      click("zoom-in");
      await frames();
      const plot = chart._plotArea, ct = chart._chartTransform;
      const zoomed = {
        y: domainOf(chart._yAxis),
        bars: bars(chart).filter(b => b.y + b.height > ct.y + plot.y && b.y < ct.y + plot.y + plot.height).map(b => b.height),
        ticks: chart._yAxis._visibleTicks.map(Number),
      };
      return {base, zoomed, axes: Object.keys(chart._plotZoomBase.scales), groupPadding: chart._groupPadding};
    `, renderer);

    assert.deepStrictEqual(r.axes, ["x", "y"], "both axes zoom");
    assert.ok(Math.abs(span(r.zoomed.y) - span(r.base.y) / 4) < DAY, "the time y axis narrows 4×");
    assert.ok(r.zoomed.y[0] > r.zoomed.y[1], "keeping its orientation (latest at the top)");
    const lo = Math.min(...r.zoomed.y), hi = Math.max(...r.zoomed.y);
    assert.ok(r.zoomed.ticks.every(t => t >= lo && t <= hi), "re-ticked inside the window");
    const expected = 4 * (r.base.bars[0] + r.groupPadding) - r.groupPadding;
    assert.ok(r.zoomed.bars.length && r.zoomed.bars.every(h => Math.abs(h - expected) < 2), `bars thicken 4× (${r.zoomed.bars[0]} vs ${expected})`);
  });
}
