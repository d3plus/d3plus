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
    [10, 1000],
    [4, 40],
    "d3.scaleSqrt().domain([10, 1000]).range([4, 40])",
  ),
  title: "Population",
};
