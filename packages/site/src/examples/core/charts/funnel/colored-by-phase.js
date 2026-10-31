const config = {
  data: [
    {phase: "Awareness", stage: "Impressions", value: 52000},
    {phase: "Awareness", stage: "Clicks", value: 21000},
    {phase: "Consideration", stage: "Product Views", value: 11800},
    {phase: "Consideration", stage: "Added to Cart", value: 4200},
    {phase: "Conversion", stage: "Checkout", value: 2600},
    {phase: "Conversion", stage: "Purchased", value: 1900},
  ],
  groupBy: ["phase", "stage"],
  conversion: "previous",
  connectorConfig: {fill: "#ced4da", opacity: 0.6},
};
