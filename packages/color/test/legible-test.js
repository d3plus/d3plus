import assert from "assert";
import {default as legible} from "../src/legible.js";

it("legible", () => {
  assert.strictEqual("rgb(207, 23, 23)", legible("#ffaaaa"));
  assert.strictEqual("rgb(23, 207, 23)", legible("#ccffcc"));
  assert.strictEqual("rgb(23, 23, 207)", legible("#ccccff"));
});

