import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";

import {Network} from "../../index.ts";
import {
  arcLabelAnchor,
  arcLabelPath,
  bundledLinkPath,
  curvedLabelPad,
  curvedLabelSpot,
  curvePoints,
  distanceAlong,
  emitLinkLabels,
  labelStretch,
  LINK_LABEL_MAX_TURN,
  makeLinkDatum,
  placeLinkLabels,
  ringsEdgePath,
  sankeyLinkPath,
  sharpestTurn,
  trimToNodes,
} from "../../internal.ts";
import {pathLabelNodes} from "../../src/charts/features/pathLabels.ts";
import {circularLinkD} from "../../src/charts/Sankey/circularLinks.ts";
import {curvature, resample} from "../../src/charts/Plot/lineLabelsAlong.ts";
import {polylineLength} from "../../src/charts/features/pathLabelGeometry.ts";
import {chartBackground} from "../../src/charts/viz/backgroundInk.ts";
import {samplePath, pathTextBoxes} from "@d3plus/render";

useJsdom();

/**
    Link labels that follow a curved link: the link's centerline, trimmed to
    its nodes, where an anchor falls on it, the upright stretch a label
    covers (short of tight bends), the path its text follows, its pad, and
    each chart's label path.
*/

const close = (a, b, tol = 1e-6, msg = "") =>
  assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b}`);

/** The upper half of a circle of radius `r` around (0, 0), left to right. */
const arch = (r, steps = 180) =>
  Array.from({length: steps + 1}, (_, k) => {
    const a = Math.PI - (k / steps) * Math.PI;
    return [r * Math.cos(a), -r * Math.sin(a)];
  });

/** The least distance from `p` to a polyline's vertices (densely sampled). */
const distTo = (points, p) =>
  Math.min(
    ...resample(points, 0.5).map(q => Math.hypot(q[0] - p[0], q[1] - p[1])),
  );

it("curvePoints — a path's curves flattened into points", () => {
  const points = curvePoints("M0,0C0,-50 100,-50 100,0");
  assert.ok(points.length > 10);
  assert.deepStrictEqual(points[0], [0, 0]);
  assert.deepStrictEqual(points[points.length - 1], [100, 0]);
  assert.ok(
    points.every(([, y]) => y <= 0),
    "above the chord",
  );
  assert.deepStrictEqual(curvePoints("M0,0L10,0"), [
    [0, 0],
    [10, 0],
  ]);
});

it("trimToNodes — the run outside each end's node", () => {
  const line = [
    [0, 0],
    [100, 0],
  ];
  assert.deepStrictEqual(trimToNodes(line, 10, 20), [
    [10, 0],
    [80, 0],
  ]);
  assert.deepStrictEqual(trimToNodes(line), line);
  assert.deepStrictEqual(trimToNodes(line, 60, 60), [], "nodes cover it");
  assert.deepStrictEqual(trimToNodes([[0, 0]], 1, 1), []);
  // Along a curve, the cut is where it leaves each circle.
  const cut = trimToNodes(arch(50), 10, 10);
  close(Math.hypot(cut[0][0] + 50, cut[0][1]), 10, 0.05);
  const last = cut[cut.length - 1];
  close(Math.hypot(last[0] - 50, last[1]), 10, 0.05);
});

it("distanceAlong — how far along a polyline its nearest point lies", () => {
  const line = [
    [0, 0],
    [100, 0],
    [100, 100],
  ];
  close(distanceAlong(line, [30, 5]), 30);
  close(distanceAlong(line, [104, 40]), 140);
  close(distanceAlong(line, [-20, 0]), 0, 1e-6, "clamped to the start");
  close(distanceAlong(line, [200, 300]), 200, 1e-6, "clamped to the end");
  close(distanceAlong(arch(50), [0, -50]), polylineLength(arch(50)) / 2, 0.5);
});

it("sharpestTurn — the most a polyline turns over a given length", () => {
  const r = 20;
  // A circle turns span / r over any span of it.
  close(sharpestTurn(arch(r, 360), 10), 10 / r, 0.02);
  close(sharpestTurn(arch(r, 360), 1000), Math.PI, 0.02, "the whole arch");
  assert.strictEqual(
    sharpestTurn(
      [
        [0, 0],
        [50, 0],
        [100, 0],
      ],
      10,
    ),
    0,
  );
  // A corner turns all at once.
  close(
    sharpestTurn(
      [
        [0, 0],
        [50, 0],
        [50, 50],
      ],
      1,
    ),
    Math.PI / 2,
  );
});

it("labelStretch — centered where asked, clamped to the ends, upright", () => {
  const line = [
    [0, 0],
    [100, 0],
  ];
  assert.deepStrictEqual(labelStretch(line, 50, 20), [
    [40, 0],
    [60, 0],
  ]);
  assert.deepStrictEqual(
    labelStretch(line, 2, 20),
    [
      [0, 0],
      [20, 0],
    ],
    "held inside the line",
  );
  assert.deepStrictEqual(labelStretch(line, 50, 500), line, "the whole line");
  // A line running right to left reads left to right.
  const back = [
    [100, 0],
    [0, 0],
  ];
  assert.deepStrictEqual(labelStretch(back, 50, 20), [
    [40, 0],
    [60, 0],
  ]);
  // Straight down reads bottom to top.
  const down = [
    [0, 0],
    [0, 100],
  ];
  assert.deepStrictEqual(labelStretch(down, 50, 20), [
    [0, 60],
    [0, 40],
  ]);
});

it("labelStretch — cut short of too much turn and of tight bends", () => {
  const points = arch(30);
  const all = labelStretch(points, polylineLength(points) / 2, 1000);
  assert.ok(curvature(all) <= LINK_LABEL_MAX_TURN, "under the turn limit");
  const middle = all[Math.floor(all.length / 2)];
  close(middle[0], 0, 1, "still centered on the top");
  // A 30px circle is tighter than a 40px radius allows: no stretch fits.
  const tight = labelStretch(points, polylineLength(points) / 2, 40, 7, 40);
  assert.ok(polylineLength(tight) < 10, `${polylineLength(tight)}`);
  // A gentle one is fine.
  const loose = labelStretch(arch(100), 157, 40, 7, 40);
  close(polylineLength(loose), 40, 0.01);
});

it("curvedLabelSpot — none for a straight run or a tight loop", () => {
  const line = [
    [0, 0],
    [200, 0],
  ];
  assert.strictEqual(curvedLabelSpot(line, 100, 30, 10, 2), null);
  assert.strictEqual(curvedLabelSpot([[0, 0]], 0, 30, 10, 2), null);
  // A loop 8px across bends tighter than 1.5em.
  assert.strictEqual(curvedLabelSpot(arch(8), 12, 20, 10, 2), null);
});

it("curvedLabelSpot — text dropped 0.3em under the centerline, upright", () => {
  const points = arch(100);
  const at = polylineLength(points) / 2;
  const spot = curvedLabelSpot(points, at, 40, 10, 2);
  assert.ok(spot);
  // The stretch is the text, a font size of slack and the pad, centered on top.
  close(polylineLength(spot.stretch), 40 + 10 + 4, 0.01);
  const mid = spot.stretch[Math.floor(spot.stretch.length / 2)];
  close(mid[0], 0, 0.5);
  assert.ok(spot.stretch[0][0] < spot.stretch[spot.stretch.length - 1][0]);
  // Inside the arch, 3px below the circle, and 2px (the pad) in from each end.
  for (const [x, y] of spot.text) close(Math.hypot(x, y), 97, 0.05);
  close(polylineLength(spot.text), ((40 + 10) * 97) / 100, 0.1);
  // A right-to-left arch (a smile, drawn backwards) reads left to right too.
  const smile = arch(100).map(([x, y]) => [-x, -y]);
  const flipped = curvedLabelSpot(smile, at, 40, 10, 2);
  const [first, last] = [flipped.text[0], flipped.text.at(-1)];
  assert.ok(first[0] < last[0], "left to right");
  // Upright on a smile, the baseline sits further from the center.
  for (const [x, y] of flipped.text) close(Math.hypot(x, y), 103, 0.05);
});

it("curvedLabelSpot — a short link cuts the text short, or takes a straight label", () => {
  const points = arch(60).slice(70, 111); // about 42px of arc
  const at = polylineLength(points) / 2;
  const spot = curvedLabelSpot(points, at, 60, 10, 2);
  assert.ok(spot, "room for some of the text");
  close(polylineLength(spot.stretch), polylineLength(points), 0.01);
  const tiny = arch(60).slice(85, 96); // about 10px
  assert.strictEqual(
    curvedLabelSpot(tiny, polylineLength(tiny) / 2, 80, 10, 2),
    null,
    "no room for two ems of text",
  );
});

it("curvedLabelPad — the stretch under the text, plus the pad", () => {
  const points = arch(100);
  const spot = curvedLabelSpot(points, polylineLength(points) / 2, 40, 10, 2);
  const pad = curvedLabelPad(spot, 40, 2);
  // The text's 40px along its baseline (radius 97) is 41.2px on the centerline.
  close(polylineLength(pad), (40 * 100) / 97 + 4, 0.1);
  const mid = pad[Math.floor(pad.length / 2)];
  close(mid[0], 0, 0.5, "centered");
  for (const [x, y] of pad) close(Math.hypot(x, y), 100, 0.05);
  // Never longer than the stretch.
  close(
    polylineLength(curvedLabelPad(spot, 500, 2)),
    polylineLength(spot.stretch),
    0.01,
  );
});

it("placeLinkLabels — a label with several boxes is hidden when any one hits", () => {
  const box = (x, y) => ({x, y, width: 10, height: 10, angle: 0});
  const curved = {
    id: "curved",
    box: box(0, 0),
    boxes: [box(0, 0), box(10, 4), box(20, 10)],
  };
  const other = {id: "other", box: box(22, 14)};
  const clear = {id: "clear", box: box(100, 100)};
  assert.deepStrictEqual(
    placeLinkLabels([curved, other, clear], {}).map(l => l.id),
    ["curved", "clear"],
    "the last box of the curve covers it",
  );
  assert.deepStrictEqual(
    placeLinkLabels([curved], {circles: [{x: 20, y: 18, r: 6}]}),
    [],
    "a box covers a node",
  );
  assert.deepStrictEqual(
    placeLinkLabels([curved], {labels: [box(10, 4)]}),
    [],
    "a box covers a node label",
  );
  assert.deepStrictEqual(
    placeLinkLabels([{id: "none", box: box(0, 0), boxes: []}], {}),
    [],
  );
});

it("pathLabelNodes — no halo when asked for none", () => {
  const viz = new Network();
  const labels = [
    {key: "a", text: "abc", d: "M0,0L100,0", color: "#f00", anchor: "middle"},
  ];
  const [haloed] = pathLabelNodes(viz, labels);
  assert.strictEqual(haloed.halo, true);
  assert.strictEqual(haloed.paint.stroke, chartBackground(viz));
  const [plain] = pathLabelNodes(viz, labels, {}, {halo: false});
  assert.strictEqual(plain.halo, undefined);
  assert.strictEqual(plain.paint.stroke, undefined);
  assert.strictEqual(plain.interactive, false);
});

/** A Network drawing one link labeled `name`, and a request along `path`. */
const setup = (path, name = "rail", config = {}) => {
  const link = {source: "a", target: "b", name};
  const viz = new Network().links([link]).linkLabel("name").config(config);
  const end = id => ({data: {id}, i: 0, id});
  const datum = makeLinkDatum(link, end("a"), end("b"), 0);
  const req = {key: "l0", link: {datum}, i: 0, anchor: null, path};
  return {viz, req, datum};
};

it("emitLinkLabels — a curved link's label follows it, over a curved pad", () => {
  const points = arch(100);
  const {viz, req, datum} = setup(points, "freight rail");
  const [group] = emitLinkLabels(viz, [req], {});
  assert.strictEqual(group.key, "l0-label-group");
  assert.strictEqual(group.transform, undefined, "drawn in place");
  assert.strictEqual(group.interactive, false);
  assert.strictEqual(group.datum, datum, "dims with its link");
  const [pad, text] = group.children;
  assert.strictEqual(pad.type, "path");
  assert.strictEqual(pad.key, "l0-label-pad");
  assert.strictEqual(pad.interactive, false);
  assert.strictEqual(pad.paint.stroke, chartBackground(viz));
  assert.strictEqual(pad.paint.fill, "none");
  assert.strictEqual(pad.paint.strokeOpacity, 0.85);
  // As tall as the text and its pad.
  assert.ok(pad.paint.strokeWidth >= 10 + 4 && pad.paint.strokeWidth <= 18);
  for (const [x, y] of samplePath(pad.d).points)
    close(Math.hypot(x, y), 100, 0.1, "the pad on the centerline");
  assert.strictEqual(text.type, "text");
  assert.strictEqual(text.key, "l0-label");
  assert.strictEqual(text.interactive, false);
  assert.strictEqual(text.datum, undefined);
  assert.strictEqual(text.lines[0].text, "freight rail");
  assert.strictEqual(text.halo, undefined, "the pad is its halo");
  // The glyphs' middles sit on the link, centered on its top.
  const boxes = pathTextBoxes(text);
  for (const b of boxes)
    assert.ok(distTo(points, [b.x, b.y]) < 0.6, `${b.x},${b.y}`);
  const xs = boxes.map(b => b.x);
  close((Math.min(...xs) + Math.max(...xs)) / 2, 0, 3);
});

it("emitLinkLabels — curved labels center on the anchor, and cut short", () => {
  const points = arch(100);
  const {viz, req} = setup(points, "x");
  const anchor = {x: -70.71, y: -70.71, angle: 0};
  const [group] = emitLinkLabels(viz, [{...req, anchor}], {});
  const [b] = pathTextBoxes(group.children[1]);
  assert.ok(Math.hypot(b.x - anchor.x, b.y - anchor.y) < 4, "at the anchor");
  // On a short arc, a long name ends in an ellipsis.
  const short = arch(60).slice(70, 111);
  const long = setup(short, "a very long name for a short link");
  const [cut] = emitLinkLabels(long.viz, [long.req], {});
  const cutText = cut.children[1].lines[0].text;
  assert.ok(cutText.endsWith("..."), cutText);
  // Fewer than three letters left is no label at all.
  const tiny = arch(60).slice(85, 96);
  const none = setup(tiny, "a long name");
  assert.deepStrictEqual(
    emitLinkLabels(none.viz, [{...none.req, anchor: null}], {}),
    [],
  );
});

it("emitLinkLabels — straight links, tight loops and horizontal labels stay straight", () => {
  const line = [
    [0, 0],
    [100, 0],
  ];
  const anchor = {x: 50, y: 0, angle: 0};
  const straight = setup(line);
  const [g1] = emitLinkLabels(straight.viz, [{...straight.req, anchor}], {});
  assert.deepStrictEqual(g1.transform, {x: 50, y: 0});
  assert.strictEqual(g1.children[0].type, "rect");
  // Without an anchor, a straight path has nowhere to put a straight label.
  assert.deepStrictEqual(emitLinkLabels(straight.viz, [straight.req], {}), []);
  const loop = setup(arch(6));
  const [g2] = emitLinkLabels(
    loop.viz,
    [{...loop.req, anchor: {x: 0, y: -6, angle: 0}}],
    {},
  );
  assert.strictEqual(g2.children[0].type, "rect", "a tight loop");
  const level = setup(arch(100), "rail", {
    linkLabelConfig: {rotate: "horizontal"},
  });
  const [g3] = emitLinkLabels(
    level.viz,
    [{...level.req, anchor: {x: 0, y: -100, angle: 1}}],
    {},
  );
  assert.deepStrictEqual(g3.transform, {x: 0, y: -100});
  assert.strictEqual(g3.children[0].type, "rect");
});

it("emitLinkLabels — curved labels keep clear of nodes and of each other", () => {
  const points = arch(100);
  const {viz, req} = setup(points, "freight rail");
  assert.deepStrictEqual(
    emitLinkLabels(viz, [req], {circles: [{x: 0, y: -100, r: 5}]}),
    [],
    "covers a node",
  );
  const other = {...req, key: "l1", priority: 2};
  const kept = emitLinkLabels(viz, [req, other], {});
  assert.deepStrictEqual(
    kept.map(g => g.key),
    ["l1-label-group"],
    "the higher priority wins",
  );
});

it("emitLinkLabels — curved labels in the theme's colors, and the config's font", () => {
  const {viz, req} = setup(arch(100), "rail", {
    theme: "dark",
    linkLabelConfig: {fontSize: 14, padding: 3, fontWeight: 700},
  });
  const [group] = emitLinkLabels(viz, [req], {});
  const [pad, text] = group.children;
  assert.strictEqual(pad.paint.stroke, chartBackground(viz));
  assert.ok(pad.paint.strokeWidth >= 14 + 6 && pad.paint.strokeWidth <= 26);
  assert.strictEqual(text.font.size, 14);
  assert.strictEqual(String(text.font.weight), "700");
});

it("each chart's label path: arcs, loops, splines, bands, bundles", () => {
  // ArcDiagram: the arc between its nodes' edges, through the anchor.
  const arcLink = {
    source: {r: 5},
    target: {r: 5},
    arc: {from: 0, to: 100, base: 200, scale: 1, side: "above", orient: "h"},
  };
  const arc = arcLabelPath(arcLink);
  close(Math.hypot(arc[0][0] - 0, arc[0][1] - 200), 5, 0.05);
  const apex = arcLabelAnchor(arcLink);
  assert.ok(distTo(arc, [apex.x, apex.y]) < 0.5, "through the apex");
  // A loop follows its own path.
  const loop = {d: "M0,0C0,-40 40,-40 40,0", apex: {x: 20, y: -30, angle: 0}};
  assert.deepStrictEqual(arcLabelPath({...arcLink, loop}), curvePoints(loop.d));
  // Rings: a spline's curve, a loop, or nothing for a straight edge.
  const spline = {
    spline: true,
    source: {},
    target: {},
    sourceX: 0,
    sourceY: 0,
    sourceBisectX: 30,
    sourceBisectY: -30,
    targetBisectX: 70,
    targetBisectY: -30,
    targetX: 100,
    targetY: 0,
  };
  const curve = ringsEdgePath(spline);
  assert.deepStrictEqual(curve[0], [0, 0]);
  assert.deepStrictEqual(curve.at(-1), [100, 0]);
  assert.ok(curve.some(([, y]) => y < -20));
  assert.deepStrictEqual(ringsEdgePath({...spline, loop}), curvePoints(loop.d));
  assert.strictEqual(ringsEdgePath({source: {}, target: {}}), null);
  // Sankey: a band's centerline from source to target, or none unplaced.
  const band = sankeyLinkPath({
    source: {x1: 10},
    target: {x0: 110},
    y0: 20,
    y1: 80,
  });
  assert.deepStrictEqual(band[0], [10, 20]);
  assert.deepStrictEqual(band.at(-1), [110, 80]);
  assert.strictEqual(sankeyLinkPath({source: {x1: 0}, target: {x0: 10}}), null);
  // A circular link: its center line around the return lane.
  const shape = {
    side: "bottom",
    xs: 200,
    sy: 50,
    xt: 10,
    ty: 60,
    laneY: 150,
    xr: 220,
    rs: 10,
    xl: -10,
    rt: 10,
  };
  const lane = sankeyLinkPath({source: {}, target: {}, circular: shape});
  assert.deepStrictEqual(lane, curvePoints(circularLinkD(shape)));
  assert.ok(
    lane.some(([x, y]) => Math.abs(y - 150) < 0.01 && Math.abs(x) < 0.01),
    "the lane",
  );
  // A bundled link, between the edges of its nodes.
  const bundled = bundledLinkPath({
    source: {r: 10},
    target: {r: 10},
    points: [
      [0, 0],
      [50, -20],
      [100, 0],
    ],
  });
  assert.ok(Math.hypot(...bundled[0]) > 8);
  assert.ok(Math.hypot(bundled.at(-1)[0] - 100, bundled.at(-1)[1]) > 8);
});
