//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus elements, if available
//------------------------------------------------------------------------------
d3plus.draw.focus = function(vars) {

  vars.g.edge_focus
    .selectAll("*")
    .remove()

  vars.g.data_focus
    .selectAll("*")
    .remove()

  if (vars.focus.value) {

    if (vars.dev.value) d3plus.console.time("drawing focus elements")

    var edges = vars.g.edges.selectAll("g")

    if (edges.size() > 0) {

      edges.each(function(l){

          var source = l.source[vars.id.key],
              target = l.target[vars.id.key]

          if (source == vars.focus.value || target == vars.focus.value) {
            vars.g.edge_focus.node().appendChild(this.cloneNode(true))
          }

        })


      var marker = vars.edges.arrows.value ? "url(#d3plus_edge_marker_focus)" : "none"

      vars.g.edge_focus
        .selectAll("line, path")
          .style("stroke",d3plus.color.darker(vars.style.edges.color,.5))
          .style("stroke-width",vars.style.data.stroke.width*2)
          .attr("marker-start",function(){
            return vars.edges.arrows.direction.value == "source" ? marker : "none"
          })
          .attr("marker-end",function(){
            return vars.edges.arrows.direction.value == "target" ? marker : "none"
          })

    }

    var groups = vars.g.data.selectAll("g").filter(function(d){
      return d[vars.id.key] == vars.focus.value
    })

    vars.g.data_focus.node().appendChild(groups.node().cloneNode(true))

    vars.g.data_focus.selectAll("path")
      .style("stroke-width",vars.style.data.stroke.width*2)
      .on(d3plus.evt.click,function(){

        if (typeof vars.mouse == "function") {
          vars.mouse()
        }
        else if (vars.mouse.click) {
          vars.mouse.click()
        }

      })

    if (vars.dev.value) d3plus.console.timeEnd("drawing focus elements")

  }

}
