import assert from "assert";

import {collapse, collapseTo, commitTrailCatchups, commitTrailScene, cubicInOut, interpolateNode, interpolateScene, isFlipEligible, parseGradient, TrailLog} from "../es/index.js";

it("cubicInOut matches d3 endpoints and midpoint", () => {
  assert.strictEqual(cubicInOut(0), 0, "start");
  assert.strictEqual(cubicInOut(1), 1, "end");
  assert.strictEqual(cubicInOut(0.5), 0.5, "midpoint is symmetric");
});

it("collapse zeroes geometry and opacity", () => {
  const rect = collapse({type: "rect", key: "a", x: 10, y: 20, width: 40, height: 60});
  assert.strictEqual(rect.width, 0, "rect width collapses");
  assert.strictEqual(rect.height, 0, "rect height collapses");
  assert.strictEqual(rect.x, 30, "rect collapses toward center x");
  assert.strictEqual(rect.y, 50, "rect collapses toward center y");
  assert.strictEqual(rect.paint.opacity, 0, "opacity fades to 0");

  const circle = collapse({type: "circle", key: "b", cx: 5, cy: 5, r: 8});
  assert.strictEqual(circle.r, 0, "circle radius collapses");
});

it("collapse grows bars from their baseline, not their center", () => {
  // Vertical bar: rect spans [-H, 0] with its baseline edge at y=0.
  const up = collapse({type: "rect", shapeType: "Bar", key: "a", x: -20, y: -60, width: 40, height: 60});
  assert.strictEqual(up.y, 0, "vertical bar pins its baseline edge at y=0");
  assert.strictEqual(up.height, 0, "vertical bar collapses its height");
  assert.strictEqual(up.x, -20, "vertical bar keeps its full breadth (x)");
  assert.strictEqual(up.width, 40, "vertical bar keeps its full breadth (width)");

  // Horizontal bar: rect spans [0, W] with its baseline edge at x=0.
  const right = collapse({type: "rect", shapeType: "Bar", key: "b", x: 0, y: -20, width: 80, height: 40});
  assert.strictEqual(right.x, 0, "horizontal bar pins its baseline edge at x=0");
  assert.strictEqual(right.width, 0, "horizontal bar collapses its width");
  assert.strictEqual(right.y, -20, "horizontal bar keeps its full breadth (y)");
  assert.strictEqual(right.height, 40, "horizontal bar keeps its full breadth (height)");
});

it("collapse grows a Sankey link's stroke-width from 0, keeping opacity", () => {
  const link = collapse({
    type: "path",
    shapeType: "Link",
    key: "l",
    d: "M0,0L10,10",
    paint: {stroke: "#000", strokeOpacity: 0.5, strokeWidth: 12},
  });
  assert.strictEqual(link.paint.strokeWidth, 0, "link stroke-width collapses to 0");
  assert.strictEqual(link.paint.strokeOpacity, 0.5, "link keeps its stroke-opacity");
  assert.strictEqual(link.paint.opacity, undefined, "link does not force an opacity fade");

  // A plain (non-link) path still fades via opacity only.
  const plain = collapse({type: "path", key: "p", d: "M0,0L10,10", paint: {strokeWidth: 4}});
  assert.strictEqual(plain.paint.opacity, 0, "plain path fades opacity to 0");
  assert.strictEqual(plain.paint.strokeWidth, 4, "plain path keeps its stroke-width");
});

it("collapse flattens a shapeType Area path to a flat line at its own bounding-box center", () => {
  // A triangle-ish "d" whose bbox is x:[0,20], y:[-10,0] — the flat line
  // should sit at the box's vertical center (y=-5), spanning its x-span.
  const area = collapse({type: "path", key: "a", shapeType: "Area", d: "M0,0L10,-10L20,0Z"});
  assert.strictEqual(area.paint.opacity, 0, "opacity fades to 0");
  assert.ok(area.d.includes("-5"), "flat line sits at the bbox's vertical center");
  assert.ok(area.d.startsWith("M0,-5"), "flat line starts at the bbox's left edge");
});

it("collapse scales a shapeType Pie wedge to nothing at its own bounding-box center", () => {
  // A wedge-ish "d" whose bbox is x:[0,20], y:[-10,0] — scale:0 collapses
  // every point to the transform's (x,y), which must equal the bbox center
  // (10,-5) so the wedge shrinks toward itself, not the scene origin. `d`
  // stays untouched — only the transform expresses the collapse.
  const wedge = collapse({type: "path", key: "w", shapeType: "Pie", d: "M0,0L10,-10L20,0Z"});
  assert.strictEqual(wedge.paint.opacity, 0, "opacity fades to 0");
  assert.strictEqual(wedge.d, "M0,0L10,-10L20,0Z", "d is untouched — the collapse is expressed as a transform");
  assert.strictEqual(wedge.transform.scale, 0, "scales to nothing");
  assert.strictEqual(wedge.transform.x, 10, "collapses toward its own bbox center (x)");
  assert.strictEqual(wedge.transform.y, -5, "collapses toward its own bbox center (y)");
});

it("collapse flattens an area to its own vertical center", () => {
  const area = collapse({
    type: "area", key: "a",
    topline: [[0, 0], [10, -20], [20, -5]],
    baseline: [[0, 10], [10, 10], [20, 10]],
  });
  const midY = (0 + -20 + -5) / 3;
  assert.ok(area.topline.every(([, y]) => y === midY), "topline flattens to its own average y");
  assert.ok(area.baseline.every(([, y]) => y === midY), "baseline flattens to the same y as topline");
  assert.deepStrictEqual(area.topline.map(p => p[0]), [0, 10, 20], "x positions are kept");
  assert.strictEqual(area.paint.opacity, 0, "opacity fades to 0");
});

it("isFlipEligible admits plain rect/circle/area content, rejects chrome and other types", () => {
  assert.ok(isFlipEligible({type: "rect", key: "a", x: 0, y: 0, width: 1, height: 1}), "plain rect is eligible");
  assert.ok(isFlipEligible({type: "circle", key: "b", cx: 0, cy: 0, r: 1}), "plain circle is eligible");
  assert.ok(isFlipEligible({type: "area", key: "c", topline: [], baseline: []}), "plain area is eligible");
  assert.ok(
    !isFlipEligible({type: "rect", key: "d", x: 0, y: 0, width: 1, height: 1, interactionGroup: "back"}),
    "chrome tagged with an interactionGroup (legend/timeline/back) is not eligible",
  );
  assert.ok(!isFlipEligible({type: "text", key: "e", x: 0, y: 0, lines: [], font: {}}), "text has no rect-collapse mapping");
  assert.ok(!isFlipEligible({type: "path", key: "f", d: "M0,0"}), "a plain path keeps its own opacity-only fade, not the box override");
  assert.ok(!isFlipEligible({type: "path", key: "g", d: "M0,0", shapeType: "Link"}), "a Sankey Link keeps its own stroke-width collapse, not the box override");
  assert.ok(
    isFlipEligible({type: "path", key: "h", d: "M0,0", shapeType: "Area"}),
    "a path stamped shapeType Area is eligible — StackedArea/AreaPlot's actual band representation",
  );
  assert.ok(
    isFlipEligible({type: "path", key: "i", d: "M0,0", shapeType: "Pie"}),
    "a path stamped shapeType Pie is eligible — Pie/Donut's actual wedge representation",
  );
});

it("collapseTo collapses a flip-eligible node to/from an external box, not its own center", () => {
  const rect = collapseTo(
    {type: "rect", key: "a", x: 0, y: 0, width: 100, height: 50},
    {x: 10, y: 20, width: 30, height: 40},
  );
  assert.deepStrictEqual(
    {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
    {x: 10, y: 20, width: 30, height: 40},
    "rect takes the override box exactly",
  );
  assert.strictEqual(rect.paint.opacity, 0, "opacity fades to 0");

  const circle = collapseTo({type: "circle", key: "b", cx: 0, cy: 0, r: 100}, {x: 0, y: 0, width: 20, height: 40});
  assert.strictEqual(circle.cx, 10, "circle centers in the box (x)");
  assert.strictEqual(circle.cy, 20, "circle centers in the box (y)");
  assert.strictEqual(circle.r, 10, "circle radius is half the box's shorter side");

  const area = collapseTo(
    {type: "area", key: "c", topline: [[0, -20], [10, -30]], baseline: [[0, 10], [10, 10]]},
    {x: 100, y: 200, width: 40, height: 10},
  );
  assert.ok(area.topline.every(([, y]) => y === 205), "topline sits at the box's vertical center");
  assert.ok(area.baseline.every(([, y]) => y === 205), "baseline sits at the box's vertical center");
  assert.strictEqual(area.topline[0][0], 100, "first point at the box's left edge");
  assert.strictEqual(area.topline[1][0], 140, "last point at the box's right edge");

  const areaPath = collapseTo(
    {type: "path", key: "d", shapeType: "Area", d: "M0,0L10,-10L20,0Z"},
    {x: 100, y: 200, width: 40, height: 10},
  );
  assert.strictEqual(areaPath.paint.opacity, 0, "opacity fades to 0");
  assert.ok(areaPath.d.startsWith("M100,205"), "flat line starts at the box's left edge, vertical center");
  assert.ok(areaPath.d.includes("140,205"), "flat line reaches the box's right edge");

  // Bbox x:[0,20] y:[-10,0] fit ("contain") into a 40×10 box: the height
  // ratio (10/10=1) is the binding constraint, so scale is 1 and the wedge's
  // own shape is centered in the box, letterboxed horizontally — its real
  // silhouette (`d`, untouched), not a degenerate point.
  const wedge = collapseTo(
    {type: "path", key: "e", shapeType: "Pie", d: "M0,0L10,-10L20,0Z"},
    {x: 100, y: 200, width: 40, height: 10},
  );
  assert.strictEqual(wedge.paint.opacity, 0, "opacity fades to 0");
  assert.strictEqual(wedge.d, "M0,0L10,-10L20,0Z", "d is untouched — the collapse is expressed as a transform");
  assert.strictEqual(wedge.transform.scale, 1, "contain-fits at the binding (height) ratio");
  assert.strictEqual(wedge.transform.x, 110, "translated so its bbox centers in the box (x)");
  assert.strictEqual(wedge.transform.y, 210, "translated so its bbox centers in the box (y)");
});

it("collapseTo maps a Treemap cell PROPORTIONALLY within body into rect, instead of becoming rect", () => {
  const body = {x: 0, y: 0, width: 100, height: 50};
  const node = {type: "rect", key: "cell", x: 20, y: 10, width: 30, height: 20};
  const target = {x: 200, y: 300, width: 40, height: 20};

  const mapped = collapseTo(node, target, body);
  // fx=0.2, fy=0.2, fw=0.3, fh=0.4 of body, reapplied to target.
  assert.strictEqual(mapped.x, 208, "x keeps its fractional position within body, remapped into target");
  assert.strictEqual(mapped.y, 304, "y keeps its fractional position within body, remapped into target");
  assert.strictEqual(mapped.width, 12, "width scales by target/body ratio (non-uniform), not becoming target's width");
  assert.strictEqual(mapped.height, 8, "height scales by target/body ratio (non-uniform)");
  assert.strictEqual(mapped.paint.opacity, 0, "opacity still fades to 0");

  // A Bar (axis-based layout, not a space-filling one) keeps the plain
  // "become target exactly" behavior even when body is supplied.
  const bar = collapseTo({...node, shapeType: "Bar"}, target, body);
  assert.deepStrictEqual(
    {x: bar.x, y: bar.y, width: bar.width, height: bar.height},
    {x: 200, y: 300, width: 40, height: 20},
    "a Bar ignores body and becomes target exactly, same as without body",
  );
});

it("collapseTo maps a Pack circle PROPORTIONALLY within body into rect, instead of becoming rect", () => {
  const body = {x: 0, y: 0, width: 100, height: 100};
  const node = {type: "circle", key: "c", cx: 30, cy: 70, r: 10, shapeType: "Pack"};
  const target = {x: 500, y: 500, width: 40, height: 40};

  const mapped = collapseTo(node, target, body);
  assert.strictEqual(mapped.cx, 512, "cx keeps its fractional position within body, remapped into target");
  assert.strictEqual(mapped.cy, 528, "cy keeps its fractional position within body, remapped into target");
  assert.strictEqual(mapped.r, 4, "radius scales by the target/body ratio (0.4), not becoming half of target's side");

  // A Plot scatter point (shapeType "Circle", not "Pack") keeps the plain
  // "become target exactly" behavior even when body is supplied.
  const scatter = collapseTo({...node, shapeType: "Circle"}, target, body);
  assert.strictEqual(scatter.cx, 520, "a scatter point ignores body and centers in target, same as without body");
  assert.strictEqual(scatter.r, 20, "a scatter point's radius is half of target's side, same as without body");
});

it("collapseTo maps a Pie wedge using the WHOLE pie (body) as the shared scale source, not its own bbox", () => {
  const body = {x: -50, y: -50, width: 100, height: 100};
  const node = {type: "path", key: "w", shapeType: "Pie", d: "M0,0L10,-10L20,0Z"};
  const target = {x: 100, y: 200, width: 40, height: 10};

  const mapped = collapseTo(node, target, body);
  assert.strictEqual(mapped.d, "M0,0L10,-10L20,0Z", "d stays untouched — only the transform expresses the collapse");
  assert.strictEqual(mapped.transform.scale, 0.1, "scale is target/body (0.1), not target/own-bbox (which would be 1)");
  // body is centered at (0,0), so translate lands exactly on target's center —
  // unlike the own-bbox case (previous test), which offsets to center the
  // wedge's OWN off-center bbox instead.
  assert.strictEqual(mapped.transform.x, 120, "translates to target's center x, since body's center is the origin");
  assert.strictEqual(mapped.transform.y, 205, "translates to target's center y, since body's center is the origin");
});

it("interpolateNode interpolates numeric geometry and color", () => {
  const interp = interpolateNode(
    {type: "rect", key: "a", x: 0, y: 0, width: 0, height: 0, paint: {fill: "#000000"}},
    {type: "rect", key: "a", x: 0, y: 0, width: 100, height: 50, paint: {fill: "#ffffff"}},
  );
  const mid = interp(0.5);
  assert.strictEqual(mid.width, 50, "width halfway");
  assert.strictEqual(mid.height, 25, "height halfway");
  assert.strictEqual(mid.paint.fill, "rgb(128, 128, 128)", "fill color halfway");
});

it("interpolateScene fades entering nodes and drops exiting nodes at t=1", () => {
  const prev = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "circle", key: "old", cx: 10, cy: 10, r: 4, paint: {opacity: 1}}],
    },
  };
  const next = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "rect", key: "new", x: 0, y: 0, width: 20, height: 20}],
    },
  };

  const interp = interpolateScene(prev, next);

  const mid = interp(0.5);
  const keys = mid.root.children.map(c => c.key).sort();
  assert.deepStrictEqual(keys, ["new", "old"], "both entering and exiting nodes present mid-animation");
  const entering = mid.root.children.find(c => c.key === "new");
  assert.strictEqual(entering.paint.opacity, 0.5, "entering node is half faded-in");
  const exiting = mid.root.children.find(c => c.key === "old");
  assert.strictEqual(exiting.paint.opacity, 0.5, "exiting node is half faded-out");

  const end = interp(1);
  assert.deepStrictEqual(end.root.children.map(c => c.key), ["new"], "exiting node dropped at t=1");
});

it("interpolateScene grows an entering path from its own enterArc", () => {
  const arc = {innerRadius: 50, outerRadius: 100, startAngle: 1, endAngle: 2};
  const enterArc = {innerRadius: 0, outerRadius: 50, startAngle: 0, endAngle: 0};
  const next = {
    width: 200,
    height: 200,
    root: {type: "group", key: "root", children: [{type: "path", key: "w", d: "M0,0", arc, enterArc, paint: {opacity: 1}}]},
  };
  const interp = interpolateScene(null, next);
  const start = interp(0).root.children[0];
  assert.strictEqual(start.paint.opacity, 1, "keeps its own opacity");
  assert.ok(start.d.length > 0);
  const mid = interp(0.5).root.children[0];
  assert.notStrictEqual(mid.d, start.d, "the wedge grows");
  const plain = interpolateScene(null, {...next, root: {...next.root, children: [{...next.root.children[0], enterArc: undefined}]}});
  assert.strictEqual(plain(0).root.children[0].paint.opacity, 0, "without enterArc it fades in");
});

it("interpolateScene morphs a flip-eligible entering node from an external enterFrom box", () => {
  const prev = {width: 200, height: 100, root: {type: "group", key: "root", children: []}};
  const next = {
    width: 200, height: 100,
    root: {type: "group", key: "root", children: [
      {type: "rect", key: "new", x: 0, y: 0, width: 100, height: 50},
    ]},
  };
  const enterFrom = {x: 40, y: 20, width: 10, height: 10};
  const interp = interpolateScene(prev, next, undefined, {enterFrom});

  const start = interp(0).root.children.find(c => c.key === "new");
  assert.strictEqual(start.x, 40, "entering rect starts at enterFrom.x, not its own center");
  assert.strictEqual(start.y, 20, "entering rect starts at enterFrom.y");
  assert.strictEqual(start.width, 10, "entering rect starts at enterFrom.width");
  assert.strictEqual(start.height, 10, "entering rect starts at enterFrom.height");

  const end = interp(1).root.children.find(c => c.key === "new");
  assert.strictEqual(end.width, 100, "entering rect still ends at its own target geometry");
});

it("interpolateScene threads enterFromBody through to a PROPORTIONAL start position (Treemap-style)", () => {
  const prev = {width: 200, height: 100, root: {type: "group", key: "root", children: []}};
  const next = {
    width: 200, height: 100,
    root: {type: "group", key: "root", children: [
      // Sits at x:[50,100] within a 0..100-wide body — right half.
      {type: "rect", key: "new", x: 50, y: 0, width: 50, height: 50},
    ]},
  };
  const enterFrom = {x: 1000, y: 2000, width: 40, height: 20};
  const enterFromBody = {x: 0, y: 0, width: 100, height: 50};
  const interp = interpolateScene(prev, next, undefined, {enterFrom, enterFromBody});

  const start = interp(0).root.children.find(c => c.key === "new");
  // fx=0.5 (right half of body) → still the right half of enterFrom, not
  // enterFrom's own x/width verbatim.
  assert.strictEqual(start.x, 1020, "starts at its proportional position within enterFromBody, remapped into enterFrom");
  assert.strictEqual(start.width, 20, "starts at its proportional width within enterFromBody, remapped into enterFrom");
});

it("interpolateScene morphs a flip-eligible exiting node toward an external exitTo box", () => {
  const prev = {
    width: 200, height: 100,
    root: {type: "group", key: "root", children: [
      {type: "rect", key: "old", x: 0, y: 0, width: 100, height: 50},
    ]},
  };
  const next = {width: 200, height: 100, root: {type: "group", key: "root", children: []}};
  const exitTo = {x: 40, y: 20, width: 10, height: 10};
  const interp = interpolateScene(prev, next, undefined, {exitTo});

  // Exiting nodes are dropped entirely at t=1 (see the test above), so the
  // approach-toward-exitTo has to be checked just short of that.
  const node = interp(0.999).root.children.find(c => c.key === "old");
  assert.ok(Math.abs(node.width - 10) < 0.5, "exiting rect shrinks toward exitTo's width, not its own center");
  assert.ok(Math.abs(node.x - 40) < 0.5, "exiting rect moves toward exitTo's x");
});

it("interpolateScene ignores enterFrom/exitTo for a node that is not flip-eligible", () => {
  const prev = {width: 200, height: 100, root: {type: "group", key: "root", children: []}};
  const next = {
    width: 200, height: 100,
    root: {type: "group", key: "root", children: [
      {type: "rect", key: "back", x: 0, y: 0, width: 100, height: 50, interactionGroup: "back"},
    ]},
  };
  const interp = interpolateScene(prev, next, undefined, {enterFrom: {x: 999, y: 999, width: 1, height: 1}});
  const start = interp(0).root.children.find(c => c.key === "back");
  assert.strictEqual(start.x, 50, "chrome collapses to its own center, ignoring enterFrom");
  assert.strictEqual(start.width, 0, "chrome collapses its own width to 0, ignoring enterFrom");
});

it("interpolateScene streaks a motion trail behind a moving trailed point", () => {
  const circle = extra => ({
    type: "circle", key: "p", cx: 0, cy: 0, r: 5,
    paint: {fill: "#ff0000"}, transform: {x: 10, y: 10}, ...extra,
  });
  const prev = {width: 200, height: 200, root: {type: "group", key: "root", children: [circle()]}};
  const next = {
    width: 200, height: 200,
    root: {type: "group", key: "root", children: [circle({trail: true, transform: {x: 110, y: 90}})]},
  };
  const interp = interpolateScene(prev, next);

  const mid = interp(0.5);
  const trail = mid.root.children.find(c => c.key === "p__trail");
  assert.ok(trail, "trail node emitted mid-move");
  assert.strictEqual(trail.type, "path", "trail is a cone path");
  assert.ok(typeof trail.d === "string" && trail.d.startsWith("M"), "trail has a path d");
  // The tail is closed with a semicircle of the previous radius (an arc command),
  // so its bbox reaches behind A (10,10) — up-left of the tail chord.
  assert.ok(/A5,5 /.test(trail.d), "tail closed by a radius-5 arc");
  assert.ok(trail.gradientBounds.x < 6.9, "bbox extends behind the tail for the round cap");
  assert.ok(trail.gradientBounds, "trail carries its gradient bounds for Canvas");
  // Fill is a gradient fading transparent (tail) → the point's color (head).
  assert.ok(trail.paint.fill.startsWith("gradient:"), "trail fill is a gradient");
  const grad = parseGradient(trail.paint.fill);
  assert.strictEqual(grad.stops.length, 2, "two stops");
  assert.strictEqual(grad.stops[1].color, "#ff0000", "head stop = point color");
  assert.ok(/, ?0\)$/.test(grad.stops[0].color), "tail stop is transparent");
  // Moving down-right, tail sits at the top-left bbox corner, head bottom-right.
  assert.deepStrictEqual(grad.from, [0, 0], "gradient from = tail corner");
  assert.deepStrictEqual(grad.to, [1, 1], "gradient to = head corner");
  assert.ok(trail.paint.opacity > 0 && trail.paint.opacity < 0.6, "trail fading");
  // Trail paints beneath its point.
  const trailIdx = mid.root.children.findIndex(c => c.key === "p__trail");
  const pointIdx = mid.root.children.findIndex(c => c.key === "p");
  assert.ok(trailIdx < pointIdx, "trail is behind the point");

  assert.ok(!interp(1).root.children.some(c => c.key === "p__trail"), "no trail at rest (t=1)");

  // A point that doesn't opt in gets no trail.
  const noOpt = interpolateScene(
    {width: 200, height: 200, root: {type: "group", key: "root", children: [circle()]}},
    {width: 200, height: 200, root: {type: "group", key: "root", children: [circle({transform: {x: 110, y: 90}})]}},
  );
  assert.ok(!noOpt(0.5).root.children.some(c => c.key === "p__trail"), "no trail without trail:true");
});

it("interpolateScene sizes a rect's trail to its silhouette perpendicular to travel", () => {
  // A 20×20 square (half-extent 10). Move it and read the cone's tail chord.
  const square = extra => ({
    type: "rect", key: "r", x: -10, y: -10, width: 20, height: 20,
    paint: {fill: "#1c7ed6"}, transform: {x: 0, y: 0}, ...extra,
  });
  // The swept-hull width perpendicular to travel: project every polygon vertex
  // onto the motion perpendicular and take the extent. Robust to the hull's
  // vertex count/order (a rectangle for axis-aligned moves, a hexagon otherwise).
  const perpWidth = (dx, dy) => {
    const interp = interpolateScene(
      {width: 300, height: 300, root: {type: "group", key: "root", children: [square()]}},
      {width: 300, height: 300, root: {type: "group", key: "root",
        children: [square({trail: true, transform: {x: dx, y: dy}})]}},
    );
    const trail = interp(0.5).root.children.find(c => c.key === "r__trail");
    assert.ok(trail && trail.type === "path", "rect emits a swept-hull path trail");
    const pts = trail.d.split(/[MLZ]/).filter(s => s.trim()).map(s => s.split(",").map(Number));
    const len = Math.hypot(dx, dy), px = -dy / len, py = dx / len;
    const proj = pts.map(p => p[0] * px + p[1] * py);
    return Math.max(...proj) - Math.min(...proj);
  };

  // Axis-aligned travel presents the square's side (width 20).
  assert.ok(Math.abs(perpWidth(120, 0) - 20) < 1e-6, "horizontal move → side width (20)");
  assert.ok(Math.abs(perpWidth(0, 120) - 20) < 1e-6, "vertical move → side width (20)");
  // A 45° move presents the corner-to-corner diagonal (20·√2 ≈ 28.28).
  assert.ok(Math.abs(perpWidth(120, 120) - 20 * Math.SQRT2) < 1e-6, "45° move → diagonal width (20√2)");
  // An oblique angle sits between the two — wider than the side, under the diagonal.
  const oblique = perpWidth(160, 120);
  assert.ok(oblique > 20 && oblique < 20 * Math.SQRT2, "30-ish° move → between side and diagonal");

  // A rect without trail:true gets no cone.
  const noOpt = interpolateScene(
    {width: 300, height: 300, root: {type: "group", key: "root", children: [square()]}},
    {width: 300, height: 300, root: {type: "group", key: "root",
      children: [square({transform: {x: 120, y: 120}})]}},
  );
  assert.ok(!noOpt(0.5).root.children.some(c => c.key === "r__trail"), "no rect trail without trail:true");
});

it("persistent trails grow forward in time, cap, and rewind on scrub-back", () => {
  const scene = (x, y, persist) => ({
    width: 300, height: 300,
    root: {type: "group", key: "root", children: [{
      type: "circle", key: "p", cx: 0, cy: 0, r: 6, paint: {fill: "#1c7ed6"},
      transform: {x, y}, trail: true, trailPersist: persist,
    }]},
  });
  // The trail is one node per mark (a single fill, so overlaps don't double);
  // each segment is a subpath, so count the "M" commands in its `d`.
  const trailOf = frame => frame.root.children.find(c => String(c.key) === "p__trail");
  const segCount = frame => {
    const n = trailOf(frame);
    return n ? (n.d.match(/M/g) || []).length : 0;
  };

  // --- Forward accumulation + persist cap (trailPersist: 2) ---
  const log = new TrailLog();
  const s = (x, y) => scene(x, y, 2);
  const s0 = s(10, 10), s1 = s(110, 60), s2 = s(60, 150), s3 = s(160, 200), s4 = s(40, 250);

  // First (seeding) draw at seq 0: a trail needs a forward move to appear.
  commitTrailScene(log, s0, 0);
  assert.strictEqual(segCount(interpolateScene(s0, s0, log)(1)), 0, "no trail before moving");

  // Forward move (seq 1) → one segment that — unlike the ephemeral trail — stays at rest.
  commitTrailScene(log, s1, 1);
  const mid1 = interpolateScene(s0, s1, log)(0.5);
  const node = trailOf(mid1);
  assert.ok(node && node.type === "path", "one trail path emitted");
  assert.ok(node.paint.fill.startsWith("gradient:"), "trail filled by a single gradient");
  assert.strictEqual(segCount(mid1), 1, "one segment after first forward move");
  assert.strictEqual(segCount(interpolateScene(s0, s1, log)(1)), 1, "segment persists at rest (t=1)");

  commitTrailScene(log, s2, 2);
  assert.strictEqual(segCount(interpolateScene(s1, s2, log)(0.5)), 2, "two segments after second forward move");

  // trailPersist: 2 caps the window — after more forward moves it never exceeds 2.
  commitTrailScene(log, s3, 3);
  commitTrailScene(log, s4, 4);
  assert.strictEqual(segCount(interpolateScene(s3, s4, log)(1)), 2, "older segments drop past the persist length");

  // --- Direction: playing newest → oldest draws no trail ---
  const back = new TrailLog();
  const b0 = s(10, 10), b1 = s(110, 60), b2 = s(60, 150);
  commitTrailScene(back, b0, 5);         // seed at the newest period
  commitTrailScene(back, b1, 4);         // step backward in time
  commitTrailScene(back, b2, 3);         // and again
  assert.strictEqual(segCount(interpolateScene(b1, b2, back)(1)), 0, "backward playback from the start leaves no trail");

  // --- Rewind: after building forward, a backward step retracts, not appends ---
  const rw = new TrailLog();
  const p = (x, y) => scene(x, y, true); // long persist, so nothing caps
  const r0 = p(0, 0), r1 = p(50, 0), r2 = p(50, 50), r3 = p(100, 50);
  commitTrailScene(rw, r0, 0);
  commitTrailScene(rw, r1, 1);
  commitTrailScene(rw, r2, 2);
  commitTrailScene(rw, r3, 3);
  assert.strictEqual(segCount(interpolateScene(r2, r3, rw)(1)), 3, "three forward segments");
  // Step back to seq 2: the newest segment retracts (still drawn while animating),
  // but no NEW segment is added — the count doesn't grow.
  commitTrailScene(rw, r2, 2);
  assert.strictEqual(segCount(interpolateScene(r3, r2, rw)(0.5)), 3, "backward retracts the newest, doesn't append");
  // Step back again: the retracted one is dropped and the next retracts → two remain.
  commitTrailScene(rw, r1, 1);
  assert.strictEqual(segCount(interpolateScene(r2, r1, rw)(0.5)), 2, "rewinding drops segments as it goes back");

  // Multi-step back: jump straight from seq 3 to seq 1 in one commit — every
  // segment after seq 1 must drop, not just the newest.
  const jump = new TrailLog();
  commitTrailScene(jump, r0, 0);
  commitTrailScene(jump, r1, 1);
  commitTrailScene(jump, r2, 2);
  commitTrailScene(jump, r3, 3);
  assert.strictEqual(segCount(interpolateScene(r2, r3, jump)(1)), 3, "three forward segments before the jump");
  commitTrailScene(jump, r1, 1); // jump back two periods at once
  assert.strictEqual(segCount(interpolateScene(r3, r1, jump)(0.5)), 2, "a two-step jump back drops both later segments, not one");

  // Coarse forward jump then a single step back: the jump made ONE segment
  // spanning the skipped period; stepping back into it must truncate that
  // segment to the now-revealed position (reconnecting to the mark), not retract
  // the whole jump and detach.
  const coarse = new TrailLog();
  const g0 = p(0, 0), g2 = p(100, 100), g1 = p(40, 60); // g1 is off the g0→g2 line
  commitTrailScene(coarse, g0, 0);
  commitTrailScene(coarse, g2, 2); // jump forward two periods → one coarse segment
  commitTrailScene(coarse, g1, 1); // step back one period; mark revealed at (40,60)
  const {committed, animating} = coarse.segments("p");
  assert.strictEqual(committed.length, 1, "coarse segment truncated to a single segment");
  assert.strictEqual(animating, null, "no leftover retract");
  assert.deepStrictEqual(committed[0].B, [40, 60], "truncated segment ends at the revealed position, reconnecting the mark");

  // Instant multi-step forward: a jump that skips a period supplies that period's
  // real position as a catch-up, so the trail bends through it (committed) and
  // only the final leg animates — rather than one coarse straight segment.
  const fwd = new TrailLog();
  const f = (x, y) => scene(x, y, true);
  commitTrailScene(fwd, f(0, 0), 2020); // drawn at 2020
  const dest = f(100, 100); // jump to 2022; 2021's real pos (40,60) is off the straight line
  commitTrailCatchups(fwd, dest, [{sequence: 2021, positions: [{key: "p", x: 40, y: 60}]}]);
  commitTrailScene(fwd, dest, 2022);
  const fseg = fwd.segments("p");
  assert.strictEqual(fseg.committed.length, 1, "skipped period committed as an intermediate segment");
  assert.deepStrictEqual(fseg.committed[0].B, [40, 60], "trail bends through the skipped period's real position");
  assert.ok(fseg.animating, "the final leg animates");
  assert.deepStrictEqual(fseg.animating.seg.A, [40, 60], "final leg starts at the skipped position (bent, not straight)");
  assert.deepStrictEqual(fseg.animating.seg.B, [100, 100], "final leg ends at the destination");
});
