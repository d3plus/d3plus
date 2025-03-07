import assert from "assert";
import {default as TextBox} from "../../src/components/TextBox.js";
import it from "./../jsdom.js";

it("TextBox", function *() {

  assert.end();

  const height = 200,
        width = 200,
        x = 100,
        y = 100;

  let testBox;

  yield cb => {
    testBox = new TextBox()
      .data([{text: "Hello D3plus, please wrap this sentence for me."}])
      .fontSize(14)
      .height(height)
      .width(width)
      .x(x)
      .y(y)
      .render(cb);
  };

  assert.strictEqual(document.getElementsByTagName("svg").length, 1, "automatically added <svg> element to page");
  assert.strictEqual(document.getElementsByTagName("text").length, 1, "created <text> container element");
  assert.strictEqual(document.getElementsByTagName("tspan").length, 2, "created 2 <tspan> elements");

  let tspans = document.getElementsByTagName("tspan");
  assert.ok(tspans[0].textContent === "Hello D3plus, please wrap" &&
              tspans[1].textContent === "this sentence for me.", "wrapped text");

  const elem = document.getElementById("d3plus-textBox-0");
  let bbox = elem.getBBox();
  assert.ok(bbox.width <= width, "fit within width");
  assert.ok(bbox.height <= height, "fit within height");
  assert.strictEqual(Math.round(bbox.x), x, "x positioned correctly");

  const yP = 1;
  let y2 = y;
  assert.ok(y2 - yP <= bbox.y <= y + yP, "y positioned correctly (top)");



  yield cb => testBox.data([{text: "Hello <b>D3plus</b>, please <em>wrap this</em> sentence for me."}]).render(cb);

  tspans = document.getElementsByTagName("tspan");
  assert.ok(tspans[0].innerHTML === "Hello <tspan style=\"font-weight: bold;\">D3plus</tspan>, please <tspan style=\"font-style: italic;\">wrap</tspan>" &&
              tspans[1].innerHTML === "<tspan style=\"font-style: italic;\">this</tspan> sentence for me.", "HTML tag rendering");

  yield cb => testBox.data([{text: "Hello D3plus, please wrap this sentence for me."}]).verticalAlign("middle").render(cb);

  bbox = elem.getBBox();
  y2 = y + height / 2 - bbox.height / 2;
  assert.ok(y2 - yP <= bbox.y <= y + yP, "y positioned correctly (middle)");

  yield cb => testBox.verticalAlign("bottom").render(cb);

  bbox = elem.getBBox();
  y2 = y + height - bbox.height;
  assert.ok(y2 - yP <= bbox.y <= y + yP, "y positioned correctly (bottom)");

  yield cb => testBox.fontResize(true).verticalAlign("top").render(cb);

  tspans = document.getElementsByTagName("tspan");
  assert.ok(tspans[0].textContent === "Hello" &&
              tspans[1].textContent === "D3plus," &&
              tspans[2].textContent === "please" &&
              tspans[3].textContent === "wrap this" &&
              tspans[4].textContent === "sentence" &&
              tspans[5].textContent === "for me.", "font resizing");

});
