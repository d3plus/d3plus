import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    #611, interactively: a reversed timeline (`timelineConfig.reverse`) still
    brushes the dates under the pointer and filters to them earliest first,
    and a reversed axis's hover badge (a real pointer) reads the hovered
    value.
*/

const rows = [];
["A", "B"].forEach((id, k) => {
  for (let year = 2005; year <= 2020; year++)
    rows.push({id, year, value: 10 + k * 5 + (year % 7)});
});

/**
    Renders a BarChart over `rows` with a timeline, presses on 2016's tick
    and drags to 2010's (dispatched pointer events: d3-brush reads them from
    the page's own window), and reads the selection back.
*/
const brushTimeline = ([rows, reverse]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .data(rows)
      .groupBy("id")
      .x("id")
      .y("value")
      .time("year")
      .legend(false)
      .timelineConfig({reverse, brushing: true})
      .duration(0)
      .select("#viz");
    const years = () =>
      viz._timelineSelection.map(d => new Date(d).getFullYear());
    viz.render(() => {
      const initial = years();
      const at = text => {
        const node = Array.from(document.querySelectorAll("#viz text")).find(
          n => n.textContent === text,
        );
        const b = node.getBoundingClientRect();
        return {clientX: b.left + b.width / 2, clientY: b.top - 6};
      };
      const from = at("2016"),
        to = at("2010");
      const fire = (el, type, point) =>
        el.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            ...point,
          }),
        );
      fire(
        document.elementFromPoint(from.clientX, from.clientY),
        "mousedown",
        from,
      );
      fire(window, "mousemove", {
        clientX: (from.clientX + to.clientX) / 2,
        clientY: from.clientY,
      });
      fire(window, "mousemove", to);
      fire(window, "mouseup", to);
      setTimeout(
        () =>
          resolve({
            initial,
            from: from.clientX,
            to: to.clientX,
            selection: years(),
          }),
        100,
      );
    });
  });

for (const reverse of [false, true]) {
  it(`timeline (reverse: ${reverse}): brushing 2016 back to 2010 selects 2010–2016`, async () => {
    const r = await render(
      '<div id="viz" style="width:700px;height:320px;font-family:sans-serif"></div>',
      brushTimeline,
      [rows, reverse],
    );
    assert.deepStrictEqual(r.initial, [2020, 2020], "starts on the latest");
    assert.ok(
      reverse ? r.from < r.to : r.from > r.to,
      "2016 sits on the reversed side",
    );
    assert.deepStrictEqual(r.selection, [2010, 2016]);
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a reversed axis's hover badge reads the hovered value`, async () => {
    const {page, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;font-family:sans-serif"></div>',
    );
    try {
      await page.evaluate(
        ([renderer]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.Plot()
              .data([
                {id: "a", gdp: 1000, life: 60},
                {id: "b", gdp: 2000, life: 70},
                {id: "c", gdp: 3000, life: 65},
              ])
              .groupBy("id")
              .x("gdp")
              .y("life")
              .legend(false)
              .xConfig({reverse: true})
              .yConfig({reverse: true})
              .renderer(renderer)
              .duration(0)
              .select("#viz");
            window.__viz = viz;
            viz.render(resolve);
          }),
        [renderer],
      );
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        let found;
        const walk = nodes =>
          nodes.forEach(n => {
            if (!found && n.key === "b" && n.type === "circle") found = n;
            if (n.children) walk(n.children);
          });
        walk(viz._chartScene);
        const t = found.transform || {};
        const surface = document
          .querySelector("#viz svg, #viz canvas")
          .getBoundingClientRect();
        const c = viz._chartTransform || {x: 0, y: 0};
        return [
          surface.left + c.x + (t.x || 0) + found.cx,
          surface.top + c.y + (t.y || 0) + found.cy,
        ];
      });
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(80);
      const badges = await page.evaluate(() => {
        const out = [];
        const walk = nodes =>
          nodes.forEach(n => {
            const m = `${n.key}`.match(/plot-axis-hover-badge-(\w+)$/);
            if (m) out.push([m[1], n.children[1].lines[0].text]);
            if (n.children) walk(n.children);
          });
        walk([window.__viz._paintedScene.root]);
        return out;
      });
      assert.deepStrictEqual(badges, [
        ["x", "2k"],
        ["y", "70"],
      ]);
    } finally {
      await close();
    }
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a reversed discrete x axis moves the shared crosshair with the hovered year`, async () => {
    const series = [];
    ["Alpha", "Beta", "Gamma"].forEach((id, s) =>
      [2010, 2011, 2012, 2013].forEach((year, k) =>
        series.push({id, year, value: 10 * (s + 1) + k}),
      ),
    );
    const {page, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;font-family:sans-serif"></div>',
    );
    try {
      await page.evaluate(
        ([series, renderer]) =>
          new Promise(resolve => {
            const viz = new window.d3plus.LinePlot()
              .data(series)
              .groupBy("id")
              .x("year")
              .y("value")
              .legend(false)
              .xConfig({reverse: true})
              .renderer(renderer)
              .duration(0)
              .select("#viz");
            window.__viz = viz;
            viz.render(resolve);
          }),
        [series, renderer],
      );
      // Gamma's 2012 point, in client coordinates.
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        let found;
        const walk = nodes =>
          nodes.forEach(n => {
            if (!found && n.key === "Gamma" && n.interactionPoints) found = n;
            if (n.children) walk(n.children);
          });
        walk(viz._chartScene);
        const year2012 = found.interactionPoints.find(
          p => Math.abs(p.x - viz._xFunc(2012)) < 1,
        );
        const surface = document
          .querySelector("#viz svg, #viz canvas")
          .getBoundingClientRect();
        const c = viz._chartTransform || {x: 0, y: 0};
        return [
          surface.left + c.x + year2012.x,
          surface.top + c.y + year2012.y,
        ];
      });
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(80);
      const r = await page.evaluate(() => {
        const viz = window.__viz;
        const out = {badges: [], crosshair: null};
        const walk = nodes =>
          nodes.forEach(n => {
            const m = `${n.key}`.match(/plot-axis-hover-badge-(\w+)$/);
            if (m) out.badges.push([m[1], n.children[1].lines[0].text]);
            if (n.key === "plot-crosshair") out.crosshair = true;
            if (n.children) walk(n.children);
          });
        walk([viz._paintedScene.root]);
        out.hovered = viz._axisHoverState && viz._axisHoverState.value;
        return out;
      });
      assert.ok(r.crosshair, "the crosshair shows");
      assert.deepStrictEqual(r.badges, [
        ["x", "2012"],
        ["y", "32"],
      ]);
    } finally {
      await close();
    }
  });
}
