import {it} from "vitest";
import assert from "assert";
import {pathCommands} from "../src/pathParse.ts";

it("pathCommands keeps each command as written", () => {
  assert.deepStrictEqual(pathCommands("M10,20L30 40h5v-6Z"), [
    {command: "M", segments: [[10, 20]]},
    {command: "L", segments: [[30, 40]]},
    {command: "h", segments: [[5]]},
    {command: "v", segments: [[-6]]},
    {command: "Z", segments: []},
  ]);
});

it("pathCommands groups implicit repeats by segment", () => {
  assert.deepStrictEqual(pathCommands("m0 0 10 10 20-5"), [
    {command: "m", segments: [[0, 0], [10, 10], [20, -5]]},
  ]);
  assert.deepStrictEqual(pathCommands("M0,0C1,2,3,4,5,6 7,8,9,10,11,12"), [
    {command: "M", segments: [[0, 0]]},
    {command: "C", segments: [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]]},
  ]);
});

it("pathCommands reads compact arc flags as single digits", () => {
  assert.deepStrictEqual(pathCommands("M0,0a1 1 0 011 1"), [
    {command: "M", segments: [[0, 0]]},
    {command: "a", segments: [[1, 1, 0, 0, 1, 1, 1]]},
  ]);
  assert.deepStrictEqual(pathCommands("a5 5 0 0150 0")[0].segments, [[5, 5, 0, 0, 1, 50, 0]]);
});

it("pathCommands reads exponents, signs, and bare decimals", () => {
  assert.deepStrictEqual(pathCommands("M1e2-.5L.5.5")[0].segments, [[100, -0.5]]);
  assert.deepStrictEqual(pathCommands("M1e2-.5L.5.5")[1].segments, [[0.5, 0.5]]);
  assert.deepStrictEqual(pathCommands(""), []);
});
