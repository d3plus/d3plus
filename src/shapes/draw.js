//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws the appropriate shape based on the data
//------------------------------------------------------------------------------
d3plus.shape.draw = function(vars) {

  var data = vars.returned.nodes || [],
      edges = vars.returned.edges || []

  vars.timing = data.length < vars.data.large && edges.length < vars.edges.large ? vars.style.timing.transitions : 0

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

    var depth = d.d3plus.depth ? d.d3plus.depth : vars.depth.value

    d.d3plus.id = d3plus.variable.value(vars,d,vars.id.nesting[depth])
    d.d3plus.id += "_"+depth+"_"+shape

    vars.axes.values.forEach(function(axis){
      if (vars[axis].scale.value == "continuous") {
        d.d3plus.id += "_"+d3plus.variable.value(vars,d,vars[axis].value)
      }
    })

    d.d3plus.id = d3plus.util.strip(d.d3plus.id)

    return d
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Transforms the positions and scale of each group.
  //----------------------------------------------------------------------------
  function transform(g,grow) {

    var scales = d3plus.visualization[vars.type.value].scale
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
        if (["line","area","coordinates"].indexOf(shape) < 0) {
          return "translate("+d.d3plus.x+","+d.d3plus.y+")scale("+scale+")"
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
    if (!(shape_lookup[shape] in shapes) || Object.keys(shapes).length === 0) {
      if (vars.timing) {
        vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
          .transition().duration(vars.timing)
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
  for (shape in shapes) {

    if (vars.dev.value) d3plus.console.group("Drawing \"" + shape + "\" groups")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Filter out too small shapes
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("filtering out small shapes")
    var filtered_shapes = shapes[shape].filter(function(s){
      if (s.d3plus) {
        if ("width" in s.d3plus && s.d3plus.width < 1) {
          return false
        }
        if ("height" in s.d3plus && s.d3plus.height < 1) {
          return false
        }
        if ("r" in s.d3plus && s.d3plus.r < 0.5) {
          return false
        }
      }
      else if (s.values) {
        var small = true
        s.values.forEach(function(v){
          if (!("y0" in v.d3plus)) {
            small = false
          }
          else if (small && "y0" in v.d3plus && v.d3plus.y0-v.d3plus.y >= 1) {
            small = false
          }
        })
        if (small) {
          return false
        }
      }
      return true
    })

    if (vars.dev.value) {
      d3plus.console.timeEnd("filtering out small shapes")
      var removed = shapes[shape].length-filtered_shapes.length,
          percent = d3.round(removed/shapes[shape].length,2)
      console.log("removed "+removed+" out of "+shapes[shape].length+" shapes ("+percent*100+"% reduction)")
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind Data to Groups
    //--------------------------------------------------------------------------
    var selection = vars.g.data.selectAll("g.d3plus_"+shape)
      .data(filtered_shapes,function(d){

        if (!d.d3plus) {
          d.d3plus = {}
        }

        if (shape == "coordinates") {
          d.d3plus.id = d.id
          return d.id
        }

        if (!d.d3plus.id) {

          if (d.values) {

            d.values.forEach(function(v){
              v = id(v)
              v.d3plus.shapeType = "circle"
            })
            d.d3plus.id = d.key

          }
          else {

            d = id(d)

            if (!d.d3plus.a) {

              d.d3plus.a = {"donut": Math.PI*2}
              var active = vars.active.value ? d.d3plus[vars.active.value] : d.d3plus.active,
                  temp = vars.temp.value ? d.d3plus[vars.temp.value] : d.d3plus.temp,
                  total = vars.total.value ? d.d3plus[vars.total.value] : d.d3plus.total

              if (total) {
                if (active) {
                  d.d3plus.a.active = (active/total) * (Math.PI * 2)
                }
                else {
                  d.d3plus.a.active = 0
                }
                if (temp) {
                  d.d3plus.a.temp = ((temp/total) * (Math.PI * 2)) + d.d3plus.a.active
                }
                else {
                  d.d3plus.a.temp = 0
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
    if (vars.timing) {
      var exit = selection.exit()
        .transition().duration(vars.timing)
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
    if (vars.timing) {
      selection
        .transition().duration(vars.timing)
        .call(transform)
    }
    else {
      selection.call(transform)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Enter
    //--------------------------------------------------------------------------
    var opacity = vars.timing ? 0 : 1
    var enter = selection.enter().append("g")
      .attr("class","d3plus_"+shape)
      .attr("opacity",opacity)
      .call(transform)

    if (vars.timing) {
      enter.transition().duration(vars.timing)
        .attr("opacity",1)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // All Groups Sort Order
    //--------------------------------------------------------------------------
    selection.order()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Draw appropriate graphics inside of each group
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("shapes")
    d3plus.shape[shape](vars,selection,enter,exit,transform)
    if (vars.dev.value) d3plus.console.timeEnd("shapes")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for active and temp fills for rects and donuts
    //--------------------------------------------------------------------------
    if (["rect","donut"].indexOf(shape) >= 0 && d3plus.visualization[vars.type.value].fill) {
      d3plus.shape.fill(vars,selection,enter,exit,transform)
    }

    if (vars.dev.value) d3plus.console.groupEnd()

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function to Update Edges
  //----------------------------------------------------------------------------
  function edge_update(d) {

    if (d && vars.g.edges.selectAll("g").size() > 0) {

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
          .style("stroke",vars.style.highlight.primary)
          .style("stroke-width",function(){
            return vars.edges.size ? d3.select(this).style("stroke-width")
                 : vars.style.data.stroke.width*2
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
        .style("fill",vars.style.highlight.primary)

      if (vars.timing) {

        vars.g.edge_hover
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)

        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",0.5)

      }
      else {

        vars.g.edge_hover
          .attr("opacity",1)

      }

    }
    else {

      if (vars.timing) {

        vars.g.edge_hover
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",0)
          .transition()
          .selectAll("*")
          .remove()

        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
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

        if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this).style("cursor","pointer")
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform,true)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",1)

          vars.covered = false

          if (["area","line"].indexOf(vars.shape.value) >= 0
            || (d3plus.visualization[vars.type.value].tooltip == "follow" &&
            (vars.focus.value != d[vars.id.value]) || !vars.focus.tooltip.value)) {

            if (vars.continuous_axis) {

              var mouse = d3.event[vars.continuous_axis]
                  positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
                  closest = d3plus.util.closest(positions,mouse)

              d.data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.data ? d.data : d
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

        if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          vars.covered = false

          if (["area","line"].indexOf(vars.shape.value) >= 0
            || (d3plus.visualization[vars.type.value].tooltip == "follow" &&
            (vars.focus.value != d[vars.id.value]) || !vars.focus.tooltip.value)) {

            if (vars.continuous_axis) {

              var mouse = d3.event[vars.continuous_axis]
                  positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
                  closest = d3plus.util.closest(positions,mouse)

              d.data = d.values[positions.indexOf(closest)]
              d.d3plus = d.values[positions.indexOf(closest)].d3plus

            }

            var tooltip_data = d.data ? d.data : d
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

        if (!child && !vars.frozen && (!d.d3plus || !d.d3plus.static)) {

          d3.select(this)
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",vars.style.data.opacity)


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
      .on(d3plus.evt.over,vars.touchEvent)
      .on(d3plus.evt.move,vars.touchEvent)
      .on(d3plus.evt.out,vars.touchEvent)

  }

  vars.g.data.selectAll("g")
    .on(d3plus.evt.click,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse[d3plus.evt.out]) {
          vars.mouse[d3plus.evt.out](d)
        }
        else if (vars.mouse[d3plus.evt.click]) {
          vars.mouse[d3plus.evt.click](d)
        }

        var depth_delta = vars.zoom_direction(),
            previous = vars.id.solo.value,
            title = d3plus.variable.text(vars,d)[0],
            color = d3plus.color.legible(d3plus.variable.color(vars,d)),
            prev_sub = vars.title.sub.value || false,
            prev_color = vars.style.title.sub.font.color,
            prev_total = vars.style.title.total.font.color

        if (d.d3plus.threshold && d.d3plus.merged && vars.zoom.value) {

          vars.history.states.push(function(){

            vars.viz
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font": {"color": prev_color}}, "total": {"font": {"color": prev_total}}}})
              .draw()

          })

          vars.viz
            .id({"solo": d.d3plus.merged})
            .title({"sub": title})
            .style({"title": {"sub": {"font": {"color": color}}, "total": {"font": {"color": color}}}})
            .draw()

        }
        else if (depth_delta === 1 && vars.zoom.value) {

          var id = d3plus.variable.value(vars,d,vars.id.value)

          vars.history.states.push(function(){

            vars.viz
              .depth(vars.depth.value-1)
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font": {"color": prev_color}}, "total": {"font": {"color": prev_total}}}})
              .draw()

          })

          vars.viz
            .depth(vars.depth.value+1)
            .id({"solo": [id]})
            .title({"sub": title})
            .style({"title": {"sub": {"font": {"color": color}}, "total": {"font": {"color": color}}}})
            .draw()

        }
        else if (depth_delta === -1 && vars.zoom.value) {

          vars.history.back()

        }
        else if (d3plus.visualization[vars.type.value].zoom && vars.zoom.value) {

          edge_update()

          d3.select(this)
            .transition().duration(vars.style.timing.mouseevents)
            .call(transform)

          d3.select(this).selectAll(".d3plus_data")
            .transition().duration(vars.style.timing.mouseevents)
            .attr("opacity",vars.style.data.opacity)

          d3plus.tooltip.remove(vars.type.value)
          vars.update = false

          if (!d || d[vars.id.value] == vars.focus.value) {
            vars.viz.focus(null).draw()
          }
          else {
            vars.viz.focus(d[vars.id.value]).draw()
          }

        }
        else if (d[vars.id.value] != vars.focus.value) {

          edge_update()

          var tooltip_data = d.data ? d.data : d

          d3plus.tooltip.app({
            "vars": vars,
            "data": tooltip_data
          })

        }

      }

    })

}
