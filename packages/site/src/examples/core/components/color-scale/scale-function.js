const skewed = [
  {value: 200},
  {value: 1000},
  {value: 2000},
  {value: 2010},
  {value: 2020},
  {value: 2030},
  {value: 2040},
  {value: 2100},
  {value: 6400},
];

const pickScale = (values, [min, max]) => (max - min > 5 ? "jenks" : "linear");

const config = {
  data: skewed,
  scale: pickScale,
  height: 100,
  width: 500,
};
