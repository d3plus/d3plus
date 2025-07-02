import LineBreaker from "linebreak";

/**
    @function textSplit
    @desc Splits a given sentence into an array of words.
    @param {String} sentence
*/
export default function(sentence) {

  const breaker = new LineBreaker(sentence);

  let bk, last, words = [];
  while (bk = breaker.nextBreak()) {
    const word = sentence.slice(last, bk.position);
    words.push(word);
    last = bk.position;
  }
  
  return words;
}
