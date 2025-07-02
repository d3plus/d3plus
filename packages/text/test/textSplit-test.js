import assert from "assert";
import {default as textSplit} from "../src/textSplit.js";

it("textSplit", () => {

  assert.strictEqual(textSplit("-4")[0], "-4", "string starting with split character");
  assert.strictEqual(textSplit("This & That")[1], "& ", "solo split character");

  const chinese = textSplit("“里句。”");
  assert.ok(chinese[0] === "“里" && chinese[1] === "句。”", "simplified chinese");

  const japanese = textSplit("暑い。");
  assert.ok(japanese[0] === "暑" && japanese[1] === "い。", "japanese");

  const emojis = textSplit("🐉️🧚🏻‍♀️🧚🏻‍♂️");
  assert.ok(emojis[0] === "🐉️" && emojis[1] === "🧚🏻‍♀️", "emojis persist");

});
