import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {colorsIn, display, isColor} from "../src/components/Calls/display.ts";
import {MODULES, load} from "../src/components/Calls/modules.ts";
import {prepare, run} from "../src/components/Calls/prepare.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const code = `import {formatAbbreviate} from "@d3plus/format";
import * as color from "@d3plus/color";

const n = 1234;
formatAbbreviate(n);
color.colorLighter("#ff0000");
`;

describe("prepare", () => {
  it("collects named and namespace imports", () => {
    assert.deepEqual(prepare(code).imports, {
      "@d3plus/format": {formatAbbreviate: "formatAbbreviate"},
      "@d3plus/color": {color: "*"},
    });
  });

  it("lists each top-level expression as a call", () => {
    assert.deepEqual(
      prepare(code).calls.map(c => c.source),
      ["formatAbbreviate(n)", 'color.colorLighter("#ff0000")'],
    );
  });

  it("drops the imports and wraps each call to report its value", () => {
    const {body} = prepare(code);
    assert.ok(!body.includes("import"));
    assert.ok(body.includes("const n = 1234;"));
    assert.ok(body.includes("__show(0, () => (formatAbbreviate(n)));"));
  });

  it("notices code that draws into container", () => {
    assert.equal(prepare(code).usesContainer, false);
    assert.equal(prepare(`container.append("p");`).usesContainer, true);
  });

  it("throws on a syntax error", () => {
    assert.throws(() => prepare("formatAbbreviate(("));
  });
});

describe("run", () => {
  it("reports each call's value, with imports and container in scope", async () => {
    const prepared = prepare(`import {x} from "m";
x + 1;
container.textContent = "drawn";
Promise.resolve(x * 2);`);
    const outcomes = [];
    const box = document.createElement("div");
    const failed = await run(prepared, {m: {x: 2}}, box, (i, o) => {
      outcomes[i] = o;
    });
    assert.equal(failed, undefined);
    assert.deepEqual(outcomes, [{value: 3}, {value: "drawn"}, {value: 4}]);
    assert.equal(box.textContent, "drawn");
  });

  it("reports a call that throws, and keeps going", async () => {
    const outcomes = [];
    await run(prepare(`null.x;\n1 + 1;`), {}, null, (i, o) => {
      outcomes[i] = o;
    });
    assert.ok("error" in outcomes[0]);
    assert.deepEqual(outcomes[1], {value: 2});
  });

  it("shows what the code logs instead of logging it", async () => {
    const logs = [];
    const before = console.warn;
    await run(
      prepare(`console.warn("careful", 2);\nconsole.error("bad");`),
      {},
      null,
      () => {},
      entry => logs.push(entry),
    );
    assert.deepEqual(logs, [
      {level: "warn", message: "careful 2"},
      {level: "error", message: "bad"},
    ]);
    assert.equal(console.warn, before, "restores the console");
  });

  it("returns an error outside a call, or a module it lacks", async () => {
    assert.match(await run(prepare(`const a = b;`), {}, null, () => {}), /b/);
    assert.equal(
      await run(prepare(`import {a} from "nope";`), {}, null, () => {}),
      "Can't load nope here.",
    );
  });
});

describe("display", () => {
  it("shows strings quoted and other primitives as written", () => {
    assert.deepEqual(display("1.23k"), {text: '"1.23k"'});
    assert.deepEqual(display(42), {text: "42"});
    assert.deepEqual(display(NaN), {text: "NaN"});
    assert.deepEqual(display(undefined), {text: "undefined"});
  });

  it("prints short collections on one line, longer ones indented", () => {
    assert.equal(display([1, 2]).text, "[1, 2]");
    assert.equal(display({a: 1, "b c": "x"}).text, '{a: 1, "b c": "x"}');
    const long = display({
      name: "a".repeat(40),
      points: [
        [1, 2],
        [3, 4],
      ],
    });
    assert.equal(
      long.text,
      `{\n  name: "${"a".repeat(40)}",\n  points: [[1, 2], [3, 4]]\n}`,
    );
  });

  it("shows functions by name and class instances by class", () => {
    assert.equal(display(function lerp() {}).text, "ƒ lerp");
    class Scale {}
    assert.equal(display(new Scale()).text, "Scale {…}");
    assert.equal(display(new Map([["a", 1]])).text, "{a: 1}");
  });

  it("marks only a value inside itself as circular", () => {
    const point = [0, 0];
    assert.equal(display([point, point]).text, "[[0, 0], [0, 0]]");
    const loop = {};
    loop.self = loop;
    assert.equal(display(loop).text, "{self: [Circular]}");
  });

  it("adds swatches for a color or a list of them", () => {
    assert.deepEqual(display("#ff0000").swatches, ["#ff0000"]);
    assert.deepEqual(display(["rgb(0, 0, 0)", "#fff"]).swatches, [
      "rgb(0, 0, 0)",
      "#fff",
    ]);
    assert.equal(display("red").swatches, undefined);
  });

  it("shows an element, or a d3 selection's, as its markup", () => {
    const el = document.createElement("b");
    el.textContent = "x";
    assert.equal(display(el).text, "<b>x</b>");
    assert.equal(display({node: () => el}).text, "<b>x</b>");
  });

  it("recognizes colors written as hex or a color function", () => {
    assert.ok(isColor("#abc"));
    assert.ok(isColor("hsl(120, 50%, 50%)"));
    assert.ok(!isColor("#ggg"));
    assert.ok(!isColor(12));
  });
});

describe("load", () => {
  it("loads the modules example code imports", async () => {
    const {"@d3plus/format": format} = await load(["@d3plus/format"]);
    assert.equal(typeof format.formatAbbreviate, "function");
  });

  it("refuses a module that can't run in the browser", async () => {
    assert.ok(!("@d3plus/ssr" in MODULES));
    await assert.rejects(load(["@d3plus/ssr"]), /Can't load @d3plus\/ssr/);
  });
});

describe("colorsIn", () => {
  it("finds the colors a call passes in", () => {
    assert.deepEqual(colorsIn('colorLegible("#aaddff")'), ["#aaddff"]);
    assert.deepEqual(colorsIn(`colorAdd('#f00', "rgb(0, 0, 255)", 0.5)`), [
      "#f00",
      "rgb(0, 0, 255)",
    ]);
  });

  it("skips strings that aren't colors", () => {
    assert.deepEqual(colorsIn('formatAbbreviate("1234")'), []);
    assert.deepEqual(colorsIn('assign({fill: "red"})'), []);
  });
});
