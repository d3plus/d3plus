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

    var focii = d3plus.utils.uniques(vars.connections(vars.focus.value,true),vars.id.key)
    focii.push(vars.focus.value)

    var groups = vars.g.data.selectAll("g")
      .each(function(d){
        if (focii.indexOf(d[vars.id.key]) >= 0) {
          var elem = vars.g.data_focus.node().appendChild(this.cloneNode(true))
          var elem = d3.select(elem).datum(d)
          for (e in d3plus.evt) {
            var evt = d3.select(this).on(d3plus.evt[e])
            if (evt) {
              elem.on(d3plus.evt[e],evt)
            }
          }
        }
      })

    vars.g.data_focus.selectAll("path")
      .style("stroke-width",vars.style.data.stroke.width*2)

    if (vars.dev.value) d3plus.console.timeEnd("drawing focus elements")

  }

}
