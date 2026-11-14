import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Parliament (Waffle's `layout: "arc"`) in a real browser, on SVG and
    Canvas: a dot per seat on concentric half rings, filled party by party,
    with the total in the middle and a majority line; hovering a seat
    highlights its party; hiding a party reseats the house; icons and small
    multiples work on the arc, and the cells keep their keys from the grid.
*/

const data = [
  {party: "Left", election: 2019, seats: 40},
  {party: "Centre", election: 2019, seats: 25},
  {party: "Right", election: 2019, seats: 35},
  {party: "Left", election: 2023, seats: 30},
  {party: "Centre", election: 2023, seats: 20},
  {party: "Right", election: 2023, seats: 50},
];

/** In-page helpers: build + render a chart, list its cells, and wait. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus[opts.chart || "Parliament"]()
      .select("#viz")
      .data(window.DATA.filter(d => opts.facet || d.election === 2019).map(d => ({...d})))
      .groupBy("party")
      .sum("seats")
      .duration(0)
      .width(600).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.flat(n.children) : [])]);
  window.cells = chart => window.flat(chart._chartScene)
    .filter(n => (n.type === "circle" || n.type === "rect") && String(n.key).includes("waffle-"));
  window.text = n => n.lines.map(l => l.text ?? l).join(" ");
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

for (const renderer of ["svg", "canvas"]) {
  it(`Parliament (${renderer}): a dot per seat, filled party by party, with the total and a majority line`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const cells = window.cells(chart);
      const arc = chart.ctx.waffleArc;
      const angle = c =>
        Math.atan2(
          c.cx + (c.transform?.x ?? 0) - arc.cx,
          arc.cy - c.cy - (c.transform?.y ?? 0),
        );
      const nodes = window.flat(chart._chartScene);
      const texts = nodes.filter(n => n.type === "text").map(window.text);
      return {
        count: cells.length,
        circles: cells.every(c => c.type === "circle"),
        order: cells
          .slice()
          .sort((a, b) => angle(a) - angle(b))
          .map(c => c.datum.party)
          .filter((p, i, all) => p !== all[i - 1]),
        line: nodes.some(n => n.key === "waffle-majority" && n.type === "line"),
        texts,
        labelled: cells.filter(c => c.aria && c.aria.label).length,
        dom:
          renderer === "svg"
            ? document.querySelectorAll("#viz svg circle[data-key^='waffle-']")
                .length
            : document.querySelectorAll("#viz canvas").length,
        legend: chart._legendClass.data().map(d => d.party),
      };
    }, renderer);
    assert.strictEqual(out.count, 100);
    assert.ok(out.circles, "dots");
    assert.deepStrictEqual(out.order, ["Left", "Centre", "Right"]);
    assert.ok(out.line, "a majority line");
    assert.ok(out.texts.includes("Majority: 51"), out.texts.join("|"));
    assert.ok(out.texts.includes("100"), "the total in the middle");
    assert.strictEqual(out.labelled, 3, "one labelled seat per party");
    assert.ok(out.dom >= (renderer === "svg" ? 100 : 1));
    assert.deepStrictEqual(out.legend, ["Left", "Centre", "Right"]);
  });

  it(`Parliament (${renderer}): hovering a seat highlights its party, with seats in the tooltip`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const target = window.cells(chart).find(c => c.datum.party === "Centre");
      const host = document.querySelector(
        renderer === "svg" ? "#viz svg.d3plus-render-svg" : "#viz canvas",
      );
      const box = host.getBoundingClientRect();
      const t = chart._chartTransform || {};
      const clientX =
        box.left + (t.x || 0) + target.cx + (target.transform?.x ?? 0);
      const clientY =
        box.top + (t.y || 0) + target.cy + (target.transform?.y ?? 0);
      // A canvas hit-tests a real pointer; an SVG seat is routed its events.
      if (renderer === "canvas")
        host.dispatchEvent(
          new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
        );
      else
        for (const type of ["mouseenter", "mousemove"])
          chart._routeSceneEvent({
            type,
            point: [1, 1],
            pick: {node: target, datum: target.datum, index: target.index},
            nativeEvent: {stopPropagation() {}, clientX, clientY},
          });
      await window.wait(150);
      const bright = window
        .cells(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index));
      const tooltip = document.querySelector(".d3plus-tooltip");
      return {
        bright: bright.length,
        parties: [...new Set(bright.map(n => n.datum.party))],
        tooltip: tooltip ? tooltip.textContent : "",
      };
    }, renderer);
    assert.strictEqual(out.bright, 25);
    assert.deepStrictEqual(out.parties, ["Centre"]);
    assert.ok(/Seats\s*25/.test(out.tooltip), out.tooltip);
    assert.ok(/Share\s*25%/.test(out.tooltip), out.tooltip);
  });

  it(`Parliament (${renderer}): hiding a party reseats the house`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const legend = chart._legendClass.data();
      chart.schema.on["click.legend"].call(chart, legend[0], 0, undefined, {
        shiftKey: false,
      });
      for (let k = 0; k < 50 && chart._hidden.length === 0; k++)
        await window.wait(20);
      await window.wait(200);
      const texts = window
        .flat(chart._chartScene)
        .filter(n => n.type === "text")
        .map(window.text);
      return {
        hidden: chart._hidden,
        count: window.cells(chart).length,
        parties: [...new Set(window.cells(chart).map(c => c.datum.party))],
        texts,
      };
    }, renderer);
    assert.deepStrictEqual(out.hidden, ["Left"]);
    assert.strictEqual(out.count, 60);
    assert.deepStrictEqual(out.parties, ["Centre", "Right"]);
    assert.ok(out.texts.includes("Majority: 31"), out.texts.join("|"));
    assert.ok(out.texts.includes("60"));
  });

  it(`Parliament (${renderer}): icons, small multiples, and a Waffle's grid keys`, async () => {
    const out = await page(async renderer => {
      const icon =
        "data:image/svg+xml," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 2'><rect width='2' height='2'/></svg>",
        );
      const iconChart = await window.build({renderer, config: {icon}});
      const images = window
        .flat(iconChart._chartScene)
        .filter(n => n.type === "image").length;
      const facet = await window.build({
        renderer,
        facet: true,
        config: {facet: "election"},
      });
      const facetNodes = window.flat(facet._chartScene);
      const grid = await window.build({
        renderer,
        chart: "Waffle",
        config: {unit: 1},
      });
      const gridKeys = window
        .cells(grid)
        .map(c => c.key)
        .sort();
      const arc = await window.build({
        renderer,
        chart: "Waffle",
        config: {unit: 1, layout: "arc", cellShape: "circle"},
      });
      return {
        images,
        facetCells: window.cells(facet).length,
        facetLines: facetNodes.filter(n => n.type === "line").length,
        same:
          JSON.stringify(gridKeys) ===
          JSON.stringify(
            window
              .cells(arc)
              .map(c => c.key)
              .sort(),
          ),
        arcMajority: window
          .flat(arc._chartScene)
          .some(n => n.key === "waffle-majority"),
      };
    }, renderer);
    assert.strictEqual(out.images, 100, "an icon per seat");
    assert.strictEqual(out.facetCells, 200, "two houses");
    assert.ok(out.facetLines >= 2, "a majority line each");
    assert.ok(out.same, "the grid's cells move onto the arc");
    assert.strictEqual(out.arcMajority, false, "Waffle draws no majority");
  });
}
