const config = {
  data: (() => {
    const out = [];
    for (let d = 1; d <= 14; d++) {
      // Each day's value is stored at UTC midnight.
      const date = Date.UTC(2024, 2, d);
      out.push({id: "Visits", date, value: 40 + ((d * 7) % 13)});
      out.push({id: "Signups", date, value: 12 + ((d * 5) % 9)});
    }
    return out;
  })(),
  groupBy: "id",
  x: "date",
  time: "date",
  timeline: false,
  xConfig: {utc: true},
  y: "value",
};
