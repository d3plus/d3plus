import {configWarnings, Legend} from "@d3plus/core";

new Legend().config({titel: "Sales"});
// console: Legend received unknown property "titel".

configWarnings(false); // silence the check for every chart on the page
configWarnings();
