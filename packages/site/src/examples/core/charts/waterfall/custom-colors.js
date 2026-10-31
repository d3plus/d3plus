const cash = [
  {month: "Opening", flow: 50, subtotal: true},
  {month: "Jan", flow: 12},
  {month: "Feb", flow: -8},
  {month: "Mar", flow: 15},
  {month: "Apr", flow: 9},
  {month: "May", flow: -14},
  {month: "Jun", flow: -6},
  {month: "Jul", flow: 20},
  {month: "Aug", flow: 4},
  {month: "Sep", flow: -11},
  {month: "Oct", flow: 7},
  {month: "Nov", flow: 13},
  {month: "Dec", flow: -5},
  {month: "Closing", subtotal: true},
];

const config = {
  data: cash,
  x: "month",
  y: "flow",
  subtotal: "subtotal",
  increaseColor: "#1098ad",
  decreaseColor: "#e67700",
  totalColor: "#495057",
  connectors: false,
};
