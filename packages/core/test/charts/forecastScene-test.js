import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  backdropDecor,
  discreteDirection,
  emitForecast,
  FORECAST_KEY,
  forecastDashOr,
  forecastLineDash,
  forecastRows,
  lineRows,
  slotEdge,
} from "../../src/charts/Plot/forecastScene.ts";

useJsdom();

// The forecast backdrop, rule, and label, and the part-dashed line.

const plotted = (d, i) => ({
  __d3plus__: true,
  data: d,
  i,
  id: d.id,
  x: d.t,
  y: d.v,
  discrete: d.t,
});
const rows = [1, 2, 3, 4, 5].map((t, i) =>
  plotted(
    i < 2 ? {id: "a", t, v: 10} : {id: "a", t, v: 10, lo: 10 - i, hi: 10 + i},
    i,
  ),
);

// x: 1..5 → 0..400 px; y: 0..20 → 300..0 px.
const frame = {
  x: v => (v - 1) * 100,
  y: v => 300 - v * 15,
  xRange: [0, 400],
  yRange: [0, 300],
};

const chart = (forecast = "auto", config = {}) =>
  new LinePlot()
    .confidence(["lo", "hi"])
    .forecast(forecast)
    .forecastConfig(config);

const byKey = (nodes, suffix) =>
  nodes[0].children.find(n => n.key === `${FORECAST_KEY}-${suffix}`);

it("emitForecast — a backdrop, rule, and label from the forecast start to the end", () => {
  const nodes = emitForecast(chart(), rows, frame);
  assert.strictEqual(nodes.length, 1);
  assert.strictEqual(nodes[0].type, "group");
  assert.strictEqual(nodes[0].key, FORECAST_KEY);
  assert.strictEqual(
    nodes[0].interactive,
    false,
    "leaves the pointer to the marks",
  );
  const region = byKey(nodes, "region");
  assert.deepStrictEqual(
    [region.x, region.y, region.width, region.height],
    [100, 0, 300, 300],
    "from t=2 to the right edge",
  );
  assert.strictEqual(region.paint.fillOpacity, 0.05);
  const rule = byKey(nodes, "rule");
  assert.deepStrictEqual(rule.points, [
    [100, 0],
    [100, 300],
  ]);
  assert.deepStrictEqual(rule.paint.strokeDasharray, [4, 4]);
  assert.strictEqual(rule.paint.strokeOpacity, 0.4);
  const label = byKey(nodes, "label");
  assert.strictEqual(label.lines[0].text, "Forecast");
  assert.strictEqual(label.font.anchor, "start");
  assert.ok(label.transform.x > 100, "just inside the backdrop");
});

it("emitForecast — styled, relabeled, translated, or hidden piece by piece", () => {
  const styled = emitForecast(
    chart("auto", {
      fill: "red",
      stroke: "blue",
      strokeDasharray: "",
      label: "Projection",
      fontColor: "green",
    }),
    rows,
    frame,
  );
  assert.strictEqual(byKey(styled, "region").paint.fill, "red");
  assert.strictEqual(byKey(styled, "rule").paint.stroke, "blue");
  assert.strictEqual(
    byKey(styled, "rule").paint.strokeDasharray,
    undefined,
    "a solid rule",
  );
  assert.strictEqual(byKey(styled, "label").lines[0].text, "Projection");
  assert.strictEqual(byKey(styled, "label").paint.fill, "green");
  const spanish = chart();
  spanish.locale("es-ES");
  assert.strictEqual(
    byKey(emitForecast(spanish, rows, frame), "label").lines[0].text,
    "Pronóstico",
  );
  const bare = emitForecast(
    chart("auto", {fill: false, stroke: false, label: false}),
    rows,
    frame,
  );
  assert.deepStrictEqual(bare, [], "nothing left to draw");
  const ruleOnly = emitForecast(
    chart("auto", {fill: "none", label: ""}),
    rows,
    frame,
  );
  assert.deepStrictEqual(
    ruleOnly[0].children.map(n => n.key),
    [`${FORECAST_KEY}-rule`],
  );
});

it("emitForecast — nothing when off, unplaceable, or at the axis end", () => {
  assert.deepStrictEqual(emitForecast(chart(false), rows, frame), []);
  assert.deepStrictEqual(emitForecast(chart(), [], frame), []);
  assert.deepStrictEqual(
    emitForecast(chart(5), rows, frame),
    [],
    "starts at the last point",
  );
  assert.deepStrictEqual(
    emitForecast(chart("nowhere"), rows, {...frame, x: () => NaN}),
    [],
  );
});

it("emitForecast — a vertical plot shades down the y axis", () => {
  const viz = chart(3);
  viz.schema.discrete = "y";
  const flipped = rows.map(d => ({...d, x: d.y, y: d.x}));
  const yFrame = {
    x: v => v * 20,
    y: v => (v - 1) * 50,
    xRange: [0, 400],
    yRange: [0, 200],
  };
  const nodes = emitForecast(viz, flipped, yFrame);
  const region = byKey(nodes, "region");
  assert.deepStrictEqual(
    [region.x, region.y, region.width, region.height],
    [0, 100, 400, 100],
  );
  assert.deepStrictEqual(byKey(nodes, "rule").points, [
    [0, 100],
    [400, 100],
  ]);
});

it("emitForecast — a reversed axis shades toward its low end", () => {
  const reversed = {...frame, x: v => 400 - (v - 1) * 100};
  const region = byKey(emitForecast(chart(), rows, reversed), "region");
  assert.deepStrictEqual(
    [region.x, region.width],
    [0, 300],
    "from t=2 (300px) left to 0",
  );
  assert.strictEqual(
    byKey(emitForecast(chart(), rows, reversed), "label").font.anchor,
    "end",
  );
});

it("discreteDirection — which way later discrete values run in pixels", () => {
  const viz = chart();
  assert.strictEqual(discreteDirection(viz, frame, rows), 1);
  assert.strictEqual(discreteDirection(viz, {...frame, x: v => -v}, rows), -1);
  assert.strictEqual(
    discreteDirection(viz, frame, rows.slice().reverse()),
    1,
    "by value, not plotted order",
  );
  assert.strictEqual(
    discreteDirection(viz, frame, rows.slice(0, 1)),
    1,
    "one point",
  );
  const cats = ["Q1", "Q2", "Q3"].map((t, i) => plotted({id: "a", t, v: 1}, i));
  const band = {...frame, x: v => ({Q1: 300, Q2: 200, Q3: 100})[v]};
  assert.strictEqual(
    discreteDirection(viz, band, cats),
    -1,
    "categories by plotted order",
  );
});

it("forecastLineDash — solid to the forecast start, dashed after", () => {
  const shapeConfig = {x: d => frame.x(d.x), y: d => frame.y(d.y)};
  const dash = forecastLineDash(chart(), rows, shapeConfig, frame);
  assert.strictEqual(typeof dash, "function");
  assert.deepStrictEqual(
    dash(rows[0].data, 0).slice(0, 4),
    [100, 0, 6, 4],
    "100px solid, then 6 4",
  );
  assert.strictEqual(
    dash(rows[0].data, 0),
    dash(rows[1].data, 1),
    "measured once per line",
  );
  assert.strictEqual(
    forecastLineDash(
      chart("auto", {lineDasharray: false}),
      rows,
      shapeConfig,
      frame,
    ),
    null,
  );
  assert.strictEqual(
    forecastLineDash(chart(false), rows, shapeConfig, frame),
    null,
  );
  assert.strictEqual(
    forecastLineDash(
      chart(1, {lineDasharray: "0 0"}),
      rows,
      shapeConfig,
      frame,
    ),
    null,
  );
  assert.strictEqual(
    forecastLineDash(chart("x"), rows, shapeConfig, {...frame, x: () => NaN})(
      rows[0].data,
      0,
    ),
    undefined,
    "an unplaceable start",
  );
  const fromStart = forecastLineDash(chart(1), rows, shapeConfig, frame);
  assert.deepStrictEqual(
    fromStart(rows[0].data, 0).slice(0, 2),
    [0, 0],
    "dashed throughout",
  );
});

it("lineRows — the rows of a Plot's Line shape group", () => {
  const line = [{id: "a"}];
  assert.strictEqual(
    lineRows([
      ["Bar", []],
      ["Line", line],
    ]),
    line,
  );
  assert.deepStrictEqual(lineRows([["Bar", []]]), []);
});

it("forecastLineDash — with a predicate, each line dashes from its own start", () => {
  const shapeConfig = {x: d => frame.x(d.x), y: d => frame.y(d.y)};
  const split = [
    ...[1, 2, 3].map(t =>
      plotted({id: "Observed", t, v: 10, Type: "Observed"}),
    ),
    ...[3, 4, 5].map(t =>
      plotted({id: "Predicted", t, v: 10, Type: "Predicted"}),
    ),
  ].map((d, i) => ({...d, i}));
  const viz = new LinePlot().forecast(d => d.Type === "Predicted");
  const dash = forecastLineDash(viz, split, shapeConfig, frame);
  assert.strictEqual(
    dash(split[0].data, 0),
    undefined,
    "the observed line stays solid",
  );
  assert.deepStrictEqual(
    dash(split[3].data, 3).slice(0, 4),
    [0, 0, 6, 4],
    "the predicted line is dashed throughout",
  );
  const mixed = [1, 2, 3, 4].map((t, i) =>
    plotted({id: "a", t, v: 10, Type: t > 2 ? "Predicted" : "Observed"}, i),
  );
  assert.deepStrictEqual(
    forecastLineDash(
      viz,
      mixed,
      shapeConfig,
      frame,
    )(mixed[0].data, 0).slice(0, 2),
    [100, 0],
    "solid to its last observed point",
  );
});

it("forecastLineDash — a trend projection leaves the lines solid", () => {
  const shapeConfig = {x: d => frame.x(d.x), y: d => frame.y(d.y)};
  const viz = new LinePlot();
  viz._trendFits = [
    {
      id: "a",
      axis: "x",
      samples: [
        {x: 1},
        {x: 5},
        {x: 5, projected: true},
        {x: 6, projected: true, step: true},
      ],
    },
  ];
  assert.strictEqual(forecastLineDash(viz, rows, shapeConfig, frame), null);
});

it("forecastDashOr — the forecast dash, or the line's own", () => {
  const dash = (d, i) => (i ? [1, 0, 6, 4] : undefined);
  assert.deepStrictEqual(forecastDashOr(dash, "2 2")({}, 1), [1, 0, 6, 4]);
  assert.strictEqual(forecastDashOr(dash, "2 2")({}, 0), "2 2", "a constant");
  assert.strictEqual(
    forecastDashOr(dash, d => d.dash)({dash: "3 3"}, 0),
    "3 3",
    "an accessor",
  );
  assert.strictEqual(forecastDashOr(dash, undefined)({}, 0), undefined);
});

it("slotEdge — bars shade from halfway to the first forecast slot", () => {
  const viz = chart(false);
  const bars = [1, 2, 3, 4].map((t, i) => plotted({id: "a", t, v: 1}, i));
  assert.strictEqual(
    slotEdge(viz, frame, bars, {value: 2, next: 3}, 1),
    150,
    "between the last bar and the first forecast slot",
  );
  assert.strictEqual(
    slotEdge(viz, frame, bars, {value: 4, next: 5}, 1),
    350,
    "a projected slot past the bars",
  );
  assert.strictEqual(
    slotEdge(viz, frame, bars, {value: 3, next: 3}, 1),
    150,
    "a forecast that starts with its first slot",
  );
  assert.strictEqual(
    slotEdge(viz, frame, bars, {value: 1, next: 1}, 1),
    -50,
    "the first slot: half a step before it",
  );
  assert.strictEqual(
    slotEdge(
      viz,
      {...frame, x: v => 400 - (v - 1) * 100},
      bars,
      {value: 3, next: 3},
      -1,
    ),
    250,
    "a reversed axis",
  );
  assert.ok(
    Number.isNaN(slotEdge(viz, frame, bars, {value: 4}, 1)),
    "nothing after the start",
  );
});

it("emitForecast — a bar chart's backdrop starts at the first forecast slot's edge", () => {
  const bars = [1, 2, 3, 4].map((t, i) => plotted({id: "a", t, v: 1}, i));
  const region = byKey(emitForecast(chart(2), bars, frame, true), "region");
  assert.deepStrictEqual([region.x, region.width], [150, 250]);
  assert.deepStrictEqual(
    emitForecast(chart(4), bars, frame, true),
    [],
    "no slot after the start",
  );
});

it("emitForecast — a start scrolled out of view shades without a rule or label", () => {
  const zoomed = {...frame, x: v => (v - 1) * 100 - 250};
  const nodes = emitForecast(chart(), rows, zoomed);
  assert.deepStrictEqual(
    nodes[0].children.map(n => n.key),
    [`${FORECAST_KEY}-region`],
  );
  assert.deepStrictEqual(
    [byKey(nodes, "region").x, byKey(nodes, "region").width],
    [0, 400],
    "the whole visible plot",
  );
});

it("forecastRows — every plotted row, and whether they are bars", () => {
  const bar = [{id: "a"}],
    line = [{id: "b"}],
    area = [{id: "c"}];
  assert.deepStrictEqual(forecastRows([["Bar", bar]]), {
    rows: bar,
    slots: true,
  });
  assert.deepStrictEqual(
    forecastRows([
      ["Bar", bar],
      ["Line", line],
    ]),
    {rows: [...bar, ...line], slots: false},
  );
  assert.deepStrictEqual(forecastRows([["Area", area]]), {
    rows: area,
    slots: false,
  });
  assert.deepStrictEqual(forecastRows([]), {rows: [], slots: false});
});

it("emitForecast — the backdrop's own texture and backgroundImage, off by default", () => {
  const keys = nodes => nodes[0].children.map(n => n.key);
  assert.deepStrictEqual(
    keys(emitForecast(chart(), rows, frame)),
    [`${FORECAST_KEY}-region`, `${FORECAST_KEY}-rule`, `${FORECAST_KEY}-label`],
    "plain by default",
  );
  const image = "data:image/svg+xml,%3Csvg%2F%3E";
  const styled = emitForecast(
    chart("auto", {
      fill: "red",
      texture: "lines",
      textureDefault: {size: 8},
      backgroundImage: image,
    }),
    rows,
    frame,
  );
  assert.deepStrictEqual(
    keys(styled),
    [
      `${FORECAST_KEY}-region`,
      `${FORECAST_KEY}-texture`,
      `${FORECAST_KEY}-region-bgimage`,
      `${FORECAST_KEY}-rule`,
      `${FORECAST_KEY}-label`,
    ],
    "the texture and image sit over the shade, under the rule and label",
  );
  const region = byKey(styled, "region");
  assert.strictEqual(region.paint.fill, "red", "the shade keeps its color");
  const texture = byKey(styled, "texture");
  assert.deepStrictEqual(
    [texture.x, texture.y, texture.width, texture.height],
    [region.x, region.y, region.width, region.height],
  );
  assert.strictEqual(texture.interactive, false);
  assert.strictEqual(texture.paint.opacity, 0.3, "softened by default");
  assert.ok(texture.paint.fill.startsWith("pattern:"));
  const pattern = JSON.parse(texture.paint.fill.slice("pattern:".length));
  assert.deepStrictEqual(
    [pattern.texture, pattern.background, pattern.stroke, pattern.size],
    ["lines", "transparent", "red", 8],
    "drawn in the backdrop's color on a transparent ground, with textureDefault",
  );
  const group = byKey(styled, "region-bgimage");
  assert.strictEqual(group.interactive, false);
  assert.deepStrictEqual(
    [
      group.children[0].href,
      group.children[0].x,
      group.children[0].width,
      group.children[0].height,
    ],
    [image, region.x, region.width, region.height],
    "the image covers the backdrop",
  );
});

it("backdropDecor — ink-colored, without a shade, contained, or off", () => {
  const region = {
    type: "rect",
    key: `${FORECAST_KEY}-region`,
    x: 10,
    y: 0,
    width: 200,
    height: 100,
    paint: {fill: "#444", fillOpacity: 0.05},
    interactive: false,
  };
  const [texture] = backdropDecor(
    {
      fill: false,
      texture: {texture: "circles", radius: 2},
      textureOpacity: 0.8,
    },
    region,
    "#444",
  );
  assert.strictEqual(
    texture.paint.opacity,
    0.8,
    "textureOpacity sets its opacity",
  );
  assert.strictEqual(
    texture.key,
    `${FORECAST_KEY}-texture`,
    "draws with the shade hidden",
  );
  const pattern = JSON.parse(texture.paint.fill.slice("pattern:".length));
  assert.deepStrictEqual(
    [pattern.texture, pattern.radius, pattern.fill],
    ["circles", 2, "#444"],
    "a textures.js config, in the ink color",
  );
  const [contained] = backdropDecor(
    {backgroundImage: "a.png", backgroundImageFit: "contain"},
    region,
    "#444",
  );
  assert.strictEqual(
    contained.children[0].preserveAspectRatio,
    "xMidYMid meet",
  );
  assert.deepStrictEqual(
    backdropDecor({}, region, "#444"),
    [],
    "off by default",
  );
  assert.deepStrictEqual(
    backdropDecor(
      {texture: false, backgroundImage: () => "a.png"},
      region,
      "#444",
    ),
    [],
    "the backdrop has no row for an accessor",
  );
});
