import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `zoomAxes`: a Plot zooms and pans along one axis while the other refits
    to the rows in view. Covers the zoom buttons, Ctrl + wheel, a drag pan,
    the drawn brush box (which spans the plot's height), a horizontal chart,
    a stacked chart, a user domain that stays put, a category axis that
    can't zoom, and the minimap. Both backends.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";
const DAY = 864e5;

const PRELUDE = `
  const daily = [];
  for (let i = 0; i < 1000; i++)
    daily.push({id: "price", date: new Date(2021, 0, 1 + i), value: 100 + i / 4 + 30 * Math.sin(i / 45)});
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const domainOf = axis => axis._d3Scale.domain().map(Number);
  const sorted = d => [Math.min(...d), Math.max(...d)];
  const zoomSurface = chart => (chart._zoomEventTarget || chart._container).node();
  const click = cls => document.querySelector("#viz ." + cls).click();
  // Mouse events on the zoom surface at surface point [x, y].
  const mouse = (chart, type, [x, y], target, init = {}) => {
    const el = zoomSurface(chart);
    const r = el.getBoundingClientRect();
    (target || el).dispatchEvent(new MouseEvent(type, {
      bubbles: true, cancelable: true, view: window, button: 0,
      clientX: r.left + x, clientY: r.top + y, ...init,
    }));
  };
  const drag = (chart, [x, y], [dx, dy], init) => {
    mouse(chart, "mousedown", [x, y], null, init);
    mouse(chart, "mousemove", [x + dx / 2, y + dy / 2], window, init);
    mouse(chart, "mousemove", [x + dx, y + dy], window, init);
    mouse(chart, "mouseup", [x + dx, y + dy], window, init);
  };
  const wheel = (chart, [x, y], deltaY) => {
    const el = zoomSurface(chart);
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new WheelEvent("wheel", {
      bubbles: true, cancelable: true, view: window, ctrlKey: true,
      clientX: r.left + x, clientY: r.top + y, deltaY, deltaMode: 0,
    }));
  };
  // The extent of the values at dates in [lo, hi].
  const valuesIn = (rows, key, [lo, hi]) => sorted(rows.filter(d => +d.date >= lo && +d.date <= hi).map(d => d[key]));
`;

function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

const span = d => Math.abs(d[1] - d[0]);
const covers = (outer, inner) =>
  Math.min(...outer) <= inner[0] + 1e-9 &&
  Math.max(...outer) >= inner[1] - 1e-9;

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] zoomAxes "x": buttons, wheel and drag zoom the dates while y refits; reset restores`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(daily).groupBy("id").x("date").time("date").y("value")
        .timeline(false).legend(false).zoomAxes("x").renderer(arg);
      await done(chart);
      const state = () => ({x: domainOf(chart._xAxis), y: domainOf(chart._yAxis)});
      const base = state();
      click("zoom-in");
      click("zoom-in");
      await frames();
      const zoomed = state();
      wheel(chart, [200, 200], -300);
      await frames();
      const wheeled = state();
      drag(chart, [320, 200], [150, 40]);
      await frames();
      const panned = state();
      const visible = s => valuesIn(daily, "value", sorted(s.x));
      click("zoom-reset");
      await frames();
      return {
        base, zoomed, wheeled, panned, reset: state(),
        zoomedIn: visible(zoomed), pannedIn: visible(panned),
        rescaled: Object.keys(chart._plotZoomBase.scales),
        refit: Object.keys(chart._plotZoomBase.refit),
      };
    `,
      renderer,
    );

    assert.deepStrictEqual(r.rescaled, ["x"], "only x rescales");
    assert.deepStrictEqual(r.refit, ["y"], "y refits");
    assert.ok(
      Math.abs(span(r.zoomed.x) - span(r.base.x) / 4) < DAY,
      "two zoom-ins show a quarter of the dates",
    );
    assert.ok(covers(r.zoomed.y, r.zoomedIn), "y spans the values in view");
    assert.ok(
      span(r.zoomed.y) < span(r.base.y) * 0.75,
      `y narrows to them (${r.zoomed.y} vs ${r.base.y})`,
    );
    assert.ok(span(r.wheeled.x) < span(r.zoomed.x), "Ctrl + wheel zooms x in");
    assert.ok(
      r.panned.x[0] < r.wheeled.x[0],
      "a drag right shows earlier dates",
    );
    assert.ok(
      Math.abs(span(r.panned.x) - span(r.wheeled.x)) < 1000,
      "and keeps the window's length (the vertical part of the drag does nothing)",
    );
    assert.ok(covers(r.panned.y, r.pannedIn), "y refits as it pans");
    assert.deepStrictEqual(r.reset.x, r.base.x, "reset restores x");
    assert.deepStrictEqual(r.reset.y, r.base.y, "and y");
  });

  it(`[${renderer}] zoomAxes "x" with zoomDrag "brush": the box spans the plot's height and zooms to its dates`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(daily).groupBy("id").x("date").time("date").y("value")
        .timeline(false).legend(false).zoomAxes("x").zoomDrag("brush").renderer(arg);
      await done(chart);
      const plot = chart._plotArea, ct = chart._chartTransform;
      const left = ct.x + plot.x, top = ct.y + plot.y;
      const base = domainOf(chart._xAxis);
      const at = x => chart._xAxis._d3Scale.invert(x - ct.x);
      mouse(chart, "mousedown", [left + 100, top + 60]);
      mouse(chart, "mousemove", [left + 150, top + 80], window);
      mouse(chart, "mousemove", [left + 250, top + 90], window);
      const sel = document.querySelector("#viz g.d3plus-zoom-brush .selection");
      const mid = {height: +sel.getAttribute("height"), y: +sel.getAttribute("y"), width: +sel.getAttribute("width")};
      const want = [+at(left + 100), +at(left + 250)];
      mouse(chart, "mouseup", [left + 250, top + 90], window);
      await frames();
      return {mid, plotHeight: plot.height, plotTop: plot.y + ct.y - chart._margin.top, want, after: domainOf(chart._xAxis), base};
    `,
      renderer,
    );
    assert.ok(
      Math.abs(r.mid.height - r.plotHeight) < 1,
      `the box spans the plot's height (${r.mid.height} vs ${r.plotHeight})`,
    );
    assert.ok(Math.abs(r.mid.width - 150) < 1, "and the dragged width");
    assert.ok(
      Math.abs(r.after[0] - r.want[0]) < DAY &&
        Math.abs(r.after[1] - r.want[1]) < DAY,
      "releasing shows the box's dates",
    );
  });

  it(`[${renderer}] zoomAxes "y" on a horizontal plot zooms its dates and refits x`, async () => {
    const r = await page(
      `
      const chart = new d3plus.LinePlot()
        .data(daily.slice(0, 300)).groupBy("id").discrete("y").y("date").time("date").x("value")
        .timeline(false).legend(false).zoomAxes("y").renderer(arg);
      await done(chart);
      const base = {x: domainOf(chart._xAxis), y: domainOf(chart._yAxis)};
      click("zoom-in");
      click("zoom-in");
      await frames();
      const zoomed = {x: domainOf(chart._xAxis), y: domainOf(chart._yAxis)};
      return {
        base, zoomed, inView: valuesIn(daily.slice(0, 300), "value", sorted(zoomed.y)),
        rescaled: Object.keys(chart._plotZoomBase.scales),
      };
    `,
      renderer,
    );
    assert.deepStrictEqual(r.rescaled, ["y"]);
    assert.ok(
      Math.abs(span(r.zoomed.y) - span(r.base.y) / 4) < DAY,
      "the dates zoom",
    );
    assert.ok(covers(r.zoomed.x, r.inView), "x spans the values in view");
    assert.ok(span(r.zoomed.x) < span(r.base.x), "and narrows to them");
  });
}

it('zoomAxes "x" on a StackedArea refits the value axis to the stacks in view, from 0', async () => {
  const r = await page(`
    const rows = [];
    ["a", "b"].forEach((id, s) => {
      for (let i = 0; i < 48; i++)
        rows.push({id, date: new Date(2020, i, 1), value: 10 + i * i * (s + 1) / 10});
    });
    const chart = new d3plus.StackedArea()
      .data(rows).groupBy("id").x("date").time("date").y("value")
      .timeline(false).legend(false).zoomAxes("x");
    await done(chart);
    const base = domainOf(chart._yAxis);
    // Zoom into the earliest dates, where the stacks are lowest.
    chart._zoomToBounds([[chart._chartTransform.x + chart._plotArea.x, 0], [chart._chartTransform.x + chart._plotArea.x + chart._plotArea.width / 4, 10]], 0);
    await frames();
    const x = sorted(domainOf(chart._xAxis));
    const tops = {};
    rows.filter(d => +d.date >= x[0] && +d.date <= x[1]).forEach(d => (tops[+d.date] = (tops[+d.date] || 0) + d.value));
    return {base, zoomed: domainOf(chart._yAxis), top: Math.max(...Object.values(tops))};
  `);
  assert.strictEqual(
    Math.min(...r.zoomed),
    0,
    "the stack's base stays in view",
  );
  assert.ok(
    Math.max(...r.zoomed) >= r.top - 1e-9,
    "the tallest stack in view fits",
  );
  assert.ok(
    Math.max(...r.zoomed) < Math.max(...r.base) / 2,
    `the axis shrinks to it (${r.zoomed} vs ${r.base})`,
  );
});

it('zoomAxes "x": a BarChart keeps its baseline, and a y domain the user set stays put', async () => {
  const r = await page(`
    const monthly = daily.filter(d => d.date.getDate() === 1);
    const bars = new d3plus.BarChart()
      .data(monthly).groupBy("id").x("date").time("date").y("value")
      .timeline(false).legend(false).zoomAxes("x");
    await done(bars);
    click("zoom-in");
    await frames();
    const barY = domainOf(bars._yAxis);
    bars.select(null);
    document.querySelector("#viz").innerHTML = "";
    const fixed = new d3plus.LinePlot()
      .data(daily).groupBy("id").x("date").time("date").y("value")
      .timeline(false).legend(false).zoomAxes("x").yDomain([0, 500]);
    await done(fixed);
    const before = domainOf(fixed._yAxis);
    click("zoom-in");
    await frames();
    return {barY, before, after: domainOf(fixed._yAxis), refit: Object.keys(fixed._plotZoomBase.refit)};
  `);
  assert.strictEqual(Math.min(...r.barY), 0, "bars still grow from 0");
  assert.deepStrictEqual(r.refit, [], "a user domain doesn't refit");
  assert.deepStrictEqual(r.after, r.before, "and stays as set");
});

it('zoomAxes "x" on a category BarChart zooms its value axis, as without it', async () => {
  const r = await page(`
    const chart = new d3plus.BarChart()
      .data([{id: "a", v: 3}, {id: "b", v: 8}, {id: "c", v: 5}]).groupBy("id").x("id").y("v")
      .legend(false).zoomAxes("x");
    await done(chart);
    return Object.keys(chart._plotZoomBase.scales);
  `);
  assert.deepStrictEqual(r, ["y"]);
});

it('zoomAxes "x": the minimap\'s viewport box spans its height', async () => {
  const r = await page(`
    const chart = new d3plus.LinePlot()
      .data(daily).groupBy("id").x("date").time("date").y("value")
      .timeline(false).legend(false).zoomAxes("x");
    await done(chart);
    click("zoom-in");
    await frames();
    const outer = document.querySelector("#viz .d3plus-minimap").getBoundingClientRect();
    const view = document.querySelector("#viz .d3plus-minimap-viewport").getBoundingClientRect();
    return {outer: [outer.width, outer.height], view: [view.width, view.height]};
  `);
  assert.ok(
    Math.abs(r.view[1] - r.outer[1]) < 2,
    `full height (${r.view[1]} of ${r.outer[1]})`,
  );
  assert.ok(Math.abs(r.view[0] - r.outer[0] / 2) < 2, "half the width at 2×");
});
