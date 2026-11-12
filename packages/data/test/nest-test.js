import {it} from "vitest";
import assert from "assert";
import {default as nest, nestGroups} from "../src/nest.ts";

it("nest wraps a single key accessor and groups rows under it", () => {
  const data = [
    {group: "a", v: 1},
    {group: "a", v: 2},
    {group: "b", v: 3},
  ];
  assert.deepStrictEqual(
    nest(data, d => d.group),
    [
      {
        key: "a",
        values: [
          {group: "a", v: 1},
          {group: "a", v: 2},
        ],
      },
      {key: "b", values: [{group: "b", v: 3}]},
    ],
  );
});

it("nest preserves first-seen key order, not sorted order", () => {
  const data = [{g: "z"}, {g: "a"}, {g: "z"}, {g: "m"}];
  assert.deepStrictEqual(
    nest(data, d => d.g).map(d => d.key),
    ["z", "a", "m"],
  );
});

it("nest builds a nested hierarchy for multiple key levels", () => {
  const data = [
    {g1: "A", g2: "x", v: 1},
    {g1: "A", g2: "y", v: 2},
    {g1: "B", g2: "x", v: 3},
  ];
  assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
    {
      key: "A",
      values: [
        {key: "x", values: [{g1: "A", g2: "x", v: 1}]},
        {key: "y", values: [{g1: "A", g2: "y", v: 2}]},
      ],
    },
    {
      key: "B",
      values: [{key: "x", values: [{g1: "B", g2: "x", v: 3}]}],
    },
  ]);
});

it('nest collapses a level whose only child key is the string "undefined"', () => {
  // A deeper groupBy level that resolves to "undefined" (e.g. a missing
  // field) bubbles the leaf row up, dropping the empty level.
  const data = [{id: "a"}];
  assert.deepStrictEqual(nest(data, [d => d.id, d => String(d.missing)]), [
    {id: "a"},
  ]);
});

it("nestGroups returns the raw data when given no key accessors", () => {
  const data = [{v: 1}, {v: 2}];
  assert.strictEqual(nestGroups(data, []), data);
});

it("nest collapses a level whose key accessor returns undefined", () => {
  // Missing fields reach d3-array's group() as a real undefined key, not the
  // string "undefined", and must bubble the leaf row up the same way.
  const data = [{id: "a"}];
  assert.deepStrictEqual(nest(data, [d => d.id, d => d.missing]), [{id: "a"}]);
});

it("nest bubbles only the ragged branches of a mixed-depth hierarchy", () => {
  const data = [
    {g1: "A", g2: "x", v: 1},
    {g1: "B", v: 2},
  ];
  assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
    {key: "A", values: [{key: "x", values: [{g1: "A", g2: "x", v: 1}]}]},
    {g1: "B", v: 2},
  ]);
});

it("nest bubbles at any depth of a three-level hierarchy", () => {
  const data = [
    {g1: "A", g2: "x", g3: 1, v: 1},
    {g1: "A", g2: "y", v: 2},
  ];
  assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2, d => d.g3]), [
    {
      key: "A",
      values: [
        {
          key: "x",
          values: [{key: 1, values: [{g1: "A", g2: "x", g3: 1, v: 1}]}],
        },
        {g1: "A", g2: "y", v: 2},
      ],
    },
  ]);
});

it("nest leaves a single-level nest alone even when rows lack a key field", () => {
  const data = [{v: 1}, {v: 2}];
  assert.deepStrictEqual(
    nest(data, d => d.v),
    [
      {key: 1, values: [{v: 1}]},
      {key: 2, values: [{v: 2}]},
    ],
  );
});

for (const key of [0, false]) {
  const name = JSON.stringify(key);

  it(`nest bubbles a ragged row under a group keyed ${name}`, () => {
    const data = [
      {g1: key, v: 1},
      {g1: "B", g2: "x", v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {g1: key, v: 1},
      {key: "B", values: [{key: "x", values: [{g1: "B", g2: "x", v: 2}]}]},
    ]);
  });

  it(`nest bubbles at any depth under a group keyed ${name}`, () => {
    const data = [
      {g1: key, g2: "x", g3: 1, v: 1},
      {g1: key, g2: "y", v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2, d => d.g3]), [
      {
        key,
        values: [
          {
            key: "x",
            values: [{key: 1, values: [{g1: key, g2: "x", g3: 1, v: 1}]}],
          },
          {g1: key, g2: "y", v: 2},
        ],
      },
    ]);
  });
}

it("nest keeps a group whose key is null or undefined as it is", () => {
  const data = [{g1: null, v: 1}, {v: 2}];
  assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
    {key: null, values: [{key: undefined, values: [{g1: null, v: 1}]}]},
    {key: undefined, values: [{key: undefined, values: [{v: 2}]}]},
  ]);
});

/**
    Each entry's rows reduced to their `v`, and a key of `null` or `""`
    written as `undefined`, so nests that differ only in how a key is missing
    compare equal.
*/
const shape = entries =>
  entries.map(d =>
    d.values
      ? {
          key: d.key === "" || d.key === null ? undefined : d.key,
          values: shape(d.values),
        }
      : d.v,
  );

for (const key of [null, ""]) {
  const name = JSON.stringify(key);

  it(`nest bubbles a row whose deepest key is ${name} to its group's depth`, () => {
    const data = [
      {g1: "A", g2: key, v: 1},
      {g1: "B", g2: "x", v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {g1: "A", g2: key, v: 1},
      {key: "B", values: [{key: "x", values: [{g1: "B", g2: "x", v: 2}]}]},
    ]);
  });

  it(`nest bubbles a row whose key is ${name} at any depth`, () => {
    const data = [
      {g1: "A", g2: "x", g3: 1, v: 1},
      {g1: "A", g2: "y", g3: key, v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2, d => d.g3]), [
      {
        key: "A",
        values: [
          {
            key: "x",
            values: [{key: 1, values: [{g1: "A", g2: "x", g3: 1, v: 1}]}],
          },
          {g1: "A", g2: "y", g3: key, v: 2},
        ],
      },
    ]);
  });

  it(`nest leaves a top-level group keyed ${name} as it leaves one without a key`, () => {
    const data = [{g1: key, g2: "x", v: 1}];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {key, values: [{key: "x", values: [{g1: key, g2: "x", v: 1}]}]},
    ]);
  });

  for (const [level, empty, missing] of [
    ["first", {g1: key, g2: "x"}, {g2: "x"}],
    ["middle", {g1: "A", g2: key, g3: 1}, {g1: "A", g3: 1}],
    ["last", {g1: "A", g2: "x", g3: key}, {g1: "A", g2: "x"}],
  ]) {
    it(`nest treats a ${level} key of ${name} as a missing one`, () => {
      const keys = [d => d.g1, d => d.g2, d => d.g3];
      const other = {g1: "B", g2: "y", g3: 2, v: 2};
      assert.deepStrictEqual(
        shape(nest([{...empty, v: 1}, other], keys)),
        shape(nest([{...missing, v: 1}, other], keys)),
      );
    });
  }
}

for (const key of [undefined, null, ""]) {
  const name = JSON.stringify(key) ?? "undefined";

  it(`nest keeps a group's keyed rows beside a row whose deepest key is ${name}`, () => {
    const data = [
      {g1: "A", g2: "x", v: 1},
      {g1: "A", g2: key, v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {
        key: "A",
        values: [{key: "x", values: [data[0]]}, data[1]],
      },
    ]);
  });

  it(`nest keeps a group's keyed rows after a first row whose deepest key is ${name}`, () => {
    const data = [
      {g1: "A", g2: key, v: 1},
      {g1: "A", g2: "x", v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {
        key: "A",
        values: [data[0], {key: "x", values: [data[1]]}],
      },
    ]);
  });

  it(`nest makes a row whose middle key is ${name} a leaf of its group, beside its sub-groups`, () => {
    const data = [
      {g1: "A", g2: "x", g3: 1, v: 1},
      {g1: "A", g2: key, g3: 2, v: 2},
      {g1: "A", g2: "y", v: 3},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2, d => d.g3]), [
      {
        key: "A",
        values: [
          {key: "x", values: [{key: 1, values: [data[0]]}]},
          data[1],
          data[2],
        ],
      },
    ]);
  });

  it(`nest replaces a group holding only a row whose middle key is ${name} with the row`, () => {
    const data = [
      {g1: "A", g2: key, g3: 1, v: 1},
      {g1: "B", g2: "y", g3: 2, v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2, d => d.g3]), [
      data[0],
      {key: "B", values: [{key: "y", values: [{key: 2, values: [data[1]]}]}]},
    ]);
  });

  it(`nest keeps every row of a group whose rows all lack a deepest key of ${name}`, () => {
    const data = [
      {g1: "A", g2: key, v: 1},
      {g1: "A", g2: key, v: 2},
    ];
    assert.deepStrictEqual(nest(data, [d => d.g1, d => d.g2]), [
      {key: "A", values: [data[0], data[1]]},
    ]);
  });
}
