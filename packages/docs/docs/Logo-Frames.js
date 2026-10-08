import {colorDefaults, colorLegible} from "@d3plus/color";
const darkMode =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const background = darkMode ? "#222325" : "#FFFFFF";
const colors = colorDefaults.scale.range();
const dColor = colors[0];
const threeColor = colors[1];
const threeAccent = colorLegible(threeColor);
const plusColor = colors[2];

const xSquares = 30;
const ySquares = 12;
const middle = ySquares / 2;

// Space the axes claim around the cell grid (px): the y-axis labels and
// ticks on the left, the bottom axis below, and the overhang of the "12" and
// "30" end labels above and to the right. The svg is sized around it so every
// cell is square.
const gutter = {top: 6, right: 12.5, bottom: 40, left: 31};
const height = 200;
const cellSize = (height - gutter.top - gutter.bottom) / ySquares;
const width = cellSize * xSquares + gutter.left + gutter.right;
const barSpacing = xSquares / 5;

// Ink bounds of Inter Bold's "3", in ems from its baseline and advance center.
const threeInk = {ascent: 0.739, descent: 0.012, left: 0.276, right: 0.281};
const threeInkHeight = threeInk.ascent + threeInk.descent;
const threeInkWidth = threeInk.left + threeInk.right;

// Letter geometry, in cells. The D is a stem plus a half ring, the "3" matches
// its height, and the "+" arms share the 3's stroke weight.
const letterHeight = 10;
const dRadius = letterHeight / 2;
const dStroke = 2;
// the stem rect reaches the ring's center; the counter cuts its last cell
const stemSpan = dStroke + 1;
const dWidth = stemSpan + dRadius;
const threeWidth = (threeInkWidth * letterHeight) / threeInkHeight;
const plusSize = 3;
const plusStroke = 1.5;
const gap = 2;

// The final logo centers its ink on the svg (and the page), not the plot area.
const logoCenter = xSquares / 2 + (gutter.right - gutter.left) / 2 / cellSize;
const logoWidth = dWidth + gap + threeWidth + gap + plusSize * 2;
const dLeft = logoCenter - logoWidth / 2;
const arcCenter = dLeft + dWidth - dRadius;
const threeCenter = dLeft + dWidth + gap + threeWidth / 2;
const plusCenter = threeCenter + threeWidth / 2 + gap + plusSize;

// The wireframe frame snaps the same layout onto the grid lines: the D's ring
// spans cells 1–11, the 3's box 13–21, and the "+" 23–29.
const gridArcCenter = 6;
const gridThreeCenter = 17;
const gridPlusCenter = 26;

const tickRange = (max, step) =>
  Array.from({length: max / step + 1}, (_, i) => i * step);
const axisTicks = max => ({
  labels: tickRange(max, 6),
  ticks: tickRange(max, 2),
});

// Every frame resets `data` and `legend`, so a frame's series never carry into
// the next one through config merging. The logo is decorative: no tooltips.
export const sharedConfig = {
  data: [],
  height,
  legend: false,
  noDataMessage: false,
  search: false,
  tableView: false,
  tooltip: false,
  width,
  xDomain: [0, xSquares],
  yDomain: [0, ySquares],
  zoom: false,
};

const hiddenAxis = {
  barConfig: {opacity: 0},
  gridConfig: {opacity: 0},
  shapeConfig: {opacity: 0},
};

// On the dark theme the axis labels, ticks, and domain line need light
// strokes, and the grid a stroke as faint as the light theme's.
const axisColors = darkMode
  ? {
      barConfig: {stroke: "#adb5bd"},
      gridConfig: {stroke: "#343a40"},
      shapeConfig: {
        stroke: "#adb5bd",
        labelConfig: {fontColor: colorDefaults.light},
      },
    }
  : {barConfig: {}, gridConfig: {}, shapeConfig: {}};
const visibleAxis = {
  barConfig: {opacity: 1, ...axisColors.barConfig},
  gridConfig: {opacity: 1, ...axisColors.gridConfig},
  shapeConfig: {
    duration: 250,
    opacity: 1,
    ...axisColors.shapeConfig,
  },
};
const axes = config => ({
  xConfig: {...axisTicks(xSquares), ...config},
  yConfig: {...axisTicks(ySquares), ...config},
});

/**
    Label settings that draw the "3" with its ink `inkHeight` cells tall and
    centered on its shape. TextBox sets a single line's baseline
    `fontSize - 0.6 * lineHeight` below the middle of its label box, so with
    `lineHeight` equal to `fontSize` the box is offset to put the glyph's ink,
    rather than its em box, on the shape's center.
*/
function threeLabel(inkHeight, labelConfig = {}) {
  const fontSize = (inkHeight * cellSize) / threeInkHeight;
  const inkMiddle = ((threeInk.ascent - threeInk.descent) / 2) * fontSize;
  const dx = ((threeInk.left - threeInk.right) / 2) * fontSize;
  const dy = inkMiddle - 0.4 * fontSize;
  const boxWidth = fontSize * 1.5;
  const boxHeight = fontSize * 1.1;
  return {
    labelBounds: () => ({
      x: dx - boxWidth / 2,
      y: dy - boxHeight / 2,
      width: boxWidth,
      height: boxHeight,
    }),
    labelConfig: {
      fontMax: fontSize,
      fontResize: false,
      fontSize,
      fontWeight: 700,
      lineHeight: fontSize,
      padding: 0,
      textAnchor: "middle",
      verticalAlign: "middle",
      ...labelConfig,
    },
  };
}

const dCircles = arc => [
  {id: "curve", r: cellSize * dRadius, x: arc, y: middle, fill: dColor},
  {
    id: "curve-mask",
    r: cellSize * (dRadius - dStroke),
    x: arc,
    y: middle,
    fill: background,
  },
];

// The rects paint over the ring: one hides its left half, one draws the stem,
// and one cuts the counter out of the stem (each overlaps its neighbor a hair
// so no anti-aliased seam shows).
const dRects = arc => [
  {
    id: "curve-mask",
    height: cellSize * (letterHeight + 1),
    width: cellSize * (dRadius + 0.2),
    x: arc - (dRadius + 0.2) / 2 - 0.05,
    y: middle,
    fill: background,
  },
  {
    id: "ascender",
    height: cellSize * letterHeight,
    width: cellSize * stemSpan,
    x: arc - stemSpan / 2,
    y: middle,
    fill: dColor,
  },
  {
    id: "ascender-mask",
    height: cellSize * (letterHeight - dStroke * 2),
    width: cellSize * 1.1,
    x: arc - 0.45,
    y: middle,
    fill: background,
  },
];

const threeRect = x => ({
  id: "3",
  height: cellSize * letterHeight,
  width: cellSize * threeWidth,
  x,
  y: middle,
  fill: "transparent",
});

const plusLines = center => [
  {id: "plus-horizontal", x: center - plusSize, y: middle},
  {id: "plus-horizontal", x: center + plusSize, y: middle},
  {id: "plus-vertical", x: center, y: middle + plusSize},
  {id: "plus-vertical", x: center, y: middle - plusSize},
];

// A seeded generator keeps the chart frames identical on every load: the
// legend frame's series always leave its top-left corner open for the inset
// legend, and the annotated chart's lines always clear its labels.
let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const ink = darkMode ? colorDefaults.light : colorDefaults.dark;
const muted = "#868e96";
const smallText = {
  fontColor: ink,
  fontMax: 12,
  fontResize: false,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 14,
  padding: 0,
  textAnchor: "middle",
  verticalAlign: "middle",
};

const bars = [
  {id: "curve-mask", value: 2},
  {id: "ascender", value: 5},
  {id: "3", value: 3},
  {id: "ascender-mask", value: 8},
].map((d, i) => ({
  ...d,
  x: barSpacing * (i + 1),
  width: cellSize * 2,
  label: d.value,
}));
const band = {id: "band", x: xSquares / 2, y: 6.5, label: "target"};
const peak = {x: 17, y: 10};
const ringRadius = 1.6;
const callout = {id: "callout", x: 24, y: 10.6, label: "new high"};

// Two jagged series that stay under the bars' value labels.
const chartLines = id =>
  Array.from({length: xSquares}, (_, x) => {
    const y = 1 + random() * (6.5 * (x / xSquares) + 0.5);
    const bar = bars.find(b => Math.abs(b.x - x) <= 1.5);
    return {id, x, y: bar ? Math.min(y, bar.value - 0.7) : y};
  });
const lineData = [
  ...chartLines("plus-horizontal"),
  ...chartLines("plus-vertical"),
];
const leader = [
  {id: "leader", x: peak.x + ringRadius * 0.8, y: peak.y + ringRadius * 0.45},
  {id: "leader", x: callout.x - 3, y: callout.y},
];

const chartCircles = [
  {id: "curve", r: cellSize, ...peak, fill: dColor},
  {id: "curve-mask", r: cellSize * 0.75, x: 5, y: 7.5, fill: dColor},
  {
    id: "ring",
    r: cellSize * ringRadius,
    ...peak,
    fill: "transparent",
    stroke: dColor,
  },
];
// Where the highlighted point and callout start from, just under the "D"
// series in the legend frame so they stay inside its marks.
const collapsedPeakY = 6;
const collapsedCalloutY = 7.5;
const chartRects = [
  {...band, width: cellSize * xSquares, height: cellSize * 2},
  ...bars.map(d => ({...d, height: cellSize * d.value, y: d.value / 2})),
  {...callout, width: cellSize * 6, height: cellSize * 1.6},
];

/**
    The annotated chart's annotations. With `collapsed`, every shape keeps its
    id at zero size, so the frame before it hands its shapes over and the
    chart grows in instead of popping in: the bars, lines, and the left point
    rise from the x axis, the band opens in place, and the highlighted point
    and callout rise from just under the "D" series. Collapsed shapes still
    count as marks when the inset legend looks for room, so none of them sit
    above the legend frame's lines.
*/
const chartAnnotations = (collapsed = false) => [
  {
    data: collapsed
      ? chartCircles.map(d => ({
          ...d,
          r: 0,
          y: d.id === "curve-mask" ? 0 : collapsedPeakY,
        }))
      : chartCircles,
    fill: d => d.fill,
    shape: "Circle",
    stroke: d => d.stroke || d.fill,
    strokeDasharray: "3 2",
    strokeWidth: d => (d.stroke && !collapsed ? 1.5 : 0),
  },
  {
    data: collapsed
      ? chartRects.map(d => ({
          ...d,
          height: 0,
          width: d.id === "callout" ? 0 : d.width,
          y: d.id === "callout" ? collapsedCalloutY : d.id === "band" ? d.y : 0,
        }))
      : chartRects,
    fill: d =>
      d.id === "band" ? muted : d.id === "callout" ? background : threeColor,
    fillOpacity: d => (d.id === "band" ? 0.15 : 1),
    label: d => (collapsed ? false : d.label),
    labelBounds: (d, i, s) =>
      d.id === "band"
        ? {x: -s.width / 2 + 4, y: -s.height / 2 + 2, width: 48, height: 16}
        : d.id === "callout"
          ? {
              x: -s.width / 2,
              y: -s.height / 2,
              width: s.width,
              height: s.height,
            }
          : {
              x: -s.width / 2 - 8,
              y: -s.height / 2 - 17,
              width: s.width + 16,
              height: 16,
            },
    labelConfig: smallText,
    shape: "Rect",
    // The band and callout have no border, so no edge sweeps across their
    // text as they shrink away.
    stroke: d => (bars.some(b => b.id === d.id) ? threeAccent : "transparent"),
    strokeWidth: d => (bars.some(b => b.id === d.id) && !collapsed ? 1 : 0),
    texture: d => (d.id === "band" || d.id === "callout" ? false : "lines"),
    textureDefault: {
      size: cellSize / 2,
      background: threeColor,
      stroke: threeAccent,
      strokeWidth: 1,
    },
  },
  {
    data: collapsed
      ? [
          ...lineData.map(d => ({...d, y: 0})),
          ...leader.map(() => ({...leader[0], y: collapsedPeakY})),
        ]
      : [...lineData, ...leader],
    shape: "Line",
    stroke: d => (d.id === "leader" ? muted : plusColor),
    strokeDasharray: d => (d.id.includes("horizontal") ? "10 2" : false),
    strokeWidth: d => (collapsed ? 0 : d.id === "leader" ? 1 : 2),
  },
];

// Three series named after the logo's letters, so the inset legend reads
// "D 3 +" in the letters' colors.
const seriesOrder = ["D", "3", "+"];
const seriesColor = {D: dColor, 3: threeColor, "+": plusColor};
const walk = (id, start, drift) => {
  let y = start;
  return Array.from({length: xSquares + 1}, (_, x) => {
    y = Math.max(0.8, Math.min(8.5, y + drift + (random() - 0.5) * 1.2));
    const spread = 0.3 + x / 60;
    return {id, x, y, lci: y - spread, hci: y + spread};
  });
};
const seriesData = [
  ...walk("D", 1.2, 0.22),
  ...walk("3", 3.2, 0.06),
  ...walk("+", 5.5, -0.1),
];

const logoFrame = {
  annotations: [
    {
      data: dCircles(arcCenter),
      fill: d => d.fill,
      shape: "Circle",
      stroke: d => d.fill,
      strokeWidth: 0,
    },
    {
      data: [...dRects(arcCenter), threeRect(threeCenter)],
      fill: d => d.fill,
      label: d => (d.id === "3" ? 3 : false),
      ...threeLabel(letterHeight, {fontColor: threeColor}),
      shape: "Rect",
      stroke: d => d.fill,
      strokeWidth: 0,
    },
    {
      data: plusLines(plusCenter),
      shape: "Line",
      stroke: plusColor,
      strokeWidth: cellSize * plusStroke,
    },
  ],
  ...axes(hiddenAxis),
};

const iconDCenter = threeCenter - 2;
const iconThreeCenter = threeCenter + 2;
export const icon = {
  annotations: [
    {
      data: dCircles(iconDCenter).filter(d => !d.id.includes("mask")),
      fill: d => d.fill,
      shape: "Circle",
      strokeWidth: 0,
    },
    {
      data: [
        ...dRects(iconDCenter).filter(d => d.id !== "ascender-mask"),
        threeRect(iconThreeCenter),
      ],
      fill: d => d.fill,
      label: d => (d.id === "3" ? 3 : false),
      ...threeLabel(letterHeight, {fontColor: dColor}),
      shape: "Rect",
      strokeWidth: 0,
    },
    {
      data: plusLines(threeCenter),
      shape: "Line",
      stroke: background,
      strokeWidth: cellSize * plusStroke,
    },
  ],
  ...axes(hiddenAxis),
};

export const animationFrames = [
  logoFrame,

  {
    annotations: [
      {
        data: dCircles(gridArcCenter),
        fill: "transparent",
        shape: "Circle",
        stroke: dColor,
        strokeDasharray: d => (d.id.includes("mask") ? "4 1" : false),
        strokeWidth: 2,
      },

      {
        data: [
          {
            id: "curve-mask",
            height: cellSize * 8,
            width: cellSize * 6,
            x: gridArcCenter,
            y: middle,
          },
          {
            id: "ascender",
            height: cellSize * 6,
            width: cellSize * 4,
            x: gridArcCenter,
            y: middle,
          },
          {
            id: "ascender-mask",
            height: cellSize * 4,
            width: cellSize * 2,
            x: gridArcCenter,
            y: middle,
          },
          {
            id: "3",
            height: cellSize * 8,
            width: cellSize * 8,
            x: gridThreeCenter,
            y: middle,
          },
        ],
        fill: d => (d.id === "3" ? threeColor : "transparent"),
        label: d => (d.id === "3" ? 3 : false),
        ...threeLabel(4, {
          fontColor: colorDefaults.light,
          fontStroke: threeAccent,
          fontStrokeWidth: 2,
        }),
        shape: "Rect",
        stroke: d => (d.id === "3" ? threeAccent : dColor),
        strokeDasharray: d => (d.id.includes("mask") ? "4 1" : false),
        strokeWidth: 2,
      },
      {
        data: plusLines(gridPlusCenter),
        shape: "Line",
        stroke: plusColor,
        strokeWidth: cellSize / 2,
      },
    ],
    ...axes(visibleAxis),
  },

  {
    annotations: chartAnnotations(true),
    color: d => seriesColor[d.id],
    confidence: ["lci", "hci"],
    confidenceConfig: {fillOpacity: 0.25},
    data: seriesData,
    groupBy: "id",
    legend: true,
    legendConfig: {shapeConfig: {labelConfig: {fontSize: 12}}},
    legendSort: (a, b) => seriesOrder.indexOf(a.id) - seriesOrder.indexOf(b.id),
    shape: "Line",
    shapeConfig: {Line: {strokeWidth: 2}},
    x: "x",
    y: "y",
    ...axes(visibleAxis),
  },

  {
    annotations: chartAnnotations(),
    ...axes(visibleAxis),
  },

  logoFrame,
];
