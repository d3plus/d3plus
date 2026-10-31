const config = {
  data: (() => {
    const rows = [];
    [["ACME", 120]].forEach(([symbol, start], k) => {
      let seed = 11 + k * 12;
      const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const day = new Date(2024, 0, 1);
      let close = start,
        n = 0;
      while (n < 60) {
        if (day.getDay() % 6) {
          const open = close * (1 + (random() - 0.5) * 0.02);
          close = open * (1 + (random() - 0.48) * 0.04);
          const round = v => Math.round(v * 100) / 100;
          rows.push({
            symbol,
            date: [day.getFullYear(), day.getMonth() + 1, day.getDate()]
              .map(v => String(v).padStart(2, "0"))
              .join("-"),
            open: round(open),
            high: round(Math.max(open, close) * (1 + random() * 0.015)),
            low: round(Math.min(open, close) * (1 - random() * 0.015)),
            close: round(close),
          });
          n++;
        }
        day.setDate(day.getDate() + 1);
      }
    });
    return rows;
  })().map((d, i) => ({
    ...d,
    volume: Math.round(
      1e6 *
        (1 +
          ((i * 7919) % 13) / 13 +
          (Math.abs(d.close - d.open) / d.open) * 60),
    ),
  })),
  groupBy: "symbol",
  volume: "volume",
};
