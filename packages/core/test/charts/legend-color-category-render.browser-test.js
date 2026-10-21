import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    A chart colored by a categorical key outside its groupBy (here, points per
    country colored by region) shows a legend with one entry per category,
    labelled by the category. Hide, solo, and hover act on every item in the
    category, on SVG and Canvas alike.
*/

after(closeBrowser);

const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

/**
    Renders `chart` configured by `configSrc` (a `(viz, data) => viz`
    source) into #viz with `renderer`, then runs `body` in the page. An SVG
    twin in #probe gives each legend entry's position, which holds for the
    canvas too since both lay out identically.
*/
function scene(chart, configSrc, body, renderer = "svg") {
  const boxes = `
    <div id="probe" style="width:700px;height:400px"></div>
    <div id="viz" style="width:700px;height:400px"></div>`;
  return render(boxes, new Function(`return (async () => {
    // Regions first appear in reverse, so the legend's order comes from its sort.
    const regions = ${JSON.stringify(REGIONS)};
    const data = Array.from({length: 20}, (_, i) => ({
      country: "Country " + (i + 1), region: regions[4 - (i % 5)],
      x: i, y: (i * 7) % 13, value: i + 1,
    }));
    const configure = ${configSrc};
    const build = sel =>
      configure(new window.d3plus.${chart}().select(sel).width(700).height(400).duration(0), data);
    const probe = build("#probe");
    await new Promise(r => probe.render(r));
    const viz = build("#viz").renderer("${renderer}");
    await new Promise(r => viz.render(r));
    const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    // Waits out a re-render, then mirrors its hide/solo state onto the twin,
    // whose layout follows the shown data.
    const settle = async () => {
      await new Promise(r => setTimeout(r, 250));
      probe._hidden = [...viz._hidden];
      probe._solo = [...viz._solo];
      await new Promise(r => probe.render(r));
    };
    const legend = viz._legendClass;
    const labels = () => legend.data().map((d, i) => legend.label()(d, i));
    const point = label => {
      const text = Array.from(document.querySelectorAll('#probe [data-key="viz-legend"] text'))
        .find(t => t.textContent.trim() === label);
      const b = text.getBoundingClientRect();
      const p = document.querySelector("#probe").getBoundingClientRect();
      const v = document.querySelector("#viz").getBoundingClientRect();
      return [b.left + b.width / 2 - p.left + v.left, b.top + b.height / 2 - p.top + v.top];
    };
    const fire = (type, label, init = {}) => {
      const [clientX, clientY] = point(label);
      document.elementFromPoint(clientX, clientY)
        .dispatchEvent(new MouseEvent(type, {clientX, clientY, bubbles: true, ...init}));
    };
    const drawn = () => [...new Set(viz._filteredData.map(d => d.region))].sort();
    ${body}
  })()`), renderer);
}

const plot = `(viz, data) => viz.data(data).groupBy("country").color("region").x("x").y("y")`;

for (const renderer of ["svg", "canvas"]) {
  it(`Plot colored by region shows a region legend whose entries act on the whole region (${renderer})`, async function () {
    this.timeout(120000);
    const result = await scene("Plot", plot, `
      const out = {labels: labels()};
      fire("mousemove", "Americas");
      await frame();
      const americas = data.filter(d => d.region === "Americas");
      const others = data.filter(d => d.region !== "Americas");
      out.hovered = americas.every(d => viz._hover(d, 0));
      out.othersHovered = others.some(d => viz._hover(d, 0));
      out.tooltip = document.querySelector(".d3plus-tooltip").textContent;
      fire("click", "Americas");
      await settle();
      out.afterHide = drawn();
      fire("click", "Americas");
      await settle();
      out.afterShow = drawn();
      fire("click", "Asia", {shiftKey: true});
      await settle();
      out.afterSolo = drawn();
      return out;
    `, renderer);
    assert.deepStrictEqual(result.labels, REGIONS, "one entry per region, labelled by region");
    assert.ok(result.hovered, "hovering an entry highlights every point in its region");
    assert.ok(!result.othersHovered, "…and no other region's points");
    assert.ok(result.tooltip.includes("Americas"), `tooltip title names the region: ${result.tooltip}`);
    assert.ok(!result.tooltip.includes("Country"), "tooltip title doesn't list countries");
    assert.deepStrictEqual(result.afterHide, REGIONS.filter(r => r !== "Americas"), "click hides the whole region");
    assert.deepStrictEqual(result.afterShow, REGIONS, "clicking again restores it");
    assert.deepStrictEqual(result.afterSolo, ["Asia"], "shift+click solos the region");
  });
}

/** The legend labels a chart shows, and whether they're color categories. */
const legendOf = (chart, configSrc) =>
  scene(chart, configSrc, "return {labels: labels(), categories: Boolean(viz._legendCategories)};");

it("CSS color values keep the legend hidden", async function () {
  this.timeout(60000);
  const result = await legendOf("Plot", `(viz, data) => viz.data(data).groupBy("country")
    .color(d => ({Africa: "#e8590c", Americas: "#1c7ed6", Asia: "#2f9e44", Europe: "#7048e8", Oceania: "#c2255c"})[d.region])
    .x("x").y("y")`);
  assert.deepStrictEqual(result, {labels: [], categories: false});
});

it("legend(false) hides a category legend", async function () {
  this.timeout(60000);
  const result = await legendOf("Plot", `(viz, data) => viz.data(data).groupBy("country")
    .color("region").x("x").y("y").legend(false)`);
  assert.deepStrictEqual(result.labels, []);
});

it("a color key that is a groupBy level keeps its groupBy labels", async function () {
  this.timeout(60000);
  const result = await legendOf("Plot", `(viz, data) => viz.data(data).groupBy(["region", "country"])
    .color("region").x("x").y("y")`);
  assert.strictEqual(result.categories, false);
  assert.deepStrictEqual([...result.labels].sort(), REGIONS);
});

it("numeric ids hide and restore with their category", async function () {
  this.timeout(60000);
  const result = await scene("Plot", `(viz, data) => viz.data(data.map((d, i) => ({...d, id: i + 1})))
    .groupBy("id").color("region").x("x").y("y")`, `
    fire("click", "Europe");
    await settle();
    const hidden = drawn();
    fire("click", "Europe");
    await settle();
    return {hidden, shown: drawn()};
  `);
  assert.deepStrictEqual(result.hidden, REGIONS.filter(r => r !== "Europe"));
  assert.deepStrictEqual(result.shown, REGIONS);
});

it("an inset or bottom legend labels category entries too", async function () {
  this.timeout(60000);
  const bottom = await legendOf("Plot", `(viz, data) => viz.data(data).groupBy("country")
    .color("region").x("x").y("y").legendPosition("bottom")`);
  assert.deepStrictEqual(bottom.labels, REGIONS);
  const inset = await scene("Plot", `(viz, data) => viz.data(data).groupBy("country")
    .color("region").x("x").y(d => d.x < 10 ? 1 : 12).legendInset(true)`,
  "return {labels: labels(), placed: viz._insetPlacement && viz._insetPlacement.key};");
  assert.deepStrictEqual(inset, {labels: REGIONS, placed: "legend"});
});

for (const [chart, configSrc] of [
  ["BarChart", `(viz, data) => viz.data(data).groupBy("country").color("region").x("country").y("value")`],
  ["Pack", `(viz, data) => viz.data(data).groupBy("country").color("region").sum("value")`],
  ["Pie", `(viz, data) => viz.data(data).groupBy("country").color("region").value("value")`],
  ["Treemap", `(viz, data) => viz.data(data).groupBy("country").color("region").sum("value")`],
]) {
  it(`${chart} colored by a category outside groupBy shows a category legend`, async function () {
    this.timeout(60000);
    const result = await legendOf(chart, configSrc);
    assert.ok(result.categories);
    assert.deepStrictEqual([...result.labels].sort(), REGIONS);
  });
}

it("Treemap keeps hiding a legend whose entries match its tiles", async function () {
  this.timeout(60000);
  const result = await legendOf("Treemap", `(viz, data) => viz.data(data).groupBy("country").sum("value")`);
  assert.deepStrictEqual(result.labels, []);
});
