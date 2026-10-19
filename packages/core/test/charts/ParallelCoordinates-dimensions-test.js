import assert from "assert";
import {
  autoLineOpacity,
  axisPositions,
  detectDimensions,
  dimensionDomain,
  dimensionType,
  isMissing,
  isNumeric,
  resolveDimensions,
  sharedDomains,
} from "../../es/src/charts/ParallelCoordinates/dimensions.js";

const rows = [
  {id: 1, name: "A", origin: "USA", mpg: 18, weight: 3500, _hidden: 1},
  {id: 2, name: "B", origin: "Japan", mpg: 31, weight: 2100, note: null},
  {id: 3, name: "C", origin: "USA", mpg: null, weight: 4100, note: "x"},
];

it("ParallelCoordinates dimensions: isNumeric accepts only finite numbers", () => {
  assert.ok(isNumeric(0));
  assert.ok(isNumeric(-2.5));
  assert.ok(!isNumeric(NaN));
  assert.ok(!isNumeric(Infinity));
  assert.ok(!isNumeric("3"));
  assert.ok(!isNumeric(null));
});

it("ParallelCoordinates dimensions: isMissing treats null, undefined, empty strings, and non-finite numbers as missing", () => {
  for (const v of [undefined, null, "", NaN, Infinity]) assert.ok(isMissing(v), `${v} is missing`);
  for (const v of [0, "0", "a", false]) assert.ok(!isMissing(v), `${v} is present`);
});

it("ParallelCoordinates dimensions: detectDimensions finds numeric keys in first-seen order, skipping excluded and internal keys", () => {
  assert.deepStrictEqual(detectDimensions(rows), ["id", "mpg", "weight"]);
  assert.deepStrictEqual(detectDimensions(rows, ["id"]), ["mpg", "weight"]);
  assert.deepStrictEqual(detectDimensions([{a: null}, {a: undefined}]), [], "a key with no numbers is skipped");
  assert.deepStrictEqual(detectDimensions([]), []);
});

it("ParallelCoordinates dimensions: dimensionType is numeric only when every present value is a number", () => {
  assert.strictEqual(dimensionType([1, 2, null, 3]), "numeric");
  assert.strictEqual(dimensionType([1, "2"]), "categorical");
  assert.strictEqual(dimensionType(["a", "b"]), "categorical");
  assert.strictEqual(dimensionType([null, undefined]), "categorical");
});

it("ParallelCoordinates dimensions: dimensionDomain spans the numeric extent, with user overrides per end", () => {
  assert.deepStrictEqual(dimensionDomain([3, 1, null, 7], "numeric"), [1, 7]);
  assert.deepStrictEqual(dimensionDomain([3, 1, 7], "numeric", {domain: [0, undefined]}), [0, 7]);
  assert.deepStrictEqual(dimensionDomain([3, 1, 7], "numeric", {domain: [undefined, 10]}), [1, 10]);
  assert.deepStrictEqual(dimensionDomain([], "numeric"), [0, 0]);
});

it("ParallelCoordinates dimensions: dimensionDomain sorts categories naturally unless given a domain", () => {
  assert.deepStrictEqual(dimensionDomain(["b", "a", "b", null], "categorical"), ["a", "b"]);
  assert.deepStrictEqual(dimensionDomain([10, 8, 4], "categorical"), ["4", "8", "10"]);
  assert.deepStrictEqual(dimensionDomain(["b", "a"], "categorical", {domain: ["b", "a", "c"]}), ["b", "a", "c"]);
});

it("ParallelCoordinates dimensions: resolveDimensions reads type, domain, title, and direction", () => {
  const dims = resolveDimensions(["mpg", "origin", "weight"], rows, {
    mpg: {reverse: true, title: "Miles per Gallon"},
    weight: {scale: "point"},
  });
  assert.deepStrictEqual(dims[0], {key: "mpg", title: "Miles per Gallon", type: "numeric", domain: [18, 31], reverse: true});
  assert.deepStrictEqual(dims[1], {key: "origin", title: "origin", type: "categorical", domain: ["Japan", "USA"], reverse: false});
  assert.strictEqual(dims[2].type, "categorical", "a point scale makes a numeric key categorical");
  assert.deepStrictEqual(dims[2].domain, ["2100", "3500", "4100"]);
});

it("ParallelCoordinates dimensions: resolveDimensions prefers shared domains", () => {
  const [dim] = resolveDimensions(["mpg"], rows, {}, {mpg: [0, 50]});
  assert.deepStrictEqual(dim.domain, [0, 50]);
});

it("ParallelCoordinates dimensions: sharedDomains covers every panel's rows", () => {
  const out = sharedDomains(["mpg", "origin"], [...rows, {mpg: 44, origin: "Europe"}]);
  assert.deepStrictEqual(out, {mpg: [18, 44], origin: ["Europe", "Japan", "USA"]});
});

it("ParallelCoordinates dimensions: autoLineOpacity stays opaque for few lines and fades with density", () => {
  assert.strictEqual(autoLineOpacity(10), 1);
  assert.strictEqual(autoLineOpacity(50), 1);
  assert.strictEqual(autoLineOpacity(200), 0.5);
  assert.ok(autoLineOpacity(1000) < 0.25 && autoLineOpacity(1000) > 0.2);
  assert.strictEqual(autoLineOpacity(1e7), 0.1, "never below 0.1");
});

it("ParallelCoordinates dimensions: axisPositions spaces axes evenly and centers a single one", () => {
  assert.deepStrictEqual(axisPositions(3, 0, 100), [0, 50, 100]);
  assert.deepStrictEqual(axisPositions(1, 20, 80), [50]);
  assert.deepStrictEqual(axisPositions(0, 0, 100), []);
});
