import assert from "assert";
import {emitRadarRings, radarRingPaint, radarRingStyle} from "../../es/src/charts/Radar/rings.js";

const ring = {value: 50, r: 100};

it("radarRingStyle layers user styles over defaults", () => {
  const defaults = {stroke: "#eee", strokeWidth: 1};
  assert.deepStrictEqual(radarRingStyle(defaults, undefined), defaults);
  assert.deepStrictEqual(radarRingStyle(defaults, {stroke: "red"}), {stroke: "red", strokeWidth: 1});
  assert.deepStrictEqual(
    radarRingStyle(defaults, {"stroke-width": 3, "stroke-dasharray": "4 2", "stroke-opacity": 0.5}),
    {stroke: "#eee", strokeWidth: 3, strokeDasharray: "4 2", strokeOpacity: 0.5},
    "Plot's kebab-case gridConfig keys are accepted",
  );
  assert.deepStrictEqual(defaults, {stroke: "#eee", strokeWidth: 1}, "defaults are not mutated");
});

it("radarRingPaint resolves values and (ring, i) accessors into an unfilled stroke", () => {
  assert.deepStrictEqual(radarRingPaint({stroke: "#ccc", strokeWidth: 1}, ring, 0), {
    fill: "none",
    stroke: "#ccc",
    strokeWidth: 1,
  });
  const paint = radarRingPaint(
    {
      stroke: (d, i) => (d.value > 25 && i === 2 ? "blue" : "red"),
      strokeWidth: d => d.r / 50,
      strokeOpacity: 0.4,
      opacity: 0.9,
      strokeDasharray: "4, 2",
    },
    ring,
    2,
  );
  assert.deepStrictEqual(paint, {
    fill: "none",
    stroke: "blue",
    strokeWidth: 2,
    strokeOpacity: 0.4,
    opacity: 0.9,
    strokeDasharray: [4, 2],
  });
  assert.deepStrictEqual(radarRingPaint({strokeDasharray: [3, 1]}, ring, 0).strokeDasharray, [3, 1]);
  assert.deepStrictEqual(radarRingPaint({}, ring, 0), {fill: "none"}, "unset keys stay unset");
});

it("emitRadarRings draws inner rings in the grid style and the outer ring in the axis style", () => {
  const rings = [
    {value: 0, r: 0},
    {value: 50, r: 50},
    {value: 100, r: 100},
    {value: 150, r: 150},
  ];
  const [group] = emitRadarRings(rings, 150, 150, {stroke: "grid"}, {stroke: "axis"});
  assert.strictEqual(group.type, "group");
  assert.strictEqual(group.key, "radar-radial-circles");
  assert.strictEqual(group.interactive, false);
  assert.deepStrictEqual(group.children.map(c => c.r), [50, 100, 150], "the center 'ring' is skipped");
  assert.deepStrictEqual(group.children.map(c => c.paint.stroke), ["grid", "grid", "axis"]);
  assert.strictEqual(group.children[2].key, "radar-ring-outer");
});

it("emitRadarRings rings are chrome: no datum, never interactive", () => {
  const [group] = emitRadarRings([{value: 50, r: 50}], 100, 100, {}, {});
  for (const c of group.children) {
    assert.strictEqual(c.interactive, false);
    assert.strictEqual(c.datum, undefined, "no datum, so hover can't dim or match it");
  }
});

it("emitRadarRings always closes the web with an outer ring at the radius", () => {
  // Explicit levels below the data max: the last level is an inner ring.
  const [group] = emitRadarRings([{value: 50, r: 70}, {value: 100, r: 140}], 200, 143, {stroke: "g"}, {stroke: "a"});
  assert.deepStrictEqual(group.children.map(c => [c.r, c.paint.stroke]), [[70, "g"], [140, "g"], [200, "a"]]);
  assert.deepStrictEqual(emitRadarRings([], 0, 0, {}, {}), [], "no radius, no rings");
});
