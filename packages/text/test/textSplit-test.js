import assert from "assert";
import {default as textSplit} from "../es/src/textSplit.js";
import it from "./jsdom.js";

it("textSplit", () => {
  assert.strictEqual(
    textSplit("-4")[0],
    "-4",
    "string starting with split character",
  );
  assert.strictEqual(textSplit("This & That")[1], "& ", "solo split character");

  const chinese = textSplit("\u201c里句。\u201d");
  assert.ok(
    chinese[0] === "\u201c里" && chinese[1] === "句。\u201d",
    "simplified chinese",
  );

  const japanese = textSplit("暑い。");
  assert.ok(japanese[0] === "暑" && japanese[1] === "い。", "japanese");

  const emojis = textSplit("🐉️🧚🏻‍♀️🧚🏻‍♂️");
  assert.ok(emojis[0] === "🐉️" && emojis[1] === "🧚🏻‍♀️", "emojis persist");

  const html = textSplit("this <b>and</b> that");
  assert.strictEqual(html[1], "<b>and</b> ", "html tags stay with words");

  const longWord = textSplit("supercalifragilisticexpialidocious");
  assert.ok(longWord.length > 1, "long words are hyphenated into syllables");
  assert.strictEqual(
    longWord.map(s => s.replace(/\u00AD/g, "")).join(""),
    "supercalifragilisticexpialidocious",
    "hyphenated syllables rejoin to original word",
  );
  assert.ok(
    longWord.slice(0, -1).every(s => s.endsWith("\u00AD")),
    "all syllables except the last end with a soft hyphen",
  );

  const shortWord = textSplit("hello world");
  assert.strictEqual(shortWord[0], "hello ", "short words are not hyphenated");

  const capitalized = textSplit("JavaScript");
  assert.strictEqual(capitalized[0], "JavaScript", "words with internal capitals are not hyphenated");

  const singleWord = textSplit("hi");
  assert.strictEqual(singleWord[0], "hi", "very short word stays intact");

  const empty = textSplit("");
  assert.ok(Array.isArray(empty), "empty string returns array");

  const withNewline = textSplit("line one\nline two");
  assert.ok(withNewline.length >= 2, "newline splits text");

  const mixedCjkLatin = textSplit("Hello世界Test");
  assert.ok(mixedCjkLatin.length >= 2, "mixed CJK and Latin are split");

  const multiSpace = textSplit("hello  world");
  assert.ok(multiSpace.length >= 1, "multiple spaces handled");

  const withHyphen = textSplit("well-known fact");
  assert.ok(withHyphen.length >= 1, "hyphenated compound word handled");
});
