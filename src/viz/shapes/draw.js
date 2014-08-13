var fetchValue = require("../../core/fetch/value.js"),
    fetchColor = require("../../core/fetch/color.js"),
    fetchText  = require("../../core/fetch/text.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws the appropriate shape based on the data
//------------------------------------------------------------------------------
d3plus.shape.draw = function(vars) {

  var data = vars.returned.nodes || [],
      edges = vars.returned.edges || []

  vars.draw.timing = data.length < vars.data.large
                     && edges.length < vars.edges.large
                     ? vars.timing.transitions : 0

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Match vars.shape types to their respective d3plus.shape functions. For
  // example, both "square", and "circle" shapes use "rect" as their drawing
  // class.
  //----------------------------------------------------------------------------
  var shape_lookup = {
    "area": "area",
    "circle": "rect",
    "donut": "donut",
    "line": "line",
    "square": "rect",
    "coordinates": "coordinates"
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Split the data by each shape type in the data.
  //----------------------------------------------------------------------------
  var shapes = {}
  data.forEach(function(d){
    if (!d.d3plus) {
      var s = shape_lookup[vars.shape.value]
    }
    else if (!d.d3plus.shape) {
      var s = shape_lookup[vars.shape.value]
      d.d3plus.shapeType = s
    }
    else {
      var s = d.d3plus.shape
      d.d3plus.shapeType = s
    }
    if (!shapes[s]) {
      shapes[s] = []
    }
    shapes[s].push(d)
  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Resets the "id" of each data point to use with matching.
  //----------------------------------------------------------------------------
  function id(d) {

    d.d3plus.id = ""
    for (var i = 0; i <= vars.depth.value; i++) {
      d.d3plus.id += fetchValue(vars,d,vars.id.nesting[i])+"_"
    }

    d.d3plus.id += shape

    vars.axes.values.forEach(function(axis){
      if (vars[axis].scale.value == "continuous") {
        d.d3plus.id += "_"+fetchValue(vars,d,vars[axis].value)
      }
    })

    d.d3plus.id = d3plus.string.strip(d.d3plus.id)

    return d
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Transforms the positions and scale of each group.
  //----------------------------------------------------------------------------
  function transform(g,grow) {

    var scales = vars.types[vars.type.value].scale
    if (grow && scales && scales[vars.shape.value]) {
       var scale = scales[vars.shape.value]
    }
    else if (grow && scales && typeof scales == "number") {
      var scale = scales
    }
    else {
      var scale = 1
    }

    g
      .attr("transform",function(d){

        var x = d.d3plus.x || 0
          , y = d.d3plus.y || 0

        if (["line","area","coordinates"].indexOf(shape) < 0) {
          return "translate("+x+","+y+")scale("+scale+")"
        }
        else {
          return "scale("+scale+")"
        }

      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Remove old groups
  //----------------------------------------------------------------------------
  for (shape in shape_lookup) {
    if (!(shape_lookup[shape] in shapes) || d3.keys(shapes).length === 0) {
      if (vars.draw.timing) {
        vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
          .transition().duration(vars.draw.timing)
          .attr("opacity",0)
          .remove()
      }
      else {
        vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
          .remove()
      }
    }
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialize arrays for labels and sizes
  //----------------------------------------------------------------------------
  var labels = [],
      shares = []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Create groups by shape, apply data, and call specific shape drawing class.
  //----------------------------------------------------------------------------
  for (var shape in shapes) {

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind Data to Groups
    //--------------------------------------------------------------------------
    var selection = vars.g.data.selectAll("g.d3plus_"+shape)
      .data(shapes[shape],function(d){

        if (!d.d3plus) d.d3plus = {}

        if ( shape === "coordinates" ) {
          d.d3plus.id = d.id
          return d.id
        }

        if ( !d.d3plus.id ) {

          if (d.values) {

            d.values.forEach(function(v){
              v = id(v)
              v.d3plus.shapeType = "circle"
            })
            d.d3plus.id = d.key

          }
          else {

            d = id(d)

            if (!d.d3plus.segments) {

              d.d3plus.segments = {"donut": Math.PI*2}
              var active = vars.active.value ? d.d3plus[vars.active.value] : d.d3plus.active,
                  temp = vars.temp.value ? d.d3plus[vars.temp.value] : d.d3plus.temp,
                  total = vars.total.value ? d.d3plus[vars.total.value] : d.d3plus.total

              if (total) {
                if (active) {
                  d.d3plus.segments.active = (active/total) * (Math.PI * 2)
                }
                else {
                  d.d3plus.segments.active = 0
                }
                if (temp) {
                  d.d3plus.segments.temp = ((temp/total) * (Math.PI * 2)) + d.d3plus.segments.active
                }
                else {
                  d.d3plus.segments.temp = 0
                }
              }

            }

          }

        }

        return d.d3plus ? d.d3plus.id : false;

      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Exit
    //--------------------------------------------------------------------------
    if (vars.draw.timing) {
      var exit = selection.exit()
        .transition().duration(vars.draw.timing)
        .attr("opacity",0)
        .remove()
    }
    else {
      var exit = selection.exit()
        .remove()
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Existing Groups Update
    //--------------------------------------------------------------------------
    if (vars.draw.timing) {
      selection
        .transition().duration(vars.draw.timing)
        .call(transform)
    }
    else {
      selection.call(transform)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Enter
    //--------------------------------------------------------------------------
    var opacity = vars.draw.timing ? 0 : 1
    var enter = selection.enter().append("g")
      .attr("class","d3plus_"+shape)
      .attr("opacity",opacity)
      .call(transform)

    if (vars.draw.timing) {
      enter.transition().duration(vars.draw.timing)
        .attr("opacity",1)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // All Groups Sort Order
    //--------------------------------------------------------------------------
    selection.order()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Draw appropriate graphics inside of each group
    //--------------------------------------------------------------------------
    if ( vars.dev.value ) d3plus.console.time("drawing \"" + shape + "\" shapes")
    d3plus.shape[shape]( vars , selection , enter , exit , transform )
    if ( vars.dev.value ) d3plus.console.timeEnd("drawing \"" + shape + "\" shapes")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for active and temp fills for rects and donuts
    //--------------------------------------------------------------------------
    if (["rect","donut"].indexOf(shape) >= 0 && vars.types[vars.type.value].fill) {
      if ( vars.dev.value ) d3plus.console.time("filling \"" + shape + "\" shapes")
      d3plus.shape.fill( vars , selection , enter , exit , transform )
      if ( vars.dev.value ) d3plus.console.timeEnd("filling \"" + shape + "\" shapes")
    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function to Update Edges
  //----------------------------------------------------------------------------
  function edge_update(d) {

    if (d && vars.g.edges.selectAll("g").size() > 0) {

      vars.g.edge_hover
        .selectAll("*")
        .remove()

      vars.g.edges.selectAll("g")
        .each(function(l){

          var id = d[vars.id.value],
              source = l[vars.edges.source][vars.id.value],
              target = l[vars.edges.target][vars.id.value]

          if (source == id || target == id) {
            var elem = vars.g.edge_hover.node().appendChild(this.cloneNode(true))
            d3.select(elem).datum(l).attr("opacity",1)
              .selectAll("line, path").datum(l)
          }

        })


      var marker = vars.edges.arrows.value

      vars.g.edge_hover
        .attr("opacity",0)
        .selectAll("line, path")
          .style("stroke",vars.color.primary)
          .style("stroke-width",function(){
            return vars.edges.size ? d3.select(this).style("stroke-width")
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
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

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
                 ? "url(#d3plus_edge_marker_highlight"+d+")" : "none"

          })


      vars.g.edge_hover.selectAll("text")
        .style("fill",vars.color.primary)

      if (vars.draw.timing) {

        vars.g.edge_hover
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",1)

        vars.g.edges
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",0.5)

      }
      else {

        vars.g.edge_hover
          .attr("opacity",1)

      }

    }
    else {

      if (vars.draw.timing) {

        vars.g.edge_hover
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",0)
          .transition()
          .selectAll("*")
          .remove()

        vars.g.edges
          .transition().duration(vars.timing.mouseevents)
          .attr("opacity",1)

      }
      else {

        vars.g.edge_hover
          .selectAll("*")
          .remove()

      }

    }

  }

  edge_update()

  if (!d3plus.touch) {

    vars.g.data.selectAll("g")
      .on(d3plus.evt.over,function(d){

        if (!vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this).style("cursor","pointer")
            .transition().duration(vars.timing.mouseevents)
            .call(transform,true)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.timing.mouseevents)
            .attr("opacity",1)

          vars.covered = false

          if (vars.focus.value.length !== 1 || vars.focus.value[0] != d[vars.id.value]) {

            if (d.values && vars.continuous_axis) {

              var index = vars.continuous_axis === "x" ? 0 : 1
                , mouse = d3.mouse(vars.container.value.node())[index]
                , positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]})
                , closest = d3plus.util.closest(positions,mouse)

              d.d3plus_data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.d3plus_data ? d.d3plus_data : d
            d3plus.tooltip.app({
              "vars": vars,
              "data": tooltip_data
            })

          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.over]) {
            vars.mouse[d3plus.evt.over](d)
          }

          edge_update(d)

        }

      })
      .on(d3plus.evt.move,function(d){

        if (!vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

          vars.covered = false

          if (d.values || (vars.types[vars.type.value].tooltip == "follow" && vars.focus.value[0] != d[vars.id.value])) {

            if (d.values && vars.continuous_axis) {

              var index = vars.continuous_axis === "x" ? 0 : 1
                , mouse = d3.mouse(vars.container.value.node())[index]
                , positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]})
                , closest = d3plus.util.closest(positions,mouse)

              d.d3plus_data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.d3plus_data ? d.d3plus_data : d
            d3plus.tooltip.app({
              "vars": vars,
              "data": tooltip_data
            })

          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.move]) {
            vars.mouse[d3plus.evt.move](d)
          }

        }

      })
      .on(d3plus.evt.out,function(d){

        var child = d3plus.util.child(this,d3.event.toElement)

        if (!child && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this)
            .transition().duration(vars.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.timing.mouseevents)
            .attr("opacity",vars.data.opacity)


          if (!vars.covered) {
            d3plus.tooltip.remove(vars.type.value)
          }

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse[d3plus.evt.out]) {
            vars.mouse[d3plus.evt.out](d)
          }

          edge_update()

        }

      })

  }
  else {

    vars.g.data.selectAll("g")
      .on(d3plus.evt.over,vars.zoom.touchEvent)
      .on(d3plus.evt.move,vars.zoom.touchEvent)
      .on(d3plus.evt.out,vars.zoom.touchEvent)

  }

  vars.g.data.selectAll("g")
    .on(d3plus.evt.click,function(d){

      if (!d3.event.defaultPrevented && !vars.draw.frozen && (!d.d3plus || !d.d3plus.static)) {

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse[d3plus.evt.out]) {
          vars.mouse[d3plus.evt.out](d)
        }
        else if (vars.mouse[d3plus.evt.click]) {
          vars.mouse[d3plus.evt.click](d)
        }

        var depth_delta = vars.zoom.direction(d.d3plus_data || d)
          , previous = vars.id.solo.value
          , title = fetchText(vars,d)[0]
          , color = d3plus.color.legible(fetchColor(vars,d))
          , prev_sub = vars.title.sub.value || false
          , prev_color = vars.title.sub.font.color
          , prev_total = vars.title.total.font.color

        if (d.d3plus.threshold && d.d3plus.merged && vars.zoom.value) {

          vars.history.states.push(function(){

            vars.self
              .id({"solo": previous})
              .title({
                "sub": {
                  "font": {
                    "color": prev_color
                  },
                  "value": prev_sub
                },
                "total": {
                  "font": {
                    "color": prev_total
                  }
                }
              })
              .draw()

          })

          vars.self
            .id({"solo": d3plus.util.uniques(d.d3plus.merged,vars.id.value)})
            .title({
              "sub": {
                "font": {
                  "color": color
                },
                "value": title
              },
              "total": {
                "font": {
                  "color": color
                }
              }
            })
            .draw()

        }
        else if (depth_delta === 1 && vars.zoom.value) {

          var id = fetchValue(vars,d,vars.id.value)

          vars.history.states.push(function(){

            vars.self
              .depth(vars.depth.value-1)
              .id({"solo": previous})
              .title({
                "sub": {
                  "font": {
                    "color": prev_color
                  },
                  "value": prev_sub
                },
                "total": {
                  "font": {
                    "color": prev_total
                  }
                }
              })
              .draw()

          })

          vars.self
            .depth(vars.depth.value+1)
            .id({"solo": [id]})
            .title({
              "sub": {
                "font": {
                  "color": color
                },
                "value": title
              },
              "total": {
                "font": {
                  "color": color
                }
              }
            })
            .draw()

        }
        else if (depth_delta === -1 && vars.zoom.value) {

          vars.history.back()

        }
        else if (vars.types[vars.type.value].zoom && vars.zoom.value) {

          edge_update()

          d3.select(this)
            .transition().duration(vars.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.timing.mouseevents)
            .attr("opacity",vars.data.opacity)

          d3plus.tooltip.remove(vars.type.value)
          vars.draw.update = false

          if (!d || d[vars.id.value] == vars.focus.value[0]) {
            vars.self.focus(false).draw()
          }
          else {
            vars.self.focus(d[vars.id.value]).draw()
          }

        }
        else if (vars.focus.value.length !== 1 || d[vars.id.value] != vars.focus.value[0]) {

          edge_update()

          var tooltip_data = d.d3plus_data ? d.d3plus_data : d

          d3plus.tooltip.app({
            "vars": vars,
            "data": tooltip_data
          })

        }

      }

    })

}
