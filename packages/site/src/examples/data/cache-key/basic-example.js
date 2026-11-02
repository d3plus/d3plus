import {cacheKey} from "@d3plus/data";

cacheKey("data", "/data/fruits.csv");
cacheKey("data", ["/data/fruits.csv"]);
cacheKey("links", {url: "/api/graph.json", headers: {Authorization: "token"}});
cacheKey("data", ["/data/a.json", "/data/b.json"]);
