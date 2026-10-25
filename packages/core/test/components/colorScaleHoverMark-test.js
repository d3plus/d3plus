import {it} from "vitest";
import assert from "assert";
import {ColorScale} from "../../index.ts";
import {
  addHoverMark,
  badgeBox,
  barPosition,
  bucketSpan,
  clampTo,
  hoverMarkDefaults,
  tickPoints,
} from "../../src/components/ColorScale/colorScaleHoverMark.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("clampTo — holds a value within a range given in either order", () => {
  assert.strictEqual(clampTo(5, [0, 10]), 5);
  assert.strictEqual(clampTo(-3, [0, 10]), 0);
  assert.strictEqual(clampTo(12, [10, 0]), 10);
});

const geometry = {
  orient: "bottom",
  position: v => 10 + v * 2,
  range: [10, 210],
  cross: [20, 30],
  domain: [0, 100],
};

it("barPosition — a value's pixel along the bar, clamped to its ends", () => {
  assert.strictEqual(barPosition(geometry, 25), 60);
  assert.strictEqual(barPosition(geometry, 500), 210, "above the domain");
  assert.strictEqual(barPosition(geometry, -40), 10, "below the domain");
  assert.strictEqual(barPosition(geometry, NaN), null);
  assert.strictEqual(barPosition(geometry, Infinity), null);
  assert.strictEqual(
    barPosition({...geometry, position: () => NaN}, 5),
    null,
    "a position the axis can't place",
  );
});

it("tickPoints — from the bar's edge on the labels' side, out toward them", () => {
  const cross = [20, 30];
  assert.deepStrictEqual(tickPoints("bottom", 50, cross, 8), [
    [50, 30],
    [50, 38],
  ]);
  assert.deepStrictEqual(tickPoints("top", 50, cross, 8), [
    [50, 20],
    [50, 12],
  ]);
  assert.deepStrictEqual(tickPoints("right", 50, cross, 8), [
    [30, 50],
    [38, 50],
  ]);
  assert.deepStrictEqual(tickPoints("left", 50, cross, 8), [
    [20, 50],
    [12, 50],
  ]);
});

it("badgeBox — `offset` past the bar on the labels' side, kept inside the scale", () => {
  const size = {width: 20, height: 10};
  const cross = [20, 30];
  assert.deepStrictEqual(badgeBox("bottom", 50, cross, size, 200, 8), {
    x: 40,
    y: 38,
    width: 20,
    height: 10,
  });
  assert.deepStrictEqual(badgeBox("top", 50, cross, size, 200, 8), {
    x: 40,
    y: 2,
    width: 20,
    height: 10,
  });
  assert.deepStrictEqual(badgeBox("right", 50, cross, size, 200, 8), {
    x: 38,
    y: 45,
    width: 20,
    height: 10,
  });
  assert.deepStrictEqual(badgeBox("left", 50, cross, size, 200, 8), {
    x: -8,
    y: 45,
    width: 20,
    height: 10,
  });
  assert.strictEqual(badgeBox("bottom", 2, cross, size, 200, 8).x, 0, "start");
  assert.strictEqual(
    badgeBox("bottom", 199, cross, size, 200, 8).x,
    180,
    "end",
  );
  assert.strictEqual(badgeBox("right", 199, cross, size, 200, 8).y, 190, "end");
});

it("bucketSpan — the bucket holding a value", () => {
  const ticks = [0, 10, 25];
  assert.deepStrictEqual(bucketSpan(ticks, 4, 40), [0, 10]);
  assert.deepStrictEqual(bucketSpan(ticks, 10, 40), [10, 25]);
  assert.deepStrictEqual(bucketSpan(ticks, 30, 40), [25, 40], "the last");
  assert.deepStrictEqual(bucketSpan(ticks, -5, 40), [0, 10], "below: first");
  assert.strictEqual(bucketSpan([], 5, 40), null);
});

it("hoverMarkDefaults — fresh tick, badge, and outline styles", () => {
  const a = hoverMarkDefaults();
  assert.deepStrictEqual(Object.keys(a), [
    "tickConfig",
    "badgeConfig",
    "outlineConfig",
  ]);
  assert.notStrictEqual(a.tickConfig, hoverMarkDefaults().tickConfig);
});

const rows = [5, 10, 20, 40, 80].map((value, i) => ({id: i, value}));

/** Renders a ColorScale (compute mode) and returns its scene's hover nodes. */
const hoverNodes = (configure, value) => {
  document.body.innerHTML = "<svg><g></g></svg>";
  const cs = configure(
    new ColorScale()
      .renderMode("compute")
      .select(document.querySelector("g"))
      .data(rows)
      .width(400)
      .height(80)
      .duration(0),
  );
  cs.render();
  if (value !== undefined) cs.hover(value);
  const scene = cs.toScene();
  const nodes = [];
  const walk = n => {
    if (String(n.key).includes("-hover-")) nodes.push(n);
    (n.children || []).forEach(walk);
  };
  walk(scene);
  return {cs, scene, nodes};
};

it("ColorScale.hover — stores the marked value", () => {
  const cs = new ColorScale();
  assert.strictEqual(cs.hover(), undefined);
  assert.strictEqual(cs.hover(12), cs, "chains");
  assert.strictEqual(cs.hover(), 12);
  cs.hover(false);
  assert.strictEqual(cs.hover(), false);
  assert.strictEqual(cs.hoverMark(), true, "on by default");
});

it("addHoverMark — a bar gets a tick and a badge reading the value", () => {
  const {cs, scene, nodes} = hoverNodes(cs => cs.scale("linear"), 20);
  const keys = nodes.map(n => String(n.key).split("-hover-")[1]);
  assert.deepStrictEqual(keys, ["tick", "badge", "badge-box", "badge-text"]);
  const [tick, , box, text] = nodes;
  const at = cs._barGeometry.position(20);
  const edge = cs._barGeometry.cross[1];
  const {tickSize, padding} = cs._axisClass.schema;
  assert.deepStrictEqual(tick.points, [
    [at, edge],
    [at, edge + tickSize],
  ]);
  // Styled like the axis's own ticks.
  let axisTick;
  const find = n => {
    if (!axisTick && n.type === "path" && /^\d+$/.test(String(n.key)))
      axisTick = n;
    (n.children || []).forEach(find);
  };
  find(scene.children.find(n => String(n.key).startsWith("Axis-")));
  assert.strictEqual(tick.paint.stroke, axisTick.paint.stroke);
  assert.strictEqual(tick.paint.strokeWidth, axisTick.paint.strokeWidth);
  assert.strictEqual(
    box.y,
    edge + tickSize,
    "the badge starts at the tick's end",
  );
  assert.strictEqual(
    box.y + (box.height - text.font.size) / 2,
    edge + tickSize + padding,
    "its text as far out as the tick labels",
  );
  assert.ok(
    nodes.every(n => n.interactive === false),
    "all inert",
  );
  assert.strictEqual(nodes[3].lines[0].text, "20");
  assert.strictEqual(nodes[2].paint.fill, cs._colorScale(20));
});

it("addHoverMark — nothing for no value, a non-finite value, or hoverMark(false)", () => {
  assert.strictEqual(hoverNodes(cs => cs.scale("linear")).nodes.length, 0);
  assert.strictEqual(
    hoverNodes(cs => cs.scale("linear"), false).nodes.length,
    0,
  );
  assert.strictEqual(hoverNodes(cs => cs.scale("linear"), NaN).nodes.length, 0);
  assert.strictEqual(
    hoverNodes(cs => cs.scale("linear").hoverMark(false), 20).nodes.length,
    0,
  );
});

it("addHoverMark — hoverMarkConfig styles the tick, badge, and outline", () => {
  const {nodes} = hoverNodes(
    cs =>
      cs
        .scale("jenks")
        .bucketAxis(true)
        .hoverMarkConfig({
          tickConfig: {stroke: "red", strokeWidth: 2, length: 12},
          badgeConfig: {
            fill: v => (v > 10 ? "navy" : "pink"),
            fontColor: "gold",
          },
          outlineConfig: {stroke: "lime", strokeWidth: 3},
        }),
    20,
  );
  const byKey = k => nodes.find(n => String(n.key).endsWith(`-hover-${k}`));
  const tick = byKey("tick");
  assert.strictEqual(tick.paint.stroke, "red");
  assert.strictEqual(tick.paint.strokeWidth, 2);
  assert.strictEqual(tick.points[1][1] - tick.points[0][1], 12);
  assert.strictEqual(
    byKey("badge-box").y,
    tick.points[1][1],
    "the badge follows a longer tick",
  );
  assert.strictEqual(byKey("badge-box").paint.fill, "navy");
  assert.strictEqual(byKey("badge-text").paint.fill, "gold");
  assert.strictEqual(byKey("outline").paint.stroke, "lime");
  assert.strictEqual(byKey("outline").paint.strokeWidth, 3);
});

it("addHoverMark — discrete swatches get no mark", () => {
  const {cs, scene, nodes} = hoverNodes(cs => cs.scale("jenks"), 40);
  assert.strictEqual(cs._barGeometry, undefined, "no bar");
  assert.deepStrictEqual(nodes, []);
  // Same nodes and paint as with nothing hovered: no swatch is outlined.
  const paints = root => {
    const out = [];
    const walk = n => {
      out.push([String(n.key), JSON.stringify(n.paint ?? null)]);
      (n.children || []).forEach(walk);
    };
    walk(root);
    return out;
  };
  assert.deepStrictEqual(paints(scene), paints(cs.hover(false).toScene()));
});

it("addHoverMark — leaves a group without a scale untouched", () => {
  const group = {type: "group", key: "g", children: []};
  addHoverMark(new ColorScale().hover(5), group);
  assert.deepStrictEqual(group.children, []);
});
