import {describe, it} from "vitest";
import assert from "node:assert";
import path from "node:path";
import {distTag, publishOrder, workspacePackages} from "../publish.js";

describe("distTag", () => {
  it("publishes a release as latest and a prerelease as next", () => {
    assert.strictEqual(distTag("4.9.0"), "latest");
    assert.strictEqual(distTag("5.0.0-beta.1"), "next");
  });
});

describe("publishOrder", () => {
  const pkg = (name, deps = {}, extra = {}) => ({
    name,
    dir: name,
    dependencies: deps,
    ...extra,
  });

  it("puts every workspace dependency (or peer) before its dependents", () => {
    const order = publishOrder([
      pkg("@d3plus/react", {}, {peerDependencies: {"@d3plus/core": "4.9.0"}}),
      pkg("@d3plus/core", {"@d3plus/text": "4.9.0", "d3-array": "^3"}),
      pkg("@d3plus/text", {"@d3plus/dom": "4.9.0"}),
      pkg("@d3plus/dom"),
    ]).map(p => p.name);
    assert.deepStrictEqual(order, [
      "@d3plus/dom",
      "@d3plus/text",
      "@d3plus/core",
      "@d3plus/react",
    ]);
  });

  it("leaves private packages out", () => {
    const order = publishOrder([
      pkg("@d3plus/docs", {"@d3plus/core": "4.9.0"}, {private: true}),
      pkg("@d3plus/core"),
    ]).map(p => p.name);
    assert.deepStrictEqual(order, ["@d3plus/core"]);
  });

  it("orders the real workspace: core after its dependencies, wrappers after core, docs left out", () => {
    const order = publishOrder(
      workspacePackages(path.resolve(import.meta.dirname, "../..")),
    ).map(p => p.name);
    const at = name => order.indexOf(name);
    assert.ok(!order.includes("@d3plus/docs"));
    for (const dep of ["@d3plus/color", "@d3plus/text", "@d3plus/render"])
      assert.ok(at(dep) < at("@d3plus/core"), dep);
    for (const wrapper of ["@d3plus/react", "@d3plus/vue", "@d3plus/ssr"])
      assert.ok(at("@d3plus/core") < at(wrapper), wrapper);
  });
});
