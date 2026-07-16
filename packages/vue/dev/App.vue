<script setup>
import {ref} from "vue";
import {Treemap} from "../index.ts";

const data = [
  {parent: "Group 1", id: "alpha", value: 29},
  {parent: "Group 1", id: "beta", value: 10},
  {parent: "Group 1", id: "gamma", value: 2},
  {parent: "Group 2", id: "delta", value: 29},
  {parent: "Group 2", id: "eta", value: 25},
];

const config = ref({data, groupBy: ["parent", "id"], sum: "value"});
</script>

<template>
  <Treemap :config="config" style="height: 75vh" />
</template>
