import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot, StackedArea, Streamgraph} from "../../index.ts";
import {
  bandColor,
  bandSections,
  bandTextColor,
  boxLabelsOnly,
  densify,
  labelSizes,
  labelsAlongBand,
  placeBandLabel,
  thickRuns,
} from "../../src/charts/Plot/areaLabelsAlong.ts";
import {
  labelFont,
  PointGrid,
  scoreStretch,
} from "../../src/charts/Plot/lineLabelsAlong.ts";
import {pathLabelNodes} from "../../src/charts/features/pathLabels.ts";

useJsdom();

const close = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

/** A band between two edges, as a closed outline: along the top, back along the bottom. */
const band = (top, bottom) => [...top, ...bottom.slice().reverse(), top[0]];

/** A level band `thickness` pixels thick, centered on `y`, from x0 to x1. */
const level = (x0, x1, y, thickness) =>
  band(
    [
      [x0, y - thickness / 2],
      [x1, y - thickness / 2],
    ],
    [
      [x0, y + thickness / 2],
      [x1, y + thickness / 2],
    ],
  );

const rect = {x0: 0, y0: 0, x1: 400, y1: 300};

it("labelsAlongBand — along and auto run along, inside and outside keep the box", () => {
  assert.strictEqual(labelsAlongBand("along"), true);
  assert.strictEqual(labelsAlongBand("auto"), true);
  assert.strictEqual(labelsAlongBand(undefined), true);
  assert.strictEqual(labelsAlongBand("inside"), false);
  assert.strictEqual(labelsAlongBand("outside"), false);
});

it("bandSections — the midpoint and thickness at every step along the band", () => {
  const sections = bandSections(
    band(
      [
        [0, 10],
        [30, 0],
      ],
      [
        [0, 30],
        [30, 40],
      ],
    ),
    0,
    10,
  );
  assert.deepStrictEqual(
    sections.map(s => s.point[0]),
    [0, 10, 20, 30],
  );
  close(sections[0].point[1], 20);
  close(sections[0].thickness, 20);
  close(sections[3].point[1], 20);
  close(sections[3].thickness, 40);
  close(sections[1].thickness, 20 + 20 / 3);
});

it("bandSections — a band along y takes its sections across x", () => {
  const sections = bandSections(
    band(
      [
        [10, 0],
        [10, 20],
      ],
      [
        [30, 0],
        [30, 20],
      ],
    ),
    1,
    10,
  );
  assert.deepStrictEqual(
    sections.map(s => s.point),
    [
      [20, 0],
      [20, 10],
      [20, 20],
    ],
  );
  assert.ok(sections.every(s => s.thickness === 20));
  assert.deepStrictEqual(bandSections([[0, 0]]), [], "no band");
});

it("thickRuns — the stretches of centerline at least so thick", () => {
  const at = (x, thickness) => ({point: [x, 0], thickness});
  const runs = thickRuns(
    [at(0, 20), at(1, 20), at(2, 5), at(3, 20), at(4, 5), at(5, 30), at(6, 30)],
    10,
  );
  assert.deepStrictEqual(
    runs.map(r => r.map(p => p[0])),
    [
      [0, 1],
      [5, 6],
    ],
    "a lone point is no run",
  );
});

it("densify — no gap along the polyline longer than the step", () => {
  assert.deepStrictEqual(
    densify(
      [
        [0, 0],
        [10, 0],
        [10, 1],
      ],
      4,
    ),
    [
      [0, 0],
      [10 / 3, 0],
      [20 / 3, 0],
      [10, 0],
      [10, 1],
    ],
  );
});

it("labelSizes — from the font size or max down to the min, no lower than 8px", () => {
  assert.deepStrictEqual(labelSizes({fontMin: 12}), [16, 15, 14, 13, 12]);
  assert.deepStrictEqual(labelSizes({fontSize: 10, fontMin: 9}), [10, 9]);
  assert.deepStrictEqual(labelSizes({fontMax: 9}), [9, 8]);
  assert.deepStrictEqual(
    labelSizes({fontMax: 10, fontMin: 6}),
    [10, 9, 8],
    "Plot's box-label fontMin of 6 stops at 8",
  );
  assert.deepStrictEqual(labelSizes({fontSize: 7}), [7], "min caps at size");
  assert.deepStrictEqual(labelSizes({fontMax: 9.5, fontMin: 8}), [9.5, 8.5, 8]);
});

it("bandTextColor — a user's fontColor wins over the contrast", () => {
  const row = {id: "a"};
  assert.strictEqual(bandTextColor(undefined, row, 0, "#000000"), "#f8f9fa");
  assert.strictEqual(bandTextColor(undefined, row, 0, "#ffffff"), "#495057");
  assert.strictEqual(bandTextColor("tomato", row, 0, "#000000"), "tomato");
  assert.strictEqual(
    bandTextColor((d, i) => `${d.id}${i}`, row, 3, "#000000"),
    "a3",
  );
  assert.strictEqual(
    bandTextColor(() => undefined, row, 0, "#000000"),
    "#f8f9fa",
    "an accessor with no color falls back",
  );
  assert.strictEqual(
    bandTextColor(undefined, row, 0, "#000000", {light: "#eee"}),
    "#eee",
  );
});

it("scoreStretch — minClearance and the room it rewards are settable", () => {
  const grid = new PointGrid(30);
  grid.add(densify(level(0, 400, 100, 30), 2));
  const line = [
    [100, 100],
    [160, 100],
  ];
  const base = {grid, rect, fontSize: 10, lift: -3};
  assert.notStrictEqual(scoreStretch(line, base), null);
  assert.strictEqual(
    scoreStretch(line, {...base, minClearance: 12}),
    null,
    "too close to the band's edges",
  );
  const near = scoreStretch(line, {...base, roomReach: 10, roomWeight: 1});
  const far = scoreStretch(line, {...base, roomReach: 30, roomWeight: 1});
  assert.ok(near < far, "a longer reach finds less of it filled");
});

it("placeBandLabel — the largest size that fits, on the band's thick part", () => {
  // Thin for its first half, 30px thick for its second.
  const outline = band(
    [
      [0, 95],
      [200, 95],
      [200, 85],
      [400, 85],
    ],
    [
      [0, 105],
      [200, 105],
      [200, 115],
      [400, 115],
    ],
  );
  const width = size => size * 4;
  const placed = placeBandLabel([outline], width, labelSizes(), rect);
  assert.ok(placed, "finds a place");
  assert.strictEqual(placed.fontSize, 16);
  assert.ok(
    placed.points.every(p => p[0] > 200),
    "on the thick half",
  );
  // Its glyphs, 0.8em above to 0.2em below the baseline, center on the band.
  assert.ok(placed.points.every(p => Math.abs(p[1] - 104.8) < 1e-6));
  assert.ok(placed.points[0][0] < placed.points[placed.points.length - 1][0]);
});

it("placeBandLabel — shrinks to fit a thin band, and gives up on one thinner", () => {
  const width = size => size * 4;
  const thin = placeBandLabel(
    [level(0, 400, 100, 14)],
    width,
    labelSizes(),
    rect,
  );
  assert.ok(thin && thin.fontSize < 16, `${thin?.fontSize}`);
  assert.ok(thin.fontSize + 4 <= 14);
  assert.strictEqual(
    placeBandLabel([level(0, 400, 100, 6)], width, labelSizes(), rect),
    null,
  );
  assert.strictEqual(
    placeBandLabel([level(0, 40, 100, 40)], width, labelSizes(), rect),
    null,
    "too short",
  );
  assert.strictEqual(
    placeBandLabel([level(0, 400, 320, 40)], width, labelSizes(), rect),
    null,
    "past the plot",
  );
  assert.strictEqual(placeBandLabel([], width, labelSizes(), rect), null);
});

it("placeBandLabel — reads upright along a band drawn right to left", () => {
  const outline = level(0, 400, 100, 40).map(([x, y]) => [400 - x, y]);
  const placed = placeBandLabel([outline], s => s * 4, [12], rect);
  assert.ok(placed.points[0][0] < placed.points[placed.points.length - 1][0]);
});

it("bandColor — a fill laid over the background at its opacity", () => {
  assert.strictEqual(bandColor("#ff0000", 1, "#ffffff"), "#ff0000");
  assert.strictEqual(bandColor("#000000", 0.5, "#ffffff"), "#808080");
  assert.strictEqual(bandColor("nope", 0.5, "#ffffff"), "nope");
});

it("boxLabelsOnly — bands labeled along their centerline draw no box label", () => {
  const viz = new StackedArea();
  // The Area's own accessor unwraps its row itself.
  const label = (d, i) => `${(d.data ?? d).genre}-${i}`;
  const row = {genre: "Rock"};
  const wrapped = {__d3plus__: true, data: row, i: 3};
  assert.strictEqual(boxLabelsOnly(viz, label)(wrapped, 0), false);
  viz.labelPosition("inside");
  assert.strictEqual(boxLabelsOnly(viz, label)(wrapped, 0), "Rock-0");
  viz.labelPosition(d => (d.genre === "Rock" ? "along" : "inside"));
  assert.strictEqual(boxLabelsOnly(viz, label)(wrapped, 0), false);
  assert.strictEqual(boxLabelsOnly(viz, label)({genre: "Pop"}, 1), "Pop-1");
  assert.strictEqual(boxLabelsOnly(viz, "Fixed")({genre: "Pop"}, 1), "Fixed");
});

it("labelFont — a shape's label font, without accessors", () => {
  const viz = new LinePlot().shapeConfig({
    Area: {labelConfig: {fontSize: 14, fontWeight: () => 700}},
    Line: {labelConfig: {fontFamily: "Inter"}},
  });
  assert.deepStrictEqual(labelFont(viz, "Area"), {fontSize: 14});
  assert.deepStrictEqual(labelFont(viz), {fontFamily: "Inter"});
});

it("pathLabelNodes — a label keeps its mark's datum, and can go without a halo", () => {
  const viz = new Streamgraph();
  const datum = {id: "a"};
  const label = {
    key: "k",
    text: "Label",
    d: "M0,0L100,0",
    color: "#ffffff",
    anchor: "middle",
    datum,
    index: 4,
  };
  const [plain] = pathLabelNodes(viz, [label], {}, {halo: false});
  assert.strictEqual(plain.datum, datum);
  assert.strictEqual(plain.index, 4);
  assert.strictEqual(plain.interactive, false);
  assert.ok(!plain.halo);
  const [haloed] = pathLabelNodes(viz, [{...label, datum: undefined}]);
  assert.strictEqual(haloed.datum, undefined);
  assert.strictEqual(haloed.halo, true);
});
