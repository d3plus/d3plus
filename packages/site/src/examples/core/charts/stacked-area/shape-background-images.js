const starIcon =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpolygon%20points%3D%2250%2C4%2061%2C38%2098%2C38%2068%2C59%2079%2C95%2050%2C73%2021%2C95%2032%2C59%202%2C38%2039%2C38%22%20fill%3D%22%230b6e63%22%2F%3E%3C%2Fsvg%3E";

const heartIcon =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M50%2C88%20C10%2C58%2020%2C18%2050%2C42%20C80%2C18%2090%2C58%2050%2C88%20Z%22%20fill%3D%22%23c0392b%22%2F%3E%3C%2Fsvg%3E";

const config = {
  data: [
    {id: "alpha", x: 4, y: 12},
    {id: "alpha", x: 5, y: 28},
    {id: "alpha", x: 6, y: 20},
    {id: "beta", x: 4, y: 22},
    {id: "beta", x: 5, y: 14},
    {id: "beta", x: 6, y: 24},
  ],
  groupBy: "id",
  x: "x",
  y: "y",
  shapeConfig: {
    Area: {
      // `backgroundImageFit: "contain"` fits the whole icon inside each band's
      // largest inscribed rectangle — centered and completely visible. (The
      // default, "cover", instead fills the band's bounding box and clips to its
      // outline.) The image's aspect ratio is always preserved.
      backgroundImageFit: "contain",
      backgroundImage: d => (d.id === "alpha" ? starIcon : heartIcon),
    },
  },
};
