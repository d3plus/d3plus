module.exports = function(vars) {

  var edges = vars.returned.edges || [];

  var paths = vars.g.edges.selectAll("g.d3plus_edge_path")
    .data(edges, function(d){
      d.d3plus.id = "path_" + d[vars.edges.source][vars.id.value] + "_" + d[vars.edges.target][vars.id.value];
      return d.d3plus.id;
    });

  function pathStyles(p) {
    p
      .attr("d", vars.edges.path)
      .style("stroke-width", function(d) {
        return Math.max(1, d.dy);
      })
      .style("stroke", "#ddd")
      .style("fill", "none")
      .attr("transform", function(d){
        return "translate(" + d.d3plus.x + "," + d.d3plus.y + ")";
      });
  }

  if (vars.draw.timing) {

    paths.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove();

    paths.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.draw.timing/2)
      .attr("opacity",0)
      .remove();

    paths.selectAll("path")
      .data(function(d){ return [d] })
      .transition().duration(vars.draw.timing)
        .call(pathStyles);

    paths.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .style("stroke-width", 0)
      .transition().duration(vars.draw.timing)
        .call(pathStyles);

  }
  else {

    paths.exit().remove();

    paths.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .remove();

    paths.selectAll("path")
      .data(function(d){ return [d] })
      .call(pathStyles);

    paths.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(pathStyles);

  }

}
