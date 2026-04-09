import assert from "assert";
import {default as textWrap} from "../es/src/textWrap.js";
import it from "./jsdom.js";

it("textWrap", () => {
  const font = "Verdana";

  const sentence = "Hello D3plus, please wrap this sentence for me.",
    testWrap = textWrap().fontFamily(font).fontSize(14)(sentence);

  assert.ok(
    testWrap.lines[0] === "Hello D3plus, please wrap this" &&
      testWrap.lines[1] === "sentence for me.",
    "returning wrapped lines",
  );
  assert.strictEqual(
    testWrap.sentence,
    "Hello D3plus, please wrap this sentence for me.",
    "returning original sentence",
  );
  assert.strictEqual(testWrap.truncated, false, "returning truncated boolean");

  const spaceTest = "Two  Space Test",
    spaceWrap = textWrap().fontFamily(font).fontSize(14)(spaceTest);
  assert.strictEqual(
    spaceWrap.lines[0],
    spaceTest,
    "catch for multiple spaces",
  );

  assert.strictEqual(
    textWrap()("A\nB").lines[0],
    "A",
    "catch for literal line break (\\n)",
  );

  const truncResult = textWrap().fontFamily(font).fontSize(14).width(200).height(14)("This is a very long sentence that should definitely be truncated at some point.");
  assert.strictEqual(truncResult.truncated, true, "truncated when height is too small");

  const maxLinesResult = textWrap().fontFamily(font).fontSize(14).maxLines(1)("Hello D3plus, please wrap this sentence for me.");
  assert.strictEqual(maxLinesResult.lines.length, 1, "maxLines limits output to 1 line");
  assert.strictEqual(maxLinesResult.truncated, true, "maxLines truncates remaining text");

  const nonString = textWrap()(42);
  assert.strictEqual(nonString.sentence, "42", "non-string input is stringified");

  const undefInput = textWrap()(undefined);
  assert.strictEqual(undefInput.sentence, "undefined", "undefined input is stringified");

  const overflowResult = textWrap().fontFamily(font).fontSize(14).width(5).overflow(false)("Superlongword");
  assert.strictEqual(overflowResult.truncated, true, "overflow false truncates wide word");

  const getters = textWrap().fontFamily(font).fontSize(14);
  assert.strictEqual(getters.fontFamily(), font, "fontFamily getter");
  assert.strictEqual(getters.fontSize(), 14, "fontSize getter");
  assert.strictEqual(getters.fontWeight(), 400, "fontWeight getter");
  assert.strictEqual(getters.overflow(), false, "overflow getter");
  assert.strictEqual(getters.maxLines(), null, "maxLines getter");
});
