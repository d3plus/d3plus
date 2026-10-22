import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A category axis whose labels didn't fit side by side used to leave
    irregular gaps: a label too wide for its slot was dropped, cut to "São…",
    or broken mid-word ("Kin-shasa"), and the overlap pass hid whichever of
    its neighbors it crowded, while the axis kept every tick in
    `_visibleTicks` and never rotated. Now a horizontal category axis rotates
    its labels when they don't fit whole, and thins any that still crowd at
    an even interval, which `_visibleTicks` reports. Driven in real Chromium
    for text measurement.
*/

const cities = [
  "Tokyo",
  "Delhi",
  "Shanghai",
  "São Paulo",
  "Mexico City",
  "Dhaka",
  "Cairo",
  "New York",
  "Buenos Aires",
  "Lagos",
  "Kinshasa",
  "Luanda",
];

/**
    Renders a chart and reads back, per category, the text its axis label
    paints (lines joined by spaces), plus the axis's rotation and visible ticks.
*/
const probe = ([setup, width, height, renderer, axisKey]) =>
  new Promise(resolve => {
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    const viz = new Function("d3plus", `return ${setup}`)(window.d3plus)
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const axis = axisKey === "x" ? viz._xAxis : viz._yAxis;
      const painted = {};
      const walk = (node, inAxis) => {
        if (!node) return;
        const within = inAxis || node.key === `plot-${axisKey}-axis`;
        if (within && node.type === "text" && node.datum?.data) {
          const id = `${node.datum.data.id}`;
          painted[id] = node.lines.map(l => l.text).join(" ");
        }
        (node.children || []).forEach(c => walk(c, within));
      };
      walk(viz._paintedScene.root, false);
      resolve({
        painted,
        rotated: axis._labelRotation,
        visible: axis._visibleTicks.map(String),
        available: axis._availableTicks.map(String),
      });
    });
  });

const run = (setup, width, height = 260, renderer = "svg", axisKey = "x") =>
  render('<div id="viz"></div>', probe, [
    setup,
    width,
    height,
    renderer,
    axisKey,
  ]);

const cityBars = `new d3plus.BarChart()
  .data(${JSON.stringify(cities.map((city, i) => ({city, pop: 38 - i * 2.5})))})
  .groupBy("city").x("city").y("pop").legend(false).shapeConfig({Bar: {label: false}})`;

/**
    Every category either paints its whole name and is a visible tick, or is
    thinned out: painted nowhere and left out of `_visibleTicks`. The ones
    left out fall at an even interval.
*/
const assertHonest = (r, names, context) => {
  names.forEach(name => {
    const visible = r.visible.includes(name);
    if (visible)
      assert.strictEqual(
        r.painted[name],
        name,
        `${context}: "${name}" paints whole (${r.painted[name]})`,
      );
    else
      assert.ok(
        !(name in r.painted),
        `${context}: thinned "${name}" paints nothing`,
      );
  });
  const shown = names
    .map((n, i) => (r.visible.includes(n) ? i : -1))
    .filter(i => i >= 0);
  assert.ok(
    shown.length >= 2,
    `${context}: shows labels (${r.visible.join(", ")})`,
  );
  const steps = new Set(shown.slice(1).map((d, i) => d - shown[i]));
  assert.strictEqual(
    steps.size,
    1,
    `${context}: thins evenly (${r.visible.join(", ")})`,
  );
  assert.strictEqual(shown[0], 0, `${context}: starts with the first label`);
};

it("category labels — every width paints whole labels or thins evenly", async () => {
  for (const renderer of ["svg", "canvas"]) {
    for (const width of [900, 600, 480, 360]) {
      const r = await run(cityBars, width, 260, renderer);
      assertHonest(r, cities, `${renderer} ${width}px`);
      assert.strictEqual(
        r.visible.length,
        12,
        `${renderer} ${width}px: all 12 labels show`,
      );
    }
  }
});

it("category labels — side by side at 900px, rotated once they no longer fit", async () => {
  const wide = await run(cityBars, 900);
  assert.strictEqual(wide.rotated, false, "900px keeps labels flat");
  assert.strictEqual(
    wide.painted["Buenos Aires"],
    "Buenos Aires",
    "wraps a two-word label",
  );
  for (const width of [600, 480, 360]) {
    const r = await run(cityBars, width);
    assert.strictEqual(r.rotated, true, `${width}px rotates`);
  }
});

it("category labels — a mid-word break counts as not fitting", async () => {
  // At 600px "Kinshasa" only fits flat as "Kin-shasa"; that rotates the axis.
  const r = await run(cityBars, 600);
  assert.strictEqual(r.rotated, true);
  assert.strictEqual(r.painted.Kinshasa, "Kinshasa");
});

it("category labels — the axis decides again on every render", async () => {
  const r = await render(
    '<div id="viz" style="width:360px;height:260px"></div>',
    setup =>
      new Promise(resolve => {
        const viz = new Function("d3plus", `return ${setup}`)(window.d3plus)
          .duration(0)
          .select("#viz");
        viz.render(() => {
          const narrow = viz._xAxis._labelRotation;
          document.querySelector("#viz").style.width = "900px";
          viz
            .width(900)
            .render(() => resolve({narrow, wide: viz._xAxis._labelRotation}));
        });
      }),
    cityBars,
  );
  assert.deepStrictEqual(r, {narrow: true, wide: false});
});

for (const renderer of ["svg", "canvas"]) {
  it(`category labels — rotated labels paint rotatedTickFormat, flat ones tickFormat (${renderer})`, async () => {
    const setup = `${cityBars}.xConfig({tickFormat: d => d + "\\n12.5%", rotatedTickFormat: d => d})`;
    const wide = await run(setup, 900, 260, renderer);
    assert.strictEqual(wide.rotated, false, "900px keeps labels flat");
    assert.strictEqual(
      wide.painted.Tokyo,
      "Tokyo 12.5%",
      "flat labels keep their second line",
    );
    const narrow = await run(setup, 480, 260, renderer);
    assert.strictEqual(narrow.rotated, true, "480px rotates");
    const painted = Object.values(narrow.painted);
    assert.ok(
      painted.length >= 2 && painted.every(t => !t.includes("%")),
      `rotated: names alone (${painted})`,
    );
    assert.strictEqual(narrow.painted.Tokyo, "Tokyo");
  });
}

it("category labels — too many to fit even rotated thin evenly", async () => {
  const codes = Array.from(
    {length: 60},
    (_, i) => `C${String(i + 1).padStart(2, "0")}`,
  );
  const setup = `new d3plus.BarChart()
    .data(${JSON.stringify(codes.map((code, i) => ({code, value: 10 + ((i * 7) % 23)})))})
    .groupBy("code").x("code").y("value").legend(false).shapeConfig({Bar: {label: false}})`;
  const r = await run(setup, 360);
  assert.strictEqual(r.rotated, true);
  assert.ok(r.visible.length < 60, `thins (${r.visible.length} of 60)`);
  assert.strictEqual(r.available.length, 60, "keeps a tick for every category");
  assertHonest(r, codes, "60 codes");
});

it("category labels — labelRotation(false) keeps them flat and thins evenly", async () => {
  const r = await run(`${cityBars}.xConfig({labelRotation: false})`, 360);
  assert.strictEqual(r.rotated, false);
  assert.ok(r.visible.length < 12, `thins (${r.visible.join(", ")})`);
  assertHonest(r, cities, "flat 360px");
});

it("category labels — a dot plot names every country", async () => {
  const countries = [
    "Switzerland",
    "Norway",
    "Iceland",
    "Hong Kong",
    "Denmark",
    "Sweden",
    "Germany",
    "Ireland",
    "Singapore",
    "Australia",
    "Netherlands",
    "Belgium",
  ];
  const setup = `new d3plus.Plot()
    .data(${JSON.stringify(countries.map((country, i) => ({country, score: 0.97 - i * 0.008, population: 5 + i})))})
    .groupBy("country").discrete("x").x("country").y("score").size("population")
    .shapeConfig({label: false}).legend(false)`;
  const r = await run(setup, 520, 320);
  assert.strictEqual(
    r.visible.length,
    12,
    `shows every country (${r.visible.join(", ")})`,
  );
  assertHonest(r, countries, "dot plot");
});

it("category labels — a horizontal BarChart's vertical axis never rotates", async () => {
  const setup = `new d3plus.BarChart()
    .data(${JSON.stringify(cities.map((city, i) => ({city, pop: 38 - i * 2.5})))})
    .groupBy("city").discrete("y").y("city").x("pop").legend(false).shapeConfig({Bar: {label: false}})`;
  const r = await run(setup, 360, 320, "svg", "y");
  assert.strictEqual(r.rotated, false);
  assert.strictEqual(r.visible.length, 12);
  assertHonest(r, cities, "horizontal bars");
});

it("numeric labels — a crowded year axis thins evenly instead of rotating", async () => {
  const years = Array.from({length: 30}, (_, i) => 2000 + i);
  const setup = `new d3plus.LinePlot()
    .data(${JSON.stringify(years.map((year, i) => ({id: "A", year, value: 10 + i})))})
    .groupBy("id").x("year").y("value")`;
  const r = await run(setup, 600, 400);
  assert.strictEqual(r.rotated, false);
  assert.ok(r.visible.length < 30, `thins (${r.visible.join(", ")})`);
  assertHonest(r, years.map(String), "years");
});
