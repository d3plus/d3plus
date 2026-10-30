import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart} from "~test/browser/helpers.js";
import {render} from "~test/browser/render.js";
import {themeDark} from "../../src/utils/theme.ts";

/**
    `lineLabels: "both"` on a LinePlot, in a real browser on both renderers:
    every line is named at each end, the labels at each end are spread apart
    so none overlap, the plot gives up room on its left for the left-end
    labels, `lineLabelConfig` adds each end's value, and labels follow the
    theme. Small multiples, a time axis, and zooming keep them.
*/

const names = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"];
// Lines that start and end close together, so the labels on each side collide.
const data = names.flatMap((id, k) =>
  [2016, 2018, 2020, 2022, 2024].map((year, j) => ({
    id,
    year,
    value: 40 + k * 1.5 + j * (k % 2 ? 3 : -2) + (j === 4 ? k * 0.4 : 0),
  })),
);

/**
    Every text a chart painted, in absolute coordinates: `left`/`right` its
    extent along x, `y` its baseline, plus its font size, anchor, and fill.
*/
function paintedTexts(viz) {
  const out = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0);
    const ny = y + (t.y || 0);
    if (n.type === "text")
      for (const line of n.lines || []) {
        const at = nx + (n.x || 0) + line.x;
        const anchor = n.font?.anchor || "start";
        const left =
          anchor === "end"
            ? at - line.width
            : anchor === "middle"
              ? at - line.width / 2
              : at;
        out.push({
          text: line.text,
          key: n.key,
          left,
          right: left + line.width,
          y: ny + (n.y || 0) + line.y,
          size: n.font?.size || 10,
          anchor,
          fill: n.paint?.fill,
        });
      }
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  const scene = viz._paintedScene;
  walk(scene.root || scene, 0, 0);
  return out;
}

/** The absolute x of each line's first and last point, by series. */
function lineEnds(viz) {
  const out = {};
  const walk = (n, x, y) => {
    if (
      n.shapeType === "Line" &&
      names.includes(n.datum?.id) &&
      n.interactionPoints?.length
    ) {
      const xs = n.interactionPoints.map(p => p.x + x);
      out[n.datum.id] = {first: Math.min(...xs), last: Math.max(...xs)};
    }
    const t = n.transform || {};
    (n.children || []).forEach(c => walk(c, x + (t.x || 0), y + (t.y || 0)));
  };
  const scene = viz._paintedScene;
  walk(scene.root || scene, 0, 0);
  return out;
}

/** The line labels a chart drew, split by side, with every line's ends. */
const lineLabelInfo = viz => {
  const texts = paintedTexts(viz).filter(t =>
    names.some(n => t.text.startsWith(n)),
  );
  return {
    start: texts.filter(t => t.anchor === "end"),
    end: texts.filter(t => t.anchor === "start"),
    ends: lineEnds(viz),
    plot: viz._plotArea,
    margin: {...viz._margin},
  };
};

/** Asserts that no two labels on one side sit closer than their font size. */
function assertApart(labels, side) {
  const ys = labels.map(l => l.y).sort((a, b) => a - b);
  for (let i = 1; i < ys.length; i++)
    assert.ok(
      ys[i] - ys[i - 1] >= labels[0].size - 0.5,
      `${side} labels overlap: ${ys.join(", ")}`,
    );
}

const src = config => `(lib, data) => new lib.LinePlot()
  .data(data)
  .groupBy("id")
  .x("year")
  .y("value")
  .legend(false)
  .config(${JSON.stringify(config)})`;

for (const renderer of ["svg", "canvas"]) {
  it(`LinePlot ${renderer} — "both" names every line at each end, apart on each side`, async () => {
    const out = await probeChart(src({lineLabels: "both"}), lineLabelInfo, {
      data,
      renderer,
    });
    assert.strictEqual(out.start.length, names.length);
    assert.strictEqual(out.end.length, names.length);
    assert.deepStrictEqual(
      out.start.map(t => t.text).sort(),
      [...names].sort(),
    );
    assert.deepStrictEqual(out.end.map(t => t.text).sort(), [...names].sort());
    assertApart(out.start, "start");
    assertApart(out.end, "end");
    const first = Math.min(...Object.values(out.ends).map(e => e.first));
    const last = Math.max(...Object.values(out.ends).map(e => e.last));
    for (const l of out.start)
      assert.ok(l.right <= first + 0.5, `${l.text} ends left of the lines`);
    for (const l of out.end)
      assert.ok(l.left >= last - 0.5, `${l.text} starts right of the lines`);
    for (const l of [...out.start, ...out.end]) {
      assert.ok(l.left >= 0, `${l.text} stays in the chart`);
      assert.ok(l.right <= 700 + 0.5, `${l.text} stays in the chart`);
    }
  });

  it(`LinePlot ${renderer} — "both" claims room on the left for its labels`, async () => {
    const both = await probeChart(src({lineLabels: "both"}), lineLabelInfo, {
      data,
      renderer,
    });
    const end = await probeChart(src({lineLabels: "end"}), lineLabelInfo, {
      data,
      renderer,
    });
    assert.strictEqual(end.start.length, 0, '"end" labels only the right end');
    const widest = Math.max(...both.start.map(l => l.right - l.left));
    const firstBoth = Math.min(...Object.values(both.ends).map(e => e.first));
    const firstEnd = Math.min(...Object.values(end.ends).map(e => e.first));
    assert.ok(
      firstBoth - firstEnd >= widest - 30,
      `the lines start ${firstBoth - firstEnd}px further right for ${widest}px labels`,
    );
    const leftmost = Math.min(...both.start.map(l => l.left));
    const yLabels = await probeChart(
      src({lineLabels: "both"}),
      viz =>
        paintedTexts(viz)
          .filter(t => /^\d+$/.test(t.text) && t.anchor === "end")
          .map(t => t.right),
      {data, renderer},
    );
    assert.ok(yLabels.length > 0, "the y axis keeps its labels");
    for (const right of yLabels)
      assert.ok(right <= leftmost + 0.5, "the y axis sits left of the labels");
  });

  it(`LinePlot ${renderer} — "start" labels the left end only`, async () => {
    const out = await probeChart(src({lineLabels: "start"}), lineLabelInfo, {
      data,
      renderer,
    });
    assert.strictEqual(out.start.length, names.length);
    assert.strictEqual(out.end.length, 0);
  });

  it(`LinePlot ${renderer} — lineLabelConfig adds each end's value`, async () => {
    const config = {
      lineLabels: "both",
      lineLabelConfig: {value: true},
      yConfig: {tickFormat: "__pct__"},
    };
    const withFormat = src(config).replace(
      '"__pct__"',
      "d => `${Math.round(d)}%`",
    );
    const out = await probeChart(withFormat, lineLabelInfo, {data, renderer});
    const alpha = data.filter(d => d.id === "Alpha");
    const expected = d => `Alpha ${Math.round(d.value)}%`;
    assert.deepStrictEqual(
      out.start.filter(t => t.text.startsWith("Alpha")).map(t => t.text),
      [expected(alpha[0])],
    );
    assert.deepStrictEqual(
      out.end.filter(t => t.text.startsWith("Alpha")).map(t => t.text),
      [expected(alpha[alpha.length - 1])],
    );
    const custom = await probeChart(
      `${src({lineLabels: "end"})}.lineLabelConfig({value: true, valueFormat: (v, d) => d.id.slice(0, 1) + v.toFixed(1)})`,
      lineLabelInfo,
      {data, renderer},
    );
    const zeta = data.filter(d => d.id === "Zeta").pop();
    assert.ok(
      custom.end.some(t => t.text === `Zeta Z${zeta.value.toFixed(1)}`),
      custom.end.map(t => t.text).join(", "),
    );
    const plain = await probeChart(
      src({lineLabels: "end", lineLabelConfig: {value: true}}),
      lineLabelInfo,
      {data, renderer},
    );
    assert.ok(
      plain.end.every(t => /^\w+ \d+(\.\d+)?$/.test(t.text)),
      `abbreviated values: ${plain.end.map(t => t.text)}`,
    );
  });

  it(`LinePlot ${renderer} — dark theme labels both ends in its text color`, async () => {
    const out = await probeChart(
      src({lineLabels: "both", theme: "dark"}),
      lineLabelInfo,
      {data, renderer},
    );
    const hex = c => {
      const m = String(c).match(/\d+/g);
      return m && !String(c).startsWith("#")
        ? `#${m
            .slice(0, 3)
            .map(v => Number(v).toString(16).padStart(2, "0"))
            .join("")}`
        : String(c).toLowerCase();
    };
    for (const l of [...out.start, ...out.end])
      assert.strictEqual(hex(l.fill), themeDark.text.toLowerCase(), l.text);
  });

  it(`LinePlot ${renderer} — lineLabels true keeps labels at the right end`, async () => {
    const out = await probeChart(src({lineLabels: true}), lineLabelInfo, {
      data,
      renderer,
    });
    assert.strictEqual(out.start.length, 0);
    assert.ok(out.end.length > 0);
    const last = Math.max(...Object.values(out.ends).map(e => e.last));
    for (const l of out.end) assert.ok(l.left >= last - 0.5);
  });

  it(`LinePlot ${renderer} — "both" on a time axis and in small multiples`, async () => {
    const dated = data.map(d => ({
      ...d,
      date: `${d.year}-07-01`,
      group: names.indexOf(d.id) % 2 ? "Odd" : "Even",
    }));
    const time = await probeChart(
      `${src({lineLabels: "both"})}.x("date").time("date")`,
      lineLabelInfo,
      {data: dated, renderer},
    );
    assert.strictEqual(time.start.length, names.length);
    assert.strictEqual(time.end.length, names.length);
    const faceted = await probeChart(
      `${src({lineLabels: "both"})}.facet("group")`,
      lineLabelInfo,
      {data: dated, renderer},
    );
    assert.strictEqual(faceted.start.length, names.length);
    assert.strictEqual(faceted.end.length, names.length);
    // Each panel claims its own room: some left labels sit in the right panel.
    assert.ok(faceted.start.some(l => l.left > 350));
  });

  it(`LinePlot ${renderer} — zooming keeps the labels at both ends`, async () => {
    const out = await render(
      '<div id="viz" style="width:700px;height:450px"></div>',
      ([renderer, rows]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.LinePlot()
            .data(rows)
            .groupBy("id")
            .x("year")
            .y("value")
            .lineLabels("both")
            .zoom(true)
            .legend(false)
            .renderer(renderer)
            .duration(0)
            .select("#viz");
          viz.render(() => {
            const before = lineLabelInfo(viz);
            for (let i = 0; i < 2; i++)
              document.querySelector("#viz .zoom-in").click();
            setTimeout(() => resolve({before, after: lineLabelInfo(viz)}), 400);
          });
        }),
      [renderer, data],
    );
    assert.strictEqual(out.before.start.length, names.length);
    assert.ok(out.after.start.length + out.after.end.length > 0);
  });
}
