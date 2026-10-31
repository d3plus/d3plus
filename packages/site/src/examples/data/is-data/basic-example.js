import {isData} from "@d3plus/data";

isData("/data/cities.json");
isData({
  url: "https://api.example.com/rows",
  headers: {Authorization: "Bearer …"},
});
isData([{id: 1}, {id: 2}]);
isData({data: [{id: 1}]});
isData(null);
isData(42);
