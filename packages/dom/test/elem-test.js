import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {default as elem} from "../src/elem.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom({augment: false});

it("elem", () => {
  let svg = elem("svg.className", {enter: {id: "enter"}});

  assert.strictEqual(svg.size(), 1, "Append");
  assert.strictEqual(svg.attr("id"), "enter", "Enter Attributes");

  svg = elem("svg.className", {update: {id: "update"}});
  assert.strictEqual(svg.attr("id"), "update", "Update Attributes");
});

it("applies an id from the selector and runs the transitioned enter/update path", () => {
  // `#id` in the selector exercises the id branch; a non-zero duration drives
  // the transitioned enter/update code path (elem.transition(t)…).
  const svg = elem("svg#chart.frame", {
    enter: {width: 20},
    update: {height: 30},
    duration: 50,
  });
  assert.strictEqual(svg.attr("id"), "chart", "id parsed from the selector");
  assert.strictEqual(
    svg.attr("class"),
    "frame",
    "class parsed from the selector",
  );
});

it("removes the element on the transitioned exit path when condition is false", () => {
  // Create the element, then re-select with condition:false and a duration so
  // the transitioned exit branch (elem.exit().transition(t)…) runs.
  elem("svg.gone", {enter: {width: 10}});
  const update = elem("svg.gone", {
    condition: false,
    duration: 50,
    exit: {width: 0},
  });
  assert.strictEqual(
    update.size(),
    0,
    "no update nodes when condition is false",
  );
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

it("transitions an element whose parent is off the page", async () => {
  // d3 finds a transition by walking up from each element, which never
  // reaches <html> from inside a detached parent.
  const parent = select(document.createElement("div"));
  elem("p.moved", {parent, enter: {"data-n": 0}});
  let update;
  assert.doesNotThrow(() => {
    update = elem("p.moved", {parent, duration: 30, update: {"data-n": 10}});
  });
  await wait(80);
  assert.strictEqual(update.attr("data-n"), "10", "the update animates");
  assert.doesNotThrow(() =>
    elem("p.moved", {parent, condition: false, duration: 30}),
  );
  await wait(80);
  assert.strictEqual(parent.selectAll("p").size(), 0, "the exit is removed");
});

it("leaves the parent's own transition running", async () => {
  const parent = select(document.body).append("div").attr("data-n", 0);
  parent.transition().duration(30).attr("data-n", 10);
  elem("p.child", {parent, duration: 30, update: {"data-n": 1}});
  await wait(80);
  assert.strictEqual(parent.attr("data-n"), "10", "not interrupted");
});
