// great unicode list: http://asecuritysite.com/coding/asc2

const diacritics = [
  [/[\300-\305]/g, "A"], [/[\340-\345]/g, "a"],
  [/[\306]/g, "AE"], [/[\346]/g, "ae"],
  [/[\337]/g, "B"],
  [/[\307]/g, "C"], [/[\347]/g, "c"],
  [/[\320\336\376]/g, "D"], [/[\360]/g, "d"],
  [/[\310-\313]/g, "E"], [/[\350-\353]/g, "e"],
  [/[\314-\317]/g, "I"], [/[\354-\357]/g, "i"],
  [/[\321]/g, "N"], [/[\361]/g, "n"],
  [/[\u014c\322-\326\330]/g, "O"], [/[\u014d\362-\366\370]/g, "o"],
  [/[\u016a\331-\334]/g, "U"], [/[\u016b\371-\374]/g, "u"],
  [/[\327]/g, "x"],
  [/[\335]/g, "Y"], [/[\375\377]/g, "y"]
];

/**
    @function strip
    @desc Removes all non ASCII characters from a string.
    @param {String} value
    @param {String} [spacer = "-"]
*/
export default function(value, spacer = "-") {

  return `${value}`.replace(/[^A-Za-z0-9\-_\u0621-\u064A]/g, char => {

    if (char === " ") return spacer;

    let ret = false;
    for (let d = 0; d < diacritics.length; d++) {
      if (new RegExp(diacritics[d][0]).test(char)) {
        ret = diacritics[d][1];
        break;
      }
    }

    return ret || "";

  });
}
