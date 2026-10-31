import {assign} from "@d3plus/dom";

assign(
  {tags: ["a", "b"], deep: {list: [1]}},
  {tags: ["c"], deep: {list: [2, 3]}},
);
