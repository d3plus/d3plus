import React from "react";
import { argTypes, LinePlot } from "../args/LinePlot.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Advanced/LinePlot",
  component: LinePlot,
  argTypes
};

const Template = (args) => <LinePlot config={configify(args, argTypes)} />;

export const LineLabels = Template.bind({});
LineLabels.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineLabels: true,
  x: "x",
  y: "y"
};

export const LineValueLabels = Template.bind({});
LineValueLabels.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineLabels: true,
  shapeConfig: {
    Line: {
      label: funcify(
        function(d) {
          const dataArray = this._filteredData.filter(f => f.id === d.id);
          const maxX = Math.max(...dataArray.map(f => f.x));
          const maxData = dataArray.find(f => f.x === maxX);

          return `${maxData.y}`;
        },
        `function(d) {
        const dataArray = this._filteredData.filter(f => f.id === d.id);
        const maxX = Math.max(...dataArray.map(f => f.x));
        const maxData = dataArray.find(f => f.x === maxX); 
        return \`\${maxData.y}\`;
      }`
      )
    }
  },
  x: "x",
  y: "y"
};

export const SecondaryYAxis = Template.bind({});
SecondaryYAxis.args = {
  data: [
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2011,
      "Trade Value": 1403273708182,
      "Trade Value Growth": 0.17509765715100706
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2012,
      "Trade Value": 1453520657725,
      "Trade Value Growth": 0.03580694860170724
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2013,
      "Trade Value": 1478035757057,
      "Trade Value Growth": 0.016866013703836988
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2014,
      "Trade Value": 1521969928619,
      "Trade Value Growth": 0.029724701416885744
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2015,
      "Trade Value": 1409516953687,
      "Trade Value Growth": -0.07388646307488954
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2016,
      "Trade Value": 1353648792022,
      "Trade Value Growth": -0.0396363885647921
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2017,
      "Trade Value": 1456201053251,
      "Trade Value Growth": 0.07575987348669187
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2018,
      "Trade Value": 1548849519602,
      "Trade Value Growth": 0.06362340292513889
    },
    {
      "Country ID": "nausa",
      "Country": "United States",
      "Year": 2019,
      "Trade Value": 1511931053052,
      "Trade Value Growth": -0.023836057720756986
    }
  ],
  groupBy: ["Country"],
  shape: "Line",
  x: "Year",
  xConfig: {
    labels: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
    tickFormat: funcify(
      d => `${d * 1}`,
      "d => `${d * 1}`"
    )
  },
  y: "Trade Value",
  y2: "Trade Value Growth",
  y2Config: {
    tickFormat: funcify(
      d => `${parseInt(d * 100)}%`,
      "d => `${parseInt(d * 100)}%`"
    )
  }
};

export const VertexMarkersT = Template.bind({});
VertexMarkersT.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineMarkers: true,
  lineMarkerConfig: {
    r: 6
  },
  x: "x",
  y: "y"
};

export const ChangingVertexMarkersStyle = Template.bind({});
ChangingVertexMarkersStyle.args = {
  data: [
    { id: "alpha", x: 4, y: 9 },
    { id: "alpha", x: 5, y: 17 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 16 },
    { id: "gamma", x: 4, y: 14 },
    { id: "gamma", x: 5, y: 9 },
    { id: "gamma", x: 6, y: 11 }
  ],
  groupBy: "id",
  lineMarkers: true,
  lineMarkerConfig: {
    opacity: funcify(d => d.x === 6 ? 1 : 0.25, "d => d.x === 6 ? 1 : 0.25"),
    r: funcify(d => d.x === 6 ? 6 : 4, "d => d.x === 6 ? 6 : 3")
  },
  x: "x",
  y: "y"
};

export const ChangingSplining = Template.bind({});
ChangingSplining.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      curve: "catmullRom"
    }
  },
  x: "year",
  y: "price"
};

export const ChangingStrokeWidth = Template.bind({});
ChangingStrokeWidth.args = {
  data: [
    { id: "alpha", x: 4, y: 7 },
    { id: "alpha", x: 5, y: 25 },
    { id: "alpha", x: 6, y: 13 },
    { id: "beta", x: 4, y: 17 },
    { id: "beta", x: 5, y: 8 },
    { id: "beta", x: 6, y: 13 }
  ],
  groupBy: "id",
  shapeConfig: {
    Line: {
      strokeWidth: 5
    }
  },
  x: "x",
  y: "y"
};

export const ConfidenceIntervals = Template.bind({});
ConfidenceIntervals.args = {
  data: [
    { fruit: "apple", year: 1, amount: 50, moe: 2 },
    { fruit: "apple", year: 2, amount: 56, moe: 1 },
    { fruit: "apple", year: 3, amount: 58, moe: 1 },
    { fruit: "banana", year: 1, amount: 88, moe: 3 },
    { fruit: "banana", year: 2, amount: 90, moe: 4 },
    { fruit: "banana", year: 3, amount: 76, moe: 3 }
  ],
  groupBy: "fruit",
  confidence: [
    funcify(
      d => d.amount - d.moe,
      "d => d.amount - d.moe"
    ),
    funcify(
      d => d.amount + d.moe,
      "d => d.amount + d.moe"
    )
  ],
  confidenceConfig: {
    fillOpacity: 0.3
  },
  x: "year",
  y: "amount"
};

export const DashedLines = Template.bind({});
DashedLines.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "cherry", price: 7, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "cherry", price: 9, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "cherry", price: 5, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "cherry", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 },
    { fruit: "cherry", price: 12, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      strokeDasharray: funcify(
        d => {
          if (d.fruit === "apple") return "10";
          if (d.fruit === "banana") return "10 7 3";
          if (d.fruit === "cherry") return "10 7 5 2";
          return "0";
        },
        "d => {if (d.fruit === 'apple') return '10'; if (d.fruit === 'banana') return '10 7 3'; if (d.fruit === 'cherry') return '10 7 5 2'; return '0';}")
    }
  },
  x: "year",
  y: "price"
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "cherry", price: 7, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "cherry", price: 9, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "cherry", price: 5, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "cherry", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 },
    { fruit: "cherry", price: 12, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      stroke: funcify(
        d => {
          if (d.fruit === "apple") return "green";
          if (d.fruit === "banana") return "goldenrod";
          if (d.fruit === "cherry") return "red";
          return "grey";
        },
        "d => {if (d.fruit === 'apple') return 'green'; if (d.fruit === 'banana') return 'goldenrod'; if (d.fruit === 'cherry') return 'red'; return 'grey';}"
      )
    }
  },
  x: "year",
  y: "price"
};

export const SortingLines = Template.bind({});
SortingLines.args = {
  data: [
    { fruit: "apple", price: 5, year: 2014 },
    { fruit: "banana", price: 4, year: 2014 },
    { fruit: "apple", price: 7, year: 2015 },
    { fruit: "banana", price: 6, year: 2015 },
    { fruit: "apple", price: 10, year: 2016 },
    { fruit: "banana", price: 8, year: 2016 },
    { fruit: "apple", price: 6, year: 2017 },
    { fruit: "banana", price: 10, year: 2017 },
    { fruit: "apple", price: 8, year: 2018 },
    { fruit: "banana", price: 15, year: 2018 }
  ],
  groupBy: "fruit",
  shapeConfig: {
    Line: {
      strokeLinecap: "round",
      strokeWidth: 10
    },
    sort: funcify(
      (a, b) => {
        if (a.fruit === "apple") return 1;
        else return -1;
      },
      "(a, b) => {if (a.fruit === 'apple') return 1; else return -1;}")
  },
  x: "year",
  y: "price"
};

export const DottedLinePredictions = Template.bind({});
DottedLinePredictions.args = {
  data: [
    {
      "Year": 2006,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 227746107622,
      "Type": "Observed"
    },
    {
      "Year": 2006,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 243328728338,
      "Type": "Observed"
    },
    {
      "Year": 2007,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 250510781866,
      "Type": "Observed"
    },
    {
      "Year": 2007,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 266075508173,
      "Type": "Observed"
    },
    {
      "Year": 2008,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 273451264785,
      "Type": "Observed"
    },
    {
      "Year": 2008,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 284982624365,
      "Type": "Observed"
    },
    {
      "Year": 2009,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 206734904705,
      "Type": "Observed"
    },
    {
      "Year": 2009,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 220133846133,
      "Type": "Observed"
    },
    {
      "Year": 2010,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 282348541534,
      "Type": "Observed"
    },
    {
      "Year": 2010,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 293914911217,
      "Type": "Observed"
    },
    {
      "Year": 2011,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 331884428040,
      "Type": "Observed"
    },
    {
      "Year": 2011,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 343550107823,
      "Type": "Observed"
    },
    {
      "Year": 2012,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 351687026850,
      "Type": "Observed"
    },
    {
      "Year": 2012,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 361886624083,
      "Type": "Observed"
    },
    {
      "Year": 2013,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 356069934491,
      "Type": "Observed"
    },
    {
      "Year": 2013,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 373619307190,
      "Type": "Observed"
    },
    {
      "Year": 2014,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 369627996773,
      "Type": "Observed"
    },
    {
      "Year": 2014,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 389499264277,
      "Type": "Observed"
    },
    {
      "Year": 2015,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 375484880972,
      "Type": "Observed"
    },
    {
      "Year": 2015,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 372557671308,
      "Type": "Observed"
    },
    {
      "Year": 2016,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 363829206796,
      "Type": "Observed"
    },
    {
      "Year": 2016,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 364493560621,
      "Type": "Observed"
    },
    {
      "Year": 2017,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 376297646785,
      "Type": "Observed"
    },
    {
      "Year": 2017,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 401741532115,
      "Type": "Observed"
    },
    {
      "Year": 2018,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 414829536859,
      "Type": "Observed"
    },
    {
      "Year": 2018,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 441736801029,
      "Type": "Observed"
    },
    {
      "Year": 2019,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 425699639802,
      "Type": "Observed"
    },
    {
      "Year": 2019,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 432693158563,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 366314124058,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 406070750072,
      "Type": "Observed"
    },
    {
      "Year": 2020,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 366314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2020,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 406070750072,
      "Type": "Predicted"
    },
    {
      "Year": 2021,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 346314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2021,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 386070750072,
      "Type": "Predicted"
    },
    {
      "Year": 2022,
      "Flow ID": 1,
      "Flow": "Imports",
      "Trade Value": 336314124058,
      "Type": "Predicted"
    },
    {
      "Year": 2022,
      "Flow ID": 2,
      "Flow": "Exports",
      "Trade Value": 396070750072,
      "Type": "Predicted"
    }
  ],
  groupBy: ["Type", "Flow"],
  shapeConfig: {
    Line: {
      strokeDasharray: funcify(
        d => {
          if (d["Type"] === "Predicted") return "10";
          return "0";
        },
        "d => {if (d['Type'] === 'Predicted') return '10'; return '0'; }"
      )
    }
  },
  time: "Year",
  timeline: false,
  x: "Year",
  y: "Trade Value"
};

export const QuarterlyData = Template.bind({});
QuarterlyData.args = {
  data: "https://api.datamexico.org/tesseract/data.jsonrecords?cube=fdi_9_quarter_investment&drilldowns=Quarter,Investment+Type&measures=Investment",
  groupBy: "Investment Type",
  time: "Quarter",
  timeline: false,
  x: "Quarter",
  y: "Investment"
};
