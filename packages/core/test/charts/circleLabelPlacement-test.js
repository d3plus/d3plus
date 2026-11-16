import {describe, it} from "vitest";
import assert from "assert";

import {
  boxCoverage,
  boxesOverlap,
  boxHitsCircle,
  coveredInside,
  insideBox,
  placeCircleLabels,
  ringCentroid,
  sideBox,
  sideOrder,
} from "../../internal.ts";

/**
    The pure geometry of circle label placement: candidate boxes, side order
    from the Voronoi cell, coverage and overlap tests, and the greedy
    placement itself.
*/

const bounds = {x: 0, y: 0, width: 400, height: 300};
const label = (circle, extra = {}) => ({
  circle,
  width: 40,
  height: 14,
  position: "auto",
  fitsInside: false,
  ...extra,
});

/** Whether a box lies inside the bounds. */
const inside = (b, o = bounds) =>
  b.x >= o.x - 1e-6 &&
  b.y >= o.y - 1e-6 &&
  b.x + b.width <= o.x + o.width + 1e-6 &&
  b.y + b.height <= o.y + o.height + 1e-6;

/** Asserts no placed box overlaps another box or any circle. */
function assertClear(circles, placements) {
  const boxes = placements
    .filter(p => p.position === "outside")
    .map(p => p.box);
  boxes.forEach((a, i) => {
    assert.ok(inside(a), `box ${i} in bounds`);
    for (const c of circles)
      assert.ok(!boxHitsCircle(a, c), `box ${i} clear of circle`);
    boxes.slice(i + 1).forEach(b => assert.ok(!boxesOverlap(a, b)));
  });
}

describe("charts/circleLabelPlacement sideBox", () => {
  const c = {x: 100, y: 100, r: 10};
  it("puts straight sides on the circle's axis, gap pixels clear", () => {
    assert.deepStrictEqual(sideBox(c, "right", 40, 14, 3), {
      x: 113,
      y: 93,
      width: 40,
      height: 14,
    });
    assert.deepStrictEqual(sideBox(c, "left", 40, 14, 3), {
      x: 47,
      y: 93,
      width: 40,
      height: 14,
    });
    assert.deepStrictEqual(sideBox(c, "top", 40, 14, 3), {
      x: 80,
      y: 73,
      width: 40,
      height: 14,
    });
    assert.deepStrictEqual(sideBox(c, "bottom", 40, 14, 3), {
      x: 80,
      y: 113,
      width: 40,
      height: 14,
    });
  });
  it("puts a diagonal box's nearest corner on the circle's diagonal", () => {
    const b = sideBox(c, "top-left", 40, 14, 3);
    const o = 13 * Math.SQRT1_2;
    assert.ok(Math.abs(b.x + b.width - (100 - o)) < 1e-9);
    assert.ok(Math.abs(b.y + b.height - (100 - o)) < 1e-9);
    assert.ok(!boxHitsCircle(b, c));
  });
});

describe("charts/circleLabelPlacement ringCentroid", () => {
  it("finds a square's center", () => {
    const [x, y] = ringCentroid([
      [0, 0],
      [10, 0],
      [10, 20],
      [0, 20],
    ]);
    assert.ok(Math.abs(x - 5) < 1e-9 && Math.abs(y - 10) < 1e-9);
  });
  it("returns null for a ring without area", () => {
    assert.strictEqual(
      ringCentroid([
        [0, 0],
        [5, 5],
        [10, 10],
      ]),
      null,
    );
  });
});

describe("charts/circleLabelPlacement sideOrder", () => {
  const c = {x: 50, y: 50, r: 5};
  it("keeps the default order when the cell centers on the circle", () => {
    const cell = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    assert.deepStrictEqual(sideOrder(c, cell).slice(0, 4), [
      "right",
      "left",
      "top",
      "bottom",
    ]);
    assert.strictEqual(sideOrder(c, null)[0], "right");
  });
  it("leads with the side facing the cell's centroid", () => {
    const leftCell = [
      [-200, 0],
      [60, 0],
      [60, 100],
      [-200, 100],
    ];
    assert.strictEqual(sideOrder(c, leftCell)[0], "left");
    const below = [
      [0, 40],
      [100, 40],
      [100, 400],
      [0, 400],
    ];
    assert.strictEqual(sideOrder(c, below)[0], "bottom");
  });
  it("prefers a straight side unless a diagonal is clearly closer", () => {
    // Centroid 30° above the horizontal: right wins over top-right.
    const ring30 = [
      [
        50 + 100 * Math.cos(Math.PI / 6) - 10,
        50 - 100 * Math.sin(Math.PI / 6) - 10,
      ],
      [
        50 + 100 * Math.cos(Math.PI / 6) + 10,
        50 - 100 * Math.sin(Math.PI / 6) - 10,
      ],
      [
        50 + 100 * Math.cos(Math.PI / 6) + 10,
        50 - 100 * Math.sin(Math.PI / 6) + 10,
      ],
      [
        50 + 100 * Math.cos(Math.PI / 6) - 10,
        50 - 100 * Math.sin(Math.PI / 6) + 10,
      ],
    ];
    assert.strictEqual(sideOrder(c, ring30)[0], "right");
    const ring45 = [
      [140, -40],
      [160, -40],
      [160, -20],
      [140, -20],
    ];
    assert.strictEqual(sideOrder(c, ring45)[0], "top-right");
  });
});

describe("charts/circleLabelPlacement boxCoverage", () => {
  const ring = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  it("is 1 inside, 0 outside, and the overlap share across an edge", () => {
    assert.strictEqual(
      boxCoverage({x: 10, y: 10, width: 20, height: 20}, ring),
      1,
    );
    assert.strictEqual(
      boxCoverage({x: 200, y: 10, width: 20, height: 20}, ring),
      0,
    );
    const half = boxCoverage({x: 90, y: 10, width: 20, height: 20}, ring);
    assert.ok(Math.abs(half - 0.5) < 1e-9);
  });
  it("clips against a triangle", () => {
    const tri = [
      [0, 0],
      [100, 0],
      [0, 100],
    ];
    const share = boxCoverage({x: 0, y: 0, width: 100, height: 100}, tri);
    assert.ok(Math.abs(share - 0.5) < 1e-9);
  });
  it("is 0 for an empty box or ring", () => {
    assert.strictEqual(boxCoverage({x: 0, y: 0, width: 0, height: 5}, ring), 0);
    assert.strictEqual(boxCoverage({x: 0, y: 0, width: 5, height: 5}, []), 0);
  });
});

describe("charts/circleLabelPlacement overlap tests", () => {
  it("boxHitsCircle tells a box crossing a circle from one beside it", () => {
    const c = {x: 0, y: 0, r: 10};
    assert.ok(boxHitsCircle({x: 5, y: -2, width: 10, height: 4}, c));
    assert.ok(!boxHitsCircle({x: 10, y: -2, width: 10, height: 4}, c));
    // The box's corner sits just outside the circle's diagonal.
    assert.ok(!boxHitsCircle({x: 7.2, y: 7.2, width: 5, height: 5}, c));
    assert.ok(boxHitsCircle({x: 7, y: 7, width: 5, height: 5}, c));
  });
  it("boxesOverlap ignores touching edges", () => {
    const a = {x: 0, y: 0, width: 10, height: 10};
    assert.ok(boxesOverlap(a, {x: 5, y: 5, width: 10, height: 10}));
    assert.ok(!boxesOverlap(a, {x: 10, y: 0, width: 10, height: 10}));
    assert.ok(!boxesOverlap(a, {x: 0, y: 20, width: 10, height: 10}));
  });
});

describe("charts/circleLabelPlacement placeCircleLabels", () => {
  it("puts an isolated point's label on the preferred (right) side", () => {
    const circles = [{x: 200, y: 150, r: 5}];
    const [p] = placeCircleLabels(circles, [label(0)], bounds);
    assert.strictEqual(p.position, "outside");
    assert.strictEqual(p.side, "right");
    assert.deepStrictEqual(p.box, {x: 208, y: 143, width: 40, height: 14});
  });

  it("turns away from the bounds' edge", () => {
    const circles = [{x: 390, y: 150, r: 5}];
    const [p] = placeCircleLabels(circles, [label(0)], bounds);
    assert.strictEqual(p.side, "left");
  });

  it("pushes a crowded point's label to its open side", () => {
    // Neighbors to the right, above, and below; open room to the left.
    const circles = [
      {x: 200, y: 150, r: 5},
      {x: 225, y: 150, r: 5},
      {x: 200, y: 128, r: 5},
      {x: 200, y: 172, r: 5},
      {x: 225, y: 128, r: 5},
      {x: 225, y: 172, r: 5},
    ];
    const [p] = placeCircleLabels(circles, [label(0)], bounds);
    assert.strictEqual(p.position, "outside");
    assert.strictEqual(p.side, "left");
  });

  it("never overlaps labels with each other or any circle, and stays in bounds", () => {
    const circles = [];
    for (let i = 0; i < 60; i++)
      circles.push({
        x: 20 + ((i * 53) % 360),
        y: 20 + ((i * 37) % 260),
        r: 3 + (i % 7),
      });
    const placements = placeCircleLabels(
      circles,
      circles.map((_, i) => label(i, {width: 30 + (i % 5) * 8})),
      bounds,
    );
    assert.ok(placements.some(p => p.position === "outside"));
    assertClear(circles, placements);
  });

  it("hides labels in a hopelessly dense cluster", () => {
    const circles = [];
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++)
        circles.push({x: 150 + i * 8, y: 100 + j * 8, r: 3.5});
    const placements = placeCircleLabels(
      circles,
      circles.map((_, i) => label(i)),
      bounds,
    );
    const shown = placements.filter(p => p.position === "outside").length;
    assert.ok(shown > 0, "the cluster's edge keeps some labels");
    assert.ok(shown < circles.length / 4, `only a few labels show (${shown})`);
    assertClear(circles, placements);
  });

  it("keeps a big circle's fitting label inside", () => {
    const circles = [
      {x: 100, y: 100, r: 60},
      {x: 300, y: 100, r: 4},
    ];
    const placements = placeCircleLabels(
      circles,
      [label(0, {fitsInside: true}), label(1, {fitsInside: true})],
      bounds,
    );
    assert.deepStrictEqual(
      placements.map(p => p.position),
      ["inside", "inside"],
    );
  });

  it("places larger circles first, so they win the room", () => {
    // Two points facing each other: only one label fits between them.
    const circles = [
      {x: 20, y: 150, r: 4},
      {x: 80, y: 150, r: 12},
    ];
    const narrow = {x: 0, y: 140, width: 120, height: 20};
    const placements = placeCircleLabels(
      circles,
      [label(0, {width: 30, height: 10}), label(1, {width: 30, height: 10})],
      narrow,
      {cellCoverage: 0},
    );
    assert.strictEqual(placements[1].position, "outside");
    assert.strictEqual(placements[0].position, "hidden");
  });

  it("'inside' keeps a label inside even when it doesn't fit", () => {
    const [p] = placeCircleLabels(
      [{x: 200, y: 150, r: 3}],
      [label(0, {position: "inside"})],
      bounds,
    );
    assert.deepStrictEqual(p, {position: "inside"});
  });

  it("'outside' moves a label out even when it fits inside", () => {
    const [p] = placeCircleLabels(
      [{x: 200, y: 150, r: 50}],
      [label(0, {position: "outside", fitsInside: true})],
      bounds,
    );
    assert.strictEqual(p.position, "outside");
    assert.strictEqual(p.side, "right");
  });

  it("'outside' hides a label with no room", () => {
    const [p] = placeCircleLabels(
      [{x: 20, y: 20, r: 18}],
      [label(0, {position: "outside"})],
      {x: 0, y: 0, width: 40, height: 40},
    );
    assert.strictEqual(p.position, "hidden");
  });

  it("requires a label to lie mostly in its own Voronoi cell", () => {
    // A neighbor 30px to the right: a 40px label to the right would sit
    // mostly in its cell, so the label goes left.
    const circles = [
      {x: 200, y: 150, r: 3},
      {x: 230, y: 180, r: 3},
    ];
    const [p] = placeCircleLabels(circles, [label(0, {width: 60})], bounds);
    assert.strictEqual(p.position, "outside");
    assert.notStrictEqual(p.side, "right");
    assert.notStrictEqual(p.side, "bottom-right");
  });

  it("skips circles with a non-finite position, and hides their labels", () => {
    const placements = placeCircleLabels(
      [
        {x: NaN, y: 10, r: 4},
        {x: 100, y: 100, r: 4},
      ],
      [label(0), label(1)],
      bounds,
    );
    assert.strictEqual(placements[0].position, "hidden");
    assert.strictEqual(placements[1].position, "outside");
  });

  it("hides the label of a circle centered outside the bounds", () => {
    // Just left of the bounds: a label to its right would fit inside them.
    const [p] = placeCircleLabels([{x: -4, y: 150, r: 3}], [label(0)], bounds);
    assert.strictEqual(p.position, "hidden");
  });

  it("returns the same placements for the same input", () => {
    const circles = Array.from({length: 40}, (_, i) => ({
      x: 30 + ((i * 71) % 340),
      y: 30 + ((i * 29) % 240),
      r: 2 + (i % 9),
    }));
    const labels = circles.map((_, i) => label(i));
    const a = placeCircleLabels(circles, labels, bounds);
    const b = placeCircleLabels(circles, labels, bounds);
    assert.deepStrictEqual(a, b);
  });

  it("keeps labels off obstacles, and hides one with no clear side", () => {
    const circles = [{x: 200, y: 150, r: 5}];
    // A bar through the point's right side sends its label left.
    const right = {x: 205, y: 140, width: 60, height: 20};
    const [p] = placeCircleLabels(circles, [label(0)], bounds, {
      obstacles: [right],
    });
    assert.strictEqual(p.side, "left");
    assert.ok(!boxesOverlap(p.box, right));
    // A box around the whole point leaves no side.
    const all = {x: 100, y: 50, width: 200, height: 200};
    const [hidden] = placeCircleLabels(circles, [label(0)], bounds, {
      obstacles: [all],
    });
    assert.strictEqual(hidden.position, "hidden");
  });
});

describe("charts/circleLabelPlacement insideBox", () => {
  it("is the square inscribed in the circle", () => {
    const box = insideBox({x: 10, y: 20, r: Math.SQRT2 * 5});
    for (const [k, v] of Object.entries({x: 5, y: 15, width: 10, height: 10}))
      assert.ok(Math.abs(box[k] - v) < 1e-9, `${k} ${box[k]}`);
  });
});

describe("charts/circleLabelPlacement insideBox inset", () => {
  it("leaves out the label's padding", () => {
    const pad = {top: 1, right: 2, bottom: 3, left: 4};
    const box = insideBox({x: 10, y: 20, r: Math.SQRT2 * 10}, pad);
    for (const [k, v] of Object.entries({x: 4, y: 11, width: 14, height: 16}))
      assert.ok(Math.abs(box[k] - v) < 1e-9, `${k} ${box[k]}`);
  });
});

describe("charts/circleLabelPlacement coveredInside", () => {
  it("ignores a later circle that only reaches the label's padding", () => {
    // It cuts the inscribed square's corner, but not the square less 5px.
    const circles = [
      {x: 100, y: 100, r: 40},
      {x: 100 + 52, y: 100 + 52, r: 40},
    ];
    const pad = {top: 5, right: 5, bottom: 5, left: 5};
    assert.deepStrictEqual([...coveredInside(circles, [0])], [0]);
    assert.deepStrictEqual(
      [...coveredInside(circles, [0], undefined, [pad])],
      [],
    );
  });

  const big = {x: 100, y: 100, r: 40};
  it("finds a circle painted later over the inside label's box", () => {
    const circles = [big, {x: 95, y: 100, r: 10}];
    assert.deepStrictEqual([...coveredInside(circles, [0, 1])], [0]);
  });

  it("ignores circles painted earlier", () => {
    const circles = [{x: 95, y: 100, r: 10}, big];
    assert.deepStrictEqual([...coveredInside(circles, [0, 1])], [0]);
    assert.deepStrictEqual([...coveredInside(circles, [1])], []);
  });

  it("follows the given paint order", () => {
    const circles = [big, {x: 95, y: 100, r: 10}];
    assert.deepStrictEqual([...coveredInside(circles, [0, 1], [1, 0])], [1]);
  });

  it("ignores a later circle that only touches the rim, outside the box", () => {
    // It reaches 4px into the circle's right edge, short of the inscribed square.
    const circles = [big, {x: 146, y: 100, r: 10}];
    assert.deepStrictEqual([...coveredInside(circles, [0])], []);
  });

  it("skips circles with no size or position", () => {
    const circles = [
      {x: 100, y: 100, r: 0},
      {x: NaN, y: 100, r: 10},
      {x: 100, y: 100, r: 10},
    ];
    assert.deepStrictEqual([...coveredInside(circles, [0, 1])], []);
  });

  it("checks thousands of circles quickly", () => {
    const circles = Array.from({length: 5000}, (_, i) => ({
      x: (i * 37) % 1000,
      y: (i * 53) % 700,
      r: 4 + (i % 9),
    }));
    const which = circles.map((_, i) => i);
    const start = performance.now();
    const covered = coveredInside(circles, which);
    assert.ok(covered.size > 0 && covered.size < circles.length);
    assert.ok(performance.now() - start < 1000, "well under a second");
  });
});

describe("charts/circleLabelPlacement placeCircleLabels (covered)", () => {
  const covered = (extra = {}) =>
    label(0, {fitsInside: true, covered: true, ...extra});

  it("moves a covered auto label that fits inside beside its circle", () => {
    const circles = [{x: 200, y: 150, r: 20}];
    const [p] = placeCircleLabels(circles, [covered()], bounds);
    assert.strictEqual(p.position, "outside");
  });

  it("keeps a covered auto label inside when no side has room", () => {
    const circles = [{x: 200, y: 150, r: 20}];
    const tight = {x: 175, y: 125, width: 50, height: 50};
    const [p] = placeCircleLabels(circles, [covered()], tight);
    assert.strictEqual(p.position, "inside");
  });

  it("keeps a covered auto label inside when its circle is out of bounds", () => {
    const circles = [{x: 500, y: 150, r: 20}];
    const [p] = placeCircleLabels(circles, [covered()], bounds);
    assert.strictEqual(p.position, "inside");
  });

  it("leaves inside-mode labels inside, and uncovered ones too", () => {
    const circles = [{x: 200, y: 150, r: 20}];
    const [a, b] = placeCircleLabels(
      circles,
      [covered({position: "inside"}), label(0, {fitsInside: true})],
      bounds,
    );
    assert.strictEqual(a.position, "inside");
    assert.strictEqual(b.position, "inside");
  });

  it("still hides a covered label that doesn't fit inside and has no room", () => {
    const circles = [{x: 200, y: 150, r: 20}];
    const tight = {x: 175, y: 125, width: 50, height: 50};
    const [p] = placeCircleLabels(
      circles,
      [covered({fitsInside: false})],
      tight,
    );
    assert.strictEqual(p.position, "hidden");
  });
});

describe("charts/circleLabelPlacement placeCircleLabels slide", () => {
  // Boxes that leave one open window above and right of a circle at
  // (200, 150): only its label slid all the way right along the top fits,
  // half a pixel from the boxes (so these tests keep no `slideSpacing`).
  const circle = {x: 200, y: 150, r: 5};
  const walls = (left = 199.5) => [
    {x: 0, y: 0, width: left, height: 300},
    {x: 0, y: 142.5, width: 400, height: 158},
    {x: 0, y: 0, width: 400, height: 119},
    {x: 262, y: 0, width: 138, height: 300},
  ];

  it("hides a label with no open side unless it may slide", () => {
    const [plain] = placeCircleLabels([circle], [label(0)], bounds, {
      obstacles: walls(),
    });
    assert.deepStrictEqual(plain, {position: "hidden"});
    const [slid] = placeCircleLabels([circle], [label(0)], bounds, {
      obstacles: walls(),
      slide: true,
      slideSpacing: 0,
    });
    assert.deepStrictEqual(slid, {
      position: "outside",
      side: "top",
      slide: 1,
      box: {x: 200, y: 128, width: 40, height: 14},
    });
  });

  it("keeps a slid label `slideClearance` from other circles", () => {
    // A circle 1px from the open window: in the way at the default
    // clearance (the 3px gap), not with no clearance.
    const near = {x: 246, y: 135, r: 5};
    const opts = {obstacles: walls(), slide: true, slideSpacing: 0};
    const [kept] = placeCircleLabels([circle, near], [label(0)], bounds, opts);
    assert.strictEqual(kept.position, "hidden");
    const [close] = placeCircleLabels([circle, near], [label(0)], bounds, {
      ...opts,
      slideClearance: 0,
    });
    assert.strictEqual(close.position, "outside");
    assert.strictEqual(close.slide, 1);
  });

  it("keeps a slid label `slideSpacing` from other boxes", () => {
    // The window's walls sit half a pixel from the slid label: too near at
    // the default spacing (the 3px gap), not at a quarter pixel.
    const opts = {obstacles: walls(), slide: true};
    const [spaced] = placeCircleLabels([circle], [label(0)], bounds, opts);
    assert.strictEqual(spaced.position, "hidden");
    const [close] = placeCircleLabels([circle], [label(0)], bounds, {
      ...opts,
      slideSpacing: 0.25,
    });
    assert.strictEqual(close.slide, 1);
  });

  it("takes the open slot crossing the fewest segments", () => {
    // Two slots open (slid half and all the way right); a link crosses the first.
    const opts = {obstacles: walls(189.5), slide: true, slideSpacing: 0};
    const [first] = placeCircleLabels([circle], [label(0)], bounds, opts);
    assert.strictEqual(first.slide, 0.5);
    const [clear] = placeCircleLabels([circle], [label(0)], bounds, {
      ...opts,
      segments: [{x1: 195, y1: 0, x2: 195, y2: 140}],
    });
    assert.strictEqual(clear.slide, 1);
  });

  it("moves another label aside to make room", () => {
    // A row with room only to the left and right of each circle. A's label
    // holds the right of A (its previous slot), the only side of B's in
    // bounds; A's label moves left so B's fits.
    const row = {x: 0, y: 0, width: 220, height: 30};
    const circles = [
      {x: 100, y: 15, r: 4},
      {x: 180, y: 15, r: 4},
    ];
    const labels = [label(0, {previous: {side: "right", slide: 0}}), label(1)];
    const held = placeCircleLabels(circles, labels, row);
    assert.strictEqual(held[0].side, "right");
    assert.strictEqual(held[1].position, "hidden");
    const [a, b] = placeCircleLabels(circles, labels, row, {slide: true});
    assert.strictEqual(a.side, "left");
    assert.deepStrictEqual(b, {
      position: "outside",
      side: "left",
      box: {x: 133, y: 8, width: 40, height: 14},
    });
    assertClear(circles, [a, b]);
  });

  it("keeps a label's previous slot while it is open", () => {
    // Alone in a wide cell, a label goes right; told it was on the left
    // (slid up) last frame, it stays there.
    const circles = [{x: 200, y: 150, r: 5}];
    const [fresh] = placeCircleLabels(circles, [label(0)], bounds, {
      slide: true,
    });
    assert.strictEqual(fresh.side, "right");
    const [kept] = placeCircleLabels(
      circles,
      [label(0, {previous: {side: "left", slide: -0.5}})],
      bounds,
      {slide: true},
    );
    assert.strictEqual(kept.side, "left");
    assert.strictEqual(kept.slide, -0.5);
    // A previous slot out of bounds is passed over.
    const [moved] = placeCircleLabels(
      [{x: 20, y: 150, r: 5}],
      [label(0, {previous: {side: "left", slide: 0}})],
      bounds,
      {slide: true},
    );
    assert.strictEqual(moved.side, "right");
  });

  it("spaces a kept slot only when it is slid", () => {
    // A box 1px right of the label's right side: a centered previous slot
    // keeps no spacing and holds; one slid down needs the gap and moves.
    const circles = [{x: 200, y: 150, r: 5}];
    const opts = {
      slide: true,
      obstacles: [{x: 249, y: 140, width: 10, height: 30}],
    };
    const [centered] = placeCircleLabels(
      circles,
      [label(0, {previous: {side: "right", slide: 0}})],
      bounds,
      opts,
    );
    assert.strictEqual(centered.side, "right");
    assert.strictEqual(centered.slide, undefined);
    const [slid] = placeCircleLabels(
      circles,
      [label(0, {previous: {side: "right", slide: 0.5}})],
      bounds,
      opts,
    );
    assert.ok(!(slid.side === "right" && slid.slide === 0.5), "moved");
  });

  it("places the same labels the same way every time", () => {
    let seed = 3;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const circles = Array.from({length: 80}, () => ({
      x: 20 + rand() * 360,
      y: 20 + rand() * 260,
      r: 3 + rand() * 4,
    }));
    const labels = circles.map((_, i) => label(i));
    const segments = circles
      .slice(1)
      .map((c, i) => ({x1: circles[i].x, y1: circles[i].y, x2: c.x, y2: c.y}));
    const run = () =>
      placeCircleLabels(circles, labels, bounds, {slide: true, segments});
    const once = run();
    assert.deepStrictEqual(run(), once);
    assertClear(circles, once);
    // Sliding shows more labels than the sides alone.
    const sides = placeCircleLabels(circles, labels, bounds);
    const shown = p => p.filter(x => x.position === "outside").length;
    assert.ok(shown(once) > shown(sides), `${shown(once)} > ${shown(sides)}`);
  });
});
