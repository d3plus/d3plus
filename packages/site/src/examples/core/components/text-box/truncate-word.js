const config = {
  data: [
    {text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", truncateWord: false},
    {text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", truncateWord: true},
    {text: "Ends at a word: ABCDEFGHIJKLMNOP", truncateWord: false},
    {text: "Ends at a word: ABCDEFGHIJKLMNOP", truncateWord: true},
  ],
  fontSize: 15,
  height: 24,
  text: d => d.text,
  truncateWord: d => d.truncateWord,
  width: 200,
  x: (d, i) => (i % 2) * (200 + 40),
  y: (d, i) => Math.floor(i / 2) * 40,
};
