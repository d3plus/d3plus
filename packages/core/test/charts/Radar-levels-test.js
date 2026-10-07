import assert from "assert";
import {
  emitRadarLevelLabels,
  radarLevelLabels,
  radarLevels,
  radarRadius,
} from "../../es/src/charts/Radar/levels.js";

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≉ ${b}`);

const labelOpts = over => ({
  ticks: [0, 50, 100],
  domain: [0, 100],
  radius: 200,
  angle: 0,
  format: String,
  measure: text => text.length * 6,
  fontSize: 10,
  ...over,
});

const paint = over => ({
  fontColor: "rgb(0, 0, 0)",
  fontFamily: "sans-serif",
  fontOpacity: 1,
  fontSize: 10,
  fontWeight: 400,
  ...over,
});

it("radarLevels rounds the domain out to nice ticks for a count hint", () => {
  const {domain, ticks} = radarLevels([170.992, 40, 240, 320, 97.5], 6);
  assert.deepStrictEqual(domain, [0, 350]);
  assert.deepStrictEqual(ticks, [0, 50, 100, 150, 200, 250, 300, 350]);

  const small = radarLevels([8, 6, 9, 7, 5], 6);
  assert.deepStrictEqual(small.domain, [0, 10]);
  assert.deepStrictEqual(small.ticks, [0, 2, 4, 6, 8, 10]);
});

it("radarLevels uses a lower count hint for fewer rings", () => {
  const {domain, ticks} = radarLevels([320], 3);
  assert.deepStrictEqual(domain, [0, 400]);
  assert.deepStrictEqual(ticks, [0, 100, 200, 300, 400]);
});

it("radarLevels uses explicit level values and grows the domain to fit them", () => {
  const {domain, ticks} = radarLevels([42, 87], [100, 25, 0, 50, 75, 50]);
  assert.deepStrictEqual(ticks, [0, 25, 50, 75, 100], "sorted + deduplicated");
  assert.deepStrictEqual(domain, [0, 100]);

  const over = radarLevels([140], [0, 50, 100]);
  assert.deepStrictEqual(over.domain, [0, 140], "data beyond the last level stays in range");
});

it("radarLevels includes negative values in the domain", () => {
  const {domain, ticks} = radarLevels([-30, 80], 5);
  assert.ok(domain[0] <= -30 && domain[1] >= 80, `domain ${domain}`);
  assert.ok(ticks.includes(0), "zero is a ring");
});

it("radarLevels ignores non-finite values", () => {
  const {domain} = radarLevels([NaN, 10, undefined, Infinity], 5);
  assert.deepStrictEqual(domain, [0, 10]);
});

it("radarRadius maps values linearly from the domain min (center) to the radius", () => {
  assert.strictEqual(radarRadius(0, [0, 100], 200), 0);
  assert.strictEqual(radarRadius(50, [0, 100], 200), 100);
  assert.strictEqual(radarRadius(100, [0, 100], 200), 200);
  assert.strictEqual(radarRadius(0, [-50, 50], 200), 100, "negative domain offsets the center");
  assert.strictEqual(radarRadius(5, [0, 0], 200), 0, "empty domain collapses to the center");
});

it("radarLevelLabels places labels straight up from the center at angle 0", () => {
  const labels = radarLevelLabels(labelOpts());
  assert.deepStrictEqual(labels.map(l => l.value), [0, 50, 100]);
  labels.forEach(l => {
    close(l.x, 0, `${l.value} x`);
    close(l.y, -l.r, `${l.value} y`);
  });
  assert.deepStrictEqual(labels.map(l => l.r), [0, 100, 200]);
});

it("radarLevelLabels follows levelLabelAngle clockwise from 12 o'clock", () => {
  const right = radarLevelLabels(labelOpts({angle: 90, ticks: [0, 50], measure: () => 4}));
  close(right[1].x, 100, "90° → x");
  close(right[1].y, 0, "90° → y");

  const down = radarLevelLabels(labelOpts({angle: 180, ticks: [50]}));
  close(down[0].x, 0, "180° → x");
  close(down[0].y, 100, "180° → y");
});

it("radarLevelLabels formats and measures each label", () => {
  const labels = radarLevelLabels(labelOpts({format: d => `${d}%`}));
  assert.deepStrictEqual(labels.map(l => l.text), ["0%", "50%", "100%"]);
  const l = labels[2];
  assert.strictEqual(l.width, 24, "measured text width");
  assert.strictEqual(l.height, 10, "font size");
});

it("radarLevelLabels thins out labels that would overlap along the direction", () => {
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  // 20px between rings vertically, 10px-tall labels → every label fits.
  const roomy = radarLevelLabels(labelOpts({ticks}));
  assert.strictEqual(roomy.length, ticks.length);
  // 10px between rings → every other label.
  const tight = radarLevelLabels(labelOpts({ticks, radius: 100}));
  assert.deepStrictEqual(tight.map(l => l.value), [0, 20, 40, 60, 80, 100]);
  // Larger text → every third label.
  const big = radarLevelLabels(labelOpts({ticks, radius: 100, fontSize: 20}));
  assert.deepStrictEqual(big.map(l => l.value), [0, 30, 60, 90]);
});

it("radarLevelLabels drops labels that would reach into the metric labels", () => {
  // Horizontal: the outer label is 30px wide, so it pokes 15px past the ring.
  const labels = radarLevelLabels(labelOpts({angle: 90, measure: () => 30}));
  assert.deepStrictEqual(labels.map(l => l.value), [0, 50]);
});

it("radarLevelLabels skips ticks outside the domain", () => {
  const labels = radarLevelLabels(labelOpts({ticks: [-10, 0, 50, 150]}));
  assert.deepStrictEqual(labels.map(l => l.value), [0, 50]);
});

it("emitRadarLevelLabels builds a non-interactive group of text nodes", () => {
  const labels = radarLevelLabels(labelOpts());
  const [group] = emitRadarLevelLabels(labels, paint());
  assert.strictEqual(group.type, "group");
  assert.strictEqual(group.key, "radar-level-labels");
  assert.strictEqual(group.interactive, false);
  assert.strictEqual(group.children.length, 3);
  assert.ok(group.children.every(c => c.type === "text" && c.interactive === false), "text only, no backdrops");

  const text = group.children[2];
  assert.strictEqual(text.lines[0].text, "100");
  assert.strictEqual(text.lines[0].width, labels[2].width);
  assert.deepStrictEqual(text.transform, {x: labels[2].x, y: labels[2].y});
  assert.strictEqual(text.font.anchor, "middle");
  assert.strictEqual(text.font.size, 10);
  assert.strictEqual(text.paint.fill, "rgb(0, 0, 0)");
  assert.strictEqual(text.paint.opacity, 1);
});

it("emitRadarLevelLabels returns nothing for no labels", () => {
  assert.deepStrictEqual(emitRadarLevelLabels([], paint()), []);
});
