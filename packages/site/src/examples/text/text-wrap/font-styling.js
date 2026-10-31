import {textWrap} from "@d3plus/text";

const wrap = textWrap()
  .width(240)
  .fontSize(18)
  .fontWeight(700)
  .fontFamily("Inter");
wrap(
  "The quick brown fox jumps over the lazy dog while the sun sets behind the hills.",
);
