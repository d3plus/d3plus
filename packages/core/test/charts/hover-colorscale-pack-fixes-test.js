import assert from "assert";

import {colorScaleBucketOf} from "../../es/src/charts/features/colorScaleBucket.js";
import {buildLabelData} from "../../es/src/shapes/buildLabelData.js";

it("colorScaleBucketOf unwraps wrapped bucket data and ignores non-buckets", () => {
  const bucket = {_isColorScaleBucket: true, color: "#abc"};
  assert.strictEqual(colorScaleBucketOf(bucket), bucket, "direct bucket");
  assert.strictEqual(colorScaleBucketOf({__d3plus__: true, data: bucket}), bucket, "one-level wrapped");
  assert.strictEqual(
    colorScaleBucketOf({__d3plus__: true, data: {__d3plus__: true, data: bucket}}),
    bucket, "double wrapped (label -> shape-row -> bucket)",
  );
  assert.strictEqual(colorScaleBucketOf({foo: 1}), null, "non-bucket -> null");
  assert.strictEqual(colorScaleBucketOf({__d3plus__: true, data: {x: 1}}), null, "wrapped non-bucket -> null");
});

it("buildLabelData datum option stores the resolved source row as .data (Pack fix)", () => {
  const source = {id: "leaf-1", value: 5};
  const hierarchyNode = {x: 10, y: 20, r: 8, id: "leaf-1", data: source, parent: {}, children: null};
  const labels = buildLabelData({
    data: [hierarchyNode],
    label: d => d.data.id,
    labelBounds: (d, i, aes) => ({width: aes.r * 1.6, height: aes.r * 0.8, x: -aes.r * 0.8, y: -aes.r * 0.4}),
    x: d => d.x, y: d => d.y,
    aes: d => ({r: d.r, width: 2 * d.r, height: 2 * d.r}),
    rotate: () => 0,
    id: d => d.id,
    datum: d => d.data,
  });
  assert.strictEqual(labels.length, 1, "one label produced");
  assert.strictEqual(labels[0].data, source, "label .data is the source row, matching the circle node's datum");
});

it("buildLabelData without datum option keeps the iterated node as .data (unchanged default)", () => {
  const node = {x: 10, y: 20, r: 8, id: "a", data: {id: "a"}};
  const labels = buildLabelData({
    data: [node],
    label: () => "X",
    labelBounds: () => ({width: 5, height: 5, x: 0, y: 0}),
    x: d => d.x, y: d => d.y,
    aes: d => ({r: d.r}),
    rotate: () => 0,
    id: d => d.id,
  });
  assert.strictEqual(labels[0].data, node, "defaults to the iterated node");
});
