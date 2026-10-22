import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Box, Whisker} from "../../index.ts";

useJsdom();

/**
    Box draws each box's rect, median, whiskers, whisker ends and outliers as
    siblings in one scene group, so every node needs a key of its own. Each key
    is the box's id plus the part it draws, so a box's parts keep their keys
    when other boxes come, go or move.
*/

const rows = keys =>
  keys.flatMap(key =>
    [1, 2, 3, 4, 5, 40].map((v, j) => ({key, v: v + key.charCodeAt(0), j})),
  );

const sceneOf = (data, configure = b => b) =>
  configure(
    new Box()
      .data(data)
      .x(d => d.key)
      .y(d => d.v)
      .renderMode("compute"),
  )
    .render()
    .toScene();

const keysOf = scene => scene.children.map(n => String(n.key));

const duplicates = keys => keys.filter((k, i) => keys.indexOf(k) !== i);

/** Each node's key mapped to the box it draws, read off its datum. */
const boxOf = scene => {
  const out = {};
  for (const n of scene.children) {
    let d = n.datum;
    while (d && d.key === undefined && d.data) d = d.data;
    out[n.key] = d && d.key;
  }
  return out;
};

it("Box.toScene keys every node uniquely within its group", () => {
  const keys = keysOf(sceneOf(rows(["A", "B", "C"])));
  assert.deepStrictEqual(duplicates(keys), []);
});

it("Box.toScene keys each part by its box's id and the part", () => {
  const keys = keysOf(sceneOf(rows(["A", "B"])));
  for (const id of ["A", "B"]) {
    for (const part of [
      "box",
      "median",
      "whisker-top",
      "whisker-top::hit",
      "whisker-bottom",
      "whisker-bottom::hit",
      "whisker-top-end",
      "whisker-bottom-end",
      "outlier-5",
    ])
      assert.ok(
        keys.includes(`${id}-${part}`),
        `${id}-${part} is in the scene`,
      );
  }
});

it("Box.toScene keys horizontal whiskers by their side", () => {
  const keys = keysOf(
    sceneOf(rows(["A"]), b =>
      b
        .orient("horizontal")
        .x(d => d.v)
        .y(d => d.key),
    ),
  );
  for (const part of [
    "whisker-left",
    "whisker-right",
    "whisker-left-end",
    "whisker-right-end",
  ])
    assert.ok(keys.includes(`A-${part}`), `A-${part} is in the scene`);
  assert.deepStrictEqual(duplicates(keys), []);
});

it("Box parts keep their keys and their box when the boxes change", () => {
  const before = boxOf(sceneOf(rows(["A", "B", "C"])));
  for (const next of [
    ["B", "C"],
    ["C", "B", "A"],
    ["B", "C", "D"],
  ]) {
    const after = boxOf(sceneOf(rows(next)));
    const shared = Object.keys(after).filter(k => k in before);
    assert.ok(shared.length, `${next}: some keys carry over`);
    for (const k of shared)
      assert.strictEqual(
        after[k],
        before[k],
        `${next}: ${k} still draws box ${before[k]}`,
      );
    for (const id of next.filter(k => k !== "D"))
      assert.ok(
        `${id}-box` in after && `${id}-box` in before,
        `${next}: ${id}-box carries over`,
      );
  }
});

it("Box id reads each box's first row", () => {
  const scene = sceneOf(rows(["A", "B"]), b =>
    b.id(d => `box-${d.key.toLowerCase()}`),
  );
  const keys = keysOf(scene);
  assert.ok(keys.includes("box-a-box") && keys.includes("box-b-median"));
  assert.deepStrictEqual(duplicates(keys), []);
  assert.strictEqual(new Box().id(), undefined, "no id by default");
});

it("Box keeps keys unique when its id accessor repeats", () => {
  const scene = sceneOf(rows(["A", "B", "C"]), b => b.id(() => "same"));
  const keys = keysOf(scene);
  assert.deepStrictEqual(duplicates(keys), []);
  for (const k of ["same-box", "same~1-box", "same~2-box"])
    assert.ok(keys.includes(k), `${k} is in the scene`);
  assert.strictEqual(
    scene.children.filter(
      n => n.type === "path" && !String(n.key).endsWith("::hit"),
    ).length,
    6,
    "each box keeps its own two whisker lines",
  );
});

it("Whisker.toScene keys each line and end by its whisker", () => {
  const data = [
    {x: 10, y: 10, orient: "top"},
    {x: 30, y: 10, orient: "bottom"},
    {x: 50, y: 10, orient: "left", endpoint: "Circle"},
  ];
  const keys = keysOf(
    new Whisker().data(data).renderMode("compute").render().toScene(),
  );
  assert.deepStrictEqual(duplicates(keys), []);
  for (const k of ["0", "0-end", "1", "1-end", "2", "2-end"])
    assert.ok(keys.includes(k), `${k} is in the scene`);

  const named = keysOf(
    new Whisker()
      .data(data.map((d, i) => ({...d, id: `w${i}`})))
      .renderMode("compute")
      .render()
      .toScene(),
  );
  for (const k of ["w0", "w0-end", "w2", "w2-end"])
    assert.ok(named.includes(k), `${k} is in the scene`);
});

it("Whisker.toScene keeps keys unique when ids repeat", () => {
  const data = [
    {id: "w", x: 10, y: 10, orient: "top"},
    {id: "w", x: 30, y: 10, orient: "bottom"},
  ];
  const scene = new Whisker()
    .data(data)
    .renderMode("compute")
    .render()
    .toScene();
  const keys = keysOf(scene);
  assert.deepStrictEqual(duplicates(keys), []);
  for (const k of ["w", "w-end", "w~1", "w~1-end"])
    assert.ok(keys.includes(k), `${k} is in the scene`);
});
