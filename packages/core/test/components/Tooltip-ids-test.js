import assert from "assert";
import it from "../jsdom.js";
import {Tooltip} from "../../es/index.js";

/**
    Tooltip element ids are prefixed with the Tooltip instance's uuid, then
    keyed per datum, so two tooltips over the same data never share an id —
    and each Tooltip binds only the elements it created.
*/

const ids = root => [...root.querySelectorAll("[id^='d3plus-tooltip']")].map(el => el.id);

it("Tooltip ids carry the instance's uuid, then the datum id", () => {
  const tip = new Tooltip().id(d => d.id).data([{id: "a", title: "A"}]).render();
  const u = tip._uuid;
  assert.deepStrictEqual(ids(tip._portalEl ?? document.body), [
    `d3plus-tooltip-${u}-a`,
    `d3plus-tooltip-title-${u}-a`,
    `d3plus-tooltip-body-${u}-a`,
    `d3plus-tooltip-footer-${u}-a`,
    `d3plus-tooltip-arrow-${u}-a`,
  ]);
  tip.data([]).render();
});

it("Two Tooltips over the same data get distinct ids", () => {
  const data = [{title: "Same"}];
  const tipA = new Tooltip().parent(document.body).data(data).render();
  const tipB = new Tooltip().parent(document.body).data(data).render();
  const all = ids(document.body);
  assert.strictEqual(all.length, 10, "five elements per tooltip");
  assert.strictEqual(new Set(all).size, all.length, `unique: ${all.join(", ")}`);
  assert.ok(ids(tipA._portalEl).every(id => id.includes(tipA._uuid)));
  assert.ok(ids(tipB._portalEl).every(id => id.includes(tipB._uuid)));
  tipA.data([]).render();
  tipB.data([]).render();
});

it("Tooltips sharing the global portal leave each other's elements alone", () => {
  const tipA = new Tooltip().data([{title: "A"}]).render();
  const tipB = new Tooltip().data([{title: "B"}]).render();
  const portal = document.querySelector("#d3plus-portal");
  const titles = () =>
    [...portal.querySelectorAll(".d3plus-tooltip-title")].map(el => el.textContent);
  assert.deepStrictEqual(titles(), ["A", "B"], "B adds its own tooltip");
  tipB.data([]).render();
  assert.deepStrictEqual(titles(), ["A"], "clearing B keeps A's");
  tipA.data([]).render();
  assert.deepStrictEqual(titles(), []);
});

it("Each tooltip positions its own arrow", () => {
  const data = [{title: "Same"}];
  const tipA = new Tooltip().parent(document.body).data(data).render();
  const tipB = new Tooltip().parent(document.body).data(data).render();
  const refA = Object.values(tipA._tooltipRefs)[0];
  const refB = Object.values(tipB._tooltipRefs)[0];
  assert.ok(tipA._portalEl.contains(refA.tooltip) && tipA._portalEl.contains(refA.arrowEl));
  assert.ok(tipB._portalEl.contains(refB.tooltip) && tipB._portalEl.contains(refB.arrowEl));
  assert.ok(refB.tooltip.contains(refB.arrowEl), "the arrow inside its own tooltip");
  tipA.data([]).render();
  tipB.data([]).render();
});
