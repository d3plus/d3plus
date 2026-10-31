import {textWrap} from "@d3plus/text";

const wrap = textWrap().width(160).maxLines(2);
wrap(
  "The quick brown fox jumps over the lazy dog while the sun sets behind the hills.",
);
