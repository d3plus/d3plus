/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Dumbbell's change connectors in a real browser, on SVG and Canvas:
    `arrows` draws an arrow from each category's first value to its last,
    colored by direction, ending at its head's base; `connector: "bar"`
    draws a floating bar in place of the dots (with an arrowhead under
    `arrows`), hides the series legend, and keeps the shared tooltip, which
    adds the category's change or range.
*/

const rates = [
  {country: "Spain", year: "2019", v: 14},
  {country: "Spain", year: "2023", v: 12},
  {country: "Chile", year: "2019", v: 7},
  {country: "Chile", year: "2023", v: 9},
  {country: "Japan", year: "2019", v: 2.4},
  {country: "Japan", year: "2023", v: 2.5},
];

/** Renders a Dumbbell, hovers `hover`'s dot, and reports its scene and tooltip. */
const draw = ([config, rows, renderer, hover]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Dumbbell()
      .data(rows)
      .groupBy("year")
      .x("v")
      .y("country")
      .config(config)
      .renderer(renderer)
      .width(500)
      .height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes =>
        nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const numbers = d =>
        d
          .split(/[^\d.e-]+/)
          .filter(Boolean)
          .map(Number);
      const at = n => [n.transform?.x ?? 0, n.transform?.y ?? 0];
      const lines = nodes
        .filter(n => /::connector$/.test(`${n.key}`) && n.type === "path")
        .map(n => {
          const [x0, y0, x1, y1] = numbers(n.d);
          const [tx, ty] = at(n);
          return {
            key: n.key,
            stroke: n.paint.stroke,
            from: [x0 + tx, y0 + ty],
            to: [x1 + tx, y1 + ty],
          };
        });
      const arrows = nodes
        .filter(n => /::connector::arrow$/.test(`${n.key}`))
        .map(n => ({
          key: n.key,
          fill: n.paint.fill,
          interactive: n.interactive,
          points: (n.interactionPoints || []).length,
          tip: numbers(n.d).slice(0, 2),
        }));
      const bars = nodes
        .filter(n => /::connector$/.test(`${n.key}`) && n.type === "rect")
        .map(n => ({
          key: n.key,
          fill: n.paint.fill,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          points: (n.interactionPoints || []).length,
        }));
      const points = nodes
        .filter(n => n.type === "circle" && n.datum)
        .map(n => ({
          country: n.datum.data.country,
          year: n.datum.data.year,
          x: n.transform.x,
          y: n.transform.y,
          r: n.r,
          fill: n.paint.fill,
          opacity: n.paint.opacity,
        }));
      const legend = viz._legendClass ? viz._legendClass.data().length : 0;
      const dot = nodes.find(
        n => n.type === "circle" && n.datum && n.datum.data.country === hover,
      );
      const c = viz._chartTransform;
      const host =
        renderer === "canvas"
          ? document.querySelector("#viz canvas.d3plus-render-canvas")
          : document.querySelector("#viz svg.d3plus-render-svg");
      const box = host.getBoundingClientRect();
      host.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: box.left + c.x + dot.transform.x + 10,
          clientY: box.top + c.y + dot.transform.y,
          bubbles: true,
        }),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          const swatches = tip
            ? Array.from(tip.querySelectorAll(".d3plus-tooltip-swatch")).map(
                el => getComputedStyle(el).backgroundColor,
              )
            : [];
          resolve({
            swatches,
            axisColor: viz._axisHoverState ? viz._axisHoverState.color : null,
            lines,
            arrows,
            bars,
            points,
            legend,
            tooltip: tip ? tip.textContent : "",
            colors: viz.schema.colorDefaults,
          });
        }, 50),
      );
    });
  });

const chart = (config, renderer, hover = "Spain") =>
  render("<div id='viz' style='width:500px;height:400px'></div>", draw, [
    config,
    rates,
    renderer,
    hover,
  ]);

const near = (a, b, label, tolerance = 0.6) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} ≈ ${b}`);

for (const renderer of ["svg", "canvas"]) {
  it(`Dumbbell arrows (${renderer}): an arrow from the first value to the last, colored by direction`, async () => {
    const out = await chart({arrows: true}, renderer);
    const point = (country, year) =>
      out.points.find(p => p.country === country && p.year === year);
    // Japan's change is too small for a head between its dots.
    assert.deepStrictEqual(out.arrows.map(a => a.key).sort(), [
      "Chile::connector::arrow",
      "Spain::connector::arrow",
    ]);
    const spain = out.lines.find(l => l.key === "Spain::connector");
    const chile = out.lines.find(l => l.key === "Chile::connector");
    assert.strictEqual(spain.stroke, out.colors.off, "a fall is red");
    assert.strictEqual(chile.stroke, out.colors.on, "a rise is green");
    const head = out.arrows.find(a => a.key === "Spain::connector::arrow");
    assert.strictEqual(
      head.fill,
      spain.stroke,
      "the head takes its line's color",
    );
    assert.strictEqual(head.interactive, false);
    assert.strictEqual(head.points, 2, "dims with its points");
    // Spain falls from 2019 (right) to 2023 (left): the line starts at the
    // 2019 dot and ends at the head's base, the tip a pixel off the 2023 dot.
    const from = point("Spain", "2019");
    const to = point("Spain", "2023");
    near(spain.from[0], from.x, "starts at the first dot");
    near(head.tip[0], to.x + to.r + 1, "tip at the last dot's outline");
    assert.ok(spain.to[0] > head.tip[0] + 6, "line ends at the head's base");
    assert.ok(/Change\s*-2/.test(out.tooltip), out.tooltip);
  });

  it(`Dumbbell arrows (${renderer}): vertical, with custom colors and size`, async () => {
    const out = await chart(
      {
        arrows: true,
        arrowSize: 14,
        discrete: "x",
        x: "country",
        y: "v",
        increaseColor: "#ff00ff",
        decreaseColor: "#00ffff",
      },
      renderer,
    );
    const chile = out.lines.find(l => l.key === "Chile::connector");
    const spain = out.lines.find(l => l.key === "Spain::connector");
    assert.strictEqual(chile.stroke, "#ff00ff");
    assert.strictEqual(spain.stroke, "#00ffff");
    const head = out.arrows.find(a => a.key === "Chile::connector::arrow");
    const to = out.points.find(p => p.country === "Chile" && p.year === "2023");
    near(head.tip[1], to.y + to.r + 1, "rising tip below the higher dot");
    near(chile.to[1] - head.tip[1], 14, "the head is 14 pixels long", 1.6);
  });

  it(`Dumbbell bars (${renderer}): a floating bar per category in place of the dots`, async () => {
    const out = await chart({connector: "bar"}, renderer);
    assert.strictEqual(out.lines.length, 0);
    assert.strictEqual(out.arrows.length, 0);
    assert.strictEqual(out.bars.length, 3);
    assert.ok(
      out.points.every(
        p => p.opacity === 0 && p.fill === out.colors.sequential,
      ),
      "the dots stay for hover, unseen, in their bar's color",
    );
    assert.strictEqual(out.legend, 0, "no series legend");
    const spain = out.bars.find(b => b.key === "Spain::connector");
    const pts = out.points.filter(p => p.country === "Spain");
    const xs = pts.map(p => p.x).sort((a, b) => a - b);
    near(spain.x, xs[0], "starts at the smallest value");
    near(spain.x + spain.width, xs[1], "ends at the largest value");
    near(spain.y + spain.height / 2, pts[0].y, "centered on the category");
    assert.strictEqual(spain.fill, out.colors.sequential);
    assert.strictEqual(spain.points, 2);
    assert.ok(/Range\s*2/.test(out.tooltip), out.tooltip);
  });

  it(`Dumbbell bars (${renderer}): the shared tooltip and axis tag take the bar's color`, async () => {
    const rgb = hex =>
      `rgb(${[1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)).join(", ")})`;
    const span = await chart({connector: "bar"}, renderer);
    assert.strictEqual(span.swatches.length, 2, span.tooltip);
    assert.ok(
      span.swatches.every(c => c === rgb(span.colors.sequential)),
      span.swatches.join(" "),
    );
    assert.strictEqual(span.axisColor, span.colors.sequential);
    const change = await chart(
      {connector: "bar", arrows: true},
      renderer,
      "Chile",
    );
    assert.ok(
      change.swatches.length === 2 &&
        change.swatches.every(c => c === rgb(change.colors.on)),
      change.swatches.join(" "),
    );
    assert.strictEqual(change.axisColor, change.colors.on);
  });

  it(`Dumbbell bars with arrows (${renderer}): change bars colored by direction`, async () => {
    const out = await chart(
      {connector: "bar", arrows: true},
      renderer,
      "Chile",
    );
    const chile = out.bars.find(b => b.key === "Chile::connector");
    const head = out.arrows.find(a => a.key === "Chile::connector::arrow");
    const pts = out.points.filter(p => p.country === "Chile");
    const [first, last] = [
      pts.find(p => p.year === "2019"),
      pts.find(p => p.year === "2023"),
    ];
    assert.strictEqual(chile.fill, out.colors.on);
    assert.strictEqual(head.fill, chile.fill);
    near(chile.x, first.x, "starts at the first value");
    near(head.tip[0], last.x, "the tip reaches the last value");
    near(
      last.x - (chile.x + chile.width),
      chile.height,
      "head as long as the bar is thick",
    );
    const spain = out.bars.find(b => b.key === "Spain::connector");
    assert.strictEqual(spain.fill, out.colors.off);
    assert.ok(/Change\s*\+2/.test(out.tooltip), out.tooltip);
  });
}
