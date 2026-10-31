import {RESET, Treemap} from "@d3plus/core";

const viz = new Treemap().config({title: "Quarterly revenue", legend: false});

// Later: put both keys back to their defaults instead of guessing what they were.
viz.config({title: RESET, legend: RESET});
