import React from "react";
import {SyntaxHighlighter} from "storybook/internal/components";
import {ThemeProvider, convert} from "storybook/theming";

const theme = convert();

const BLUE = "#1c7ed6";
const GREY = "#868e96";
const PAD = 16;

/**
 * A small SVG diagram beside a syntax-highlighted result, for the geometry
 * and statistics helpers in @d3plus/math.
 *
 * `shapes` are drawn in order; each is `{type, …}`:
 * - `polygon`  {points, fill?, stroke?, dashed?, label?}
 * - `polyline` {points, stroke?, dashed?}
 * - `path`     {d, stroke?, fill?}         (pixel coordinates only)
 * - `segment`  {from, to, stroke?, dashed?, label?}
 * - `point`    {at, r?, fill?, label?}
 * - `circle`   {at, r, stroke?, fill?}     (`r` in pixels)
 * - `rect`     {x, y, width, height, stroke?, fill?, dashed?}
 * - `band`     {upper, lower, fill?}       (two point arrays; a filled region)
 *
 * Without `domain` every coordinate is a pixel (y grows downward, like SVG).
 * With `domain: {x: [x0, x1], y: [y0, y1]}` coordinates are data values mapped
 * into the box with y growing upward, which is what the fitting helpers want.
 */
export default function GeometryExample({
  width = 260,
  height = 200,
  domain,
  shapes = [],
  output = "",
  language = "js",
}) {
  const sx = domain
    ? x => PAD + ((x - domain.x[0]) / (domain.x[1] - domain.x[0])) * (width - 2 * PAD)
    : x => x;
  const sy = domain
    ? y => height - PAD - ((y - domain.y[0]) / (domain.y[1] - domain.y[0])) * (height - 2 * PAD)
    : y => y;
  const pt = ([x, y]) => `${sx(x)},${sy(y)}`;
  const dash = d => (d ? "4 3" : undefined);

  return (
    <ThemeProvider theme={theme}>
      <div style={{display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap", fontSize: 13}}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{flex: "0 0 auto", background: "#fff", border: "1px solid #dee2e6", borderRadius: 6}}
        >
          {shapes.map((s, i) => {
            const key = `${s.type}-${i}`;
            switch (s.type) {
              case "polygon":
                return (
                  <g key={key}>
                    <polygon
                      points={s.points.map(pt).join(" ")}
                      fill={s.fill ?? "rgba(28, 126, 214, 0.12)"}
                      stroke={s.stroke ?? BLUE}
                      strokeWidth={1.5}
                      strokeDasharray={dash(s.dashed)}
                    />
                    {s.label ? <Label at={s.points[0]} sx={sx} sy={sy} text={s.label} /> : null}
                  </g>
                );
              case "polyline":
                return (
                  <polyline
                    key={key}
                    points={s.points.map(pt).join(" ")}
                    fill="none"
                    stroke={s.stroke ?? BLUE}
                    strokeWidth={1.5}
                    strokeDasharray={dash(s.dashed)}
                  />
                );
              case "path":
                return (
                  <path key={key} d={s.d} fill={s.fill ?? "none"} stroke={s.stroke ?? BLUE} strokeWidth={1.5} />
                );
              case "segment":
                return (
                  <g key={key}>
                    <line
                      x1={sx(s.from[0])}
                      y1={sy(s.from[1])}
                      x2={sx(s.to[0])}
                      y2={sy(s.to[1])}
                      stroke={s.stroke ?? GREY}
                      strokeWidth={1.5}
                      strokeDasharray={dash(s.dashed)}
                    />
                    {s.label ? (
                      <Label
                        at={[(s.from[0] + s.to[0]) / 2, (s.from[1] + s.to[1]) / 2]}
                        sx={sx}
                        sy={sy}
                        text={s.label}
                      />
                    ) : null}
                  </g>
                );
              case "point":
                return (
                  <g key={key}>
                    <circle cx={sx(s.at[0])} cy={sy(s.at[1])} r={s.r ?? 4} fill={s.fill ?? "#e03131"} />
                    {s.label ? <Label at={s.at} sx={sx} sy={sy} text={s.label} /> : null}
                  </g>
                );
              case "circle":
                return (
                  <circle
                    key={key}
                    cx={sx(s.at[0])}
                    cy={sy(s.at[1])}
                    r={s.r}
                    fill={s.fill ?? "none"}
                    stroke={s.stroke ?? BLUE}
                    strokeWidth={1.5}
                  />
                );
              case "rect": {
                const x0 = sx(s.x);
                const x1 = sx(s.x + s.width);
                const y0 = sy(s.y);
                const y1 = sy(s.y + s.height);
                return (
                  <rect
                    key={key}
                    x={Math.min(x0, x1)}
                    y={Math.min(y0, y1)}
                    width={Math.abs(x1 - x0)}
                    height={Math.abs(y1 - y0)}
                    fill={s.fill ?? "none"}
                    stroke={s.stroke ?? "#f08c00"}
                    strokeWidth={1.5}
                    strokeDasharray={dash(s.dashed)}
                  />
                );
              }
              case "band": {
                const points = s.upper.concat(s.lower.slice().reverse());
                return (
                  <polygon
                    key={key}
                    points={points.map(pt).join(" ")}
                    fill={s.fill ?? "rgba(28, 126, 214, 0.15)"}
                    stroke="none"
                  />
                );
              }
              default:
                return null;
            }
          })}
        </svg>
        <div style={{flex: "1 1 220px", minWidth: 0}}>
          <SyntaxHighlighter language={language} copyable bordered padded>
            {output}
          </SyntaxHighlighter>
        </div>
      </div>
    </ThemeProvider>
  );
}

function Label({at, sx, sy, text}) {
  return (
    <text
      x={sx(at[0]) + 6}
      y={sy(at[1]) - 6}
      fontSize={11}
      fontFamily="ui-monospace, monospace"
      fill="#495057"
    >
      {text}
    </text>
  );
}
