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
    [0, 5000000],
    [0, 36],
    "d3.scaleSqrt().domain([0, 5e6]).range([0, 36])",
  ),
  values: [5000000, 2500000, 1000000, 250000],
  tickFormat: d => `$${d / 1e6}M`,
  title: "Annual Revenue",
};
