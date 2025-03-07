import assert from "assert";
import {default as textSplit, splitChars} from "../src/textSplit.js";

it("textSplit", () => {

  for (let i = 0; i < splitChars.length; i++) {
    let char = splitChars[i];
    if (char.startsWith("u")) char = String.fromCharCode(`0x${char.slice(1)}`);
    const sentence = `test${char}test`;
    const arr = textSplit(sentence);
    const first = char === " " ? "test" : `test${char}`;
    assert.ok(arr[0] === first && arr[1] === "test", `using "${char}"`);
  }

  assert.strictEqual(textSplit("-4")[0], "-4", "string starting with split character");
  assert.strictEqual(textSplit("This & That")[1], "&", "solo split character");

  const chinese = textSplit("里句。");
  assert.ok(chinese[0] === "里" && chinese[1] === "句。", "simplified chinese");

  const burmese = textSplit("ကြောယ်။");
  assert.ok(burmese[0] === "ကြော" && burmese[1] === "ယ်။", "burmese");

  const japanese = textSplit("暑い。");
  assert.ok(japanese[0] === "暑" && japanese[1] === "い。", "japanese");

  const lao = textSplit("ຕໍ່ດ້.");
  assert.ok(lao[0] === "ຕໍ່" && lao[1] === "ດ້.", "lao");

});
