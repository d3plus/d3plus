const config = {
  data: [
    {id: "alpha", x: 4, y: 9},
    {id: "alpha", x: 5, y: 17},
    {id: "alpha", x: 6, y: 13},
    {id: "beta", x: 4, y: 17},
    {id: "beta", x: 5, y: 8},
    {id: "beta", x: 6, y: 16},
    {id: "gamma", x: 4, y: 14},
    {id: "gamma", x: 5, y: 9},
    {id: "gamma", x: 6, y: 11},
  ],
  groupBy: "id",
  lineLabels: true,
  shapeConfig: {
    Line: {
      label: function (d) {
        const dataArray = this._filteredData.filter(f => f.id === d.id);
        const maxX = Math.max(...dataArray.map(f => f.x));
        const maxData = dataArray.find(f => f.x === maxX);

        return `${maxData.y}`;
      },
    },
  },
  x: "x",
  y: "y",
};
