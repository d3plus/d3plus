import assert from "assert";
import {Line} from "../../es/index.js";
import {buildLabelData} from "../../es/src/shapes/buildLabelData.js";

// A multi-point shape nested under the key `0` (a Line whose id is the number
// 0, e.g. an axis tick at value 0) is still a nested shape: its label and
// style accessors resolve against its points, the same as any other key.

it("buildLabelData labels a nested shape whose key is 0", () => {
  const values = [{id: 0, text: "0"}];
  const labels = buildLabelData({
    data: [{nested: true, key: 0, values}],
    label: d => d.text,
    labelBounds: () => ({x: 0, y: 0, width: 10, height: 10}),
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: () => 0,
    id: d => d.id,
  });
  assert.strictEqual(labels.length, 1, "the key-0 shape gets its label");
  assert.strictEqual(labels[0].text, "0");
});

it("a Line keyed 0 hands style accessors the merged aggregate", () => {
  const data = [
    {id: 0, x: 0, y: 10},
    {id: 0, x: 1, y: 20},
  ];
  let seen;
  new Line()
    .data(data)
    .stroke(d => {
      seen = d;
      return "black";
    })
    .toScene();
  assert.strictEqual(seen.y, 30, "accessor gets the aggregate, not the nest wrapper");
});
