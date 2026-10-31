import {hash} from "@d3plus/dom";

const a = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const b = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const c = {groupBy: "id", x: d => d.month, tooltipConfig: {title: d => d.name}};
const circular = {label: "self"};
circular.self = circular;

hash(a);
hash(a) === hash(b);
hash(a) === hash(c);
hash(circular);
