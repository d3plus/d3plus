import {cacheKey} from "@d3plus/data";

cacheKey("/data/fruits.csv");
cacheKey({url: "/api/graph.json", headers: {Authorization: "token"}});
cacheKey({url: "/api/graph.json", headers: {Authorization: "other"}});
