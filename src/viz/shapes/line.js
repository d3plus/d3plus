//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "line" shapes using svg:line
//------------------------------------------------------------------------------
d3plus.shape.line = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The D3 line function that determines what variables to use for x and y
  // positioning, as well as line interpolation defined by the user.
  //----------------------------------------------------------------------------
  var line = d3.svg.line()
    .x(function(d){ return d.d3plus.x; })
    .y(function(d){ return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Divide each line into it's segments. We do this so that there can be gaps
  // in the line and mouseover.
  //
  // Then, create new data group from values to become small nodes at each
  // point on the line.
  //----------------------------------------------------------------------------

  var hitarea = vars.data.stroke.width
  if (hitarea < 30) {
    hitarea = 30
  }

  selection.each(function(d){

    var step = false,
        segments = [],
        nodes = [],
        temp = d3plus.util.copy(d),
        group = d3.select(this)

    temp.values = []
    d.values.forEach(function(v,i,arr){
      nodes.push(v)
      var k = v[vars[vars.continuous_axis].value],
          index = vars.tickValues[vars.continuous_axis].indexOf(k)

      if (step === false) {
        step = index
      }

      if (i+step == index) {
        temp.values.push(v)
        temp.key += "_"+segments.length
      }
      else {
        if (i > 0) {
          segments.push(temp)
          temp = d3plus.util.copy(d)
          temp.values = []
        }
        temp.values.push(v)
        temp.key += "_"+segments.length
        step++
      }
      if (i == arr.length-1) {
        segments.push(temp)
      }
    })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind segment data to "paths"
    //--------------------------------------------------------------------------
    var paths = group.selectAll("path.d3plus_line")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Bind node data to "rects"
    //--------------------------------------------------------------------------
    var rects = group.selectAll("rect.d3plus_anchor")
      .data(nodes, function(d){
        return d.d3plus.id
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // "paths" and "rects" Enter/Update
    //--------------------------------------------------------------------------
    if (vars.timing.transitions) {

      paths.transition().duration(vars.timing.transitions)
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      paths.enter().append("path")
        .attr("class","d3plus_line")
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){
          return d.d3plus.id
        })
        .call(init)
        .call(d3plus.shape.style,vars)

      rects.transition().duration(vars.timing.transitions)
        .call(update)
        .call(d3plus.shape.style,vars)

      rects.exit().transition().duration(vars.timing.transitions)
        .call(init)
        .remove()

    }
    else {

      paths.enter().append("path")
        .attr("class","d3plus_line")

      paths
        .attr("d",function(d){ return line(d.values) })
        .call(d3plus.shape.style,vars)

      rects.enter().append("rect")
        .attr("class","d3plus_anchor")
        .attr("id",function(d){
          return d.d3plus.id
        })

      rects.call(update)
        .call(d3plus.shape.style,vars)

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create mouse event lines
    //--------------------------------------------------------------------------
    var mouse = group.selectAll("path.d3plus_mouse")
      .data(segments, function(d){
        return d.key
      })

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Enter
    //--------------------------------------------------------------------------
    mouse.enter().append("path")
      .attr("class","d3plus_mouse")
      .attr("d",function(l){ return line(l.values) })
      .style("stroke","black")
      .style("stroke-width",hitarea)
      .style("fill","none")
      .style("stroke-linecap","round")
      .attr("opacity",0)

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Update
    //--------------------------------------------------------------------------
    mouse
      .on(d3plus.evt.over,function(m){

        if (!vars.draw.frozen) {

          var mouse = d3.event[vars.continuous_axis]
              positions = d3plus.util.uniques(d.values,function(x){return x.d3plus[vars.continuous_axis]}),
              closest = d3plus.util.closest(positions,mouse)

          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus

          d3.select(this.parentNode).selectAll("path.d3plus_line")
            .transition().duration(vars.timing.mouseevents)
            .style("stroke-width",vars.data.stroke.width*2)

          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.timing.mouseevents)
            .style("stroke-width",vars.data.stroke.width*2)
            .call(update,2)

        }

      })
      .on(d3plus.evt.move,function(d){

        if (!vars.draw.frozen) {

          var mouse = d3.event.x,
              positions = d3plus.util.uniques(d.values,function(x){return x.d3plus.x}),
              closest = d3plus.util.closest(positions,mouse)

          var parent_data = d3.select(this.parentNode).datum()
          parent_data.data = d.values[positions.indexOf(closest)]
          parent_data.d3plus = d.values[positions.indexOf(closest)].d3plus

        }

      })
      .on(d3plus.evt.out,function(d){

        if (!vars.draw.frozen) {

          d3.select(this.parentNode).selectAll("path.d3plus_line")
            .transition().duration(vars.timing.mouseevents)
            .style("stroke-width",vars.data.stroke.width)

          d3.select(this.parentNode).selectAll("rect")
            .transition().duration(vars.timing.mouseevents)
            .style("stroke-width",vars.data.stroke.width)
            .call(update)

          var parent_data = d3.select(this.parentNode).datum()
          delete parent_data.data
          delete parent_data.d3plus

        }

      })

    if (vars.timing.transitions) {

      mouse.transition().duration(vars.timing.transitions)
        .attr("d",function(l){ return line(l.values) })
        .style("stroke-width",hitarea)

    }
    else {

      mouse.attr("d",function(l){ return line(l.values) })
        .style("stroke-width",hitarea)

    }

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mouse "paths" Exit
    //--------------------------------------------------------------------------
    mouse.exit().remove()

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on enter and exit.
  //----------------------------------------------------------------------------
  function init(n) {

    n
      .attr("x",function(d){
        return d.d3plus.x
      })
      .attr("y",function(d){
        return d.d3plus.y
      })
      .attr("width",0)
      .attr("height",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each anchor point on update.
  //----------------------------------------------------------------------------
  function update(n,mod) {

    if (!mod) var mod = 0

    n
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return d.d3plus.x - ((w/2)+(mod/2))
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return d.d3plus.y - ((h/2)+(mod/2))
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w+mod
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h+mod
      })
      .attr("rx",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return (w+mod)/2
      })
      .attr("ry",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return (h+mod)/2
      })

  }

}
