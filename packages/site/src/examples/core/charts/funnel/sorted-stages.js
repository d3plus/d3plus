const config = {
  data: [
    {id: "Activated", step: 4, value: 1850},
    {id: "Visited Site", step: 1, value: 12400},
    {id: "Subscribed", step: 5, value: 760},
    {id: "Viewed Pricing", step: 2, value: 6900},
    {id: "Started Trial", step: 3, value: 3100},
  ],
  sort: (a, b) => a.step - b.step,
  conversion: "previous",
};
