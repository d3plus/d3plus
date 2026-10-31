const config = {
  // This page answers this URL itself, with new readings on every request.
  data: "/demo/live-sales.json",
  groupBy: "region",
  x: "region",
  y: "sales",
  title: "Sales by region (refreshes every 2 seconds)",
  dataPollingInterval: 2000,
};
