const config = {
  data: (() => {
    const out = [];
    for (let m = 0; m < 12; m++) {
      const date = new Date(2024, m, 1);
      out.push({
        id: "Rainfall",
        date,
        value: 60 + Math.round(30 * Math.cos(m / 2)),
      });
    }
    return out;
  })(),
  groupBy: "id",
  x: "date",
  xConfig: {tickLabelPosition: "period"},
  y: "value",
};
