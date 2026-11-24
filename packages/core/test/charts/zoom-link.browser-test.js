import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Linked zoom (on for every chart in a `link` group): zooming, panning, a
    range button, or a reset in one Plot shows the same window of dates on
    the others, including charts over a different span that the window
    reaches. A chart with `zoom: false`, one whose axis is of another kind,
    one the window doesn't reach, and one whose zoom scales a dimension the
    window doesn't cover keep their view; small multiples show the window in
    each panel it reaches. Both backends.
*/

const box = `
  <div id='a' style='width:600px;height:300px'></div>
  <div id='b' style='width:400px;height:240px'></div>
  <div id='c' style='width:400px;height:240px'></div>
  <div id='d' style='width:400px;height:240px'></div>`;
const DAY = 864e5;

const PRELUDE = `
  const series = (from, days) => {
    const rows = [];
    for (let i = 0; i < days; i++)
      rows.push({id: "s", date: new Date(from, 0, 1 + i), value: 50 + 20 * Math.sin(i / 30) + i / 10});
    return rows;
  };
  const plot = (sel, data, link, extra = {}) => {
    const chart = new d3plus.LinePlot()
      .data(data).groupBy("id").x("date").time("date").y("value")
      .timeline(false).legend(false).duration(0).zoomAxes(["x"])
      .link(link).config(extra).renderer(arg);
    return new Promise(resolve => chart.select(sel).render(() => resolve(chart)));
  };
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const x = chart => chart._xAxis._d3Scale.domain().map(Number);
  const k = chart => chart._plotZoomBase && d3plus.liveTransform(chart).k;
  const click = (sel, cls) => document.querySelector(sel + " ." + cls).click();
  const drag = (chart, [px, py], dx) => {
    const el = (chart._zoomEventTarget || chart._container).node();
    const r = el.getBoundingClientRect();
    const at = (type, cx, target) => target.dispatchEvent(new MouseEvent(type, {
      bubbles: true, cancelable: true, view: window, button: 0,
      clientX: r.left + cx, clientY: r.top + py,
    }));
    at("mousedown", px, el);
    at("mousemove", px + dx / 2, window);
    at("mousemove", px + dx, window);
    at("mouseup", px + dx, window);
  };
`;

function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

const near = (a, b, tolerance = DAY / 2) =>
  Math.abs(a[0] - b[0]) < tolerance && Math.abs(a[1] - b[1]) < tolerance;

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] zooming, panning, a range button and a reset in one chart show the same dates in the other`, async () => {
    const r = await page(
      `
      const link = "zl-" + arg;
      const a = await plot("#a", series(2021, 900), link, {rangeSelector: ["3M", "All"]});
      const b = await plot("#b", series(2021, 900), link);
      const base = {a: x(a), b: x(b)};
      click("#a", "zoom-in");
      click("#a", "zoom-in");
      await frames();
      const zoomed = {a: x(a), b: x(b)};
      drag(b, [200, 120], 120);
      await frames();
      const panned = {a: x(a), b: x(b)};
      document.querySelector("#a .d3plus-range-button").click();
      await frames();
      const ranged = {a: x(a), b: x(b)};
      click("#b", "zoom-reset");
      await frames();
      return {base, zoomed, panned, ranged, reset: {a: x(a), b: x(b)}};
    `,
      renderer,
    );
    assert.ok(near(r.zoomed.a, r.zoomed.b), "zooming one zooms the other");
    assert.ok(r.zoomed.b[1] - r.zoomed.b[0] < (r.base.b[1] - r.base.b[0]) / 3);
    assert.ok(
      r.panned.a[0] < r.zoomed.a[0],
      "panning the other pans the first",
    );
    assert.ok(near(r.panned.a, r.panned.b), "to the same dates");
    assert.ok(near(r.ranged.a, r.ranged.b), "a range button moves both");
    assert.ok(
      r.ranged.b[1] - r.ranged.b[0] < 93 * DAY,
      "to the button's three months",
    );
    assert.deepStrictEqual(r.reset.a, r.base.a, "a reset resets both");
    assert.deepStrictEqual(r.reset.b, r.base.b);
  });
}

it("a chart over a different span shows the same dates; zoom: false, or no data in the window, keep their view", async () => {
  const r = await page(
    `
    const a = await plot("#a", series(2021, 1000), "spans");
    const b = await plot("#b", series(2022, 1000), "spans");
    const c = await plot("#c", series(2021, 1000), {group: "spans", zoom: false});
    const later = await plot("#d", series(2030, 300), "spans");
    const before = {c: x(c), later: x(later)};
    // Zoom into a stretch of 2022, which a and b cover.
    const scale = a._xAxis._d3Scale, ct = a._chartTransform;
    const px = date => scale(date) + ct.x;
    a._zoomToBounds([[px(new Date(2022, 3, 1)), 0], [px(new Date(2022, 8, 1)), 10]], 0);
    await frames();
    return {a: x(a), b: x(b), before, c: x(c), later: x(later), kc: k(c), kl: k(later)};
  `,
    "svg",
  );
  assert.ok(
    near(r.a, [+new Date(2022, 3, 1), +new Date(2022, 8, 1)]),
    "a shows the window",
  );
  assert.ok(near(r.b, r.a), "b, over 2022–2024, shows the same dates");
  assert.deepStrictEqual(r.c, r.before.c, "zoom: false keeps its view");
  assert.strictEqual(r.kc, 1);
  assert.deepStrictEqual(
    r.later,
    r.before.later,
    "a chart the window doesn't reach keeps its view",
  );
  assert.strictEqual(r.kl, 1);
});

it("a number axis doesn't follow a time axis", async () => {
  const r = await page(
    `
    const a = await plot("#a", series(2021, 1000), "kinds");
    const numbers = series(2021, 200).map((d, i) => ({...d, date: undefined, n: i}));
    const e = await new Promise(resolve => {
      const chart = new d3plus.LinePlot()
        .data(numbers).groupBy("id").x("n").y("value").legend(false).duration(0)
        .zoomAxes(["x"]).link("kinds").renderer(arg);
      chart.select("#b").render(() => resolve(chart));
    });
    const before = x(e);
    click("#a", "zoom-in");
    await frames();
    return {before, after: x(e), ka: k(a), ke: k(e)};
  `,
    "svg",
  );
  assert.ok(r.ka > 1);
  assert.deepStrictEqual(r.after, r.before);
  assert.strictEqual(r.ke, 1);
});

it("a window that only partly reaches a chart's data still shows the same dates", async () => {
  const r = await page(
    `
    const a = await plot("#a", series(2021, 1000), "partial");
    const b = await plot("#b", series(2023, 300), "partial");
    const scale = a._xAxis._d3Scale, ct = a._chartTransform;
    const px = date => scale(date) + ct.x;
    a._zoomToBounds([[px(new Date(2022, 9, 1)), 0], [px(new Date(2023, 2, 1)), 10]], 0);
    await frames();
    return {a: x(a), b: x(b), kb: k(b)};
  `,
    "svg",
  );
  assert.ok(r.kb > 1, "b zooms");
  assert.ok(near(r.a, r.b, 40 * DAY), `to the same dates (${r.a} vs ${r.b})`);
});

it("a chart zooming both axes ignores a window along x alone", async () => {
  const r = await page(
    `
    const a = await plot("#a", series(2021, 900), "dims");
    const b = await plot("#b", series(2021, 900), "dims", {zoomAxes: ["x", "y"]});
    document.querySelector("#a .zoom-in").click();
    await frames();
    return {ka: k(a), kb: k(b)};
  `,
    "svg",
  );
  assert.ok(r.ka > 1);
  assert.strictEqual(
    r.kb,
    1,
    "b would have to zoom y too, so it keeps its view",
  );
});

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] small multiples show a linked window in each panel it reaches`, async () => {
    const r = await page(
      `
      const a = await plot("#a", series(2021, 900), "facets");
      const rows = [
        ...series(2021, 900).map(d => ({...d, id: "early"})),
        ...series(2026, 300).map(d => ({...d, id: "late"})),
      ];
      const f = await plot("#b", rows, "facets", {facet: "id", facetConfig: {scales: "independent"}, zoomAxes: undefined});
      const spans = () => f._facetPanels.map(p => {
        let pts = [];
        const walk = n => {
          if (n.interactionPoints && n.interactionPoints.length > pts.length) pts = n.interactionPoints;
          (n.children || []).forEach(walk);
        };
        p.scene.forEach(walk);
        const xs = pts.map(q => q.x);
        return Math.max(...xs) - Math.min(...xs);
      });
      const before = spans();
      click("#a", "zoom-in");
      click("#a", "zoom-in");
      await frames();
      await frames();
      await frames();
      const after = spans();
      click("#a", "zoom-reset");
      await frames();
      await frames();
      await frames();
      return {before, after, reset: spans(), facetZoom: f._facetZoom};
    `,
      renderer,
    );
    assert.ok(
      r.after[0] > r.before[0] * 3,
      "the panel the window reaches zooms",
    );
    assert.ok(
      Math.abs(r.after[1] - r.before[1]) < 1,
      "the other keeps its view",
    );
    assert.ok(Math.abs(r.reset[0] - r.before[0]) < 1, "a reset resets them");
    assert.strictEqual(r.facetZoom, undefined);
  });
}
