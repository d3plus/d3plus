const config = {
  links: [
    {source: "Mining", target: "Raw materials", value: 50},
    {source: "Raw materials", target: "Manufacturing", value: 60},
    {source: "Manufacturing", target: "Products", value: 55},
    {source: "Manufacturing", target: "Manufacturing", value: 4},
    {source: "Manufacturing", target: "Waste", value: 5},
    {source: "Products", target: "Consumers", value: 55},
    {source: "Consumers", target: "Landfill", value: 30},
    {source: "Consumers", target: "Recycling", value: 25},
    {source: "Recycling", target: "Raw materials", value: 10},
    {source: "Recycling", target: "Manufacturing", value: 8},
    {source: "Recycling", target: "Landfill", value: 7},
  ],
  arrows: true,
  circularLinks: true,
  linkColor: "source",
  linkLabel: "value",
};
