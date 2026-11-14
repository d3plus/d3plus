import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";
import {render} from "~test/browser/render.js";

/**
    Map-shaped small multiples (`facetConfig.layout`) in a real browser, on
    both renderers: each panel in its place's cell with empty cells left
    empty, titles in short codes with the full name on hover, every plot
    area the same size, a custom grid, and a warning for values the grid
    doesn't hold.
*/

const states = ["California", "Nevada", "Oregon", "Washington", "Texas", "NY"];
const data = states.flatMap(state =>
  [2020, 2021, 2022].map((year, k) => ({state, year, value: k + state.length})),
);

/** Each panel's value, cell, title, title tooltip, and plot size. */
const extract = viz => {
  const nodes = sceneNodes(viz._chartScene || []);
  return viz._facetPanels.map(p => {
    const title = nodes.find(n => n.key === `${p.key}/title`);
    const a = p.state._plotArea;
    return {
      value: p.value,
      row: p.cell.row,
      column: p.cell.column,
      title: title ? title.lines.map(l => l.text).join(" ") : "",
      tooltip: title?.axisTooltip?.option,
      width: a.width,
      height: a.height,
    };
  });
};

const src = config => `(lib, data) => new lib.LinePlot()
  .data(data)
  .detectVisible(false)
  .config(${JSON.stringify({
    x: "year",
    y: "value",
    groupBy: "state",
    facet: "state",
    ...config,
  })})`;

const html = '<div id="viz" style="width:900px;height:600px"></div>';

for (const renderer of ["svg", "canvas"]) {
  it(`facet layout ${renderer} — us-states places each state in its cell`, async () => {
    const out = await probeChart(
      src({facetConfig: {layout: "us-states"}}),
      extract,
      {data, renderer, html},
    );
    const by = Object.fromEntries(out.map(p => [p.title, p]));
    assert.deepStrictEqual(out.map(p => p.title).sort(), [
      "CA",
      "NV",
      "NY",
      "OR",
      "TX",
      "WA",
    ]);
    assert.deepStrictEqual([by.WA.row, by.WA.column], [2, 1]);
    assert.deepStrictEqual([by.CA.row, by.CA.column], [4, 1]);
    assert.deepStrictEqual([by.TX.row, by.TX.column], [7, 4]);
    assert.deepStrictEqual([by.NY.row, by.NY.column], [2, 9]);
    assert.strictEqual(by.CA.tooltip, "California");
    assert.strictEqual(by.NY.tooltip, "New York");
    for (const p of out) {
      assert.ok(Math.abs(p.width - out[0].width) < 0.75, `${p.title} width`);
      assert.ok(Math.abs(p.height - out[0].height) < 0.75, `${p.title} height`);
    }
  });

  it(`facet layout ${renderer} — hovering a title shows the full name`, async () => {
    const text = await probeChart(
      src({facetConfig: {layout: "us-states"}}),
      viz =>
        new Promise(resolve => {
          const host = document.querySelector("#viz");
          const surface = host.querySelector(
            "svg.d3plus-render-svg, canvas.d3plus-render-canvas",
          );
          const r = surface.getBoundingClientRect();
          const node = sceneNodes(viz._chartScene).find(
            n => n.axisTooltip?.option === "Texas",
          );
          // SVG: the title's own element; Canvas: its first line's place.
          const el = host.querySelector(`svg [data-key="${node.key}"]`);
          const box = el && el.getBoundingClientRect();
          const t = node.transform || {};
          const x = box
              ? box.left + box.width / 2
              : r.left + (t.x || 0) + (node.lines[0].x || 0),
            y = box
              ? box.top + box.height / 2
              : r.top + (t.y || 0) + node.lines[0].y - 4;
          (el || surface).dispatchEvent(
            new MouseEvent("mousemove", {
              clientX: x,
              clientY: y,
              bubbles: true,
            }),
          );
          setTimeout(() => {
            const tip = document.querySelector(".d3plus-tooltip");
            resolve(tip ? tip.textContent : "");
          }, 80);
        }),
      {data, renderer, html},
    );
    assert.match(text, /Texas/);
  });

  it(`facet layout ${renderer} — a mark's tooltip is headed by its panel's place`, async () => {
    const heading = config =>
      probeChart(
        src(config),
        viz =>
          new Promise(resolve => {
            const host = document.querySelector("#viz");
            const surface = host.querySelector(
              "svg.d3plus-render-svg, canvas.d3plus-render-canvas",
            );
            const r = surface.getBoundingClientRect();
            const p = viz._facetPanels.find(
              p => p.value === "Texas" || p.value === "Nevada",
            );
            const a = p.state._plotArea,
              t = p.chartTransform;
            // The pointer over the panel's plot, as the renderer reports it.
            const point = [t.x + a.x + a.width / 2, t.y + a.y + a.height / 2];
            viz._routeSceneEvent({
              type: "mousemove",
              point,
              pick: null,
              nativeEvent: new MouseEvent("mousemove", {
                clientX: r.left + point[0],
                clientY: r.top + point[1],
              }),
            });
            requestAnimationFrame(() =>
              setTimeout(() => {
                const tip = document.querySelector(".d3plus-tooltip");
                resolve({
                  shown: !!tip,
                  heading:
                    tip?.querySelector(".d3plus-tooltip-heading")
                      ?.textContent ?? null,
                });
              }, 60),
            );
          }),
        {data, renderer, html},
      );
    const named = await heading({facetConfig: {layout: "us-states"}});
    assert.ok(named.shown);
    assert.ok(["Texas", "Nevada"].includes(named.heading), named.heading);
    const custom = await heading({
      facetConfig: {layout: {Texas: [0, 0], Nevada: [0, 1]}},
    });
    assert.ok(custom.shown);
    assert.strictEqual(custom.heading, null, "a custom grid has no names");
  });

  it(`facet layout ${renderer} — a custom grid, and a warning for values it lacks`, async () => {
    const out = await render(
      html,
      async ([data, renderer]) => {
        const warnings = [];
        const warn = console.warn;
        console.warn = (...args) => warnings.push(args.join(" "));
        try {
          const viz = await new Promise(resolve => {
            const v = new window.d3plus.LinePlot()
              .data(data)
              .detectVisible(false)
              .duration(0)
              .renderer(renderer)
              .select("#viz")
              .config({
                x: "year",
                y: "value",
                groupBy: "state",
                facet: "state",
                facetConfig: {
                  layout: {California: [1, 0], Nevada: [1, 1], Oregon: [0, 0]},
                },
              });
            v.render(() => resolve(v));
          });
          return {
            panels: viz._facetPanels.map(p => [
              p.value,
              p.cell.row,
              p.cell.column,
            ]),
            warnings,
          };
        } finally {
          console.warn = warn;
        }
      },
      [data, renderer],
    );
    assert.deepStrictEqual(out.panels.sort(), [
      ["California", 1, 0],
      ["Nevada", 1, 1],
      ["Oregon", 0, 0],
    ]);
    assert.ok(
      out.warnings.some(w => /no cell for "NY", "Texas", "Washington"/.test(w)),
      out.warnings.join("\n"),
    );
  });
}
