const answers = [
  "Strongly disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly agree",
];
const survey = {
  "The app is easy to use": [5, 10, 20, 40, 25],
  "Support answers quickly": [12, 18, 25, 30, 15],
  "Pricing is fair": [20, 25, 30, 15, 10],
  "I would recommend it": [4, 8, 18, 42, 28],
};
const colors = ["#b2182b", "#ef8a62", "#bababa", "#67a9cf", "#2166ac"];

const config = {
  // Rows listed along the scale, disagreeing answers negative.
  data: Object.entries(survey).flatMap(([question, shares]) =>
    shares.map((share, k) => ({
      question,
      answer: answers[k],
      percent: k < 2 ? -share : share,
    })),
  ),
  discrete: "y",
  groupBy: "answer",
  legend: true,
  shapeConfig: {fill: d => colors[answers.indexOf(d.answer)]},
  stacked: true,
  stackNeutral: "Neutral",
  x: "percent",
  y: "question",
};
