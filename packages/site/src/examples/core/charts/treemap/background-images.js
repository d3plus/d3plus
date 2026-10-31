/** A three-stripe flag as an inline SVG data URI. */
const flag = ([a, b, c]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20"><rect width="10" height="20" fill="${a}"/><rect x="10" width="10" height="20" fill="${b}"/><rect x="20" width="10" height="20" fill="${c}"/></svg>`,
  )}`;

const config = {
  data: [
    {id: "France", value: 68, stripes: ["#0055a4", "#ffffff", "#ef4135"]},
    {id: "Italy", value: 59, stripes: ["#009246", "#ffffff", "#ce2b37"]},
    {id: "Belgium", value: 12, stripes: ["#000000", "#fdda24", "#ef3340"]},
    {id: "Ireland", value: 5, stripes: ["#169b62", "#ffffff", "#ff883e"]},
  ],
  groupBy: "id",
  shapeConfig: {
    backgroundImage: d => flag(d.stripes),
  },
  sum: "value",
};
