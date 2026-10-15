import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Plot measures its x axis across the full width to find the room its last
    label needs past the range's end, then starts the axis after the y axis.
    The right inset used to come from that first, full-width measurement, but
    the narrower axis can pick different ticks: here the full width ends on a
    crowded "84" with no domain-end label, while the inset axis ends on "86",
    which then hung past the chart's right edge and was clipped. The inset is
    now taken from the x axis as it starts after the y axis. Driven in real
    Chromium for text measurement.
*/

const countries = [
  ["Japan", "Asia", 81.1, 84.5], ["Switzerland", "Europe", 79.7, 83.9],
  ["United Kingdom", "Europe", 77.7, 80.7], ["United States", "Americas", 76.6, 76.4],
  ["China", "Asia", 71.4, 78.2], ["Brazil", "Americas", 70.1, 72.8],
  ["Russia", "Europe", 65.3, 69.4], ["India", "Asia", 62.7, 67.2],
  ["South Africa", "Africa", 55.9, 62.3], ["Ethiopia", "Africa", 50.7, 65.0],
  ["Nigeria", "Africa", 46.3, 52.7],
];
const life = countries.flatMap(([country, continent, a, b]) => [
  {country, continent, year: "2000", value: a},
  {country, continent, year: "2021", value: b},
]);

const probe = ([rows, size, facet, renderer]) =>
  new Promise(resolve => {
    const el = document.querySelector("#viz");
    el.style.width = `${size[0]}px`;
    el.style.height = `${size[1]}px`;
    const viz = new window.d3plus.Plot()
      .data(rows).groupBy("year").discrete("y").x("value").y("country").shape("Circle")
      .renderer(renderer).duration(0).select("#viz");
    if (facet) viz.facet("continent").facetConfig({scales: "independent"});
    viz.render(() => {
      const right = el.getBoundingClientRect().right;
      const overhang = Array.from(el.querySelectorAll("[data-key$='plot-x-axis'] text"))
        .filter(t => t.textContent !== "value")
        .map(t => ({text: t.textContent, past: t.getBoundingClientRect().right - right}));
      let room;
      if (!facet) {
        // the last label's half width against the room right of the range
        const {textData} = window.d3plus.measureAxis(viz._xAxis);
        const last = textData.filter(d => !d.truncated && d.lines.length).pop();
        room = {text: last.lines.join(" "), half: last.width / 2, right: size[0] - last.position};
      }
      resolve({overhang, room});
    });
  });

const run = (rows, size, facet = false, renderer = "svg") =>
  render('<div id="viz"></div>', probe, [rows, size, facet, renderer]);

after(closeBrowser);

it("x axis — the last label fits when the y axis insets the plot", async () => {
  const europe = life.filter(d => d.continent === "Europe");
  for (const width of [210, 240]) {
    const r = await run(europe, [width, 200]);
    assert.ok(r.overhang.length, "draws x labels");
    r.overhang.forEach(l => assert.ok(l.past <= 0.5, `${width}px: "${l.text}" stays inside (${l.past.toFixed(1)}px past)`));
    const c = await run(europe, [width, 200], false, "canvas");
    assert.ok(c.room.half <= c.room.right, `canvas ${width}px: "${c.room.text}" fits (${c.room.half} <= ${c.room.right})`);
  }
});

it("x axis — independent facet panels keep their last labels inside", async () => {
  const r = await run(life, [450, 400], true);
  assert.ok(r.overhang.some(l => l.text === "86"), `the Europe panel labels its end (${r.overhang.map(l => l.text).join(", ")})`);
  r.overhang.forEach(l => assert.ok(l.past <= 0.5, `"${l.text}" stays inside (${l.past.toFixed(1)}px past)`));
});

it("x axis — the inset reserves only the last label's overhang", async () => {
  const months = ["Opening", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Closing"];
  const r = await render('<div id="viz" style="width:580px;height:380px"></div>', names =>
    new Promise(resolve => {
      const viz = new window.d3plus.BarChart()
        .data(names.map((id, i) => ({id, value: 10 - i * 0.4})))
        .groupBy("id").x("id").y("value").legend(false)
        .shapeConfig({Bar: {label: false}}).duration(0).select("#viz");
      viz.render(() => {
        const {textData} = window.d3plus.measureAxis(viz._xAxis);
        const last = textData[textData.length - 1];
        resolve({
          drawn: textData.filter(d => d.lines.length).map(d => d.lines.join(" ")),
          end: viz._xAxis._getRange()[1],
          labelRight: last.position + last.width / 2,
        });
      });
    }), months);
  assert.deepStrictEqual(r.drawn, months, "every month keeps its label");
  assert.ok(r.labelRight <= 580.5, `"Closing" stays inside (${r.labelRight.toFixed(1)})`);
  assert.ok(580 - r.labelRight < 10, `no spare room past "Closing" (${(580 - r.labelRight).toFixed(1)}px)`);
});
