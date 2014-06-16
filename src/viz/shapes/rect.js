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

      d.d3plus_share = {
        "w": w,
        "h": d3.max([25,h/3]),
        "x": 0,
        "y": 0
      }

      d.d3plus_label.w = w
      d.d3plus_label.h = h

      d.d3plus_label.shape = vars.shape.value === "circle" ? "circle" : "square"

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
          return vars.shape.rendering.value
        }
        else {
          return "auto"
        }
      })

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "rects" Enter
  //----------------------------------------------------------------------------
  if (vars.draw.timing) {
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
  if (vars.draw.timing) {
    selection.selectAll("rect.d3plus_data")
      .data(data)
      .transition().duration(vars.draw.timing)
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
  if (vars.draw.timing) {
    exit.selectAll("rect.d3plus_data")
      .transition().duration(vars.draw.timing)
      .call(init)
  }

}
