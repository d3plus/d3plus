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
  padding: 2,
  ...over,
});

const paint = over => ({
  fontColor: "rgb(0, 0, 0)",
  fontFamily: "sans-serif",
  fontOpacity: 1,
  fontSize: 10,
  fontWeight: 400,
  background: "rgb(255, 255, 255)",
  backgroundOpacity: 0.85,
  borderRadius: 2,
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
  assert.strictEqual(l.textWidth, 24);
  assert.strictEqual(l.width, 24 + 4, "width adds padding on both sides");
  assert.strictEqual(l.height, 10 + 4);
});

it("radarLevelLabels thins out labels that would overlap along the direction", () => {
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  // 20px between rings vertically, 14px-tall backdrops → every label fits.
  const roomy = radarLevelLabels(labelOpts({ticks}));
  assert.strictEqual(roomy.length, ticks.length);
  // 10px between rings → every other label.
  const tight = radarLevelLabels(labelOpts({ticks, radius: 100}));
  assert.deepStrictEqual(tight.map(l => l.value), [0, 20, 40, 60, 80, 100]);
});

it("radarLevelLabels drops labels that would reach into the metric labels", () => {
  // Horizontal: the outer label is 30px wide, so it pokes 15px past the ring.
  const labels = radarLevelLabels(labelOpts({angle: 90, measure: () => 26}));
  assert.deepStrictEqual(labels.map(l => l.value), [0, 50]);
});

it("radarLevelLabels skips ticks outside the domain", () => {
  const labels = radarLevelLabels(labelOpts({ticks: [-10, 0, 50, 150]}));
  assert.deepStrictEqual(labels.map(l => l.value), [0, 50]);
});

it("emitRadarLevelLabels builds a non-interactive group of backdrops + text", () => {
  const labels = radarLevelLabels(labelOpts());
  const [group] = emitRadarLevelLabels(labels, paint());
  assert.strictEqual(group.type, "group");
  assert.strictEqual(group.key, "radar-level-labels");
  assert.strictEqual(group.interactive, false);
  const rects = group.children.filter(c => c.type === "rect");
  const texts = group.children.filter(c => c.type === "text");
  assert.strictEqual(rects.length, 3);
  assert.strictEqual(texts.length, 3);
  assert.ok(group.children.every(c => c.interactive === false));

  const [rect, text] = group.children.slice(4, 6);
  assert.strictEqual(text.lines[0].text, "100");
  assert.deepStrictEqual(text.transform, {x: labels[2].x, y: labels[2].y});
  assert.strictEqual(text.font.anchor, "middle");
  assert.strictEqual(text.paint.fill, "rgb(0, 0, 0)");
  close(rect.x + rect.width / 2, labels[2].x, "backdrop centered on x");
  close(rect.y + rect.height / 2, labels[2].y, "backdrop centered on y");
  assert.strictEqual(rect.paint.fill, "rgb(255, 255, 255)");
  assert.strictEqual(rect.paint.fillOpacity, 0.85);
  assert.strictEqual(rect.rx, 2);
});

it("emitRadarLevelLabels omits backdrops when background is false", () => {
  const labels = radarLevelLabels(labelOpts());
  const [group] = emitRadarLevelLabels(labels, paint({background: false}));
  assert.ok(group.children.every(c => c.type === "text"));
  assert.strictEqual(group.children.length, 3);
});

it("emitRadarLevelLabels returns nothing for no labels", () => {
  assert.deepStrictEqual(emitRadarLevelLabels([], paint()), []);
});
