//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws the appropriate shape based on the data
//------------------------------------------------------------------------------
d3plus.shape.draw = function(vars) {

  var data = vars.returned.nodes

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

    d.d3plus.id = ""

    vars.id.nesting.forEach(function(n,i){
      if (i <= depth) {
        d.d3plus.id += d3plus.variable.value(vars,d,n)
        d.d3plus.id += "_"
      }
    })

    d.d3plus.id += depth+"_"+shape

    vars.axes.values.forEach(function(axis){
      if (vars[axis].scale.value == "continuous") {
        d.d3plus.id += "_"+d3plus.variable.value(vars,d,vars[axis].key)
      }
    })

    d.d3plus.id = d3plus.utils.strip(d.d3plus.id)

    return d
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Transforms the positions and scale of each group.
  //----------------------------------------------------------------------------
  function transform(g,grow) {

    var scales = d3plus.apps[vars.type.value].scale
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
      vars.g.data.selectAll("g.d3plus_"+shape_lookup[shape])
        .transition().duration(vars.style.timing.transitions)
        .attr("opacity",0)
        .remove()
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

        if (shape == "coordinates") {
          if (!d.d3plus) {
            d.d3plus = {}
          }
          return d.id
        }

        if (d.values) {
          d.values.forEach(function(v){
            v = id(v)
            v.d3plus.shapeType = "circle"
          })
        }
        else {

          d = id(d)

          if (!d.d3plus.a) {

            d.d3plus.a = {"donut": Math.PI*2}
            var active = vars.active.key ? d.d3plus[vars.active.key] : d.d3plus.active,
                temp = vars.temp.key ? d.d3plus[vars.temp.key] : d.d3plus.temp,
                total = vars.total.key ? d.d3plus[vars.total.key] : d.d3plus.total

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

        return d.d3plus ? d.d3plus.id : d3plus.variable.value(vars,d,vars.id.key);

      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Enter
    //--------------------------------------------------------------------------
    var enter = selection.enter().append("g")
      .attr("class","d3plus_"+shape)
      .attr("opacity",0)
      .call(transform)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Update
    //--------------------------------------------------------------------------
    selection
      .order()
      .transition().duration(vars.style.timing.transitions)
      .call(transform)
      .attr("opacity",1)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Groups Exit
    //--------------------------------------------------------------------------
    var exit = selection.exit()
      .transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Draw appropriate graphics inside of each group
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("shapes")
    d3plus.shape[shape](vars,selection,enter,exit,transform)
    if (vars.dev.value) d3plus.console.timeEnd("shapes")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Check for active and temp fills for rects and donuts
    //--------------------------------------------------------------------------
    if (["rect","donut"].indexOf(shape) >= 0) {
      d3plus.shape.fill(vars,selection,enter,exit,transform)
    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create labels
    //--------------------------------------------------------------------------
    if (vars.dev.value) d3plus.console.time("labels")
    d3plus.shape.labels(vars,selection)
    if (vars.dev.value) d3plus.console.timeEnd("labels")

    if (vars.dev.value) d3plus.console.groupEnd()

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Function to Update Edges
  //----------------------------------------------------------------------------
  function edges(d) {

    var edge_count = vars.g.edges.selectAll("line, path").size()

    if (d) {

      vars.g.edges.selectAll("g")
        .each(function(l){

          var id = d[vars.id.key],
              source = l.source[vars.id.key],
              target = l.target[vars.id.key]

          if (source == id || target == id) {
            vars.g.edge_focus.node().appendChild(this.cloneNode(true))
          }

        })


      var marker = vars.edges.arrows.value ? "url(#d3plus_edge_marker_highlight)" : "none"

      vars.g.edge_focus
        .attr("opacity",0)
        .selectAll("line, path")
        .style("stroke",vars.style.highlight.primary)
        .attr("marker-start",function(){
          return vars.edges.arrows.direction.value == "source" ? marker : "none"
        })
        .attr("marker-end",function(){
          return vars.edges.arrows.direction.value == "target" ? marker : "none"
        })

      vars.g.edge_focus
        .transition().duration(vars.style.timing.mouseevents)
        .attr("opacity",1)

      if (edge_count < vars.edges.large) {
        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",0.5)
      }

    }
    else {

      vars.g.edge_focus
        .transition().duration(vars.style.timing.mouseevents)
        .attr("opacity",0)
        .transition()
        .selectAll("*")
        .remove()

      if (edge_count < vars.edges.large) {
        vars.g.edges
          .transition().duration(vars.style.timing.mouseevents)
          .attr("opacity",1)
      }

    }

  }

  vars.g.data.selectAll("g")
    .on(d3plus.evt.over,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        d3.select(this).style("cursor","pointer")

        vars.covered = false

        var tooltip_data = d.data ? d.data : d
        d3plus.tooltip.app({
          "vars": vars,
          "data": tooltip_data
        })

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse.over) {
          vars.mouse.over(d)
        }

        edges(d)

      }

    })
    .on(d3plus.evt.move,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        vars.covered = false

        if (["area","line"].indexOf(vars.shape.value) >= 0 || d3plus.apps[vars.type.value].tooltip == "follow") {

          var tooltip_data = d.data ? d.data : d
          d3plus.tooltip.app({
            "vars": vars,
            "data": tooltip_data
          })

        }

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse.move) {
          vars.mouse.move(d)
        }

      }

    })
    .on(d3plus.evt.out,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        if (!vars.covered) {
          d3plus.tooltip.remove(vars.type.value)
        }

        if (typeof vars.mouse == "function") {
          vars.mouse(d)
        }
        else if (vars.mouse.out) {
          vars.mouse.out(d)
        }

        edges()

      }

    })
    .on(d3plus.evt.click,function(d){

      if (!vars.frozen && (!d.d3plus || !d.d3plus.static)) {

        var depth_delta = vars.zoom_direction(),
            previous = vars.id.solo.value,
            title = d3plus.variable.value(vars,d,vars.text.key),
            color = d3plus.color.legible(d3plus.variable.color(vars,d)),
            prev_sub = vars.title.sub.value,
            prev_color = vars.style.title.sub["font-color"]

        if (d.d3plus.threshold && d.d3plus.merged) {

          vars.history.states.push(function(){

            vars.viz
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font-color": prev_color}}})
              .draw()

          })

          vars.viz
            .id({"solo": d.d3plus.merged})
            .title({"sub": title})
            .style({"title": {"sub": {"font-color": color}}})
            .draw()

        }
        else if (depth_delta === 1) {

          var id = d3plus.variable.value(vars,d,vars.id.key)

          vars.history.states.push(function(){

            vars.viz
              .depth(vars.depth.value-1)
              .id({"solo": previous})
              .title({"sub": prev_sub})
              .style({"title": {"sub": {"font-color": prev_color}}})
              .draw()

          })

          vars.viz
            .depth(vars.depth.value+1)
            .id({"solo": [id]})
            .title({"sub": title})
            .style({"title": {"sub": {"font-color": color}}})
            .draw()

        }
        else if (depth_delta === -1) {

          vars.back()

        }
        else {

          edges()

          var tooltip_data = d.data ? d.data : d

          d3plus.tooltip.app({
            "vars": vars,
            "data": tooltip_data
          })

          if (typeof vars.mouse == "function") {
            vars.mouse(d)
          }
          else if (vars.mouse.click) {
            vars.mouse.click(d)
          }

        }

      }

    })

}
