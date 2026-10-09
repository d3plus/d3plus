import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

// Setting one nested key of a chart's config bag (or calling fontFamily(),
// which writes into those bags) must leave every other default as drawn.
after(async () => {
  await closeBrowser();
});

/**
 * Draws each case twice — as configured by `base`, then with `change` on
 * top — and returns both renders' paint attributes for every chart element.
 */
function drawPairs(cases) {
  return render('<div id="s" style="width:600px;height:400px;"></div>', async cases => {
    const data = {
      Radar: [
        {id: "alpha", axis: "Strength", value: 10},
        {id: "alpha", axis: "Speed", value: 6},
        {id: "alpha", axis: "Range", value: 8},
        {id: "beta", axis: "Strength", value: 4},
        {id: "beta", axis: "Speed", value: 9},
        {id: "beta", axis: "Range", value: 5},
      ],
      Priestley: [
        {id: "alpha", start: new Date(2001, 0, 1), end: new Date(2005, 0, 1)},
        {id: "beta", start: new Date(2003, 0, 1), end: new Date(2008, 0, 1)},
      ],
      Treemap: [
        {id: "alpha", value: 50},
        {id: "beta", value: 20},
        {id: "gamma", value: 8},
      ],
      Pie: [
        {id: "alpha", value: 50},
        {id: "beta", value: 20},
        {id: "gamma", value: 8},
      ],
    };
    const setup = {
      Radar: v => v.data(data.Radar).metric("axis").value("value"),
      Priestley: v => v.data(data.Priestley),
      Treemap: v => v.data(data.Treemap),
      Pie: v => v.data(data.Pie),
    };
    const ATTRS = ["fill", "stroke", "stroke-width", "font-family", "font-size", "font-weight"];
    const draw = async (chart, config) => {
      document.querySelector("#s").innerHTML = "";
      const viz = setup[chart](new window.d3plus[chart]().select("#s").duration(0).legend(false));
      new Function("viz", `viz${config}`)(viz);
      await new Promise(resolve => viz.render(resolve));
      return [...document.querySelectorAll("#s svg text, #s svg line, #s svg path, #s svg rect")]
        .filter(el => el.closest("[data-key*='viz-chart-body'], [id*='viz-chart-body']"))
        .map(el => {
          const out = {tag: el.tagName, text: el.tagName === "text" ? el.textContent : ""};
          for (const a of ATTRS) out[a] = el.getAttribute(a);
          return out;
        });
    };
    const results = [];
    for (const {chart, change} of cases)
      results.push({base: await draw(chart, ""), changed: await draw(chart, change)});
    return results;
  }, cases);
}

const mask = (els, attr) => els.map(el => (el.tag === "text" ? {...el, [attr]: null} : el));

const cases = [
  {chart: "Radar", change: ".axisConfig({shapeConfig: {labelConfig: {fontSize: 17}}})", attr: "font-size", value: "17"},
  {chart: "Radar", change: ".fontFamily('monospace')", attr: "font-family", value: "monospace"},
  {chart: "Priestley", change: ".fontFamily('monospace')", attr: "font-family", value: "monospace"},
  {chart: "Treemap", change: ".shapeConfig({labelConfig: {fontColor: 'rgb(1, 2, 3)'}})", attr: "fill", value: "rgb(1, 2, 3)"},
  {chart: "Pie", change: ".shapeConfig({Path: {labelConfig: {fontColor: 'rgb(1, 2, 3)'}}})", attr: "fill", value: "rgb(1, 2, 3)"},
];

let drawn;
before(async function () {
  this.timeout(120000);
  drawn = await drawPairs(cases.map(({chart, change}) => ({chart, change})));
});

cases.forEach(({chart, change, attr, value}, i) => {
  const label = `${chart}${change}`;
  it(`${label} keeps the chart's other defaults`, () => {
    const {base, changed} = drawn[i];
    assert.ok(base.some(el => el.tag === "text"), "draws labels");
    assert.ok(
      changed.some(el => el.tag === "text" && (el[attr] ?? "").includes(value)),
      `applies ${attr}`,
    );
    assert.deepStrictEqual(mask(changed, attr), mask(base, attr));
  });
});
