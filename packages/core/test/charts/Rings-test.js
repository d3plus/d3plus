import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

after(async () => {
  await closeBrowser();
});

it("Rings click.shape clears the current tooltip when re-centering", async function () {
  this.timeout(60000);
  const result = await render(
    "<div id='viz' style='width:400px;height:400px'></div>",
    async () => {
      const viz = new window.d3plus.Rings()
        .select("#viz")
        .center("alpha")
        .links([
          {source: "alpha", target: "beta"},
          {source: "alpha", target: "gamma"},
          {source: "beta", target: "delta"},
        ])
        .width(400).height(400).duration(0);
      await new Promise(r => viz.render(r));

      // Simulate a tooltip currently on screen (as if hovering a node).
      viz._tooltipClass.data([{id: "beta"}]).render();
      const before = viz._tooltipClass.data().length;

      // Click a non-center node to re-center — the shapes underneath change, so
      // the stale tooltip must be dismissed (parity with the shared drill click).
      // The tooltip clear is synchronous within the handler (before the redraw).
      viz.schema.on["click.shape"]({id: "beta"}, 0);

      return {before, after: viz._tooltipClass.data().length};
    },
  );
  assert.strictEqual(result.before, 1, "tooltip is showing before the click");
  assert.strictEqual(result.after, 0, "tooltip cleared on re-center click");
});
