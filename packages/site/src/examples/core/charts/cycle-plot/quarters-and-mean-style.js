// Monthly retail sales (billions), 2015–2024, with a holiday peak and a
// dip in spring 2020. Rows in the same quarter and year merge, summing
// their months.
const season = [
  0.85, 0.82, 0.95, 0.97, 1.02, 1, 0.98, 1.01, 0.96, 1, 1.12, 1.4,
];
const sales = [];
for (let year = 2015; year <= 2024; year++) {
  season.forEach((factor, month) => {
    const dip = year === 2020 && month >= 2 && month <= 4 ? 0.75 : 1;
    const growth = 40 * 1.035 ** (year - 2015);
    sales.push({
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      sales: Math.round(growth * factor * dip * 10) / 10,
    });
  });
}

const config = {
  data: sales,
  period: "quarter",
  x: "month",
  y: "sales",
  meanConfig: {dash: true, strokeWidth: 2},
};
