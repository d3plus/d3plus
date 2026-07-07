import assert from "assert";
import {default as elem} from "../es/src/elem.js";
import it from "./jsdom.js";

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
  assert.strictEqual(svg.attr("class"), "frame", "class parsed from the selector");
});

it("removes the element on the transitioned exit path when condition is false", () => {
  // Create the element, then re-select with condition:false and a duration so
  // the transitioned exit branch (elem.exit().transition(t)…) runs.
  elem("svg.gone", {enter: {width: 10}});
  const update = elem("svg.gone", {condition: false, duration: 50, exit: {width: 0}});
  assert.strictEqual(update.size(), 0, "no update nodes when condition is false");
});
