import {colorDefaults} from "@d3plus/color";
const colors = colorDefaults.scale.range();
const dColor = colors[0];
const plusColor = colors[2];

const height = 200;
const yAxisOffset = 35;
const xAxisOffset = 46;
const ySquares = 12;
const xSquares = 28;
const middle = ySquares / 2;
const cellSize = (height - xAxisOffset) / ySquares;
const width = cellSize * xSquares + yAxisOffset;

const stemCenter = 2;
const arcCenter = stemCenter + 3.5;
const threeCenter = arcCenter + 10;
const plusCenter = threeCenter + 8;
const plusSize = ySquares / 4;

export const sharedConfig = {
  height,
  noDataMessage: false,
  width,
  xDomain: [0, xSquares],
  yDomain: [0, ySquares]
};

const hiddenAxis = {
  barConfig: {
    "stroke-width": 0
  },
  gridConfig: {
    "stroke-width": 0
  },
  shapeConfig: {
    labelConfig: {
      fontColor: "transparent"
    },
    strokeWidth: 0
  }
}

const dCircles = [
  {id: "curve", r: cellSize * 5, x: arcCenter, y: middle, fill: dColor},
  {id: "curve-mask", r: cellSize * 3, x: arcCenter, y: middle, fill: "white"}
];

const threeLabelConfig = {
  fontMax: cellSize * ySquares * 2,
  fontResize: true,
  fontWeight: 700,
  lineHeight: ySquares + 0.6,
  textAnchor: "middle",
  verticalAlign: "middle"
};

const plusLines = [
  {shape: "Line", id: "plus-horizontal", x: plusCenter - plusSize, y: middle, fill: plusColor},
  {shape: "Line", id: "plus-horizontal", x: plusCenter + plusSize, y: middle, fill: plusColor},
  {shape: "Line", id: "plus-vertical", x: plusCenter, y: middle + plusSize, fill: plusColor},
  {shape: "Line", id: "plus-vertical", x: plusCenter, y: middle - plusSize, fill: plusColor}
];

const iconCenter = threeCenter;
const iconDCenter = iconCenter - 2;
const iconThreeCenter = iconCenter + 2;
export const icon = {
  annotations: [

    {
      data: dCircles
        .filter(d => !d.id.includes("mask"))
        .map(d => {
          const copy = {...d, x: d.x + (iconDCenter - arcCenter)};
          return copy;
        }),
      fill: d => d.fill,
      shape: "Circle",
      strokeWidth: 0
    },

    {
      data: [
        {id: "curve-mask", height: cellSize * 11, width: cellSize * 5.2, x: iconDCenter - 2.65, y: middle, fill: "white"},
        {id: "ascender", height: cellSize * 10, width: cellSize * 3, x: iconDCenter - 1.5, y: middle, fill: dColor},
        // {id: "ascender-mask", height: cellSize * 6, width: cellSize * 1, x: iconDCenter - 0.45, y: middle, fill: "white"},
        {id: "3", height: cellSize * 36, width: cellSize * 9, x: iconThreeCenter, y: middle, fill: "transparent"},
      ],
      fill: d => d.fill,
      label: d => d.id === "3" ? 3 : false,
      labelConfig: {
        ...threeLabelConfig,
        fontColor: dColor
      },
      padding: 0,
      shape: "Rect",
      strokeWidth: 0
    },
    {
      data: plusLines.map(d => {
        const copy = {...d, x: d.x - (plusCenter - iconCenter)};
        return copy;
      }),
      shape: "Line",
      stroke: "white",
      strokeWidth: cellSize * 1.5
    }
  ],
  xConfig: hiddenAxis,
  yConfig: hiddenAxis
};
]