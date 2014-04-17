d3plus.visualization.scatter = {}
d3plus.visualization.chart.fill = true;
d3plus.visualization.chart.deprecates = ["pie_scatter"];
d3plus.visualization.scatter.requirements = ["data","x","y"];
d3plus.visualization.scatter.tooltip = "static";
d3plus.visualization.scatter.shapes = ["circle","square","donut"];
d3plus.visualization.scatter.scale = d3plus.visualization.chart.scale;

d3plus.visualization.scatter.draw = function(vars) {

  return d3plus.visualization.chart.draw(vars)

}
