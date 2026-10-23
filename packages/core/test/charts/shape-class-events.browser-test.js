import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Shape-class handlers (`"click.Rect"`, `"click.Circle"`, `"click.Path"`) on
    charts that emit their marks as bare scene nodes: a real click on a
    Treemap tile, a Network node, or a Sunburst arc fires the handler for the
    shape its node draws, with the same datum `click.shape` gets, on both
    backends.
*/

const charts = {
  Treemap: {
    shape: "Rect",
    nodeType: "rect",
    build: () =>
      new window.d3plus.Treemap()
        .data([
          {id: "alpha", value: 29},
          {id: "beta", value: 10},
          {id: "gamma", value: 18},
        ])
        .groupBy("id")
        .sum("value"),
  },
  Network: {
    shape: "Circle",
    nodeType: "circle",
    build: () =>
      new window.d3plus.Network()
        .nodes([
          {id: "alpha", x: 0, y: 0},
          {id: "beta", x: 2, y: 0},
          {id: "gamma", x: 1, y: 1},
        ])
        .links([
          {source: "alpha", target: "beta"},
          {source: "beta", target: "gamma"},
        ])
        .size(() => 20),
  },
  Sunburst: {
    shape: "Path",
    nodeType: "path",
    build: () =>
      new window.d3plus.Sunburst()
        .data([
          {parent: "A", id: "alpha", value: 29},
          {parent: "A", id: "beta", value: 10},
          {parent: "B", id: "gamma", value: 18},
        ])
        .groupBy(["parent", "id"])
        .sum("value"),
  },
};

const handlers = [
  "click.shape",
  "click.Rect",
  "click.Circle",
  "click.Path",
  "click.legend",
];

for (const [name, {shape, nodeType}] of Object.entries(charts)) {
  for (const renderer of ["svg", "canvas"]) {
    it(`${name} (${renderer}): a click on a ${nodeType} fires click.${shape}`, async () => {
      const {page, errors, close} = await openPage(
        '<div id="viz" style="width:600px;height:400px;"></div>',
      );
      try {
        const point = await page.evaluate(
          ([build, renderer, handlers, nodeType]) =>
            new Promise(resolve => {
              window.__log = [];
              const viz = new Function(`return (${build})()`)()
                .renderer(renderer)
                .duration(0)
                .legend(false)
                .select("#viz");
              for (const key of handlers)
                viz.on(key, d => window.__log.push({key, d}));
              viz.render(() => {
                const box = document
                  .querySelector("#viz")
                  .getBoundingClientRect();
                const renderer = viz._sceneRenderer;
                for (let y = 10; y < box.height; y += 6)
                  for (let x = 10; x < box.width; x += 6) {
                    const pick = renderer.pick([x, y]);
                    if (pick?.node?.type === nodeType && pick.node.datum)
                      return resolve([box.left + x, box.top + y]);
                  }
                resolve(null);
              });
            }),
          [charts[name].build.toString(), renderer, handlers, nodeType],
        );
        assert.ok(point, `found a ${nodeType} mark to click`);
        await page.mouse.click(...point);
        const log = await page.evaluate(() =>
          window.__log.map(({key, d}) => ({key, id: d && d.id})),
        );
        const keys = log.map(entry => entry.key);
        assert.deepStrictEqual(
          keys.filter(key => key !== "click.shape").sort(),
          [`click.${shape}`],
          `only click.${shape} fired among the shape classes (got ${keys})`,
        );
        const own = log.find(entry => entry.key === `click.${shape}`);
        const generic = log.find(entry => entry.key === "click.shape");
        assert.ok(generic, "click.shape fired");
        assert.strictEqual(own.id, generic.id, "same datum as click.shape");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }
}
