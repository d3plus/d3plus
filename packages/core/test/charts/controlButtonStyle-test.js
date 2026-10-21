import assert from "assert";
import {controlButtonStyles, escapeHtml} from "../../es/src/charts/drawSteps/controlButtonStyle.js";

const defaults = {base: {color: "black"}, active: {color: "blue"}, hover: {color: "gray"}};

it("controlButtonStyles resolves a control's base, active, and hover styles", () => {
  const custom = {color: "red"};
  const schema = {
    fooStyle: defaults.base,
    fooStyleActive: custom,
    fooStyleHover: false,
  };
  assert.deepStrictEqual(controlButtonStyles(schema, "foo", defaults), {
    base: {color: "black"},
    active: {color: "red"},
    hover: {},
  });
});

it("controlButtonStyles drops the untouched defaults once a class name is set", () => {
  const custom = {color: "red"};
  const schema = {
    fooClassName: "btn",
    fooStyle: defaults.base,
    fooStyleActive: custom,
    fooStyleHover: defaults.hover,
  };
  assert.deepStrictEqual(controlButtonStyles(schema, "foo", defaults), {
    base: {},
    active: {color: "red"},
    hover: {},
  });
});

it("escapeHtml escapes markup characters and stringifies the value", () => {
  assert.strictEqual(escapeHtml(`<a href="x">Tom & Jerry's</a>`), "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
  assert.strictEqual(escapeHtml(42), "42");
  assert.strictEqual(escapeHtml(null), "");
  assert.strictEqual(escapeHtml(undefined), "");
});
