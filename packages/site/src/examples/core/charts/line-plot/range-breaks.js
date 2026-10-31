const config = {
  data: (() => {
    // Jan 15 and Feb 19 are market holidays.
    const holidays = [14, 49];
    const out = [];
    let close = 180;
    for (let i = 0; i < 90; i++) {
      const date = new Date(2024, 0, 1 + i);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      if (weekend || holidays.includes(i)) continue;
      close += Math.sin(i / 6) * 2.5 + Math.cos(i / 2.3) * 1.2;
      out.push({ticker: "ACME", date, close: Math.round(close * 100) / 100});
    }
    return out;
  })(),
  groupBy: "ticker",
  x: "date",
  xConfig: {
    rangeBreaks: ["weekends", {values: ["2024-01-15", "2024-02-19"]}],
  },
  y: "close",
};
