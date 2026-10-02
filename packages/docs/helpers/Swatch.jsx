import React from "react";

const labelStyle = {fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#444"};

/**
 * A color square with its value (or a custom `label`) underneath.
 */
export function Swatch({color, label, size = 48}) {
  return (
    <div style={{display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4}}>
      <div
        title={String(color)}
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: color,
          border: "1px solid rgba(0, 0, 0, 0.15)",
          boxSizing: "border-box",
        }}
      />
      <span style={labelStyle}>{label === undefined ? String(color) : label}</span>
    </div>
  );
}

/**
 * A row of swatches. `labels` pairs with `colors` by index; `separators` are
 * strings drawn between neighbouring swatches (e.g. ["+", "="] for an
 * arithmetic demo).
 */
export function SwatchRow({colors, labels = [], separators = [], size, gap = 12}) {
  return (
    <div style={{display: "flex", alignItems: "flex-start", gap, flexWrap: "wrap"}}>
      {colors.map((color, i) => (
        <React.Fragment key={`${color}-${i}`}>
          {i > 0 && separators[i - 1] !== undefined ? (
            <span
              aria-hidden="true"
              style={{alignSelf: "center", marginTop: -16, color: "#999", fontSize: 18}}
            >
              {separators[i - 1]}
            </span>
          ) : null}
          <Swatch color={color} label={labels[i]} size={size} />
        </React.Fragment>
      ))}
    </div>
  );
}

export default Swatch;
