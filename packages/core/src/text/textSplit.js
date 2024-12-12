import {default as stringify} from "./stringify";
import {default as combiningMarks} from "./combiningMarks";
import {merge} from "d3-array";

const splitChars = ["-", ";", ":", "&", "|",
  "u0E2F", // thai character pairannoi
  "u0EAF", // lao ellipsis
  "u0EC6", // lao ko la (word repetition)
  "u0ECC", // lao cancellation mark
  "u104A", // myanmar sign little section
  "u104B", // myanmar sign section
  "u104C", // myanmar symbol locative
  "u104D", // myanmar symbol completed
  "u104E", // myanmar symbol aforementioned
  "u104F", // myanmar symbol genitive
  "u2013", // en dash
  "u2014", // em dash
  "u2027", // simplified chinese hyphenation point
  "u3000", // simplified chinese ideographic space
  "u3001", // simplified chinese ideographic comma
  "u3002", // simplified chinese ideographic full stop
  "uFF0C", // full-width comma
  "uFF5E"  // wave dash
];

const prefixChars = ["'", "<", "(", "{", "[",
  "u00AB", // left-pointing double angle quotation mark
  "u300A", // left double angle bracket
  "u3008"  // left angle bracket
];

const suffixChars = ["'", ">", ")", "}", "]", ".", "!", "?", "/",
  "u00BB", // right-pointing double angle quotation mark
  "u300B", // right double angle bracket
  "u3009"  // right angle bracket
].concat(splitChars);

const burmeseRange = "\u1000-\u102A\u103F-\u1049\u1050-\u1055";
const japaneseRange = "\u3040-\u309f\u30a0-\u30ff\uff00-\uff0b\uff0d-\uff5d\uff5f-\uff9f\u3400-\u4dbf";
const chineseRange = "\u3400-\u9FBF";
const laoRange = "\u0E81-\u0EAE\u0EB0-\u0EC4\u0EC8-\u0ECB\u0ECD-\u0EDD";

const noSpaceRange = burmeseRange + chineseRange + japaneseRange + laoRange;

// eslint-disable-next-line no-misleading-character-class
const splitWords = new RegExp(`(\\${splitChars.join("|\\")})*[^\\s|\\${splitChars.join("|\\")}]*(\\${splitChars.join("|\\")})*`, "g");
// eslint-disable-next-line no-misleading-character-class
const noSpaceLanguage = new RegExp(`[${noSpaceRange}]`);
const splitAllChars = new RegExp(`(\\${prefixChars.join("|\\")})*[${noSpaceRange}](\\${suffixChars.join("|\\")}|\\${combiningMarks.join("|\\")})*|[a-z0-9]+`, "gi");

/**
    @function textSplit
    @desc Splits a given sentence into an array of words.
    @param {String} sentence
*/
export default function(sentence) {
  if (!noSpaceLanguage.test(sentence)) return stringify(sentence).match(splitWords).filter(w => w.length);
  return merge(stringify(sentence).match(splitWords).map(d => {
    if (noSpaceLanguage.test(d)) return d.match(splitAllChars);
    return [d];
  }));
}

export {prefixChars, splitChars, splitWords, suffixChars};
