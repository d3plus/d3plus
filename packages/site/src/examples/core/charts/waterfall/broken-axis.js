const bridge = [
  {driver: "Opening", value: 1000, subtotal: true},
  {driver: "Price", value: 15},
  {driver: "Volume", value: -8},
  {driver: "Mix", value: 13},
  {driver: "Closing", subtotal: true},
];

const config = {
  data: bridge,
  x: "driver",
  y: "value",
  subtotal: "subtotal",
  yDomain: [980],
};
