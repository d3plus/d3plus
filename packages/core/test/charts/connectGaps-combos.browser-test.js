/* global requestAnimationFrame */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `connectGaps` alongside the rest of a Plot, on both renderers: a time
    axis with skipped days, a vertical plot, small multiples, a zoom, line
    markers and labels, a dark theme, and reduced motion. Each draws a bridge
    for every gap, with finite dashes and no `NaN` in the page.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__draw = (configure, size = [700, 420]) =>
    new Promise(resolve => {
      const el = document.createElement("div");
      el.id = "viz";
      el.style.cssText = `width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus.LinePlot()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .width(size[0])
        .height(size[1]);
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  window.__flat = nodes =>
    nodes.flatMap(n => [n, ...(n.children ? window.__flat(n.children) : [])]);
  window.__nan = el =>
    Array.from(el.querySelectorAll("*")).filter(n =>
      Array.from(n.attributes).some(a => a.value.includes("NaN")),
    ).length;
  // Each bridge's key, color, and first dash, and the lines' colors.
  window.__summary = (viz, el) => {
    const nodes = window.__flat(viz._chartScene);
    const bridges = nodes.filter(n => /::gap$/.test(`${n.key}`));
    const lines = Object.fromEntries(
      nodes
        .filter(
          n =>
            n.shapeType === "Line" &&
            n.interactionPoints &&
            !/::hit$/.test(`${n.key}`) &&
            !/::gap$/.test(`${n.key}`),
        )
        .map(n => [n.key, n.paint.stroke]),
    );
    return {
      bridges: bridges.map(n => ({
        key: `${n.key}`,
        stroke: n.paint.stroke,
        finite: n.paint.strokeDasharray.every(Number.isFinite),
        dash: n.paint.strokeDasharray.slice(0, 4),
      })),
      lines,
      markers: nodes.filter(
        n => n.shapeType === "Circle" && !/::hit$/.test(`${n.key}`),
      ).length,
      nan: window.__nan(el),
    };
  };
  // Two series over 20 days; Alpha skips days 6–7 and 14.
  window.__days = () => {
    const rows = [];
    for (let k = 0; k < 20; k++) {
      const date = new Date(2024, 0, 1 + k);
      if (![6, 7, 14].includes(k))
        rows.push({id: "Alpha", date, value: 20 + 5 * Math.sin(k / 3)});
      rows.push({id: "Beta", date, value: 40 + k});
    }
    return rows;
  };
  // Two regions; each has a series with a null year.
  window.__regions = () => {
    const rows = [];
    ["East", "West"].forEach((region, r) =>
      ["Alpha", "Beta"].forEach((id, s) => {
        for (let year = 2015; year <= 2022; year++)
          rows.push({
            region,
            id,
            year,
            value:
              year === 2017 + r && s === 0 ? null : 10 * (s + 1) + year - 2015,
          });
      }),
    );
    return rows;
  };
};

const run = (fn, arg) =>
  render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

for (const renderer of ["svg", "canvas"]) {
  it(`connectGaps ${renderer}: a time axis bridges each run of skipped days`, async () => {
    const r = await run(async renderer => {
      const {el, viz} = await window.__draw(v =>
        v
          .data(window.__days())
          .groupBy("id")
          .x("date")
          .time("date")
          .timeline(false)
          .y("value")
          .connectGaps("dashed")
          .renderer(renderer),
      );
      return window.__summary(viz, el);
    }, renderer);
    assert.deepStrictEqual(
      r.bridges.map(b => b.key),
      ["Alpha::gap"],
    );
    assert.ok(r.bridges[0].finite, "finite dashes");
    // The dash opens with a gap past the run before the first skipped day.
    assert.strictEqual(r.bridges[0].dash[0], 0);
    assert.strictEqual(r.bridges[0].stroke, r.lines.Alpha);
    assert.strictEqual(r.nan, 0);
  });

  it(`connectGaps ${renderer}: a vertical plot bridges along y`, async () => {
    const r = await run(async renderer => {
      const {el, viz} = await window.__draw(v =>
        v
          .data(window.__regions().filter(d => d.region === "East"))
          .groupBy("id")
          .y("year")
          .x("value")
          .discrete("y")
          .connectGaps("dashed")
          .renderer(renderer),
      );
      return window.__summary(viz, el);
    }, renderer);
    assert.deepStrictEqual(
      r.bridges.map(b => b.key),
      ["Alpha::gap"],
    );
    assert.ok(r.bridges[0].finite);
    assert.strictEqual(r.nan, 0);
  });

  it(`connectGaps ${renderer}: each small multiple bridges its own gaps`, async () => {
    const r = await run(async renderer => {
      const {el, viz} = await window.__draw(
        v =>
          v
            .data(window.__regions())
            .groupBy("id")
            .x("year")
            .y("value")
            .facet("region")
            .connectGaps("dashed")
            .renderer(renderer),
        [900, 420],
      );
      return window.__summary(viz, el);
    }, renderer);
    assert.strictEqual(r.bridges.length, 2, "one bridge per panel");
    assert.ok(
      r.bridges.every(b => /Alpha::gap$/.test(b.key)),
      JSON.stringify(r.bridges.map(b => b.key)),
    );
    assert.notStrictEqual(r.bridges[0].key, r.bridges[1].key);
    assert.notDeepStrictEqual(
      r.bridges[0].dash,
      r.bridges[1].dash,
      "each at its own panel's gap",
    );
    assert.strictEqual(r.nan, 0);
  });

  it(`connectGaps ${renderer}: a zoom redraws the bridges at the new scale`, async () => {
    const r = await run(async renderer => {
      const {el, viz} = await window.__draw(v =>
        v
          .data(window.__days())
          .groupBy("id")
          .x("date")
          .time("date")
          .timeline(false)
          .legend(false)
          .y("value")
          .connectGaps("dashed")
          .renderer(renderer),
      );
      const before = window.__summary(viz, el);
      el.querySelector(".zoom-in").click();
      await new Promise(res =>
        requestAnimationFrame(() => requestAnimationFrame(res)),
      );
      const after = window.__summary(viz, el);
      return {before, after};
    }, renderer);
    assert.strictEqual(r.after.bridges.length, 1, "still bridged");
    assert.ok(r.after.bridges[0].finite);
    assert.notDeepStrictEqual(
      r.after.bridges[0].dash,
      r.before.bridges[0].dash,
      "the bridge moved with the zoom",
    );
    assert.strictEqual(r.after.nan, 0);
  });

  it(`connectGaps ${renderer}: markers and labels, a dark theme, and reduced motion`, async () => {
    const r = await run(async renderer => {
      const {el, viz} = await window.__draw(v =>
        v
          .data(window.__regions().filter(d => d.region === "West"))
          .groupBy("id")
          .x("year")
          .y("value")
          .lineMarkers(true)
          .lineLabels(true)
          .theme("dark")
          .reducedMotion(true)
          .connectGaps({stroke: "#ff00ff", strokeDasharray: "1 3"})
          .renderer(renderer),
      );
      return window.__summary(viz, el);
    }, renderer);
    assert.strictEqual(r.bridges.length, 1);
    assert.strictEqual(r.bridges[0].stroke, "#ff00ff");
    assert.strictEqual(
      r.markers,
      15,
      "a marker on every value, none on the gap",
    );
    assert.strictEqual(r.nan, 0);
  });
}
