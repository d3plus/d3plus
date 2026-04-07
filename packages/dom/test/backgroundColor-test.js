import assert from "assert";
import {default as backgroundColor} from "../es/src/backgroundColor.js";
import it from "./jsdom.js";

it("returns inline background color from the element itself", () => {
  const div = document.createElement("div");
  div.style.backgroundColor = "rgb(255, 0, 0)";
  document.body.appendChild(div);
  assert.strictEqual(backgroundColor(div), "rgb(255, 0, 0)");
});

it("inherits background color from a parent element", () => {
  const parent = document.createElement("div");
  parent.style.backgroundColor = "rgb(0, 128, 0)";
  const child = document.createElement("div");
  parent.appendChild(child);
  document.body.appendChild(parent);
  assert.strictEqual(backgroundColor(child), "rgb(0, 128, 0)");
});

it("skips transparent ancestors and finds the first opaque one", () => {
  const grandparent = document.createElement("div");
  grandparent.style.backgroundColor = "rgb(0, 0, 255)";
  const parent = document.createElement("div");
  parent.style.backgroundColor = "transparent";
  const child = document.createElement("div");
  grandparent.appendChild(parent);
  parent.appendChild(child);
  document.body.appendChild(grandparent);
  assert.strictEqual(backgroundColor(child), "rgb(0, 0, 255)");
});

it("prefers the element's own background over an ancestor's", () => {
  const parent = document.createElement("div");
  parent.style.backgroundColor = "rgb(0, 0, 255)";
  const child = document.createElement("div");
  child.style.backgroundColor = "rgb(255, 0, 0)";
  parent.appendChild(child);
  document.body.appendChild(parent);
  assert.strictEqual(backgroundColor(child), "rgb(255, 0, 0)");
});

it("falls back to white when no background is set", () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  assert.strictEqual(backgroundColor(div), "rgb(255, 255, 255)");
});
