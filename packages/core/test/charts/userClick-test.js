import {it} from "vitest";
import assert from "assert";
import {hasOwnClick, hasUserClick} from "../../src/charts/viz/userClick.ts";

/**
    A click handler under `click`, or under a chart's own event that is not
    the chart's handler, is the user's.
*/

/** A chart's handler, and a copy of it as a chart makes on each read. */
function own() {
  return 1;
}
const copy = () => own.bind(null);
const user = () => 2;

it("hasOwnClick tells the chart's handler from another, or none", () => {
  assert.strictEqual(
    hasOwnClick({"click.shape": own}, "click.shape", own),
    true,
  );
  assert.strictEqual(
    hasOwnClick({"click.shape": copy()}, "click.shape", copy()),
    true,
    "a fresh copy of the same handler",
  );
  assert.strictEqual(
    hasOwnClick({"click.shape": user}, "click.shape", own),
    false,
  );
  assert.strictEqual(hasOwnClick({}, "click.shape", own), false);
  assert.strictEqual(
    hasOwnClick({"click.shape": null}, "click.shape", own),
    false,
  );
  assert.strictEqual(
    hasOwnClick({"click.legend": own}, "click.shape", own),
    false,
    "under another event",
  );
});

it("hasUserClick finds a handler under the chart's event that is not its own", () => {
  assert.strictEqual(
    hasUserClick({"click.shape": own}, "click.shape", own),
    false,
  );
  assert.strictEqual(
    hasUserClick({"click.shape": copy()}, "click.shape", copy()),
    false,
    "a fresh copy of the chart's handler",
  );
  assert.strictEqual(
    hasUserClick({"click.shape": user}, "click.shape", own),
    true,
  );
  assert.strictEqual(
    hasUserClick({"click.legend": user}, "click.shape", own),
    false,
    "a handler for another event",
  );
});

it("hasUserClick counts any click handler", () => {
  assert.strictEqual(
    hasUserClick({click: user, "click.shape": own}, "click.shape", own),
    true,
  );
  assert.strictEqual(hasUserClick({click: user}, "click.legend", own), true);
});

it("hasUserClick ignores handlers that are unset", () => {
  assert.strictEqual(hasUserClick({}, "click.shape", own), false);
  for (const unset of [null, undefined, false])
    assert.strictEqual(
      hasUserClick({click: unset, "click.shape": unset}, "click.shape", own),
      false,
    );
});
