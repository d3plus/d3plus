var events = require("../../../client/pointer.coffee"),
    fetchValue   = require("../../../core/fetch/value.coffee"),
    print        = require("../../../core/console/print.coffee"),
    uniqueValues = require("../../../util/uniques.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates focus elements, if available
//------------------------------------------------------------------------------
module.exports = function(vars) {

  vars.g.edge_focus
    .selectAll("g")
    .remove()

  vars.g.data_focus
    .selectAll("g")
    .remove()

  if (vars.focus.value.length && vars.types[vars.type.value].zoom && vars.zoom.value) {

    if ( vars.dev.value ) print.time("drawing focus elements")

    var edges = vars.g.edges.selectAll("g")

    if (edges.size() > 0) {

      edges.each(function(l){

          var source = l[vars.edges.source][vars.id.value],
              target = l[vars.edges.target][vars.id.value]

          if (source == vars.focus.value[0] || target == vars.focus.value[0]) {
            var elem = vars.g.edge_focus.node().appendChild(this.cloneNode(true))
            d3.select(elem).datum(l).attr("opacity",1)
              .selectAll("line, path").datum(l)
          }

        })


      var marker = vars.edges.arrows.value

      vars.g.edge_focus.selectAll("line, path")
        .attr("vector-effect","non-scaling-stroke")
        .style("stroke",vars.color.focus)
        .style("stroke-width",function(){
          return vars.edges.size.value ? d3.select(this).style("stroke-width")
               : vars.data.stroke.width*2
        })
        .attr("marker-start",function(e){

          var direction = vars.edges.arrows.direction.value

          if ("bucket" in e.d3plus) {
            var d = "_"+e.d3plus.bucket
          }
          else {
            var d = ""
          }

          return direction == "source" && marker
               ? "url(#d3plus_edge_marker_focus"+d+")" : "none"

        })
        .attr("marker-end",function(e){

          var direction = vars.edges.arrows.direction.value

          if ("bucket" in e.d3plus) {
            var d = "_"+e.d3plus.bucket
          }
          else {
            var d = ""
          }

          return direction == "target" && marker
               ? "url(#d3plus_edge_marker_focus"+d+")" : "none"

        })

      vars.g.edge_focus.selectAll("text")
        .style("fill",vars.color.focus)

    }

    var focii = uniqueValues(vars.edges.connections(vars.focus.value[0],vars.id.value,true),vars.id.value, fetchValue, vars)
    focii.push(vars.focus.value[0])

    var x_bounds = [], y_bounds = [], x_buffer = [0], y_buffer = [0]

    var groups = vars.g.data.selectAll("g")
      .each(function(d){
        if (focii.indexOf(d[vars.id.value]) >= 0) {
          var elem = vars.g.data_focus.node().appendChild(this.cloneNode(true))
          var elem = d3.select(elem).datum(d).attr("opacity",1)

          if (vars.shape.value == "coordinates") {

            vars.zoom.viewport = vars.path.bounds(vars.zoom.coords[d.d3plus.id])

          }
          else if ("d3plus" in d) {
            if ("x" in d.d3plus) {
              x_bounds.push(d.d3plus.x)
            }
            if ("y" in d.d3plus) {
              y_bounds.push(d.d3plus.y)
            }
            if ("r" in d.d3plus) {
              x_buffer.push(d.d3plus.r)
              y_buffer.push(d.d3plus.r)
            }
            else {
              if ("width" in d.d3plus) {
                x_buffer.push(d.d3plus.width/2)
              }
              if ("height" in d.d3plus) {
                y_buffer.push(d.d3plus.height/2)
              }
            }
          }

          for (e in events) {
            var evt = d3.select(this).on(events[e])
            if (evt) {
              elem.on(events[e],evt)
            }
          }

        }
      })

    if (x_bounds.length && y_bounds.length) {

      var xcoords = d3.extent(x_bounds),
          ycoords = d3.extent(y_bounds),
          xmax = d3.max(x_buffer),
          ymax = d3.max(y_buffer)

      vars.zoom.viewport = [
        [xcoords[0]-xmax,ycoords[0]-ymax],
        [xcoords[1]+xmax,ycoords[1]+ymax]
      ]

    }

    vars.g.data_focus.selectAll("path")
      .style("stroke-width",vars.data.stroke.width*2)

    if ( vars.dev.value ) print.timeEnd("drawing focus elements")

  }
  else {
    vars.zoom.viewport = false
  }

}
