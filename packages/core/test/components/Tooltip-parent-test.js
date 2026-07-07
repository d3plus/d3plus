import assert from "assert";
import it from "../jsdom.js";
import {Tooltip} from "../../es/index.js";

/**
    v4 Tooltip.parent() gives each chart its own per-instance portal, mounted
    at document.body (viewport-level) rather than the shared body-level
    #d3plus-portal. Mounting on <body> keeps the tooltip free to overflow its
    chart's bounds and immune to the chart container's styling/clipping, while
    the per-instance portal preserves multi-chart isolation — two charts get
    distinct portals and don't fight over a shared one.
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

it("Tooltip.render() with parent() mounts a per-instance portal on <body>, not inside the parent", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const tip = new Tooltip()
    .parent(container)
    .data([{id: "a", title: "Hello"}])
    .render();

  // The portal is viewport-level now, so it does NOT live under the parent.
  assert.strictEqual(
    container.querySelector(".d3plus-tooltip-portal"),
    null,
    "portal is not scoped under the parent",
  );

  const portal = tip._portalEl;
  assert.ok(
    portal && portal.classList.contains("d3plus-tooltip-portal"),
    "instance owns a portal",
  );
  assert.strictEqual(portal.parentNode, document.body, "portal mounted on <body>");
  assert.ok(
    portal.querySelector(".d3plus-tooltip"),
    "tooltip rendered inside the body-level portal",
  );

  // Cleanup.
  tip.data([]).render();
  portal.remove();
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
  const portalA = tip._portalEl;
  assert.ok(portalA && portalA.isConnected, "portal exists after first render");
  assert.strictEqual(portalA.parentNode, document.body, "portal mounted on <body>");

  // Switch to B — the first portal should be torn down (no orphan).
  tip.parent(containerB).data([{id: "switch-test", title: "in B"}]).render();
  assert.strictEqual(portalA.isConnected, false, "stale portal removed when parent switched");
  const portalB = tip._portalEl;
  assert.ok(
    portalB && portalB.isConnected && portalB !== portalA,
    "fresh portal mounted after switch",
  );

  // Cleanup.
  tip.data([]).render();
  portalB.remove();
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

  const portalA = tipA._portalEl;
  const portalB = tipB._portalEl;
  assert.ok(portalA && portalB, "both charts got their own portal");
  assert.notStrictEqual(portalA, portalB, "portals are distinct DOM nodes");
  assert.strictEqual(portalA.parentNode, document.body, "A's portal on <body>");
  assert.strictEqual(portalB.parentNode, document.body, "B's portal on <body>");

  // Each portal contains ONLY its own tooltip.
  assert.strictEqual(
    portalA.querySelectorAll(".d3plus-tooltip").length, 1, "A has exactly 1 tooltip",
  );
  assert.strictEqual(
    portalB.querySelectorAll(".d3plus-tooltip").length, 1, "B has exactly 1 tooltip",
  );

  // Dismiss A; B's portal should still have its tooltip.
  tipA.data([]).render();
  assert.strictEqual(
    portalB.querySelectorAll(".d3plus-tooltip").length,
    1,
    "B's tooltip unaffected by A's dismissal",
  );

  tipB.data([]).render();
  portalA.remove();
  portalB.remove();
});

it("Two Tooltip instances each own a distinct portal", () => {
  const shared = document.createElement("div");
  document.body.appendChild(shared);

  const tip1 = new Tooltip()
    .parent(shared)
    .data([{id: "1", title: "Tip 1"}])
    .render();
  const tip2 = new Tooltip()
    .parent(shared)
    .data([{id: "2", title: "Tip 2"}])
    .render();

  const portal1 = tip1._portalEl;
  const portal2 = tip2._portalEl;
  assert.ok(
    portal1 && portal2 && portal1 !== portal2,
    "two Tooltip instances → two distinct portal divs",
  );
  assert.strictEqual(portal1.parentNode, document.body, "tip1 portal on <body>");
  assert.strictEqual(portal2.parentNode, document.body, "tip2 portal on <body>");

  // Switching tip1's parent must tear down only tip1's portal.
  const newParent = document.createElement("div");
  document.body.appendChild(newParent);
  tip1.parent(newParent);
  assert.strictEqual(portal1.isConnected, false, "tip1's portal removed on switch");
  assert.ok(portal2.isConnected, "tip2's portal left intact");

  tip1.data([]).render();
  tip2.data([]).render();
  tip1._portalEl?.remove();
  portal2.remove();
});
