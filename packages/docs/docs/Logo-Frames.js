import {colorDefaults, colorLegible} from "@d3plus/color";
const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const background = darkMode ? "#1B1C1D" : "white";
const tickColor = darkMode ? "#dee2e6" : "#495057";
const gridColor = darkMode ? "#495057" : "#dee2e6";
const colors = colorDefaults.scale.range();
const dColor = colors[0];
const dAccent = colorLegible(dColor);
const threeColor = colors[1];
const threeAccent = colorLegible(threeColor);
const plusColor = colors[2];

const mobile = window !== undefined && window.innerWidth <= 768;
const height = mobile ? 150 : 200;
const yAxisOffset = 35;
const xAxisOffset = 46;
const ySquares = 12;
const xSquares = 30;
const middle = ySquares / 2;
const cellSize = (height - xAxisOffset) / ySquares;
const width = cellSize * xSquares + yAxisOffset;
const barSpacing = Math.ceil(xSquares / 5);

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
    opacity: 0,
    stroke: tickColor
  },
  gridConfig: {
    opacity: 0,
    stroke: gridColor
  },
  shapeConfig: {
    fill: tickColor,
    opacity: 0,
    labelConfig: {
      fontColor: tickColor
    },
    stroke: tickColor
  }
}

const visibleAxis = {
  barConfig: {
    opacity: 1,
    stroke: tickColor
  },
  gridConfig: {
    opacity: 1,
    stroke: gridColor
  },
  shapeConfig: {
    fill: tickColor,
    duration: 250,
    opacity: 1,
    labelConfig: {
      fontColor: tickColor
    },
    stroke: tickColor
  }
}

const dCircles = [
  {id: "curve", r: cellSize * 5, x: arcCenter, y: middle, fill: dColor},
  {id: "curve-mask", r: cellSize * 3, x: arcCenter, y: middle, fill: background}
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

function randomY(x) { // min and max included 
  const clamp = x / xSquares;
  const max = (ySquares - 1) * clamp;
  return Math.random() * (max - 1 + 1) + 1;
}

const createLines = id => Array.from({length: xSquares}, (_, index) => ({id, x: index, y: randomY(index)}));

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
        {id: "curve-mask", height: cellSize * 11, width: cellSize * 5.2, x: iconDCenter - 2.65, y: middle, fill: background},
        {id: "ascender", height: cellSize * 10, width: cellSize * 3, x: iconDCenter - 1.5, y: middle, fill: dColor},
        // {id: "ascender-mask", height: cellSize * 6, width: cellSize * 1, x: iconDCenter - 0.45, y: middle, fill: background},
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
      stroke: background,
      strokeWidth: cellSize * 1.5
    }
  ],
  xConfig: hiddenAxis,
  yConfig: hiddenAxis
};

export const animationFrames = [
  {
    annotations: [

      {
        data: dCircles,
        fill: d => d.fill,
        shape: "Circle",
        strokeWidth: 0
      },

      {
        data: [
          {id: "curve-mask", height: cellSize * 11, width: cellSize * 5.2, x: arcCenter - 2.65, y: middle, fill: background},
          {id: "ascender", height: cellSize * 10, width: cellSize * 3, x: arcCenter - 1.5, y: middle, fill: dColor},
          {id: "ascender-mask", height: cellSize * 6, width: cellSize * 1, x: arcCenter - 0.45, y: middle, fill: background},
          {id: "3", height: cellSize * 36, width: cellSize * 9, x: threeCenter, y: middle, fill: "transparent"},
        ],
        fill: d => d.fill,
        label: d => d.id === "3" ? 3 : false,
        labelConfig: {
          ...threeLabelConfig,
          fontColor: threeColor
        },
        padding: 0,
        shape: "Rect",
        strokeWidth: 0
      },
      {
        data: plusLines,
        shape: "Line",
        stroke: plusColor,
        strokeWidth: cellSize * 1.5
      }
    ],
    xConfig: hiddenAxis,
    yConfig: hiddenAxis
  },




  {
    annotations: [

      {
        data: dCircles,
        fill: "transparent",
        shape: "Circle",
        stroke: dColor,
        strokeDasharray: d => d.id.includes("mask") ? "4 1" : false,
        strokeWidth: 2
      },

      {
        data: [
          {id: "curve-mask", height: cellSize * 8, width: cellSize * 5.2, x: arcCenter, y: middle},
          {id: "ascender", height: cellSize * 6, width: cellSize * 3, x: arcCenter, y: middle},
          {id: "ascender-mask", height: cellSize * 4, width: cellSize * 1, x: arcCenter, y: middle},
          {id: "3", height: (cellSize - 4) * ySquares, width: cellSize * 8, x: threeCenter + 1, y: middle},
        ],
        fill: d => d.id === "3" ? threeColor : "transparent",
        label: d => d.id === "3" ? 3 : false,
        labelConfig: {
          ...threeLabelConfig,
          fontColor: colorDefaults.light,
          fontStroke: threeAccent,
          fontStrokeWidth: 2
        },
        shape: "Rect",
        stroke: d => d.id === "3" ? threeAccent : dColor,
        strokeDasharray: d => d.id.includes("mask") ? "4 1" : false,
        strokeWidth: 2,
      },
      {
        data: plusLines
          .map(d => {
            const copy = {...d, x: d.x + 2};
            return copy;
          }),
        shape: "Line",
        stroke: plusColor,
        strokeWidth: cellSize / 2
      }
    ],
    xConfig: visibleAxis,
    yConfig: visibleAxis
  },




  {
    annotations: [

      {
        data: [
          {id: "curve", r: cellSize, x: 17, y: 10},
          {id: "curve-mask", r: cellSize * 0.75, x: 5, y: 7}
        ],
        fill: dColor,
        shape: "Circle"
      },

      {
        data: [
          {id: "curve-mask",    width: cellSize * 2, height: cellSize * 2, x: barSpacing * 1, y: 1},
          {id: "ascender",      width: cellSize * 2, height: cellSize * 5, x: barSpacing * 2, y: 2.5},
          {id: "ascender-mask", width: cellSize * 2, height: cellSize * 3, x: barSpacing * 3, y: 1.5},
          {id: "3",             width: cellSize * 2, height: cellSize * 8, x: barSpacing * 4, y: 4},
        ],
        fill: threeColor,
        label: false,
        labelConfig: threeLabelConfig,
        shape: "Rect",
        stroke: threeAccent,
        strokeWidth: 2,
        texture: "nylon",
        textureDefault: {size: cellSize / 2, background: threeColor, stroke: threeAccent, strokeWidth: 1},
      },
      {
        data: [
          ...createLines("plus-horizontal"),
          ...createLines("plus-vertical")
        ],
        shape: "Line",
        stroke: plusColor,
        strokeDasharray: d => d.id.includes("horizontal") ? "10 2" : false,
        strokeWidth: 2
      }
    ]
  },
  {
    annotations: [

      {
        data: dCircles,
        fill: d => d.fill,
        shape: "Circle",
        strokeWidth: 0
      },

      {
        data: [
          {id: "curve-mask", height: cellSize * 11, width: cellSize * 5.2, x: arcCenter - 2.65, y: middle, fill: background},
          {id: "ascender", height: cellSize * 10, width: cellSize * 3, x: arcCenter - 1.5, y: middle, fill: dColor},
          {id: "ascender-mask", height: cellSize * 6, width: cellSize * 1, x: arcCenter - 0.45, y: middle, fill: background},
          {id: "3", height: cellSize * 36, width: cellSize * 9, x: threeCenter, y: middle, fill: "transparent"},
        ],
        fill: d => d.fill,
        label: d => d.id === "3" ? 3 : false,
        labelConfig: {
          ...threeLabelConfig,
          fontColor: threeColor
        },
        padding: 0,
        shape: "Rect",
        strokeWidth: 0
      },
      {
        data: plusLines,
        shape: "Line",
        stroke: plusColor,
        strokeWidth: cellSize * 1.5
      }
    ],
    xConfig: hiddenAxis,
    yConfig: hiddenAxis
  },




  // {
  //   annotations: [],
  //   data: [
  //     {shape: "Circle", id: "curve",         r: cellSize, x: 17, y: 10, fill: dColor},
  //     {shape: "Circle", id: "curve-mask",    r: cellSize * 0.75, x: 5, y: 7, fill: dColor},
  //     // {shape: "Bar",   id: "curve-mask",     x: barSpacing * 1, y: 1, fill: threeColor},
  //     // {shape: "Bar",   id: "ascender",       x: barSpacing * 2, y: 2.5, fill: threeColor},
  //     // {shape: "Bar",   id: "ascender-mask",  x: barSpacing * 3, y: 1.5, fill: threeColor},
  //     // {shape: "Bar",   id: "3",              x: barSpacing * 4, y: 4, fill: threeColor},
  //     // ...createLines("plus-horizontal"),
  //     // ...createLines("plus-vertical")
  //   ],
  //   label: false,
  //   shape: d => d.shape,
  //   shapeConfig: {
  //     Circle: {
  //       r: d => d.r
  //     },
  //     fill: d => d.fill,
  //     strokeDasharray: d => d.id.includes("horizontal") ? "10 2" : false,
  //     strokeWidth: 2,
  //     texture: d => d.shape === "Bar" ? "nylon" : false,
  //     textureDefault: {size: cellSize / 2, background: threeColor, stroke: threeAccent, strokeWidth: 1},
  //   }
  // }
];