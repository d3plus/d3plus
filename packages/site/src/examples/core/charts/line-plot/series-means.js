const data = [];
["Alpha", "Beta", "Gamma"].forEach((id, k) => {
  for (let year = 2010; year <= 2022; year++) {
    const i = year - 2010;
    data.push({
      id,
      year,
      value: 20 + k * 18 + i * (k + 1) + ((i * (k + 3)) % 7) * 3,
    });
  }
});

const config = {
  data,
  groupBy: "id",
  x: "year",
  y: "value",
  referenceLines: [
    {y: "mean", perSeries: true, dash: true, labelPosition: "start"},
  ],
  annotations: [
    {
      shape: "Callout",
      select: "last",
      perSeries: true,
      label: d => `${d.id}: ${d.y}`,
      dx: -40,
      dy: -30,
      marker: "dot",
    },
  ],
};
