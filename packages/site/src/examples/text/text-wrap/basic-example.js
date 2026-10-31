import {textWrap} from "@d3plus/text";

const wrap = textWrap().width(200);
wrap(
  "The quick brown fox jumps over the lazy dog while the sun sets behind the hills.",
);
