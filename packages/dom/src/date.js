/**
    @function date
    @summary Parses numbers and strings to valid Javascript Date objects.
    @description Returns a javascript Date object for a given a Number (representing either a 4-digit year or milliseconds since epoch), a String representing a Quarter (ie. "Q2 1987", mapping to the last day in that quarter), or a String that is in [valid dateString format](http://dygraphs.com/date-formats.html). Besides the 4-digit year parsing, this function is useful when needing to parse negative (BC) years, which the vanilla Date object cannot parse.
    @param {Number|String} *date*
*/
export default function (d) {
  // returns if falsey or already Date object
  if ([false, undefined, NaN].includes(d) || d.constructor === Date) return d;
  // detects if milliseconds
  else if (d.constructor === Number && `${d}`.length > 5 && d % 1 === 0)
    return new Date(d);

  let s = `${d}`;

  // tests for MM/DD/YYYY and MM-DD-YYYY format
  const dayFormat = new RegExp(/^\d{1,2}[./-]\d{1,2}[./-](-*\d{1,4})$/g).exec(
    s
  );
  if (dayFormat) {
    const year = dayFormat[1];
    if (year.indexOf("-") === 0) s = s.replace(year, year.substring(1));
    const date = new Date(s);
    date.setFullYear(year);
    return date;
  }

  // tests for full Date object string format
  const strFormat = new RegExp(
    /^[A-z]{1,3} [A-z]{1,3} \d{1,2} (-*\d{1,4}) \d{1,2}:\d{1,2}:\d{1,2} [A-z]{1,3}-*\d{1,4} \([A-z]{1,3}\)/g
  ).exec(s);
  if (strFormat) {
    const year = strFormat[1];
    if (year.indexOf("-") === 0) s = s.replace(year, year.substring(1));
    const date = new Date(s);
    date.setFullYear(year);
    return date;
  }

  // tests for quarterly formats (ie. "QX YYYY" and "YYYY QX")
  const quarterPrefix = new RegExp(
    /^([qQ]{1}[1-4]{1}|[1-4]{1}[qQ]{1})[\s|-]{0,1}(-*\d{1,4})$/g
  ).exec(s);
  const quarterSuffix = new RegExp(
    /^(-*\d{1,4})[\s|-]{0,1}([qQ]{1}[1-4]{1}|[1-4]{1}[qQ]{1})$/g
  ).exec(s);
  if (quarterPrefix || quarterSuffix) {
    const quarter = +(quarterPrefix ? quarterPrefix[1] : quarterSuffix[2])
      .toLowerCase()
      .replace("q", "");
    const year = +(quarterPrefix ? quarterPrefix[2] : quarterSuffix[1]);
    const date = new Date(year, quarter * 3 - 3, 1);
    date.setFullYear(year);
    return date;
  }

  // tests for monthly formats (ie. "MM-YYYY" and "YYYY-MM")
  const monthPrefix = new RegExp(/^([-*\d]{1,2})\-(-*\d{1,4})$/g).exec(s);
  const monthSuffix = new RegExp(/^(-*\d{1,4})\-([-*\d]{1,2})$/g).exec(s);
  if (monthPrefix || monthSuffix) {
    const month = +(monthPrefix ? monthPrefix[1] : monthSuffix[2]);
    const year = +(monthPrefix ? monthPrefix[2] : monthSuffix[1]);
    const date = new Date(year, month - 1, 1);
    date.setFullYear(year);
    return date;
  }

  // detects if only passing a year value
  if (
    !s.includes("/") &&
    !s.includes(" ") &&
    (!s.includes("-") || !s.indexOf("-"))
  ) {
    const date = new Date(+s, 0, 1);
    date.setFullYear(d);
    return date;
  }

  const iso8601 = new RegExp(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/g
  ).exec(s);
  if (iso8601) return new Date(s);

  // falls back to Date object, replacing hyphens with slashes
  return new Date(s.replace(/-/g, "/"));
}
