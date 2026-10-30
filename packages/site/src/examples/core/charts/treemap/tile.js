const config = {
  data: [
    {
      Group: "Store",
      "Sub-Group": "Convenience Store",
      "Number of Food Stores": 100,
    },
    {
      Group: "Store",
      "Sub-Group": "Grocery Store",
      "Number of Food Stores": 150,
    },
    {Group: "Store", "Sub-Group": "Supercenters", "Number of Food Stores": 30},
    {
      Group: "Other",
      "Sub-Group": "Farmer's Market",
      "Number of Food Stores": 50,
    },
    {
      Group: "Restaurant",
      "Sub-Group": "Fast-Food Restaurant",
      "Number of Food Stores": 60,
    },
    {
      Group: "Restaurant",
      "Sub-Group": "Full-Service Restaurant",
      "Number of Food Stores": 120,
    },
  ],
  groupBy: ["Group", "Sub-Group"],
  sum: "Number of Food Stores",
  tile: "slice",
};
