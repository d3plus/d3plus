import beforeAfter from "./samples/before-after.csv?raw";
import categories from "./samples/categories.csv?raw";
import countries from "./samples/countries.csv?raw";
import distribution from "./samples/distribution.tsv?raw";
import flows from "./samples/flows.csv?raw";
import headline from "./samples/headline.json?raw";
import hierarchy from "./samples/hierarchy.csv?raw";
import measures from "./samples/measures.csv?raw";
import prices from "./samples/prices.csv?raw";
import pyramid from "./samples/pyramid.csv?raw";
import schedule from "./samples/schedule.csv?raw";
import sets from "./samples/sets.csv?raw";
import states from "./samples/states.csv?raw";
import timeSeries from "./samples/time-series.csv?raw";

/** A sample dataset the chooser can load, showing one shape of data. */
export interface Sample {
  id: string;
  /** The link's text: the shape the data has. */
  label: string;
  /** What the data is. */
  title: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "headline",
    label: "One number",
    title: "Service uptime against its target",
    text: headline,
  },
  {
    id: "categories",
    label: "Categories + value",
    title: "Seats in parliament by party",
    text: categories,
  },
  {
    id: "hierarchy",
    label: "Nested categories",
    title: "A company's budget by department and team",
    text: hierarchy,
  },
  {
    id: "pyramid",
    label: "Two categories",
    title: "Population by age and sex",
    text: pyramid,
  },
  {
    id: "time-series",
    label: "Time series",
    title: "Monthly active users by platform",
    text: timeSeries,
  },
  {
    id: "before-after",
    label: "Two years",
    title: "Life expectancy in 2000 and 2020",
    text: beforeAfter,
  },
  {
    id: "distribution",
    label: "Observations",
    title:
      "Commutes in three cities (tab-separated, as pasted from a spreadsheet)",
    text: distribution,
  },
  {
    id: "measures",
    label: "Several measures",
    title: "Wealth, health, and population by country",
    text: measures,
  },
  {
    id: "flows",
    label: "Source → target",
    title: "US energy flows",
    text: flows,
  },
  {
    id: "countries",
    label: "Country codes",
    title: "Renewable share of electricity by country",
    text: countries,
  },
  {
    id: "states",
    label: "US states",
    title: "Population by state",
    text: states,
  },
  {
    id: "schedule",
    label: "Start & end dates",
    title: "A project schedule",
    text: schedule,
  },
  {
    id: "prices",
    label: "Open/high/low/close",
    title: "Daily stock prices",
    text: prices,
  },
  {
    id: "sets",
    label: "Sets",
    title: "Developers by the languages they use",
    text: sets,
  },
];
