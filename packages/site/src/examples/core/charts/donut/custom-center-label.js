const config = {
  data: [
    {Topping: "Powdered sugar", Sold: 40},
    {Topping: "Cinnamon", Sold: 20},
    {Topping: "Sprinkles", Sold: 25},
    {Topping: "Fruits", Sold: 30},
    {Topping: "Cream", Sold: 15},
  ],
  groupBy: "Topping",
  value: "Sold",
  centerLabel: (data, total) => `${total} donuts sold`,
  centerLabelConfig: {
    fontColor: "#4a7aa8",
    fontWeight: 600,
  },
};
