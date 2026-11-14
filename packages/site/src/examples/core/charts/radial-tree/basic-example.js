const data = [
  ["Africa", "Northern Africa", ["Egypt", "Morocco", "Algeria", "Tunisia"]],
  ["Africa", "Eastern Africa", ["Kenya", "Ethiopia", "Tanzania", "Uganda"]],
  ["Americas", "South America", ["Brazil", "Argentina", "Chile", "Peru"]],
  ["Americas", "Northern America", ["United States", "Canada", "Mexico"]],
  ["Asia", "Eastern Asia", ["China", "Japan", "South Korea", "Mongolia"]],
  ["Asia", "Southern Asia", ["India", "Pakistan", "Bangladesh", "Nepal"]],
  ["Europe", "Northern Europe", ["Sweden", "Norway", "Finland", "Iceland"]],
  ["Europe", "Southern Europe", ["Italy", "Spain", "Portugal", "Greece"]],
].flatMap(([continent, region, countries]) =>
  countries.map(country => ({continent, region, country})),
);

const config = {
  data,
  groupBy: ["continent", "region", "country"],
};
