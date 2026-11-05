import {textWrap} from "@d3plus/text";

const byWord = textWrap().width(115).maxLines(1).ellipsis("...");
byWord("Keep going until the box runs out of room");

const byCharacter = textWrap()
  .width(115)
  .maxLines(1)
  .ellipsis("...")
  .truncateWord(true);
byCharacter("Keep going until the box runs out of room");
