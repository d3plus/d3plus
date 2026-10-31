import {accessor} from "@d3plus/core";

accessor("missing")({id: "alpha"});
accessor("missing", "n/a")({id: "alpha"});
accessor("value", 0)({id: "alpha", value: 3});
