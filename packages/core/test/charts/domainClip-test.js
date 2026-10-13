import assert from "assert";
import it from "../jsdom.js";
import {clipToPlotArea, DOMAIN_CLIP_KEY, isDomainClip, unwrapDomainClips} from "../../es/internal.js";

/**
    `clipToPlotArea`: a Plot's data marks are clipped to the plot rect only
    where they reach past it, labels never are, and points and strokes on the
    plot's edge keep room to draw whole.
*/

// A 200×100 plot rect starting at (50, 10) in shape coordinates.
const frame = {xRange: [50, 250], yRange: [20, 120], x2Height: 10};

const line = (key, points, strokeWidth = 2) => ({
  type: "path",
  key,
  d: `M${points.map(p => p.join(",")).join("L")}`,
  shapeType: "Line",
  paint: {stroke: "#f00", strokeWidth},
});
const point = (key, x, y, r = 4) => ({
  type: "circle", key, cx: 0, cy: 0, r, shapeType: "Circle",
  transform: {x, y}, paint: {fill: "#f00", stroke: "#000", strokeWidth: 2},
});
const label = key => ({type: "text", key, x: 0, y: 0, width: 20, height: 10, lines: [], transform: {x: 260, y: 140}});

it("clipToPlotArea leaves marks inside the plot untouched", () => {
  const nodes = [line("a", [[50, 10], [150, 60], [250, 110]]), point("p", 250, 10), label("l")];
  assert.strictEqual(clipToPlotArea(nodes, frame), nodes, "the same array, so the scene doesn't change");
});

it("clipToPlotArea clips a line that leaves the plot, grown by half its stroke", () => {
  const nodes = [line("a", [[50, 60], [150, 160], [250, 60]], 4)];
  const [group] = clipToPlotArea(nodes, frame);
  assert.ok(isDomainClip(group));
  assert.strictEqual(group.key, `${DOMAIN_CLIP_KEY}-0`);
  assert.deepStrictEqual(group.clip, {type: "rect", x: 48, y: 8, width: 204, height: 104});
  assert.deepStrictEqual(group.children, nodes);
});

it("clipToPlotArea keeps labels out of the clip and in paint order", () => {
  const nodes = [line("a", [[50, 60], [150, 160]]), label("l"), line("b", [[50, 60], [150, 70]])];
  const out = clipToPlotArea(nodes, frame);
  assert.deepStrictEqual(out.map(n => n.key), [`${DOMAIN_CLIP_KEY}-0`, "l", "b"]);
});

it("clipToPlotArea clips points in their own run, grown by radius plus half-stroke", () => {
  const nodes = [line("a", [[50, 60], [150, 160]]), point("top", 150, 10), point("below", 150, 160)];
  const out = clipToPlotArea(nodes, frame);
  assert.deepStrictEqual(out.map(n => n.key), [`${DOMAIN_CLIP_KEY}-0`, `${DOMAIN_CLIP_KEY}-1`]);
  assert.deepStrictEqual(out[0].clip, {type: "rect", x: 49, y: 9, width: 202, height: 102});
  assert.deepStrictEqual(out[1].clip, {type: "rect", x: 45, y: 5, width: 210, height: 110},
    "the point on the top edge draws whole");
});

it("clipToPlotArea only measures a point by its center", () => {
  const nodes = [point("edge", 250, 110, 20)];
  assert.strictEqual(clipToPlotArea(nodes, frame), nodes);
});

it("clipToPlotArea ignores hit areas and composes group transforms", () => {
  const hit = {...line("a::hit", [[0, 0], [400, 400]], 20), paint: {stroke: "transparent", strokeWidth: 20}};
  assert.strictEqual(clipToPlotArea([hit], frame).length, 1);
  assert.ok(!isDomainClip(clipToPlotArea([hit], frame)[0]), "a hit area alone isn't a cut");
  const nested = {type: "group", key: "trend", transform: {x: 0, y: 100}, children: [line("t", [[60, 0], [70, 30]])]};
  const [group] = clipToPlotArea([nested], frame);
  assert.ok(isDomainClip(group), "the group's offset pushes its line below the plot");
});

it("clipToPlotArea lets bars reach half the x axis's stroke past the plot", () => {
  const bar = {type: "rect", key: "bar", x: 60, y: 8.5, width: 10, height: 50, shapeType: "Bar"};
  const nodes = [bar];
  assert.strictEqual(clipToPlotArea(nodes, {...frame, yOffset: 1}), nodes);
  assert.ok(isDomainClip(clipToPlotArea(nodes, frame)[0]), "past the tolerance without the offset");
});

it("isDomainClip and unwrapDomainClips find clip groups, also under a panel prefix", () => {
  const marks = [line("a", [[50, 60], [150, 160]])];
  const [group] = clipToPlotArea(marks, frame);
  const prefixed = {...group, key: `panel-1/${group.key}`};
  assert.ok(isDomainClip(prefixed));
  assert.ok(!isDomainClip({type: "group", key: "plot-domain-clipper", children: []}));
  assert.ok(!isDomainClip(line("plot-domain-clip-0", [[0, 0]])), "only groups");
  const other = label("l");
  assert.deepStrictEqual(unwrapDomainClips([group, other]), [...marks, other]);
  const plain = [other];
  assert.strictEqual(unwrapDomainClips(plain), plain);
});
