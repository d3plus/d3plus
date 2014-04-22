//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.rect = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate label position and pass data from parent.
  //----------------------------------------------------------------------------
  function data(d) {

    if (vars.labels.value && !d.d3plus.label) {

      d.d3plus_label = {
        "w": 0,
        "h": 0,
        "x": 0,
        "y": 0
      }

      var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width,
          h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height

      // Square bounds
      if (vars.shape.value == "square") {

        d.d3plus_share = {
          "w": w,
          "h": h/4,
          "x": 0,
          "y": 0
        }

        d.d3plus_label.w = w
        d.d3plus_label.h = h

      }
      // Circle bounds
      else {
        d.d3plus_label.w = Math.sqrt(Math.pow(w,2)*.8)
        d.d3plus_label.h = Math.sqrt(Math.pow(h,2)*.8)
      }

    }
    else if (d.d3plus.label) {
      d.d3plus_label = d.d3plus.label
    }

    return [d];

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on enter and exit.
  //----------------------------------------------------------------------------
  function init(nodes) {

    nodes
      .attr("x",0)
      .attr("y",0)
      .attr("width",0)
      .attr("height",0)

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // The position and size of each rectangle on update.
  //----------------------------------------------------------------------------
  function update(nodes) {

    nodes
      .attr("x",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return -w/2
      })
      .attr("y",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return -h/2
      })
      .attr("width",function(d){
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return w
      })
      .attr("height",function(d){
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return h
      })
      .attr("rx",function(d){
        var rounded = vars.shape.value == "circle"
        var w = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.width
        return rounded ? (w+2)/2 : 0
      })
      .attr("ry",function(d){
        var rounded = vars.shape.value == "circle"
        var h = d.d3plus.r ? d.d3plus.r*2 : d.d3plus.height
        return rounded ? (h+2)/2 : 0
      })
      .attr("transform",function(d){
        if ("rotate" in d.d3plus) {
          return "rotate("+d.d3plus.rotate+")"
        }
        return ""
      })
      .attr("shape-rendering",function(d){
        if (vars.shape.value == "square" && !("rotate" in d.d3plus)) {
          return vars.rendering
        }
        else {
          return "auto"
        }
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Enter
  //----------------------------------------------------------------------------
  if (vars.timing.transitions) {
    enter.append("rect")
      .attr("class","d3plus_data")
      .call(init)
      .call(d3plus.shape.style,vars)
  }
  else {
    enter.append("rect")
      .attr("class","d3plus_data")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Update
  //----------------------------------------------------------------------------
  if (vars.timing.transitions) {
    selection.selectAll("rect.d3plus_data")
      .data(data)
      .transition().duration(vars.timing.transitions)
        .call(update)
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("rect.d3plus_data")
      .data(data)
      .call(update)
      .call(d3plus.shape.style,vars)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Exit
  //----------------------------------------------------------------------------
  if (vars.timing.transitions) {
    exit.selectAll("rect.d3plus_data")
      .transition().duration(vars.timing.transitions)
      .call(init)
  }

}
