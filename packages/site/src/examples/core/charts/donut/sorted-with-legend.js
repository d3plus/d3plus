const config = {
  data: [
    {Topping: "Powdered sugar", Sold: 40},
    {Topping: "Cinnamon", Sold: 20},
    {Topping: "Sprinkles", Sold: 25},
    {Topping: "Fruits", Sold: 30},
    {Topping: "Cream", Sold: 15},
  ],
  groupBy: "Topping",
  legendPosition: "right",
  sort: (a, b) => b.Sold - a.Sold,
  value: "Sold",
};
