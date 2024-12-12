import {suffixChars, default as textSplit} from "./textSplit";

const lowercase = ["a", "an", "and", "as", "at", "but", "by", "for", "from", "if", "in", "into", "near", "nor", "of", "on", "onto", "or", "per", "that", "the", "to", "with", "via", "vs", "vs."];
const uppercase = ["CEO", "CFO", "CNC", "COO", "CPU", "GDP", "HVAC", "ID", "IT", "R&D", "TV", "UI"];

/**
    @function titleCase
    @desc Capitalizes the first letter of each word in a phrase/sentence.
    @param {String} str The string to apply the title case logic.
*/
export default function(str) {

  if (str === void 0) return "";

  const smalls = lowercase.map(s =>  s.toLowerCase());

  let bigs = uppercase.slice();
  bigs = bigs.concat(bigs.map(b => `${b}s`));
  const biglow = bigs.map(b => b.toLowerCase());

  const split = textSplit(str);
  return split.map((s, i) => {
    if (s) {
      const lower = s.toLowerCase();
      const stripped = suffixChars.includes(lower.charAt(lower.length - 1)) ? lower.slice(0, -1) : lower;
      const bigindex = biglow.indexOf(stripped);
      if (bigindex >= 0) return bigs[bigindex];
      else if (smalls.includes(stripped) && i !== 0 && i !== split.length - 1) return lower;
      else return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    }
    else return "";
  }).reduce((ret, s, i) => {
    if (i && str.charAt(ret.length) === " ") ret += " ";
    ret += s;
    return ret;
  }, "");

}
