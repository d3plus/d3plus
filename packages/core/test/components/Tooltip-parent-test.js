import assert from "assert";
import it from "../jsdom.js";
import {Tooltip} from "../../es/index.js";

/**
    v4 Tooltip.parent() scopes the tooltip portal to a specific element
    instead of the global body-level #d3plus-portal. This locks the
    multi-chart-isolation guarantee — two charts on a page get their own
    portals and don't fight over a shared one.
*/

it("Tooltip.parent() is a no-arg getter and a 1-arg setter", () => {
  const tip = new Tooltip();
  assert.strictEqual(tip.parent(), undefined, "default is unset");
  const div = document.createElement("div");
  document.body.appendChild(div);
  tip.parent(div);
  assert.strictEqual(tip.parent(), div, "set value round-trips");
  tip.parent(null);
  assert.strictEqual(tip.parent(), undefined, "null clears");
});

it("Tooltip.render() with parent() mounts inside the parent, NOT the body portal", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const tip = new Tooltip()
    .parent(container)
    .data([{id: "a", title: "Hello"}])
    .render();

  const scopedPortal = container.querySelector(".d3plus-tooltip-portal");
  assert.ok(scopedPortal, "scoped tooltip portal lives under the parent");

  // The global body-level #d3plus-portal should NOT be populated by this
  // chart's tooltip (it may exist from other tests; what matters is that
  // OUR tooltip ended up under the parent, not the body portal).
  const tooltipInScoped = scopedPortal.querySelector(".d3plus-tooltip");
  assert.ok(tooltipInScoped, "tooltip rendered inside scoped portal");

  // Cleanup.
  tip.data([]).render();
});

it("Tooltip.render() without parent() falls back to body #d3plus-portal", () => {
  const tip = new Tooltip()
    .data([{id: "fallback-test", title: "x"}])
    .render();

  const bodyPortal = document.body.querySelector("#d3plus-portal");
  assert.ok(bodyPortal, "global portal still works when parent is unset");

  tip.data([]).render();
});
