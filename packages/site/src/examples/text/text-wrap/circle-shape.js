import {textWrap} from "@d3plus/text";

const wrap = textWrap().shape("circle").width(220).height(220).fontSize(14);
wrap(
  "The quick brown fox jumps over the lazy dog while the sun sets behind the hills.",
);
