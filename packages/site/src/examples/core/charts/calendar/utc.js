const config = {
  data: (() => {
    const rows = [];
    for (let d = 1; d <= 31; d++) {
      // Each day's value is stored at UTC midnight, as a timestamp.
      rows.push({date: Date.UTC(2024, 2, d), value: (d * 7) % 11});
    }
    return rows;
  })(),
  period: "month",
  utc: true,
};
