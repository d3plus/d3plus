import {textWrap} from "@d3plus/text";

const wrap = textWrap().width(160);
wrap("Justified text spreads the words of each line apart.").lineWords;
