import assert from "assert";
import {default as Axis} from "../src/Axis.js";
import it from "./jsdom.js";
import analyze from "./Axis-analyze.js";
import fs from "fs";
const configs = JSON.parse(fs.readFileSync("test/Axis-configs.json", {encoding: 'utf-8'}));
const expected = JSON.parse(fs.readFileSync("test/Axis-expected.json", {encoding: 'utf-8'}));
const height = 150;
const widths = [200, 400, 600];

it("Axis", function() {

  for (const test in configs) {

    for (let i = 0; i < widths.length; i++) {

      const width = widths[i];

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = `${test}-${width}`;
      svg.setAttribute("width", width + "px");
      svg.setAttribute("height", height + "px");
      svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
      document.body.appendChild(svg);
  
      new Axis()
        .duration(0)
        .select(`#${svg.id}`)
        .width(width)
        .height(height)
        .config(configs[test])
        .render(() => {
          assert.strictEqual(JSON.stringify(analyze(svg)), JSON.stringify(expected[svg.id]), svg.id);
        });

    }

  }

});
