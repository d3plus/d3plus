import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {stopVisibilityWatch} from "../../src/charts/viz/vizVisibility.ts";

useJsdom();

it("stopVisibilityWatch: clears the polls and unobserves", () => {
  const calls = [];
  const viz = {
    _uuid: "abc",
    _visiblePoll: setInterval(() => calls.push("visible"), 5),
    _resizePoll: setTimeout(() => calls.push("resize"), 5),
    _scrollPoll: setTimeout(() => calls.push("scroll"), 5),
    _visibleUnobserve: () => calls.push("unobserve-visible"),
    _unloadUnobserve: () => calls.push("unobserve-unload"),
    schema: {},
  };
  stopVisibilityWatch(viz);
  assert.deepStrictEqual(calls, ["unobserve-visible", "unobserve-unload"]);
  assert.strictEqual(viz._visiblePoll, undefined);
  assert.strictEqual(viz._resizePoll, undefined);
  assert.strictEqual(viz._scrollPoll, undefined);
  assert.strictEqual(viz._visibleUnobserve, undefined);
  assert.strictEqual(viz._unloadUnobserve, undefined);
  return new Promise(resolve =>
    setTimeout(() => {
      assert.deepStrictEqual(calls, ["unobserve-visible", "unobserve-unload"]);
      resolve();
    }, 20),
  );
});

it("stopVisibilityWatch: removes the chart's scroll listener", () => {
  const container = document.createElement("div");
  let scrolled = 0;
  select(container).on("scroll.abc", () => scrolled++);
  stopVisibilityWatch({_uuid: "abc", schema: {scrollContainer: container}});
  container.dispatchEvent(new window.Event("scroll"));
  assert.strictEqual(scrolled, 0);
});
