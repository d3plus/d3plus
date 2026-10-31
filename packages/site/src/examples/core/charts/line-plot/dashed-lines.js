const config = {
  data: [
    {fruit: "apple", price: 5, year: 2014},
    {fruit: "banana", price: 4, year: 2014},
    {fruit: "cherry", price: 7, year: 2014},
    {fruit: "apple", price: 7, year: 2015},
    {fruit: "banana", price: 6, year: 2015},
    {fruit: "cherry", price: 9, year: 2015},
    {fruit: "apple", price: 10, year: 2016},
    {fruit: "banana", price: 8, year: 2016},
    {fruit: "cherry", price: 5, year: 2016},
    {fruit: "apple", price: 6, year: 2017},
    {fruit: "banana", price: 10, year: 2017},
    {fruit: "cherry", price: 10, year: 2017},
    {fruit: "apple", price: 8, year: 2018},
    {fruit: "banana", price: 15, year: 2018},
    {fruit: "cherry", price: 12, year: 2018},
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      strokeDasharray: d => {
        if (d.fruit === "apple") return "10";
        if (d.fruit === "banana") return "10 7 3";
        if (d.fruit === "cherry") return "10 7 5 2";
        return "0";
      },
    },
  },
  x: "year",
  y: "price",
};
