const config = {
  data: (() => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const round = v => Math.round(v * 100) / 100;
    const rows = [];
    const day = new Date(2024, 0, 1);
    let price = 120,
      n = 0;
    while (n < 30) {
      if (day.getDay() % 6) {
        const date = [day.getFullYear(), day.getMonth() + 1, day.getDate()]
          .map(v => String(v).padStart(2, "0"))
          .join("-");
        for (let hour = 10; hour <= 16; hour++) {
          const open = price;
          price = open * (1 + (random() - 0.49) * 0.012);
          rows.push({
            symbol: "ACME",
            day: date,
            time: date + "T" + hour + ":00",
            open: round(open),
            high: round(Math.max(open, price) * (1 + random() * 0.004)),
            low: round(Math.min(open, price) * (1 - random() * 0.004)),
            close: round(price),
          });
        }
        n++;
      }
      day.setDate(day.getDate() + 1);
    }
    return rows;
  })(),
  groupBy: "symbol",
  x: "day",
};
