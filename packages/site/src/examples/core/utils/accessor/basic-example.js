import {accessor} from "@d3plus/core";

accessor("id")({id: "alpha", value: 3});
accessor("value")({id: "alpha", value: 3});
[{id: "alpha"}, {id: "beta"}, {id: "gamma"}].map(accessor("id"));
