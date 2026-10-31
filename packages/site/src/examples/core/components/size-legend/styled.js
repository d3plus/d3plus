const sqrtScale = (domain, range, label) => {
  const [d0, d1] = domain.map(Math.sqrt);
  const scale = v =>
    range[0] + ((Math.sqrt(v) - d0) / (d1 - d0)) * (range[1] - range[0]);
  scale.domain = () => domain;
  scale.invert = r =>
    (((r - range[0]) / (range[1] - range[0])) * (d1 - d0) + d0) ** 2;
  return scale;
};

const config = {
  scale: sqrtScale(
    [1, 100],
    [3, 30],
    "d3.scaleSqrt().domain([1, 100]).range([3, 30])",
  ),
  shapeConfig: {
    fill: "#4269d0",
    fillOpacity: 0.15,
    stroke: "#4269d0",
    strokeWidth: 1.5,
  },
  lineConfig: {stroke: "#4269d0", strokeDasharray: [2, 2]},
  labelConfig: {fontColor: "#4269d0", fontSize: 12},
  title: "Score",
  titleConfig: {fontColor: "#4269d0"},
};
