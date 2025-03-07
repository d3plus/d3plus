import assert from "assert";
import {default as textWrap} from "../src/textWrap.js";
import it from "./jsdom.js";

it("textWrap", () => {

  const font = "Verdana";

  const sentence = "Hello D3plus, please wrap this sentence for me.",
        testWrap = textWrap().fontFamily(font).fontSize(14)(sentence);

  assert.ok(testWrap.lines[0] === "Hello D3plus, please wrap" &&
            testWrap.lines[1] === "this sentence for me.", "returning wrapped lines");
  assert.strictEqual(testWrap.sentence, "Hello D3plus, please wrap this sentence for me.", "returning original sentence");
  assert.strictEqual(testWrap.truncated, false, "returning truncated boolean");

  const spaceTest = "Two  Space Test",
        spaceWrap = textWrap().fontFamily(font).fontSize(14)(spaceTest);
  assert.strictEqual(spaceWrap.lines[0], spaceTest, "catch for multiple spaces");

  assert.strictEqual(textWrap()("A\nB").lines[0], "A", "catch for literal line break (\\n)");

});
