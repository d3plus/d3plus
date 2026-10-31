import {describe, it} from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  configField,
  flattenArgTypes,
  flavorsFor,
  lineage,
  manifestEntry,
  merge,
  readWrappers,
  wrappedClasses,
} from "../stubs/manifest.js";

describe("wrappedClasses", () => {
  it("reads the class names a wrapper imports from @d3plus/core", () => {
    const source = `import {\n  AreaPlot as AreaPlotClass,\n  Treemap,\n} from "@d3plus/core";\nimport x from "./y.js";`;
    assert.deepEqual([...wrappedClasses(source)], ["AreaPlot", "Treemap"]);
  });
  it("is empty without a core import", () => {
    assert.equal(wrappedClasses(`import {a} from "b";`).size, 0);
  });
});

describe("readWrappers", () => {
  it("reads every listed wrapper's entry under a root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "d3plus-wrappers-"));
    fs.mkdirSync(path.join(root, "packages/react"), {recursive: true});
    fs.writeFileSync(
      path.join(root, "packages/react/index.tsx"),
      `import {Pie as PieClass} from "@d3plus/core";`,
    );
    const wrappers = readWrappers(root);
    assert.deepEqual([...wrappers.react], ["Pie"]);
    assert.equal(wrappers.vue.size, 0);
    assert.equal(wrappers.element.size, 0);
    fs.rmSync(root, {recursive: true, force: true});
  });
  it("finds the real wrappers' Treemap", () => {
    const wrappers = readWrappers();
    for (const flavor of ["react", "vue", "element"])
      assert.ok(wrappers[flavor].has("Treemap"), flavor);
  });
});

describe("flavorsFor", () => {
  const wrappers = {
    react: new Set(["Treemap"]),
    vue: new Set(["Treemap"]),
    element: new Set(),
  };
  it("lists every wrapper that renders a class, in tab order", () => {
    assert.deepEqual(flavorsFor({kind: "class", name: "Treemap"}, wrappers), [
      "javascript",
      "react",
      "vue",
      "svelte",
      "angular",
    ]);
  });
  it("gives a function only JavaScript", () => {
    assert.deepEqual(flavorsFor({kind: "function", name: "x"}, wrappers), [
      "javascript",
    ]);
  });
});

describe("merge", () => {
  it("merges objects deeply, later winning, and replaces arrays", () => {
    const a = {x: {type: "a", options: [1, 2]}, y: 1};
    const b = {x: {options: [3]}, z: 2};
    assert.deepEqual(merge(a, b), {
      x: {type: "a", options: [3]},
      y: 1,
      z: 2,
    });
    assert.deepEqual(a.x.options, [1, 2], "leaves its inputs alone");
  });
});

describe("flattenArgTypes and lineage", () => {
  const own = {
    Viz: {argTypes: {title: {d: 1}, shape: {d: 2}}},
    Plot: {argTypes: {x: {d: 3}}, parentClass: "Viz"},
    BarChart: {
      argTypes: {title: {extra: true}},
      parentClass: "Plot",
      disabledMethods: ["shape"],
    },
  };
  it("merges each parent's argTypes under the child's, minus hidden keys", () => {
    assert.deepEqual(flattenArgTypes("BarChart", own), {
      title: {d: 1, extra: true},
      x: {d: 3},
    });
  });
  it("is empty for an unknown class", () => {
    assert.deepEqual(flattenArgTypes("Nope", own), {});
  });
  it("lists ancestors nearest first", () => {
    assert.deepEqual(lineage("BarChart", own), ["Plot", "Viz"]);
    assert.deepEqual(lineage("Viz", own), []);
  });
  it("stops on a cycle", () => {
    const cyclic = {A: {parentClass: "B"}, B: {parentClass: "A"}};
    assert.deepEqual(lineage("A", cyclic), ["B", "A"]);
    assert.deepEqual(flattenArgTypes("A", cyclic), {});
  });
});

describe("configField", () => {
  it("keeps an argType's type, control, options and defaults", () => {
    const field = configField({
      type: {summary: "string | function"},
      control: {type: "radio"},
      options: ["a", "b"],
      description: "Pick one.",
      defaultValue: "a",
      table: {defaultValue: {summary: "function", detail: "d => d.a"}},
    });
    assert.deepEqual(field, {
      type: "string | function",
      description: "Pick one.",
      control: "radio",
      options: ["a", "b"],
      default: "function",
      defaultDetail: "d => d.a",
      defaultValue: "a",
    });
  });
  it("drops an undefined default and a missing control", () => {
    const field = configField({
      type: {summary: "object"},
      control: {type: undefined},
      table: {defaultValue: {summary: "undefined"}},
    });
    assert.deepEqual(field, {type: "object", description: ""});
  });
});

describe("manifestEntry", () => {
  const wrappers = {react: new Set(), vue: new Set(), element: new Set()};
  it("documents a class's config, sorted, with its ancestors", () => {
    const entry = manifestEntry(
      {name: "Pie", kind: "class", description: "A pie."},
      {
        pkg: "core",
        category: "charts",
        argTypes: {value: {type: {summary: "number"}}, angle: {}},
        ancestors: ["Viz"],
        wrappers,
      },
    );
    assert.equal(entry.package, "core");
    assert.deepEqual(entry.extends, ["Viz"]);
    assert.deepEqual(Object.keys(entry.config), ["angle", "value"]);
    assert.deepEqual(entry.flavors, ["javascript", "svelte", "angular"]);
  });
  it("documents a function's parameters", () => {
    const entry = manifestEntry(
      {
        name: "formatAbbreviate",
        kind: "function",
        params: [
          {
            name: "n",
            type: {names: ["string", "number"]},
            optional: false,
            description: "The number.",
          },
          {
            name: "locale",
            type: {names: ["string"]},
            optional: true,
            defaultvalue: "en-US",
          },
        ],
      },
      {pkg: "format", category: "", wrappers},
    );
    assert.deepEqual(entry.params, [
      {
        name: "n",
        type: "string | number",
        optional: false,
        description: "The number.",
      },
      {
        name: "locale",
        type: "string",
        optional: true,
        default: "en-US",
        description: "",
      },
    ]);
    assert.equal(entry.config, undefined);
    assert.deepEqual(entry.flavors, ["javascript"]);
  });
});
