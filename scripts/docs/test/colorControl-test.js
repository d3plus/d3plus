import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  applyColorControl,
  isColorArg,
  isCssColor,
} from "../stubs/colorControl.js";

describe("isCssColor", () => {
  it("accepts hex, color functions, and keywords", () => {
    for (const c of ["#4d79a7", "#fff", "#ffffff80", "rgb(1, 2, 3)", "hsla(0, 0%, 0%, 0.5)", "transparent", "red"])
      assert.equal(isCssColor(c), true, c);
  });
  it("rejects accessor sources and non-strings", () => {
    for (const c of ['d => d["color"]', "#ggg", "", 4, undefined])
      assert.equal(isCssColor(c), false, String(c));
  });
});

describe("isColorArg", () => {
  it("trusts a CssColor type whatever the key", () => {
    assert.equal(isColorArg({key: "background", types: ["CssColor", "Function"]}), true);
    assert.equal(isColorArg({key: "anything", types: ["csscolor"]}), true);
  });
  it("leaves array and object types alone, even when typed CssColor", () => {
    assert.equal(isColorArg({key: "color", types: ["CssColor", "Array.&lt;CssColor&gt;"]}), false);
    assert.equal(isColorArg({key: "color", types: ["string", "Array.&lt;string&gt;"]}), false);
    assert.equal(isColorArg({key: "fill", types: ["Object"]}), false);
  });
  it("falls back to color-like keys holding a plain string", () => {
    assert.equal(isColorArg({key: "hiddenColor", types: ["string", "Function"]}), true);
    assert.equal(isColorArg({key: "topojsonFill", types: ["string", "function"]}), true);
    assert.equal(isColorArg({key: "fontStroke", types: ["string"]}), true);
    assert.equal(isColorArg({key: "backgroundColor", types: ["string", "null"]}), true);
    assert.equal(isColorArg({key: "stroke", types: ["string"], value: "#000"}), true);
  });
  it("ignores other keys and non-string types", () => {
    assert.equal(isColorArg({key: "title", types: ["string"]}), false);
    assert.equal(isColorArg({key: "strokeWidth", types: ["number"]}), false);
    assert.equal(isColorArg({key: "Color", types: ["string"]}), false);
    assert.equal(isColorArg({key: "hiddenColor", types: ["Function"]}), false);
    assert.equal(isColorArg({key: "hiddenColor", types: ["number", "Function"]}), false);
    assert.equal(isColorArg({key: "color", types: ["string", "false", "Function"]}), false);
    assert.equal(isColorArg({key: "fill", types: ["*"]}), false);
  });
  it("skips settings documented as data keys", () => {
    const description = "An accessor function or a string key to reference in each data point.";
    assert.equal(isColorArg({key: "color", types: ["string", "Function"], description}), false);
  });
  it("skips a fallback whose string default isn't a color", () => {
    assert.equal(isColorArg({key: "nodeColor", types: ["string"], value: "d => d.c"}), false);
    assert.equal(isColorArg({key: "nodeColor", types: ["string"], value: "#4d79a7"}), true);
  });
});

describe("applyColorControl", () => {
  it("sets a color control and keeps a color default", () => {
    const arg = {control: {type: "text"}, defaultValue: "transparent"};
    applyColorControl(arg, {key: "fill", types: ["string"], value: "transparent"});
    assert.deepEqual(arg, {control: {type: "color"}, defaultValue: "transparent"});
  });
  it("drops a default the picker can't show", () => {
    const arg = {control: {type: "text"}, defaultValue: "d => d.fill", table: {}};
    applyColorControl(arg, {key: "fill", types: ["CssColor", "Function"]});
    assert.deepEqual(arg, {control: {type: "color"}, table: {}});
  });
  it("works with no default", () => {
    const arg = {control: {type: "text"}};
    applyColorControl(arg, {key: "hiddenColor", types: ["string", "Function"]});
    assert.deepEqual(arg, {control: {type: "color"}});
  });
  it("leaves a non-color arg untouched", () => {
    const arg = {control: {type: "text"}, defaultValue: "linear"};
    applyColorControl(arg, {key: "scale", types: ["string"], value: "linear"});
    assert.deepEqual(arg, {control: {type: "text"}, defaultValue: "linear"});
  });
});
