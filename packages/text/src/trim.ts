/**
    Cross-browser implementation of [trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim).
    @param str The string to trim.
*/
function trim(str: string): string {
  return str.toString().replace(/^\s+|\s+$/g, "");
}

/**
    Cross-browser implementation of [trimLeft](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimLeft).
    @param str The string to trim.
*/
function trimLeft(str: string): string {
  return str.toString().replace(/^\s+/, "");
}

/**
    Cross-browser implementation of [trimRight](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/TrimRight).
    @param str The string to trim.
*/
function trimRight(str: string): string {
  return str.toString().replace(/\s+$/, "");
}

export {trim, trimLeft, trimRight};
