const config = {
  data: (() => {
    // Half-hourly prices from 9:30 to 15:30 on two weeks of trading days.
    const out = [];
    let price = 50;
    for (let d = 0; d < 14; d++) {
      const day = new Date(2024, 3, 1 + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      for (let h = 9.5; h < 16; h += 0.5) {
        const date = new Date(day);
        date.setHours(Math.floor(h), (h % 1) * 60);
        price += Math.sin(d * 13 + h * 2) * 0.4;
        out.push({ticker: "ACME", date, price: Math.round(price * 100) / 100});
      }
    }
    return out;
  })(),
  groupBy: "ticker",
  x: "date",
  xConfig: {rangeBreaks: ["weekends", {hours: [16, 9.5]}]},
  y: "price",
};
