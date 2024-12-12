/**
 * Strips HTML and "un-escapes" escape characters.
 * @param {String} input
 */
function htmlDecode(input) {
  if (input.replace(/\s+/g, "") === "") return input;
  const doc = new DOMParser().parseFromString(input.replace(/<[^>]+>/g, ""), "text/html");
  return doc.documentElement ? doc.documentElement.textContent : input;
}


/**
    @function textWidth
    @desc Given a text string, returns the predicted pixel width of the string when placed into DOM.
    @param {String|Array} text Can be either a single string or an array of strings to analyze.
    @param {Object} [style] An object of CSS font styles to apply. Accepts any of the valid [CSS font property](http://www.w3schools.com/cssref/pr_font_font.asp) values.
*/
export default function(text, style) {

  style = Object.assign({
    "font-size": 10,
    "font-family": "sans-serif",
    "font-style": "normal",
    "font-weight": 400,
    "font-variant": "normal"
  }, style);

  const context = document.createElement("canvas").getContext("2d");

  const font = [];
  font.push(style["font-style"]);
  font.push(style["font-variant"]);
  font.push(style["font-weight"]);
  font.push(typeof style["font-size"] === "string" ? style["font-size"] : `${style["font-size"]}px`);
  font.push(style["font-family"]);

  context.font = font.join(" ");

  if (text instanceof Array) return text.map(t => context.measureText(htmlDecode(t)).width);
  return context.measureText(htmlDecode(text)).width;

}
