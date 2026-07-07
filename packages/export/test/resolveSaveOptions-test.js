import assert from "assert";
import {resolveSaveOptions} from "../es/src/saveElement.js";

it("resolveSaveOptions applies filename/type defaults", () => {
  const {filename, type} = resolveSaveOptions();
  assert.strictEqual(filename, "download", "default filename");
  assert.strictEqual(type, "png", "default type");
});

it("resolveSaveOptions honors explicit filename and type", () => {
  const {filename, type} = resolveSaveOptions({filename: "chart", type: "svg"});
  assert.strictEqual(filename, "chart");
  assert.strictEqual(type, "svg");
});

it("resolveSaveOptions renames renderOptions.background to backgroundColor", () => {
  const {renderOpts} = resolveSaveOptions({}, {background: "red"});
  assert.strictEqual(renderOpts.backgroundColor, "red", "background is exposed as backgroundColor");
});

it("resolveSaveOptions lets an explicit backgroundColor win over background", () => {
  const {renderOpts} = resolveSaveOptions({}, {background: "red", backgroundColor: "blue"});
  assert.strictEqual(renderOpts.backgroundColor, "blue");
});

it("resolveSaveOptions passes other renderOptions through untouched", () => {
  const {renderOpts} = resolveSaveOptions({}, {quality: 0.9, pixelRatio: 2});
  assert.strictEqual(renderOpts.quality, 0.9);
  assert.strictEqual(renderOpts.pixelRatio, 2);
  assert.strictEqual(renderOpts.backgroundColor, undefined, "no background -> backgroundColor undefined");
});

it("resolveSaveOptions does not mutate its inputs", () => {
  const options = {filename: "x"};
  const renderOptions = {background: "white"};
  resolveSaveOptions(options, renderOptions);
  assert.deepStrictEqual(options, {filename: "x"}, "options is not mutated");
  assert.deepStrictEqual(renderOptions, {background: "white"}, "renderOptions is not mutated");
});
