import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    A domain that ends on an uneven value (padded for circle radii, or set
    symmetric by the user) forces its end onto the axis. When that end sits
    within half a tick spacing of the nearest nice tick, its label crowded the
    nice one ("59  60", "1.2M  1.4M"); the end keeps its tick mark and drops
    its label. Driven in real Chromium for text measurement.
*/

const probe = ([kind, axisKey]) =>
  new Promise(resolve => {
    const charts = {
      scatter: () => {
        const ids = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const data = ids.map((id, i) => ({
          id,
          life: 59.6 + (i * 26.2) / 25,
          gdp: 1000 + ((i * 7919) % 25) * 2400,
          pop: 1e6 + ((i * 31) % 26) * 4e6,
        }));
        return new window.d3plus.Plot()
          .data(data)
          .groupBy("id")
          .x("life")
          .y("gdp")
          .size("pop")
          .sizeMin(6)
          .sizeMax(22);
      },
      symmetric: () => {
        const data = [];
        [
          "0-9",
          "10-19",
          "20-29",
          "30-39",
          "40-49",
          "50-59",
          "60-69",
          "70+",
        ].forEach((age, i) => {
          data.push({age, sex: "Male", value: -(1.32e6 - i * 120000)});
          data.push({age, sex: "Female", value: 1.29e6 - i * 110000});
        });
        return new window.d3plus.BarChart()
          .data(data)
          .groupBy("sex")
          .discrete("y")
          .x("value")
          .y("age")
          .stacked(true)
          .xConfig({domain: [-1.4e6, 1.4e6]});
      },
      percent: () => {
        const data = [];
        for (let year = 2010; year <= 2024; year++)
          data.push({
            id: "A",
            year,
            rate: year === 2020 ? 4.3 : 1.1 + ((year * 7) % 5) * 0.35,
          });
        return new window.d3plus.LinePlot()
          .data(data)
          .groupBy("id")
          .x("year")
          .y("rate")
          .yDomain([0, 4.3])
          .yConfig({tickFormat: d => `${Math.round(d * 10) / 10}%`});
      },
    };
    const viz = charts[kind]().legend(false).duration(0).select("#viz");
    viz.render(() => {
      const axis = viz[`_${axisKey}Axis`];
      const domain = axis._d3Scale.domain();
      const ticks = axis._tickShape._data.map(d => ({
        id: d.id,
        text: d.text,
        tick: d.tick,
        size: d.size,
      }));
      const texts = Array.from(document.querySelectorAll("#viz text")).map(
        t => t.textContent,
      );
      resolve({domain, ticks, texts});
    });
  });

const run = (kind, axisKey) =>
  render('<div id="viz" style="width:640px;height:400px"></div>', probe, [
    kind,
    axisKey,
  ]);

/** Asserts a forced domain end keeps a tick mark but draws no label. */
function assertTickWithoutLabel(r, end, label) {
  const entries = r.ticks.filter(d => d.id === end);
  assert.ok(entries.length, `${label}: ${end} is still on the axis`);
  assert.ok(
    entries.every(d => d.tick && d.size !== 0),
    `${label}: ${end} keeps its tick mark`,
  );
  assert.ok(
    entries.every(d => !d.text),
    `${label}: ${end} has no label`,
  );
}

after(closeBrowser);

it("padded scatter — uneven circle-padded ends drop their labels", async () => {
  for (const axisKey of ["x", "y"]) {
    const r = await run("scatter", axisKey);
    const labeled = new Set(r.ticks.filter(d => d.text).map(d => d.id));
    r.domain.forEach(end => {
      if (labeled.has(end)) return;
      assertTickWithoutLabel(r, end, `${axisKey} axis`);
    });
    const dropped = r.domain.filter(end => !labeled.has(end));
    assert.ok(
      dropped.length,
      `${axisKey} axis: a crowded padded end was dropped (${r.domain})`,
    );
  }
  const y = await run("scatter", "y");
  assert.ok(
    !y.texts.includes("-8k") && !y.texts.includes("63k"),
    "no odd y-axis end labels",
  );
  assert.ok(
    y.texts.includes("60k") && y.texts.includes("0"),
    "the nice neighbors keep their labels",
  );
});

it("symmetric domain — both ±1.4M ends drop their labels", async () => {
  const r = await run("symmetric", "x");
  assert.deepStrictEqual(r.domain, [-1.4e6, 1.4e6]);
  assertTickWithoutLabel(r, -1.4e6, "start");
  assertTickWithoutLabel(r, 1.4e6, "end");
  assert.ok(
    !r.texts.includes("-1.4M") && !r.texts.includes("1.4M"),
    "no ±1.4M text",
  );
  assert.ok(
    r.texts.includes("-1.2M") && r.texts.includes("1.2M"),
    "±1.2M keep their labels",
  );
});

it("percent axis — 4.3% gives way to the 4% tick", async () => {
  const r = await run("percent", "y");
  assertTickWithoutLabel(r, 4.3, "top");
  assert.ok(!r.texts.includes("4.3%"), "no 4.3% text");
  assert.ok(
    r.texts.includes("4%") && r.texts.includes("3%"),
    "4% and 3% are labeled",
  );
});
