import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {inline, markdown} from "../src/lib/markdown.ts";

describe("inline", () => {
  it("renders code, bold, emphasis, and links", () => {
    assert.equal(
      inline("Use `a<b` **now**, *maybe* [docs](https://d3plus.org)."),
      'Use <code>a&lt;b</code> <strong>now</strong>, <em>maybe</em> <a href="https://d3plus.org">docs</a>.',
    );
  });
  it("leaves markup inside code alone", () => {
    assert.equal(inline("`**x**`"), "<code>**x**</code>");
  });
  it("drops links to anything but http, root, or hash URLs", () => {
    assert.equal(inline("[x](javascript:void)"), "x");
  });
  it("escapes HTML", () => {
    assert.equal(
      inline(`<img src=x onerror="y">`),
      "&lt;img src=x onerror=&quot;y&quot;&gt;",
    );
  });
});

describe("markdown", () => {
  it("joins wrapped lines into paragraphs", () => {
    assert.equal(markdown("one\ntwo\n\nthree"), "<p>one two</p>\n<p>three</p>");
  });
  it("renders fenced code verbatim", () => {
    assert.equal(
      markdown("Intro\n```js\nconst a = `x` < 1;\n```\nAfter"),
      "<p>Intro</p>\n<pre><code>const a = `x` &lt; 1;</code></pre>\n<p>After</p>",
    );
  });
  it("is empty for no text", () => {
    assert.equal(markdown(""), "");
  });
});
