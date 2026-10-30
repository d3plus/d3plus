import {it} from "vitest";
import {color} from "d3-color";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";
import {render} from "~test/browser/render.js";
import {captureWarnings} from "~test/helpers.js";
import {themeDark} from "../../src/utils/theme.ts";
import {
  slopeColorsDark,
  slopeColorsLight,
} from "../../src/charts/SlopeChart/slope.ts";

/**
    SlopeChart in a real browser, on both renderers: two periods on the x
    axis, every line named at both ends with its value, no value axis, a
    marker at each end, direction colors with `slopeColor`, values in the
    tooltip, a warning past two periods, and a dark theme.
*/

const shares = [
  ["Brazil", 41, 47],
  ["Chile", 30, 36],
  ["Peru", 31, 30],
  ["Argentina", 10, 12],
  ["Colombia", 28, 27],
  ["Mexico", 17, 22],
  ["Uruguay", 57, 58],
  ["Ecuador", 29, 29],
];
const names = shares.map(([n]) => n);
const data = shares.flatMap(([country, a, b]) => [
  {country, year: 2015, share: a},
  {country, year: 2024, share: b},
]);

/** Every painted text, with its anchor and fill, in drawing order. */
const texts = viz =>
  sceneNodes(viz._paintedScene.root).flatMap(n =>
    n.type === "text"
      ? n.lines.map(l => ({
          text: l.text,
          key: `${n.key}`,
          anchor: n.font?.anchor,
          y: (n.transform?.y || 0) + l.y,
          size: n.font?.size,
          fill: n.paint?.fill,
        }))
      : [],
  );

/** What a slope chart drew: its labels by side, axis texts, lines, and markers. */
const slope = viz => {
  const all = texts(viz);
  const named = all.filter(t => names.some(n => t.text.startsWith(`${n} `)));
  const nodes = sceneNodes(viz._paintedScene.root);
  const axisTexts = key => {
    const group = nodes.find(n => n.key === key);
    return sceneNodes(group ? group.children || [] : [])
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" "));
  };
  return {
    start: named.filter(t => t.anchor === "end"),
    end: named.filter(t => t.anchor === "start"),
    xText: axisTexts("plot-x-axis"),
    yText: axisTexts("plot-y-axis"),
    lines: nodes
      .filter(
        n =>
          n.shapeType === "Line" &&
          n.type === "path" &&
          names.includes(n.datum?.id) &&
          !`${n.key}`.endsWith("::hit") &&
          // Label connectors are 1px lines.
          n.paint.strokeWidth === 2,
      )
      .map(n => ({id: n.datum.id, stroke: n.paint.stroke})),
    markers: nodes
      .filter(
        n =>
          n.shapeType === "Circle" &&
          n.type === "circle" &&
          names.includes(n.datum?.id),
      )
      .map(n => ({id: n.datum.id, fill: n.paint.fill})),
  };
};

const src = config => `(lib, data) => new lib.SlopeChart()
  .data(data)
  .groupBy("country")
  .x("year")
  .y("share")
  .config(${JSON.stringify(config)})`;

const hex = c => color(c)?.formatHex();

/** Asserts that no two labels on one side sit closer than their font size. */
function assertApart(labels, side) {
  const ys = labels.map(l => l.y).sort((a, b) => a - b);
  for (let i = 1; i < ys.length; i++)
    assert.ok(
      ys[i] - ys[i - 1] >= labels[0].size - 0.5,
      `${side} labels overlap: ${ys.join(", ")}`,
    );
}

for (const renderer of ["svg", "canvas"]) {
  it(`SlopeChart ${renderer} — two periods, each line named with its value at both ends`, async () => {
    const out = await probeChart(src({}), slope, {data, renderer});
    assert.deepStrictEqual(out.xText, ["2015", "2024"]);
    assert.deepStrictEqual(out.yText, [], "no value axis");
    assert.deepStrictEqual(
      out.start.map(t => t.text).sort(),
      shares.map(([n, a]) => `${n} ${a}`).sort(),
    );
    assert.deepStrictEqual(
      out.end.map(t => t.text).sort(),
      shares.map(([n, , b]) => `${n} ${b}`).sort(),
    );
    assertApart(out.start, "start");
    assertApart(out.end, "end");
    assert.strictEqual(out.lines.length, names.length);
    assert.strictEqual(
      out.markers.length,
      names.length * 2,
      "a marker per end",
    );
  });

  it(`SlopeChart ${renderer} — yConfig.tickFormat formats the values`, async () => {
    const out = await probeChart(
      `${src({})}.yConfig({tickFormat: d => d + "%"})`,
      slope,
      {data, renderer},
    );
    assert.ok(out.start.some(t => t.text === "Brazil 41%"));
    assert.ok(out.end.some(t => t.text === "Brazil 47%"));
  });

  it(`SlopeChart ${renderer} — slopeColor colors each line by its direction`, async () => {
    const out = await probeChart(src({slopeColor: true}), slope, {
      data,
      renderer,
    });
    const direction = {Peru: "down", Colombia: "down", Ecuador: "flat"};
    const darker = c => color(c).darker(0.25).formatHex();
    for (const line of out.lines) {
      const expected = slopeColorsLight[direction[line.id] || "up"];
      assert.strictEqual(hex(line.stroke), darker(expected), line.id);
    }
    for (const marker of out.markers) {
      const line = out.lines.find(l => l.id === marker.id);
      assert.strictEqual(hex(marker.fill), hex(line.stroke), "markers match");
    }
    const custom = await probeChart(src({slopeColor: {up: "#0000ff"}}), slope, {
      data,
      renderer,
    });
    assert.strictEqual(
      hex(custom.lines.find(l => l.id === "Brazil").stroke),
      darker("#0000ff"),
    );
    const off = await probeChart(src({}), slope, {data, renderer});
    const strokes = new Set(off.lines.map(l => hex(l.stroke)));
    assert.ok(strokes.size > 3, "off, each series keeps its own color");
  });

  it(`SlopeChart ${renderer} — dark theme`, async () => {
    const out = await probeChart(
      src({slopeColor: true, theme: "dark"}),
      slope,
      {data, renderer},
    );
    for (const l of [...out.start, ...out.end])
      assert.strictEqual(hex(l.fill), hex(themeDark.text), l.text);
    const brazil = out.lines.find(l => l.id === "Brazil");
    assert.strictEqual(
      hex(brazil.stroke),
      color(slopeColorsDark.up).darker(0.25).formatHex(),
    );
    const ecuador = out.lines.find(l => l.id === "Ecuador");
    assert.strictEqual(
      hex(ecuador.stroke),
      color(themeDark.textMuted).darker(0.25).formatHex(),
      "flat lines take the theme's muted text",
    );
  });

  it(`SlopeChart ${renderer} — more than two periods warns and draws them all`, async () => {
    const three = [
      ...data,
      ...shares.map(([country, a, b]) => ({
        country,
        year: 2020,
        share: (a + b) / 2,
      })),
    ];
    let drawn;
    const warnings = await render(
      '<div id="viz" style="width:700px;height:450px"></div>',
      ([rows, renderer]) =>
        captureWarnings(
          () =>
            new Promise(resolve => {
              const viz = new window.d3plus.SlopeChart()
                .data(rows)
                .groupBy("country")
                .x("year")
                .y("share")
                .renderer(renderer)
                .duration(0)
                .select("#viz");
              viz.render(() => resolve((drawn = slope(viz))));
            }),
        ),
      [three, renderer],
    );
    assert.deepStrictEqual(drawn.xText, ["2015", "2020", "2024"]);
    assert.strictEqual(drawn.markers.length, names.length * 3);
    assert.strictEqual(warnings.length, 1, warnings.join("\n"));
    assert.match(
      warnings[0],
      /SlopeChart compares two periods, but its data has 3 \(2015, 2020, 2024\)/,
    );
    const two = await render(
      '<div id="viz" style="width:700px;height:450px"></div>',
      ([rows, renderer]) =>
        captureWarnings(
          () =>
            new Promise(resolve =>
              new window.d3plus.SlopeChart()
                .data(rows)
                .groupBy("country")
                .x("year")
                .y("share")
                .renderer(renderer)
                .duration(0)
                .select("#viz")
                .render(resolve),
            ),
        ),
      [data, renderer],
    );
    assert.deepStrictEqual(two, [], "two periods draw quietly");
  });
}

it("SlopeChart — hovering a line shows its values", async () => {
  const tooltip = await probeChart(
    src({}),
    async viz => {
      const node = sceneNodes(viz.toScene().root).find(
        n =>
          n.shapeType === "Circle" &&
          n.datum?.id === "Brazil" &&
          n.datum?.data?.year === 2024,
      );
      const event = type =>
        viz._routeSceneEvent({
          type,
          point: [1, 1],
          pick: {node, datum: node.datum, index: node.index},
          nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
        });
      event("mouseenter");
      event("mousemove");
      await new Promise(resolve => setTimeout(resolve, 50));
      const el = document.querySelector(".d3plus-tooltip");
      return el ? el.textContent : "";
    },
    {data},
  );
  assert.ok(tooltip.includes("Brazil"), tooltip);
  assert.ok(/47/.test(tooltip), tooltip);
});
