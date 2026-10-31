const config = {
  data: (() => {
    // Daily sensor readings with June missing.
    const out = [];
    for (let i = 0; i < 120; i++) {
      const date = new Date(2024, 4, 1 + i);
      if (date.getMonth() === 5) continue;
      const value = 20 + Math.sin(i / 6) * 4;
      out.push({sensor: "Sensor", date, value: Math.round(value * 100) / 100});
    }
    return out;
  })(),
  groupBy: "sensor",
  x: "date",
  xConfig: {
    rangeBreaks: {bounds: [new Date(2024, 5, 1), new Date(2024, 6, 1)]},
  },
  y: "value",
};
