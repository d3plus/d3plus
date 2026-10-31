const config = {
  domain: [2000, 2020],
  height: 100,
  tickFormat: d =>
    `'${String(d instanceof Date ? d.getFullYear() : d).slice(-2)}`,
  ticks: [2000, 2004, 2008, 2012, 2016, 2020],
  width: 520,
};
