import React from "react";
import {AnchorMdx} from "@storybook/addon-docs/blocks";
import {useTheme} from "storybook/theming";

const charts = [
  ["Bar Chart", "barchart"],
  ["Box & Whisker", "boxwhisker"],
  ["Bump Chart", "bumpchart"],
  ["Chord", "chord"],
  ["Donut", "donut"],
  ["Gauge", "gauge"],
  ["Geomap", "geomap"],
  ["Histogram", "histogram"],
  ["Line Plot", "lineplot"],
  ["Matrix", "matrix"],
  ["Network", "network"],
  ["Pack", "pack"],
  ["Pie", "pie"],
  ["Plot", "plot"],
  ["Priestley", "priestley"],
  ["Pyramid", "pyramid"],
  ["Radar", "radar"],
  ["Radial Matrix", "radialmatrix"],
  ["Rings", "rings"],
  ["Sankey", "sankey"],
  ["Stacked Area", "stackedarea"],
  ["Tree", "tree"],
  ["Treemap", "treemap"],
];

const sites = [
  {name: "SlateData", url: "https://slatedata.ai/"},
  {name: "OEC.world", url: "https://oec.world/"},
  {name: "Data USA", url: "https://datausa.io/"},
  {name: "DataSaudi", url: "https://datasaudi.sa/"},
  {name: "COTEC Spain", url: "https://complejidadeconomica.cotec.es/"},
  {name: "Puerto Rico Family Data Center", url: "https://data.youthpr.org/en"},
  {name: "Data Africa", url: "https://dataafrica.io/"},
  {name: "CDC AR&PSP", url: "https://arpsp.cdc.gov/"},
  {name: "Healthy Communities NC", url: "https://healthycommunitiesnc.org/"},
  {name: "CNY Vitals Pro", url: "https://pro.cnyvitals.org/"},
  {name: "DataMPE Brasil", url: "https://datampe.sebrae.com.br/"},
  {name: "Estonia Statistics", url: "https://data.stat.ee/profile/country/ee/"},
];

// Raw markup in MDX inherits the page's base color rather than the docs
// theme's text color, which turns black on the dark theme. These grids read
// the active theme instead, so they stay legible either way.
const useTiles = minWidth => {
  const theme = useTheme();
  return {
    grid: {
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
      gap: "0.5rem",
      margin: "1rem 0 2rem",
    },
    tile: {
      display: "block",
      padding: "0.5rem 0.75rem",
      borderRadius: 6,
      border: `1px solid ${theme.appBorderColor}`,
      color: theme.color.defaultText,
      fontSize: "0.85rem",
      lineHeight: 1.4,
      textAlign: "center",
      textDecoration: "none",
    },
    muted: {
      display: "block",
      marginTop: 2,
      color: theme.textMutedColor,
      fontSize: 10,
      lineHeight: 1.2,
      overflowWrap: "anywhere",
    },
    hover: `.d3plus-home-tile:hover { border-color: ${theme.color.secondary}; color: ${theme.color.secondary}; }`,
  };
};

/** One tile per chart type, each opening that chart's examples page. */
export function ChartTypes() {
  const styles = useTiles(140);
  return (
    <div style={styles.grid}>
      <style>{styles.hover}</style>
      {charts.map(([name, id]) => (
        <AnchorMdx
          key={id}
          className="d3plus-home-tile"
          href={`/docs/core-charts-${id}--d3plus`}
          style={styles.tile}
        >
          {name}
        </AnchorMdx>
      ))}
    </div>
  );
}

/** Sites built with d3plus, each linking out in a new tab. */
export function BuiltWith() {
  const styles = useTiles(200);
  return (
    <div style={styles.grid}>
      <style>{styles.hover}</style>
      {sites.map(site => (
        <a
          key={site.name}
          className="d3plus-home-tile"
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.tile}
        >
          {site.name}
          <span style={styles.muted}>{site.url}</span>
        </a>
      ))}
    </div>
  );
}
