import assert from "assert";

import {applyInteractionOpacity} from "../../es/src/charts/viz/interactionOpacity.js";
import {configureOrdinalColor} from "../../es/src/charts/viz/ordinalColor.js";

/** Rough perceived brightness of a #rrggbb string (0–765), for ordering. */
const brightness = hex => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255);
};

/** Parses an "rgb(r, g, b)" / "rgba(r, g, b, a)" string to [r,g,b,a]. */
const parseRGB = s => {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
};

it("highlight desaturates non-matching marks while preserving color, transparency, and labels", () => {
  const nodes = [
    {datum: {group: "A"}, paint: {fill: "#4c6ef5", stroke: "#333333"}}, // highlighted mark
    {datum: {group: "B"}, paint: {fill: "#e03131", stroke: "#333333"}}, // other mark
    {datum: {group: "B"}, paint: {fill: "transparent"}},                // legend hit-area
    {type: "text", datum: {group: "B"}, paint: {fill: "#ffffff"}},      // white label on a mark
  ];
  const viz = {_highlight: d => d.group === "A", schema: {shapeConfig: {}}};

  const out = applyInteractionOpacity(nodes, viz);

  // Matching mark keeps its exact color and is NOT z-raised — raising it would
  // paint over its own (separate) data-label node, hiding the label.
  assert.strictEqual(out[0].paint.fill, "#4c6ef5", "highlighted keeps fill");
  assert.ok(!out[0].z, "highlighted not z-raised (keeps its label visible)");

  // Non-matching mark is desaturated to grayscale (r=g=b) but not flattened —
  // its lightness is preserved so any label on it stays legible.
  const [r, g, b] = parseRGB(out[1].paint.fill);
  assert.ok(r === g && g === b, "grayed fill is achromatic (r=g=b)");
  assert.notStrictEqual(out[1].paint.fill, "#e03131", "grayed fill differs from original");

  // A transparent fill (the legend hit-area rect) stays transparent — the bug
  // was a flat gray override turning it into a solid gray box.
  const hit = out[2].paint.fill;
  const hitRGBA = parseRGB(hit);
  assert.ok(hit === "transparent" || (hitRGBA && hitRGBA[3] === 0), "transparent stays transparent");

  // A white label stays white (lightness preserved) — the bug was it going
  // gray-on-gray and vanishing.
  assert.deepStrictEqual(parseRGB(out[3].paint.fill).slice(0, 3), [255, 255, 255], "white label stays white");
});

it("hover/active thicken + darken the matched mark's stroke (v3 parity)", () => {
  const nodes = () => [
    {type: "rect", datum: {group: "A"}, paint: {fill: "#4c6ef5", strokeWidth: 1}},
    {type: "rect", datum: {group: "B"}, paint: {fill: "#e03131", strokeWidth: 1}},
    {type: "text", datum: {group: "A"}, paint: {fill: "#ffffff"}}, // label — not a mark
  ];

  const hovered = applyInteractionOpacity(nodes(), {_hover: d => d.group === "A", schema: {shapeConfig: {}}});
  assert.strictEqual(hovered[0].paint.strokeWidth, 2, "hovered mark stroke doubled");
  assert.ok(hovered[0].paint.stroke && hovered[0].paint.stroke !== "#4c6ef5", "hovered stroke darkened");
  assert.ok(hovered[2].paint.strokeWidth === undefined, "text label gets no stroke emphasis");

  const active = applyInteractionOpacity(nodes(), {_active: d => d.group === "A", schema: {shapeConfig: {}}});
  assert.strictEqual(active[0].paint.strokeWidth, 3, "active mark stroke tripled (stronger than hover)");

  // Hovering an already-active node keeps the stronger active stroke.
  const both = applyInteractionOpacity(nodes(), {
    _hover: d => d.group === "A",
    _active: d => d.group === "A",
    schema: {shapeConfig: {}},
  });
  assert.strictEqual(both[0].paint.strokeWidth, 3, "active node keeps active stroke while hovered");
});

it("no highlight/hover/active is a no-op (same array back)", () => {
  const nodes = [{datum: {group: "A"}, paint: {fill: "#4c6ef5"}}];
  const viz = {schema: {shapeConfig: {}}};
  assert.strictEqual(applyInteractionOpacity(nodes, viz), nodes, "unchanged reference");
});

it("colorOrdinal builds a single-hue ramp ordered by value", () => {
  const viz = {
    schema: {colorOrdinal: true, color: d => d.tier},
    _filteredData: [{tier: 3}, {tier: 1}, {tier: 2}, {tier: 1}],
  };
  configureOrdinalColor(viz);
  const scale = viz._ordinalColorScale;

  assert.ok(scale, "ordinal scale built");
  const [c1, c2, c3] = ["1", "2", "3"].map(scale);
  assert.ok(c1 !== c2 && c2 !== c3, "distinct color per tier");
  // Lower values are lighter (a light→dark ramp encoding the order).
  assert.ok(brightness(c1) > brightness(c2), "tier 1 lighter than tier 2");
  assert.ok(brightness(c2) > brightness(c3), "tier 2 lighter than tier 3");
});

it("colorOrdinal is off by default and yields to a continuous colorScale", () => {
  const off = {schema: {colorOrdinal: false, color: d => d.tier}, _filteredData: [{tier: 1}]};
  configureOrdinalColor(off);
  assert.strictEqual(off._ordinalColorScale, undefined, "no scale when off");

  const continuous = {
    schema: {colorOrdinal: true, colorScale: d => d.v, color: d => d.tier},
    _filteredData: [{tier: 1, v: 5}],
  };
  configureOrdinalColor(continuous);
  assert.strictEqual(continuous._ordinalColorScale, undefined, "continuous scale wins");
});
