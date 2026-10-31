import {describe, it} from "vitest";
import assert from "node:assert/strict";
import {transformSync} from "esbuild";
import {compile as compileSvelte} from "svelte/compiler";
import {compileScript, parse as parseVue} from "vue/compiler-sfc";

import angular from "../src/components/Playground/snippets/angular.ts";
import element from "../src/components/Playground/snippets/element.ts";
import {FLAVORS} from "../src/components/Playground/snippets/index.ts";
import react from "../src/components/Playground/snippets/react.ts";
import {
  helperImports,
  imports,
  indent,
  kebab,
  usedHelpers,
} from "../src/components/Playground/snippets/shared.ts";
import svelte from "../src/components/Playground/snippets/svelte.ts";
import vanilla from "../src/components/Playground/snippets/vanilla.ts";
import vue from "../src/components/Playground/snippets/vue.ts";

const code = `const data = [
  {id: "alpha", value: 29},
  {id: "beta", value: 10},
];

const config = {
  data,
  groupBy: "id",
  sum: "value",
  tooltipConfig: {title: d => \`\${d.id}: \${formatAbbreviate(d.value)}\`},
};
`;
const input = {
  name: "BarChart",
  code,
  helpers: {format: ["formatAbbreviate"]},
  height: 320,
};

/** Fails the test when esbuild can't parse `source` with `loader`. */
const parses = (source, loader) =>
  assert.doesNotThrow(() => transformSync(source, {loader}), source);

describe("snippet helpers", () => {
  it("indent pads non-empty lines only", () => {
    assert.equal(indent("a\n\n  b", 2), "  a\n\n    b");
  });
  it("helperImports writes one sorted import per package", () => {
    assert.equal(
      helperImports({
        format: ["formatDate", "formatAbbreviate"],
        color: ["colorAssign"],
      }),
      `import {colorAssign} from "@d3plus/color";\nimport {formatAbbreviate, formatDate} from "@d3plus/format";`,
    );
    assert.equal(helperImports({}), "");
    assert.equal(helperImports({format: []}), "");
  });
  it("imports skips empty lines", () => {
    assert.equal(imports("a", "", "b"), "a\nb");
  });
  it("usedHelpers finds called and passed helpers, not keys or properties", () => {
    const available = {
      formatAbbreviate: "format",
      colorAssign: "color",
      max: "math",
      strip: "text",
    };
    const found = usedHelpers(
      `const config = {max: 10, x: d => d.strip, tickFormat: formatAbbreviate, fill: colorAssign("a")};`,
      available,
    );
    assert.deepEqual(found, {
      format: ["formatAbbreviate"],
      color: ["colorAssign"],
    });
  });
  it("kebab turns a class name into a custom-element suffix", () => {
    assert.equal(kebab("BarChart"), "bar-chart");
    assert.equal(kebab("RadialMatrix"), "radial-matrix");
    assert.equal(kebab("Pie"), "pie");
  });
});

describe("snippets", () => {
  it("vanilla shows a Tooltip beside an element", () => {
    const out = vanilla({
      name: "Tooltip",
      code: `const config = {data: [{title: "Alpha"}]};`,
    });
    assert.ok(out.startsWith(`import {Tooltip} from "@d3plus/core";`));
    assert.ok(
      out.includes(
        `new Tooltip()\n  .parent(document.body)\n  .config(config)\n  .position(() => element)\n  .render();`,
      ),
    );
    assert.ok(!out.includes("#chart"));
    parses(out, "js");
  });
  it("vanilla renders the core class into #chart", () => {
    const out = vanilla(input);
    assert.ok(
      out.startsWith(
        `import {BarChart} from "@d3plus/core";\nimport {formatAbbreviate} from "@d3plus/format";`,
      ),
    );
    assert.ok(
      out.includes(
        `new BarChart()\n  .select("#chart")\n  .config(config)\n  .render();`,
      ),
    );
    assert.ok(out.includes("height: 320px"));
    parses(out, "js");
  });
  it("react wraps the component in a sized div", () => {
    const out = react(input);
    assert.ok(out.includes(`import {BarChart} from "@d3plus/react";`));
    assert.ok(out.includes("<div style={{height: 320}}>"));
    assert.ok(out.includes("<BarChart config={config} />"));
    parses(out, "jsx");
  });
  it("vue is a script-setup component that compiles", () => {
    const out = vue(input);
    assert.ok(out.includes(`import {BarChart} from "@d3plus/vue";`));
    assert.ok(
      out.includes(`<BarChart :config="config" style="height: 320px" />`),
    );
    const {descriptor, errors} = parseVue(out);
    assert.deepEqual(errors, []);
    assert.doesNotThrow(() => compileScript(descriptor, {id: "x"}));
  });
  it("svelte uses the action with the core class and compiles", () => {
    const out = svelte(input);
    assert.ok(out.includes(`  import {d3plus} from "@d3plus/svelte";`));
    assert.ok(out.includes(`  import {BarChart} from "@d3plus/core";`));
    assert.ok(out.includes("use:d3plus={{constructor: BarChart, config}}"));
    assert.doesNotThrow(() => compileSvelte(out, {generate: "client"}));
  });
  it("element registers the tags and sets the config property", () => {
    const out = element(input);
    assert.ok(
      out.startsWith(
        `<d3plus-bar-chart id="chart" style="height: 320px"></d3plus-bar-chart>`,
      ),
    );
    assert.ok(
      out.includes(`document.getElementById("chart").config = config;`),
    );
    const script = out.match(/<script type="module">\n([\s\S]*)<\/script>/)[1];
    parses(script, "js");
  });
  it("angular declares a standalone component around the config", () => {
    const out = angular(input);
    assert.ok(
      out.includes(`import {D3plusVizComponent} from "@d3plus/angular";`),
    );
    assert.ok(
      out.includes(`[viz]="BarChart" [config]="config" style="height: 320px"`),
    );
    assert.ok(out.includes("readonly config = config;"));
    parses(out, "ts");
  });
  it("every flavor defaults to a 400px chart", () => {
    for (const flavor of FLAVORS)
      assert.ok(flavor.render({name: "Pie", code}).includes("400"), flavor.id);
  });
  it("lists the six flavors in tab order with unique labels", () => {
    assert.deepEqual(
      FLAVORS.map(f => f.id),
      ["javascript", "react", "vue", "svelte", "element", "angular"],
    );
    assert.equal(new Set(FLAVORS.map(f => f.label)).size, 6);
  });
});
