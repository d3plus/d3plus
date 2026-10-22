import {afterAll, beforeAll, describe, it} from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {printSync} from "@swc/core";

import {constructorExpressions} from "../stubs/constructorDefaults.js";

const print = expr =>
  printSync({
    type: "Module",
    body: [{type: "ExpressionStatement", expression: expr, span: expr.span}],
    span: {start: 0, end: 0, ctxt: 0},
  }).code.trim();

describe("constructorExpressions", () => {
  let dir;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ctor-defaults-"));
    fs.writeFileSync(
      path.join(dir, "init.ts"),
      `import {other} from "./other.js";
export function initDefaults(viz: Thing): void {
  const local = {viz: 1};
  viz._size = 10;
  viz.schema.shape = "Circle";
  viz.color(d => viz._id(d));
  local.viz = 2;
  other(viz);
}
`,
    );
    fs.writeFileSync(
      path.join(dir, "other.ts"),
      `export function other(o: Thing) {
  o.padding(5);
}
`,
    );
    fs.writeFileSync(
      path.join(dir, "Thing.ts"),
      `import {initDefaults} from "./init.js";
import {assign} from "@d3plus/dom";
function seed(self: Thing) {
  self._seeded = true;
}
export default class Thing extends Base {
  constructor() {
    super();
    this._a = 1;
    seed(this);
    assign(this._config, {b: 2});
    initDefaults(this);
    this.label("x");
  }
}
`,
    );
  });
  afterAll(() => fs.rmSync(dir, {recursive: true, force: true}));

  it("lists the constructor's own and its helpers' statements, in order, with helper params as this", () => {
    const exprs = constructorExpressions(path.join(dir, "Thing.ts")).map(print);
    assert.deepEqual(exprs, [
      "this._a = 1;",
      "this._seeded = true;",
      "this._size = 10;",
      'this.schema.shape = "Circle";',
      "this.color((d)=>this._id(d));",
      "this.padding(5);",
      'this.label("x");',
    ]);
  });

  it("follows Plot's init helpers", () => {
    const file = path.resolve("packages/core/src/charts/Plot/index.ts");
    const exprs = constructorExpressions(file).map(print);
    assert.ok(exprs.some(e => e.startsWith("this.schema.barPadding =")));
    assert.ok(exprs.some(e => e.startsWith("this._xConfig =")));
  });
});
