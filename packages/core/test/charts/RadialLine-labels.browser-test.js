import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    RadialLine and RadialArea name their series by default (`lineLabels`),
    clear of the ring value labels. When every series is named, the default
    legend hides; when one has no room for its name, or the names are off,
    the legend stays. On SVG and Canvas.
*/

const box = "<div id='viz' style='width:600px;height:500px'></div>";

/** Four hours of two series, at fixed values. */
const rows = (a, b) =>
  [0, 6, 12, 18].flatMap(hour => [
    {id: "Alpha", hour, value: a},
    {id: "Beta", hour, value: b},
  ]);

/** Draws a chart and reads its series labels and legend. Runs in the page. */
const draw = ([cls, data, renderer, src]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[cls]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(data)
      .groupBy("id")
      .x("hour")
      .y("value")
      .xDomain([0, 24])
      .config(new Function(`return (${src});`)());
    viz.render(() => {
      const find = (node, key) => {
        if (node.key === key) return node;
        for (const c of node.children || []) {
          const hit = find(c, key);
          if (hit) return hit;
        }
        return null;
      };
      const group = find(viz._paintedScene.root, "radial-series-labels");
      const labels = group ? group.children : [];
      const boxes = window.d3plus.radialTextBoxes(labels);
      const rings = viz.ctx.radial.levelBoxes;
      const overlaps = boxes.some(b =>
        rings.some(
          r =>
            b.x < r.x + r.width &&
            r.x < b.x + b.width &&
            b.y < r.y + r.height &&
            r.y < b.y + b.height,
        ),
      );
      resolve({
        names: labels.map(n => n.lines.map(l => l.text).join(" ")).sort(),
        rings: rings.length,
        overlaps,
        hidden: viz._alongLegendHide,
        legend: viz._legendClass.outerBounds().height > 0,
      });
    });
  });

async function chart(cls, data, renderer, config = "{}") {
  const {page, close} = await openPage(box);
  try {
    return await page.evaluate(
      ([src, args]) => new Function(`return (${src})`)()(args),
      [draw.toString(), [cls, data, renderer, config]],
    );
  } finally {
    await close();
  }
}

describe.each(["svg", "canvas"])("radial series labels (%s)", renderer => {
  it("names every line by default, clear of the ring labels, and hides the legend", async () => {
    const out = await chart(
      "RadialLine",
      rows(6, 3),
      renderer,
      "{yDomain: [0, 10]}",
    );
    assert.deepStrictEqual(out.names, ["Alpha", "Beta"]);
    assert.ok(out.rings > 0, "the rings are labeled");
    assert.strictEqual(out.overlaps, false, "no name covers a ring label");
    assert.strictEqual(out.hidden, true);
    assert.strictEqual(out.legend, false, "the names stand in for the legend");
  });

  it("keeps the legend when a line has no room for its name", async () => {
    // Alpha runs along the outer ring, where no name fits inside the circle.
    const out = await chart(
      "RadialLine",
      rows(10, 3),
      renderer,
      "{yDomain: [0, 10]}",
    );
    assert.deepStrictEqual(out.names, ["Beta"]);
    assert.strictEqual(out.overlaps, false);
    assert.strictEqual(out.hidden, false);
    assert.strictEqual(out.legend, true, "the legend names Alpha");
  });

  it("keeps the legend with lineLabels(false)", async () => {
    const out = await chart(
      "RadialLine",
      rows(6, 3),
      renderer,
      "{yDomain: [0, 10], lineLabels: false}",
    );
    assert.deepStrictEqual(out.names, []);
    assert.strictEqual(out.legend, true);
  });

  it("names every stacked band inside it and hides the legend", async () => {
    const out = await chart(
      "RadialArea",
      rows(30, 30),
      renderer,
      "{stacked: true, yDomain: [0, 60]}",
    );
    assert.deepStrictEqual(out.names, ["Alpha", "Beta"]);
    assert.strictEqual(out.overlaps, false, "no name covers a ring label");
    assert.strictEqual(out.legend, false);
  });
});
