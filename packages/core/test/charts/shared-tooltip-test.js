/* global getComputedStyle, requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #779: hovering a Plot's plot area — even empty space between marks — snaps
    to the nearest discrete position, draws a crosshair, and lists every
    series there in one tooltip (title = the continuous axis, one row per
    series colored with its stroke). Driven in real Chromium: the SVG backend
    only receives pointer events over painted nodes, which the transparent
    hover surface provides.
*/

const data = [];
["Alpha", "Beta", "Gamma"].forEach((id, s) =>
  [2010, 2011, 2012, 2013].forEach((year, k) =>
    data.push({id, year, value: 10 * (s + 1) + k}),
  ),
);

const probe = ([kind, config, data, fx, target]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[kind]()
      .data(data)
      .groupBy("id")
      .x("year")
      .y("value")
      .config(config)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      const surface = svg.querySelector('[data-key="plot-hover-surface"]');
      const r = svg.getBoundingClientRect();
      const a = viz._plotArea, c = viz._chartTransform;
      // Near the top of the plot area: empty space above every mark.
      const clientX = r.left + c.x + a.x + a.width * fx;
      const clientY = r.top + c.y + a.y + 4;
      // `target` hovers a specific mark (the renderer picks from the event
      // target); otherwise the hover surface, i.e. empty plot space.
      (target && svg.querySelector(target) || surface || svg).dispatchEvent(
        new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
      );
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        const cells = tip
          // Per row: [[name, swatch fill, swatch kind, colored text spans], [value]].
          ? Array.from(tip.querySelectorAll("tbody tr")).map(tr =>
            Array.from(tr.querySelectorAll("td")).map(td => {
              const sw = td.querySelector(".d3plus-tooltip-swatch");
              // A Line swatch is a stroke through a dot (its last child).
              const line = sw && sw.classList.contains("d3plus-tooltip-swatch-line");
              const paint = line ? sw.lastElementChild : sw;
              return [
                td.textContent,
                paint ? paint.style.backgroundColor : null,
                sw ? line ? "line" : sw.style.borderRadius === "50%" ? "dot" : "square" : null,
                Array.from(td.querySelectorAll("span:not(.d3plus-tooltip-swatch):not(.d3plus-tooltip-swatch span)")).filter(s => s.style.color).length + (td.style.color ? 1 : 0),
              ];
            }))
          : [];
        const lines = Array.from(svg.querySelectorAll('[data-key]'))
          .filter(n => /^(Alpha|Beta|Gamma)$/.test(n.getAttribute("data-key")))
          .map(n => [n.getAttribute("data-key"), n.getAttribute("stroke")]);
        // Opacity of every data mark (series lines/areas and `<id>_<year>` bars).
        const opacity = Object.fromEntries(Array.from(svg.querySelectorAll("[data-key]"))
          .filter(n => /^(Alpha|Beta|Gamma)(_\d+)?$/.test(n.getAttribute("data-key")))
          .map(n => [n.getAttribute("data-key"), Number(n.getAttribute("opacity") ?? 1)]));
        const crosshairEl = svg.querySelector('[data-key="plot-crosshair"]');
        const marks = Array.from(svg.querySelectorAll("[data-key]"));
        const firstMark = marks.findIndex(n => /^(Alpha|Beta|Gamma)(_\d+)?$/.test(n.getAttribute("data-key")));
        const arrow = tip && tip.querySelector(".d3plus-tooltip-arrow");
        const tipBox = tip && tip.getBoundingClientRect();
        const out = {
          surface: !!surface,
          // Crosshair DOM position relative to the first data mark (behind < 0).
          crosshairOrder: crosshairEl ? marks.indexOf(crosshairEl) - firstMark : null,
          markers: svg.querySelectorAll('[data-key="plot-shared-markers"] circle').length,
          // Crosshair x vs. the hovered target's own center.
          targetOffset: crosshairEl && target && svg.querySelector(target)
            ? (b => b.left + b.width / 2)(crosshairEl.getBoundingClientRect()) -
              (b => b.left + b.width / 2)(svg.querySelector(target).getBoundingClientRect())
            : null,
          arrowHidden: arrow ? getComputedStyle(arrow).display === "none" : null,
          // Tooltip center vs. the crosshair's on-screen x.
          tipCenterOffset: tipBox && crosshairEl
            ? tipBox.left + tipBox.width / 2 - (crosshairEl.getBoundingClientRect().left + crosshairEl.getBoundingClientRect().width / 2)
            : null,
          align: tip ? Array.from(tip.querySelectorAll("tbody tr:first-child td")).map(td => td.style.textAlign) : [],
          title: tip ? tip.querySelector(".d3plus-tooltip-title").textContent : null,
          header: tip ? Array.from(tip.querySelectorAll("thead th")).map(th => th.textContent) : [],
          cells,
          lines,
          opacity,
          crosshair: !!svg.querySelector('[data-key="plot-crosshair"]'),
        };
        svg.dispatchEvent(new MouseEvent("mouseleave", {clientX: 0, clientY: 0}));
        requestAnimationFrame(() => setTimeout(() => {
          out.crosshairAfterLeave = !!svg.querySelector('[data-key="plot-crosshair"]');
          out.tipAfterLeave = !!document.querySelector(".d3plus-tooltip");
          const t = viz._tooltipClass;
          out.restored = {arrow: t.arrow()({arrow: "x"}), thead: t.thead().length, tbody: t.tbody().length};
          resolve(out);
        }, 30));
      }, 30));
    });
  });

const run = (kind, config = {}, rows = data, fx = 0.34, target = null) =>
  render('<div id="viz" style="width:600px;height:400px"></div>', probe, [kind, config, rows, fx, target]);

after(closeBrowser);

it("shared tooltip — LinePlot: empty-space hover lists every series, with stroke-colored line glyphs", async () => {
  const r = await run("LinePlot");
  assert.ok(r.surface, "hover surface emitted");
  assert.ok(r.crosshair, "crosshair drawn");
  assert.strictEqual(r.title, "value", "title is the continuous axis key");
  // fx 0.34 → nearest column is 2011; rows sorted by value, descending.
  assert.deepStrictEqual(r.cells.map(([name, value]) => [name[0], value[0]]),
    [["Gamma", "31"], ["Beta", "21"], ["Alpha", "11"]]);
  const strokes = Object.fromEntries(r.lines.map(([k, s]) => [k, s]));
  for (const [[name, fill, radius, coloredName], [, valueFill, , coloredValue]] of r.cells) {
    assert.ok(fill, `${name} has a swatch`);
    assert.strictEqual(radius, "line", `${name} swatch is a line glyph`);
    assert.strictEqual(fill.replace(/\s/g, ""), strokes[name].replace(/\s/g, ""), `${name} swatch filled with its stroke`);
    assert.strictEqual(valueFill, null, "no swatch on the value");
    assert.strictEqual(coloredName + coloredValue, 0, "text keeps the default color");
  }
  assert.ok(!r.crosshairAfterLeave, "crosshair clears on leaving the chart");
  assert.ok(!r.tipAfterLeave, "tooltip hides on leaving the chart");
  assert.deepStrictEqual(r.header, ["year", "2011"], "header row names the hovered discrete value");
  assert.deepStrictEqual(r.restored, {arrow: "x", thead: 0, tbody: 0},
    "the tooltip's own arrow/thead/tbody are restored after the shared hover");
  assert.ok(r.crosshairOrder < 0, "crosshair draws behind the lines");
  assert.strictEqual(r.markers, 3, "a marker on each hovered line point");
  assert.strictEqual(r.arrowHidden, true, "no tooltip arrow");
  assert.ok(Math.abs(r.tipCenterOffset) < 1, `tooltip centered on the column (off by ${r.tipCenterOffset}px)`);
  assert.deepStrictEqual(r.align, ["left", "right"], "label column left, value column right");
});

it("shared tooltip — StackedArea reports raw (unstacked) values", async () => {
  const r = await run("StackedArea");
  assert.ok(r.crosshairOrder > 0, "crosshair draws in front of the areas");
  assert.strictEqual(r.markers, 0, "no markers on areas");
  assert.ok(r.cells.every(([[, , radius]]) => radius === "square"), "Area swatches are squares");
  assert.deepStrictEqual(r.cells.map(([name, value]) => [name[0], value[0]]),
    [["Gamma", "31"], ["Beta", "21"], ["Alpha", "11"]]);
});

it("shared tooltip — hovering a line dims no series", async () => {
  const r = await run("LinePlot", {}, data, 0.34, '[data-key="Beta"]');
  assert.ok(r.crosshair, "shared hover active over the line");
  assert.strictEqual(r.cells.length, 3, "every series listed");
  for (const k of ["Alpha", "Beta", "Gamma"])
    assert.strictEqual(r.opacity[k], 1, `${k} keeps full opacity`);
});

const texts = cells => cells.map(([a, b]) => [a[0], b[0]]);

it("shared tooltip — side-by-side bars: nothing over empty space", async () => {
  const r = await run("BarChart", {}, data, 0.1);
  assert.ok(!r.surface, "no hover surface");
  assert.ok(!r.crosshair, "no crosshair");
  assert.strictEqual(r.cells.length, 0, "no rows");
});

it("shared tooltip — side-by-side bars: a hovered bar gets a snapped x/y tooltip", async () => {
  const r = await run("BarChart", {}, data, 0.1, '[data-key="Beta_2010"]');
  assert.ok(r.crosshair, "crosshair through the bar");
  assert.ok(Math.abs(r.targetOffset) < 1, `crosshair on the bar's own center, not its band (off by ${r.targetOffset}px)`);
  assert.strictEqual(r.title, "Beta", "default title (the bar's label)");
  assert.deepStrictEqual(texts(r.cells), [["year", "2010"], ["value", "20"]]);
  assert.strictEqual(r.arrowHidden, true, "no tooltip arrow");
  assert.ok(Math.abs(r.tipCenterOffset) < 1, "tooltip centered on the bar");
  assert.deepStrictEqual(r.restored, {arrow: "x", thead: 0, tbody: 0}, "tooltip restored afterwards");
});

it("shared tooltip — stacked bars list the stack and highlight it", async () => {
  const r = await run("BarChart", {stacked: true}, data, 0.1, '[data-key="Beta_2010"]');
  assert.ok(r.crosshair, "crosshair drawn");
  assert.ok(r.crosshairOrder < 0, "crosshair draws behind the bars");
  assert.ok(r.cells.every(([[, , radius]]) => radius === "square"), "Bar swatches are squares");
  assert.deepStrictEqual(r.cells.map(([name, value]) => [name[0], value[0]]),
    [["Gamma", "30"], ["Beta", "20"], ["Alpha", "10"]]);
  for (const id of ["Alpha", "Beta", "Gamma"]) {
    assert.strictEqual(r.opacity[`${id}_2010`], 1, `${id}_2010 (hovered stack) stays bright`);
    assert.ok(r.opacity[`${id}_2012`] < 1, `${id}_2012 (other stack) dims`);
  }
});

it("shared tooltip — uses a configured continuous-axis title", async () => {
  const r = await run("LinePlot", {yConfig: {title: "Exports (USD)"}});
  assert.strictEqual(r.title, "Exports (USD)");
});

it("shared tooltip — single series: empty-space hover snaps an x/y tooltip", async () => {
  const r = await run("LinePlot", {}, data.filter(d => d.id === "Alpha"));
  assert.ok(r.surface, "hover surface emitted");
  assert.ok(r.crosshair, "crosshair drawn");
  assert.strictEqual(r.title, "Alpha", "default title (the series label)");
  assert.deepStrictEqual(texts(r.cells), [["year", "2011"], ["value", "11"]]);
  assert.deepStrictEqual(r.header, [], "no shared header row");
  assert.strictEqual(r.markers, 1, "a marker on the hovered point");
  assert.strictEqual(r.arrowHidden, true, "no tooltip arrow");
  assert.ok(Math.abs(r.tipCenterOffset) < 1, "tooltip centered on the point");
});

it("shared tooltip — tooltipShared(false): nothing over empty space", async () => {
  const r = await run("LinePlot", {tooltipShared: false});
  assert.ok(!r.surface, "no hover surface");
  assert.ok(!r.crosshair, "no crosshair");
  assert.strictEqual(r.cells.length, 0, "no rows");
});

it("shared tooltip — tooltipShared(false): a hovered line gets a snapped x/y tooltip", async () => {
  const r = await run("LinePlot", {tooltipShared: false}, data, 0.34, '[data-key="Beta"]');
  assert.ok(r.crosshair, "crosshair drawn");
  assert.strictEqual(r.title, "Beta");
  assert.deepStrictEqual(texts(r.cells), [["year", "2011"], ["value", "21"]]);
  assert.strictEqual(r.markers, 1, "a marker on the hovered point");
  assert.ok(r.opacity.Alpha < 1 && r.opacity.Beta === 1, "the hovered series is emphasized");
});

it("shared tooltip — a single-mark tooltip adds the rows a tbody accessor resolves", async () => {
  const r = await run("BarChart", {stacked: true, tooltipShared: false}, data, 0.1, '[data-key="Beta_2010"]');
  assert.strictEqual(r.title, "Beta");
  assert.deepStrictEqual(texts(r.cells), [["year", "2010"], ["value", "20"], ["Share", "33.3%"]],
    "the stacked BarChart's Share row follows the x/y rows");
});

it("shared tooltip — BoxWhisker keeps its default tooltip (a box has no single value)", async () => {
  const rows = [];
  ["Alpha", "Beta"].forEach((group, g) => ["Q1", "Q2"].forEach(x => {
    for (let k = 0; k < 6; k++) rows.push({group, id: `${group}${k}`, x, value: g * 10 + k});
  }));
  const r = await render('<div id="viz" style="width:600px;height:400px"></div>', ([data]) =>
    new Promise(resolve => {
      const viz = new window.d3plus.BoxWhisker()
        .data(data).groupBy(["group", "id"]).x("x").y("value").duration(0).select("#viz");
      viz.render(() => resolve({
        on: viz.tooltipShared(),
        surface: !!document.querySelector('[data-key="plot-hover-surface"]'),
      }));
    }), [rows]);
  assert.strictEqual(r.on, false);
  assert.ok(!r.surface, "no hover surface");
});
