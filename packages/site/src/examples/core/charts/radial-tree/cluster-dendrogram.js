// Approximate divergence of each language group, in thousands of years.
const divergence = {
  "Indo-European": 6.5,
  Germanic: 2.5,
  "West Germanic": 1.6,
  "North Germanic": 1.2,
  Romance: 1.8,
  "Ibero-Romance": 1.1,
  "Gallo-Romance": 1.3,
  Slavic: 1.5,
  "West Slavic": 1,
  "East Slavic": 0.8,
  "Indo-Iranian": 4,
  "Indo-Aryan": 3,
  Iranian: 2.8,
};

const data = [
  ["Germanic", "West Germanic", ["English", "Frisian", "Dutch", "German"]],
  ["Germanic", "North Germanic", ["Swedish", "Danish", "Norwegian"]],
  ["Romance", "Ibero-Romance", ["Spanish", "Portuguese", "Catalan"]],
  ["Romance", "Gallo-Romance", ["French", "Occitan"]],
  ["Slavic", "West Slavic", ["Polish", "Czech", "Slovak"]],
  ["Slavic", "East Slavic", ["Russian", "Ukrainian", "Belarusian"]],
  ["Indo-Iranian", "Indo-Aryan", ["Hindi", "Bengali", "Punjabi"]],
  ["Indo-Iranian", "Iranian", ["Persian", "Pashto", "Kurdish"]],
].flatMap(([branch, group, languages]) =>
  languages.map(language => ({
    family: "Indo-European",
    branch,
    group,
    language,
  })),
);

const config = {
  data,
  groupBy: ["family", "branch", "group", "language"],
  nodeHeight: (d, i, node) => divergence[node.id] ?? 0,
};
