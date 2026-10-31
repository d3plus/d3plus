const config = {
  // Illustrative trade between continents, in US dollars.
  data: [
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Africa",
      "Trade Value": 75e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Asia",
      "Trade Value": 170e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Europe",
      "Trade Value": 200e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "North America",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "Oceania",
      "Trade Value": 2e9,
    },
    {
      "Exporter Continent": "Africa",
      "Importer Continent": "South America",
      "Trade Value": 12e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Africa",
      "Trade Value": 220e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Asia",
      "Trade Value": 3200e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Europe",
      "Trade Value": 1300e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "North America",
      "Trade Value": 1400e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "Oceania",
      "Trade Value": 150e9,
    },
    {
      "Exporter Continent": "Asia",
      "Importer Continent": "South America",
      "Trade Value": 180e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Africa",
      "Trade Value": 230e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Asia",
      "Trade Value": 1100e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Europe",
      "Trade Value": 4300e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "North America",
      "Trade Value": 650e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "Oceania",
      "Trade Value": 60e9,
    },
    {
      "Exporter Continent": "Europe",
      "Importer Continent": "South America",
      "Trade Value": 110e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Africa",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Asia",
      "Trade Value": 650e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Europe",
      "Trade Value": 480e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "North America",
      "Trade Value": 1250e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "Oceania",
      "Trade Value": 40e9,
    },
    {
      "Exporter Continent": "North America",
      "Importer Continent": "South America",
      "Trade Value": 170e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Africa",
      "Trade Value": 4e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Asia",
      "Trade Value": 230e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Europe",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "North America",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "Oceania",
      "Trade Value": 25e9,
    },
    {
      "Exporter Continent": "Oceania",
      "Importer Continent": "South America",
      "Trade Value": 2e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Africa",
      "Trade Value": 15e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Asia",
      "Trade Value": 190e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Europe",
      "Trade Value": 110e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "North America",
      "Trade Value": 140e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "Oceania",
      "Trade Value": 3e9,
    },
    {
      "Exporter Continent": "South America",
      "Importer Continent": "South America",
      "Trade Value": 120e9,
    },
  ],
  groupBy: ["Exporter Continent", "Importer Continent"],
  column: "Importer Continent",
  row: "Exporter Continent",
  colorScale: "Trade Value",
};
