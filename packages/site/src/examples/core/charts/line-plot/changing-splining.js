const config = {
  data: [
    {fruit: "apple", price: 5, year: 2014},
    {fruit: "banana", price: 4, year: 2014},
    {fruit: "apple", price: 7, year: 2015},
    {fruit: "banana", price: 6, year: 2015},
    {fruit: "apple", price: 10, year: 2016},
    {fruit: "banana", price: 8, year: 2016},
    {fruit: "apple", price: 6, year: 2017},
    {fruit: "banana", price: 10, year: 2017},
    {fruit: "apple", price: 8, year: 2018},
    {fruit: "banana", price: 15, year: 2018},
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      curve: "catmullRom",
    },
  },
  x: "year",
  y: "price",
};
