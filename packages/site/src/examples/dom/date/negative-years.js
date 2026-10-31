import {date} from "@d3plus/dom";

date("-500"); // getFullYear() → -500
date("1/1/-200"); // getFullYear() → -200
date("Q1 -44"); // getFullYear() → -44
