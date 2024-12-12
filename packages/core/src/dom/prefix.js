/**
    @function prefix
    @desc Returns the appropriate CSS vendor prefix, given the current browser.
*/
export default function() {
  if ("-webkit-transform" in document.body.style) return "-webkit-";
  else if ("-moz-transform" in document.body.style) return "-moz-";
  else if ("-ms-transform" in document.body.style) return "-ms-";
  else if ("-o-transform" in document.body.style) return "-o-";
  else return "";
}
