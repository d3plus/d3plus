import {describe, it} from "vitest";
import assert from "node:assert";
import {classifyChanges, formatOutputs, withDependents} from "../affected.js";

describe("classifyChanges", () => {
  it("collects the package folders a change touches", () => {
    assert.deepStrictEqual(
      classifyChanges([
        "packages/text/src/textWrap.ts",
        "packages/core/test/charts/Pie-test.js",
        "packages/text/test/textWrap-test.js",
      ]),
      {all: false, dirs: ["packages/core", "packages/text"]},
    );
  });

  it("ignores Markdown, inside packages or out", () => {
    assert.deepStrictEqual(
      classifyChanges([
        "CHANGELOG.md",
        "packages/core/API.md",
        "packages/math/src/clamp.ts",
      ]),
      {all: false, dirs: ["packages/math"]},
    );
    assert.deepStrictEqual(classifyChanges(["AGENTS.md"]), {
      all: false,
      dirs: [],
    });
  });

  it("affects everything when a change lands outside a package", () => {
    for (const file of [
      "pnpm-lock.yaml",
      "vitest.config.ts",
      "test/jsdom.js",
      "scripts/build-esm.js",
      ".github/workflows/test.yml",
      "packages/package.json",
    ])
      assert.deepStrictEqual(
        classifyChanges(["packages/text/src/x.ts", file]),
        {all: true, dirs: []},
        file,
      );
  });
});

describe("formatOutputs", () => {
  it("runs everything, browser tests included, for all", () => {
    assert.strictEqual(formatOutputs("all"), "packages=all\nbrowser=true\n");
  });

  it("lists the packages and runs browser tests only with core", () => {
    assert.strictEqual(
      formatOutputs(["@d3plus/core", "@d3plus/text"]),
      "packages=@d3plus/core @d3plus/text\nbrowser=true\n",
    );
    assert.strictEqual(
      formatOutputs(["@d3plus/math"]),
      "packages=@d3plus/math\nbrowser=false\n",
    );
  });

  it("reports none when no package is affected", () => {
    assert.strictEqual(formatOutputs([]), "packages=none\nbrowser=false\n");
  });
});

describe("withDependents", () => {
  it("adds every package that depends on a changed one", () => {
    const names = withDependents(["packages/text"]);
    assert.ok(names.includes("@d3plus/text"));
    assert.ok(names.includes("@d3plus/core"), "core depends on text");
    assert.ok(names.includes("@d3plus/ssr"), "ssr depends on core");
    assert.ok(!names.includes("@d3plus/math"), "math doesn't depend on text");
  });

  it("returns nothing for no packages", () => {
    assert.deepStrictEqual(withDependents([]), []);
  });
});
