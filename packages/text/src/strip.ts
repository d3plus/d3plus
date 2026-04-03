// great unicode list: http://asecuritysite.com/coding/asc2

const diacritics: [RegExp, string][] = [
  [/[\xc0-\xc5]/g, "A"],
  [/[\xe0-\xe5]/g, "a"],
  [/[\xc6]/g, "AE"],
  [/[\xe6]/g, "ae"],
  [/[\xdf]/g, "B"],
  [/[\xc7]/g, "C"],
  [/[\xe7]/g, "c"],
  [/[\xd0\xde\xfe]/g, "D"],
  [/[\xf0]/g, "d"],
  [/[\xc8-\xcb]/g, "E"],
  [/[\xe8-\xeb]/g, "e"],
  [/[\xcc-\xcf]/g, "I"],
  [/[\xec-\xef]/g, "i"],
  [/[\xd1]/g, "N"],
  [/[\xf1]/g, "n"],
  [/[\u014c\xd2-\xd6\xd8]/g, "O"],
  [/[\u014d\xf2-\xf6\xf8]/g, "o"],
  [/[\u016a\xd9-\xdc]/g, "U"],
  [/[\u016b\xf9-\xfc]/g, "u"],
  [/[\xd7]/g, "x"],
  [/[\xdd]/g, "Y"],
  [/[\xfd\xff]/g, "y"],
];

/**
    Removes all non ASCII characters from a string.
    @param value The HTML string to strip.
    @param spacer The character to replace whitespace with.
*/
export default function (value: string, spacer: string = "-"): string {
  return `${value}`.replace(/[^A-Za-z0-9\-_\u0621-\u064A]/g, (char: string) => {
    if (char === " ") return spacer;

    let ret: string | false = false;
    for (let d = 0; d < diacritics.length; d++) {
      if (new RegExp(diacritics[d][0]).test(char)) {
        ret = diacritics[d][1];
        break;
      }
    }

    return ret || "";
  });
}
