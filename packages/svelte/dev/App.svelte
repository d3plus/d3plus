<script>
  import {d3plus} from "../index.ts";
  import {Treemap} from "@d3plus/core";

  const data = [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 1", id: "beta", value: 10},
    {parent: "Group 1", id: "gamma", value: 2},
    {parent: "Group 2", id: "delta", value: 29},
    {parent: "Group 2", id: "eta", value: 25},
  ];

  const config = {data, groupBy: ["parent", "id"], sum: "value"};
</script>

<div use:d3plus={{constructor: Treemap, config}} style="height: 75vh"></div>
