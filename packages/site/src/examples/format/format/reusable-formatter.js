import {format} from "@d3plus/format";

const money = format("$,.2f");
money(19.99);
money(1500);
money(2500000);
