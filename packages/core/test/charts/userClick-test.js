import {it} from "vitest";
import assert from "assert";
import {
  hasOwnClick,
  hasUserClick,
  setOwnClick,
} from "../../src/charts/viz/userClick.ts";

/**
    A click handler the chart registered as its own is the chart's; any other
    handler under `click`, or under the chart's own event, is the user's.
    Handlers are compared by identity, so a bound function of the user's is
    never taken for the chart's.
*/

function clickShape() {
  return this;
}

/** A chart with its own `click.shape` handler installed and registered. */
function chart() {
  const viz = {schema: {}};
  const own = clickShape.bind(viz);
  setOwnClick(viz, "click.shape", own);
  viz.schema.on = {"click.shape": own};
  return {viz, own};
}

it("hasOwnClick finds the handler the chart registered", () => {
  const {viz, own} = chart();
  assert.strictEqual(hasOwnClick(viz, "click.shape"), true);
  assert.strictEqual(hasOwnClick(viz, "click.legend"), false, "none there");

  viz.schema.on = {"click.shape": clickShape.bind(viz)};
  assert.strictEqual(
    hasOwnClick(viz, "click.shape"),
    false,
    "a fresh binding of the same function",
  );
  viz.schema.on = {"click.shape": null};
  assert.strictEqual(hasOwnClick(viz, "click.shape"), false);
  viz.schema.on = {"click.legend": own};
  assert.strictEqual(hasOwnClick(viz, "click.legend"), false, "another event");
});

it("hasOwnClick keeps each chart's handlers apart", () => {
  const a = chart();
  const b = chart();
  b.viz.schema.on = {"click.shape": a.own};
  assert.strictEqual(hasOwnClick(b.viz, "click.shape"), false);
  assert.strictEqual(hasOwnClick({schema: {on: {}}}, "click.shape"), false);
  assert.strictEqual(hasOwnClick({schema: {}}, "click.shape"), false);
});

it("setOwnClick replaces the handler recorded for an event", () => {
  const {viz, own} = chart();
  const zoom = () => undefined;
  setOwnClick(viz, "click.shape", zoom);
  assert.strictEqual(hasOwnClick(viz, "click.shape"), false);
  viz.schema.on = {"click.shape": zoom};
  assert.strictEqual(hasOwnClick(viz, "click.shape"), true);
  viz.schema.on = {"click.shape": own};
  assert.strictEqual(hasOwnClick(viz, "click.shape"), false);
});

it("hasUserClick finds a handler under the chart's event that is not its own", () => {
  const {viz} = chart();
  assert.strictEqual(hasUserClick(viz, "click.shape"), false);
  viz.schema.on = {"click.shape": () => 2};
  assert.strictEqual(hasUserClick(viz, "click.shape"), true);
  viz.schema.on = {"click.shape": function () {}.bind(null)};
  assert.strictEqual(hasUserClick(viz, "click.shape"), true, "a bound one");
  viz.schema.on = {"click.shape": clickShape.bind(viz)};
  assert.strictEqual(
    hasUserClick(viz, "click.shape"),
    true,
    "a binding of the chart's function made elsewhere",
  );
  viz.schema.on = {"click.legend": () => 2};
  assert.strictEqual(hasUserClick(viz, "click.shape"), false, "another event");
});

it("hasUserClick counts any click handler", () => {
  const {viz, own} = chart();
  viz.schema.on = {click: () => 2, "click.shape": own};
  assert.strictEqual(hasUserClick(viz, "click.shape"), true);
  assert.strictEqual(hasUserClick(viz, "click.legend"), true);
});

it("hasUserClick ignores handlers that are unset", () => {
  const {viz} = chart();
  for (const unset of [null, undefined, false]) {
    viz.schema.on = {click: unset, "click.shape": unset};
    assert.strictEqual(hasUserClick(viz, "click.shape"), false);
  }
  assert.strictEqual(hasUserClick({schema: {}}, "click.shape"), false);
});
