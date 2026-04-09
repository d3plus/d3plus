import assert from "assert";
import {default as textWidth} from "../es/src/textWidth.js";
import it from "./jsdom.js";

it("textWidth", () => {
  const font = "Verdana";

  const base = textWidth("Test", {"font-family": font, "font-size": 14}),
    bigger = textWidth("Test", {"font-family": font, "font-size": 28}),
    bolder = textWidth("Test", {
      "font-family": font,
      "font-size": 14,
      "font-weight": "bold",
    }),
    longer = textWidth("TestTest", {"font-family": font, "font-size": 14});

  assert.ok(base * 2 === longer, "string length");
  assert.ok(base < bigger, "font-size");
  assert.ok(base < bolder, "font-weight");

  const arrayResult = textWidth(["Test", "TestTest"], {"font-family": font, "font-size": 14});
  assert.ok(Array.isArray(arrayResult), "array input returns array");
  assert.strictEqual(arrayResult.length, 2, "array result has correct length");
  assert.ok(arrayResult[0] < arrayResult[1], "array widths reflect string lengths");

  assert.strictEqual(textWidth("", {"font-family": font, "font-size": 14}), 0, "empty string returns 0");

  const htmlWidth = textWidth("Test &amp; More", {"font-family": font, "font-size": 14});
  assert.ok(htmlWidth > 0, "HTML entities are decoded");

  const noStyle = textWidth("Test");
  assert.ok(noStyle > 0, "works without style parameter");

  const whitespace = textWidth("   ", {"font-family": font, "font-size": 14});
  assert.ok(typeof whitespace === "number", "whitespace-only string returns a number");
});
