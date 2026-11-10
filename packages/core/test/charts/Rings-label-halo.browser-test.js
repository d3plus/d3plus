import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Rings node labels outside their nodes draw over a halo in the chart's
    background, so links passing behind them don't run through the text.
    The center's label, inside its circle, has none.
*/

const links = [
  {source: "Hub", target: "A"},
  {source: "Hub", target: "B"},
  {source: "A", target: "B"},
  {source: "A", target: "A1"},
  {source: "B", target: "B1"},
];

/**
    Draws Rings and resolves with each node label's halo stroke (null when
    it has none), by key, and whether the center's label sits inside.
*/
const halos = ([renderer, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Rings()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .center("Hub")
      .links(links)
      .config(config);
    viz.render(() => {
      const labels = {};
      const walk = n => {
        if (n.type === "text" && String(n.key).startsWith("rings-label-"))
          labels[n.key] = n.halo
            ? {stroke: n.paint.stroke, width: n.paint.strokeWidth}
            : null;
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const hub = viz.ctx.ringsCtx.nodeGroups
        .flatMap(([, values]) => values)
        .find(d => d.id === "Hub");
      resolve({labels, centerInside: hub.labelInside});
    });
  });

const box = "<div id='viz' style='width:600px;height:600px'></div>";

describe.each(["svg", "canvas"])("Rings label halos (%s)", renderer => {
  it("labels outside their nodes are haloed in the background; the center's isn't", async () => {
    const {labels, centerInside} = await render(box, halos, [renderer, {}]);
    assert.strictEqual(centerInside, true);
    assert.strictEqual(labels["rings-label-Hub_0"], null, "inside the center");
    for (const id of ["A", "B", "A1", "B1"]) {
      const halo = labels[`rings-label-${id}_0`];
      assert.ok(halo, `${id} is haloed`);
      assert.strictEqual(halo.stroke, "rgb(255, 255, 255)", id);
      assert.ok(halo.width >= 2, `${id}: ${halo.width}px`);
    }
  });

  it("the halo follows the chart's background", async () => {
    const {labels} = await render(box, halos, [renderer, {theme: "dark"}]);
    const a = labels["rings-label-A_0"];
    assert.ok(a && a.stroke !== "rgb(255, 255, 255)", `dark: ${a?.stroke}`);
  });
});
