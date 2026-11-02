const config = {
  data: "/data/fruits.csv",
  // Draws only the sweet fruits, and titles the chart from the loaded rows.
  dataFormat: rows => {
    const sweet = rows.filter(d => d.sweet);
    return {
      data: sweet,
      title: `${sweet.length} of ${rows.length} fruits are sweet`,
    };
  },
  groupBy: "name",
  x: "name",
  y: "calories",
};
