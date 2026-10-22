import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A shape's background image paints above its shape. Plot sorts its circles
    by size, and an image's box reaches past a circle sitting on the plot edge,
    so the images are wrapped in a domain clip: the clip group keeps the
    images' place in the sort, on both renderers' scenes and in the SVG.
*/

const probe = renderer =>
  new Promise(resolve => {
    const data = [
      {id: "a", x: 0, y: 0, value: 100},
      {id: "b", x: 1, y: 4, value: 5},
      {id: "c", x: 2, y: 2, value: 40},
      {id: "d", x: 3, y: 8, value: 70},
    ];
    const viz = new window.d3plus.Plot()
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .size("value")
      .sizeMax(60)
      .shapeConfig({
        Circle: {
          backgroundImage: () => "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
        },
      })
      .duration(0)
      .renderer(renderer)
      .select("#viz");
    viz.render(() => {
      // Paint order: each group's children sorted by `z`, as the backends do.
      const order = [];
      const walk = node => {
        order.push(node.key);
        [...(node.children || [])]
          .map((child, i) => ({child, i}))
          .sort((p, q) => (p.child.z ?? 0) - (q.child.z ?? 0) || p.i - q.i)
          .forEach(({child}) => walk(child));
      };
      walk(viz._paintedScene.root);
      const dom = [...document.querySelectorAll("#viz [data-key]")].map(n =>
        n.getAttribute("data-key"),
      );
      const clipped = order.some(k => String(k).startsWith("plot-domain-clip"));
      resolve({order, dom, clipped, svg: renderer === "svg"});
    });
  });

for (const renderer of ["svg", "canvas"])
  it(`${renderer}: Plot circles' background images paint above every circle`, async () => {
    const {order, dom, clipped, svg} = await render(
      '<div id="viz" style="width:400px;height:300px"></div>',
      probe,
      renderer,
    );
    assert.ok(clipped, "the images are wrapped in a domain clip");
    for (const id of ["a", "b", "c", "d"]) {
      assert.ok(
        order.indexOf(`${id}-bgimage`) > order.indexOf(id),
        `${id}'s image paints after it in the scene`,
      );
      if (svg)
        assert.ok(
          dom.indexOf(`${id}-bgimage`) > dom.indexOf(id),
          `${id}'s image follows it in the SVG`,
        );
    }
    const lastCircle = Math.max(
      ...["a", "b", "c", "d"].map(id => order.indexOf(id)),
    );
    assert.ok(
      ["a", "b", "c", "d"].every(
        id => order.indexOf(`${id}-bgimage`) > lastCircle,
      ),
      "every image paints above every circle",
    );
  });
