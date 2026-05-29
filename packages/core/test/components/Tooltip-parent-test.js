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

it("Tooltip.parent() leaves no orphan portal when switched to a different parent", () => {
  const containerA = document.createElement("div");
  const containerB = document.createElement("div");
  document.body.appendChild(containerA);
  document.body.appendChild(containerB);

  const tip = new Tooltip()
    .parent(containerA)
    .data([{id: "switch-test", title: "in A"}])
    .render();
  assert.ok(
    containerA.querySelector(".d3plus-tooltip-portal"),
    "portal exists in A after first render",
  );

  // Switch to B — A's portal should be cleaned up.
  tip.parent(containerB).data([{id: "switch-test", title: "in B"}]).render();
  assert.strictEqual(
    containerA.querySelector(".d3plus-tooltip-portal"),
    null,
    "stale portal in A removed when parent switched",
  );
  assert.ok(
    containerB.querySelector(".d3plus-tooltip-portal"),
    "fresh portal mounted in B",
  );

  tip.data([]).render();
});

it("Two charts on a page maintain isolated tooltip portals", () => {
  const containerA = document.createElement("div");
  const containerB = document.createElement("div");
  document.body.appendChild(containerA);
  document.body.appendChild(containerB);

  const tipA = new Tooltip()
    .parent(containerA)
    .data([{id: "a", title: "Chart A tip"}])
    .render();
  const tipB = new Tooltip()
    .parent(containerB)
    .data([{id: "b", title: "Chart B tip"}])
    .render();

  const portalA = containerA.querySelector(".d3plus-tooltip-portal");
  const portalB = containerB.querySelector(".d3plus-tooltip-portal");
  assert.ok(portalA && portalB, "both charts got their own portal");
  assert.notStrictEqual(portalA, portalB, "portals are distinct DOM nodes");

  // Each portal contains ONLY its own tooltip.
  const tooltipsA = portalA.querySelectorAll(".d3plus-tooltip");
  const tooltipsB = portalB.querySelectorAll(".d3plus-tooltip");
  assert.strictEqual(tooltipsA.length, 1, "A has exactly 1 tooltip");
  assert.strictEqual(tooltipsB.length, 1, "B has exactly 1 tooltip");

  // Dismiss A; B's portal should still have its tooltip.
  tipA.data([]).render();
  assert.strictEqual(
    containerB.querySelector(".d3plus-tooltip-portal").querySelectorAll(".d3plus-tooltip").length,
    1,
    "B's tooltip unaffected by A's dismissal",
  );

  tipB.data([]).render();
});
