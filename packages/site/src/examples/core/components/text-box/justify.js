const passage =
  "Justified text spreads the words of each line across the whole box, so both edges stay straight. The last line of a paragraph keeps its natural spacing.";

const config = {
  data: [
    {text: passage, anchor: "start"},
    {text: passage, anchor: "justify"},
    {
      text: "日本語の文章は単語の間に空白がないので、両端揃えでは文字と文字の間に余白を均等に配分します。",
      anchor: "justify",
    },
  ],
  fontSize: 14,
  height: 200,
  text: d => d.text,
  textAnchor: d => d.anchor,
  width: 180,
  x: (d, i) => i * (180 + 20),
};
