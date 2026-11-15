import {it} from "vitest";
import assert from "assert";
import {polygonArea, polygonContains} from "d3-polygon";
import {
  ELLIPSE_SEGMENTS,
  FIVE_ELLIPSES,
  FOUR_ELLIPSES,
  classicEllipses,
  clipConvex,
  edgeDistance,
  ellipsePolygon,
  fitBounds,
  fitPoint,
  fitPolygons,
  pointBounds,
  polygonIntersection,
  polygonLabelSpot,
  polygonMargin,
  polygonPath,
} from "../../src/charts/Venn/vennEllipses.ts";
import {
  ellipseRegions,
  vennRegions,
} from "../../src/charts/Venn/applyLayout.ts";
import {
  ellipseFrame,
  fitRegion,
  frameRegion,
} from "../../src/charts/Venn/ellipseFrame.ts";
import {MIN_LABEL_ROOM, regionLines} from "../../src/charts/Venn/emit.ts";
import {near} from "~test/helpers.js";

const square = (x, y, s) => [
  [x, y],
  [x + s, y],
  [x + s, y + s],
  [x, y + s],
];
const area = p => Math.abs(polygonArea(p));

/** Every combination of `names`, each as a row with a size. */
function combinations(names) {
  const rows = [];
  for (let mask = 1; mask < 1 << names.length; mask++) {
    const sets = names.filter((_, k) => mask & (1 << k));
    rows.push({sets, size: 100 / sets.length});
  }
  return rows;
}

function mockViz(rows) {
  return {
    schema: {
      sets: d => d.sets,
      value: d => d.size,
      proportional: false,
      valueFormat: v => `${v}`,
    },
    _filteredData: rows,
    _drawLabel: d => d.sets.join(" ∩ "),
    ctx: {},
  };
}

it("Venn ellipses: ellipsePolygon traces the ellipse", () => {
  const e = {x: 2, y: 1, rx: 3, ry: 1, rotation: Math.PI / 6};
  const poly = ellipsePolygon(e);
  assert.strictEqual(poly.length, ELLIPSE_SEGMENTS);
  const cos = Math.cos(-e.rotation);
  const sin = Math.sin(-e.rotation);
  for (const [x, y] of poly) {
    const u = (x - e.x) * cos - (y - e.y) * sin;
    const v = (x - e.x) * sin + (y - e.y) * cos;
    near((u / e.rx) ** 2 + (v / e.ry) ** 2, 1, 1e-9);
  }
  near(area(poly), Math.PI * 3, 0.01);
  assert.strictEqual(ellipsePolygon(e, 8).length, 8);
});

it("Venn ellipses: clipConvex keeps the part inside the clip, whichever way either runs", () => {
  const a = square(0, 0, 2);
  const b = square(1, 1, 2);
  near(area(clipConvex(a, b)), 1, 1e-9);
  near(area(clipConvex(a.slice().reverse(), b)), 1, 1e-9);
  near(area(clipConvex(a, b.slice().reverse())), 1, 1e-9);
  assert.deepStrictEqual(clipConvex(a, square(5, 5, 1)), []);
});

it("Venn ellipses: polygonIntersection is the area every polygon shares", () => {
  near(
    area(
      polygonIntersection([square(0, 0, 2), square(1, 0, 2), square(0, 1, 2)]),
    ),
    1,
    1e-9,
  );
  assert.deepStrictEqual(
    polygonIntersection([square(0, 0, 1), square(3, 0, 1)]),
    [],
  );
  assert.deepStrictEqual(polygonIntersection([]), []);
  near(area(polygonIntersection([square(0, 0, 2)])), 4, 1e-9);
});

it("Venn ellipses: edgeDistance and polygonMargin measure to the nearest edge", () => {
  const a = square(0, 0, 4);
  const b = square(3, 0, 4);
  assert.strictEqual(edgeDistance([1, 2], a), 1);
  assert.strictEqual(edgeDistance([6, 2], a), 2);
  assert.strictEqual(polygonMargin([1, 2], [a], [b]), 1);
  assert.ok(polygonMargin([3.5, 2], [a], [b]) < 0, "inside b");
  assert.ok(polygonMargin([9, 2], [a], []) < 0, "outside a");
  assert.strictEqual(polygonMargin([3.5, 2], [a, b], []), 0.5);
});

it("Venn ellipses: polygonLabelSpot finds a region's deepest point, or the shared area's when it's covered", () => {
  const a = square(0, 0, 4);
  const b = square(2, 0, 4);
  const onlyA = polygonLabelSpot([a], [b]);
  near(onlyA.margin, 1, 1e-3);
  near(onlyA.x, 1, 1e-2);
  const both = polygonLabelSpot([a, b], []);
  near(both.x, 3, 1e-2);
  near(both.margin, 1, 1e-3);
  const covered = polygonLabelSpot([a, b], [square(-1, -1, 9)]);
  assert.strictEqual(covered.margin, 0);
  near(covered.x, 3, 1e-2);
  assert.deepStrictEqual(polygonLabelSpot([a, square(9, 9, 1)], []), {
    x: 0,
    y: 0,
    margin: 0,
  });
});

it("Venn ellipses: polygonPath draws a closed path, or nothing", () => {
  assert.strictEqual(
    polygonPath([
      [0, 0],
      [1, 0],
      [1, 1],
    ]),
    "M0,0L1,0L1,1Z",
  );
  assert.strictEqual(polygonPath([]), "");
});

it("Venn ellipses: fitPolygons scales and centers inside the padding", () => {
  const out = fitPolygons(
    {a: square(0, 0, 2), b: square(2, 0, 2)},
    400,
    200,
    10,
  );
  const all = Object.values(out).flat();
  near(Math.min(...all.map(p => p[1])), 10, 1e-9);
  near(Math.max(...all.map(p => p[1])), 190, 1e-9);
  near(Math.min(...all.map(p => p[0])), 20, 1e-9);
  near(Math.max(...all.map(p => p[0])), 380, 1e-9);
  assert.deepStrictEqual(fitPolygons({}, 10, 10), {});
});

it("Venn ellipses: classicEllipses covers four and five sets only", () => {
  const four = classicEllipses(["A", "B", "C", "D"]);
  assert.deepStrictEqual(Object.keys(four), ["A", "B", "C", "D"]);
  assert.deepStrictEqual(four.A, FOUR_ELLIPSES[0]);
  assert.notStrictEqual(four.A, FOUR_ELLIPSES[0], "copies");
  assert.deepStrictEqual(
    Object.keys(classicEllipses(["A", "B", "C", "D", "E"])).length,
    5,
  );
  assert.strictEqual(classicEllipses(["A", "B", "C"]), undefined);
  assert.strictEqual(
    classicEllipses(["A", "B", "C", "D", "E", "F"]),
    undefined,
  );
  // Grünbaum's ellipses are congruent and a fifth of a turn apart.
  for (const e of FIVE_ELLIPSES) {
    assert.strictEqual(e.rx, FIVE_ELLIPSES[0].rx);
    assert.strictEqual(e.ry, FIVE_ELLIPSES[0].ry);
  }
  near(
    FIVE_ELLIPSES[1].rotation - FIVE_ELLIPSES[0].rotation,
    (2 * Math.PI) / 5,
    1e-12,
  );
});

for (const names of [
  ["A", "B", "C", "D"],
  ["A", "B", "C", "D", "E"],
]) {
  const count = 2 ** names.length - 1;
  it(`Venn ellipses: every one of the ${count} combinations of ${names.length} sets has its own labelled region`, () => {
    const rows = combinations(names);
    const viz = mockViz(rows);
    const {regions, polygons, circles} = vennRegions(viz, rows, {
      width: 600,
      height: 600,
    });
    assert.deepStrictEqual(circles, {});
    assert.deepStrictEqual(Object.keys(polygons), names);
    assert.strictEqual(regions.length, count);
    for (const r of regions) {
      const label = r.sets.join("+");
      assert.ok(/^M.+Z$/.test(r.d), `${label} has an outline`);
      assert.ok(!r.covered, `${label} is not covered`);
      assert.ok(
        r.label.margin >= MIN_LABEL_ROOM,
        `${label} has room for a label (${r.label.margin})`,
      );
      // The label spot lies in exactly this combination of ellipses.
      const within = names.filter(s =>
        polygonContains(polygons[s], [r.label.x, r.label.y]),
      );
      assert.deepStrictEqual(within, r.sets, label);
      assert.ok(regionLines(viz, r).length > 0, `${label} has label text`);
    }
    assert.deepStrictEqual(
      regions.map(r => r.sets.length),
      regions.map(r => r.sets.length).sort((a, b) => a - b),
      "single sets first",
    );
  });
}

it("Venn ellipses: ellipseRegions skips rows naming unknown sets and counts exclusively", () => {
  const rows = [
    {sets: ["A"], size: 10},
    {sets: ["A", "B"], size: 4},
    {sets: ["A", "Z"], size: 1},
  ];
  const areas = rows.map((row, i) => ({
    sets: row.sets,
    size: row.size,
    row,
    i,
  }));
  const {regions} = ellipseRegions(areas, ["A", "B", "C", "D"], {
    width: 400,
    height: 400,
  });
  assert.deepStrictEqual(
    regions.map(r => [r.sets.join(), r.exclusive]),
    [
      ["A", 6],
      ["A,B", 4],
    ],
  );
});

it("Venn ellipses: pointBounds, fitBounds, and fitPoint place points in a padded box", () => {
  const b = pointBounds([
    [1, 2],
    [5, 4],
  ]);
  assert.deepStrictEqual(b, {x0: 1, x1: 5, y0: 2, y1: 4});
  const fit = fitBounds(b, 100, 100, 10);
  assert.strictEqual(fit.scale, 20);
  assert.deepStrictEqual(fitPoint([1, 2], fit), [10, 30]);
  assert.deepStrictEqual(fitPoint([5, 4], fit), [90, 70]);
  assert.strictEqual(fitBounds({x0: 0, x1: 0, y0: 0, y1: 1}, 10, 10).scale, 0);
});

it("Venn ellipses: the frame for a set count is made once and each region worked out once", () => {
  assert.strictEqual(ellipseFrame(3), undefined);
  assert.strictEqual(ellipseFrame(6), undefined);
  const frame = ellipseFrame(5);
  assert.strictEqual(ellipseFrame(5), frame, "the same frame");
  assert.strictEqual(frame.polygons.length, 5);
  const shape = frameRegion(frame, 0b00101);
  assert.ok(shape.outline.length && shape.label.margin > 0);
  assert.strictEqual(frameRegion(frame, 0b00101), shape, "the same region");
  // Two layouts at different sizes read the same kept regions.
  const rows = combinations(["A", "B", "C", "D", "E"]);
  const areas = rows.map((row, i) => ({
    sets: row.sets,
    size: row.size,
    row,
    i,
  }));
  ellipseRegions(areas, ["A", "B", "C", "D", "E"], {width: 300, height: 300});
  const kept = new Map(frame.regions);
  assert.strictEqual(kept.size, 31);
  ellipseRegions(areas, ["A", "B", "C", "D", "E"], {width: 900, height: 500});
  for (const [mask, region] of frame.regions)
    assert.strictEqual(region, kept.get(mask), `region ${mask} reused`);
});

it("Venn ellipses: scaled regions keep their labels inside, with room that scales", () => {
  const names = ["A", "B", "C", "D"];
  const rows = combinations(names);
  const areas = rows.map((row, i) => ({
    sets: row.sets,
    size: row.size,
    row,
    i,
  }));
  const small = ellipseRegions(areas, names, {width: 300, height: 300});
  for (const size of [
    {width: 300, height: 300},
    {width: 900, height: 450},
    {width: 420, height: 800},
  ]) {
    const {regions, polygons} = ellipseRegions(areas, names, size);
    regions.forEach((r, k) => {
      const within = names.filter(s =>
        polygonContains(polygons[s], [r.label.x, r.label.y]),
      );
      assert.deepStrictEqual(within, r.sets, `${r.sets} at ${size.width}`);
      assert.ok(
        r.label.x - r.label.margin >= 0 &&
          r.label.x + r.label.margin <= size.width,
      );
      const ratio = r.label.margin / small.regions[k].label.margin;
      near(
        ratio,
        regions[0].label.margin / small.regions[0].label.margin,
        1e-9,
      );
    });
  }
  const frame = ellipseFrame(4);
  const fitted = fitRegion(frameRegion(frame, 0b1111), {
    scale: 2,
    dx: 5,
    dy: 7,
  });
  const raw = frameRegion(frame, 0b1111);
  near(fitted.label.margin, raw.label.margin * 2, 1e-12);
  near(fitted.label.x, raw.label.x * 2 + 5, 1e-12);
  near(fitted.outline[0][1], raw.outline[0][1] * 2 + 7, 1e-12);
});
