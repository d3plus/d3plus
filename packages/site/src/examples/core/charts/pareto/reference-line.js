const tickets = [
  {topic: "Login", tickets: 412},
  {topic: "Billing", tickets: 268},
  {topic: "Shipping", tickets: 190},
  {topic: "Returns", tickets: 121},
  {topic: "Sizing", tickets: 64},
  {topic: "Coupons", tickets: 38},
  {topic: "Gift cards", tickets: 22},
];

const config = {
  data: tickets,
  groupBy: "topic",
  x: "topic",
  y: "tickets",
  paretoThreshold: 0.7,
  paretoThresholdConfig: {
    label: "70% of tickets",
    stroke: "#e03131",
    strokeOpacity: 1,
  },
};
