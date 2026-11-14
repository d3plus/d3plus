import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {Tooltip} from "../../index.ts";
import {stackPortal} from "../../src/components/tooltipDom.ts";

useJsdom();

/**
    A `z-index` in a Tooltip's `tooltipStyle` also goes on its per-instance
    portal, the fixed layer on <body> that stacks its tooltips, so pages with
    sticky chrome can lift tooltips above it without CSS.
*/

/** A Tooltip with a parent, rendered with one datum and `style`. */
function rendered(style) {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const tip = new Tooltip().parent(parent).data([{id: "a", title: "A"}]);
  if (style) tip.tooltipStyle(style);
  return tip.render();
}

it("the portal takes the z-index tooltipStyle sets", () => {
  const tip = rendered({"z-index": "30"});
  assert.strictEqual(tip._portalEl.style.zIndex, "30");
  assert.strictEqual(
    tip._portalEl.querySelector(".d3plus-tooltip").style.zIndex,
    "30",
    "the tooltip keeps its own",
  );
});

it("a z-index from a function of the datum reaches the portal", () => {
  const tip = rendered({"z-index": d => (d.id === "a" ? "12" : "1")});
  assert.strictEqual(tip._portalEl.style.zIndex, "12");
});

it("without a z-index the portal stays auto", () => {
  const tip = rendered();
  assert.strictEqual(tip._portalEl.style.zIndex, "");
  assert.strictEqual(getComputedStyle(tip._portalEl).zIndex, "auto");
});

it("changing the z-index updates the portal, and clearing it restores auto", () => {
  const tip = rendered({"z-index": "30"});
  tip.tooltipStyle({"z-index": "50"}).render();
  assert.strictEqual(tip._portalEl.style.zIndex, "50");
  tip.tooltipStyle({"z-index": null}).render();
  assert.strictEqual(tip._portalEl.style.zIndex, "");
});

it("hiding the tooltips leaves the portal's z-index alone", () => {
  const tip = rendered({"z-index": "30"});
  tip.data([]).render();
  assert.strictEqual(tip._portalEl.style.zIndex, "30");
});

it("the global #d3plus-portal is left alone; its tooltips stack themselves", () => {
  const tip = new Tooltip()
    .data([{id: "global-z", title: "x"}])
    .tooltipStyle({"z-index": "40"})
    .render();
  const portal = document.querySelector("#d3plus-portal");
  assert.strictEqual(portal.style.zIndex, "");
  assert.strictEqual(
    portal.querySelector(".d3plus-tooltip").style.zIndex,
    "40",
  );
  assert.strictEqual(tip._portalEl, undefined);
});

it("stackPortal copies the first tooltip's z-index onto the instance portal", () => {
  const portal = document.createElement("div");
  const tooltip = document.createElement("div");
  tooltip.style.zIndex = "7";
  const that = {_parentEl: document.body, _portalEl: portal};
  stackPortal(that, select(tooltip));
  assert.strictEqual(portal.style.zIndex, "7");

  tooltip.style.zIndex = "";
  stackPortal(that, select(tooltip));
  assert.strictEqual(portal.style.zIndex, "", "an unset z-index clears it");

  portal.style.zIndex = "7";
  stackPortal(that, select(null));
  assert.strictEqual(portal.style.zIndex, "7", "no tooltip: unchanged");

  stackPortal({_portalEl: portal}, select(tooltip));
  assert.strictEqual(portal.style.zIndex, "7", "no parent: unchanged");
});
