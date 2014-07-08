//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.area = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // D3 area definition
  //----------------------------------------------------------------------------
  var area = d3.svg.area()
    .x(function(d) { return d.d3plus.x; })
    .y0(function(d) { return d.d3plus.y0; })
    .y1(function(d) { return d.d3plus.y; })
    .interpolate(vars.shape.interpolate.value)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Enter
  //----------------------------------------------------------------------------
  enter.append("path").attr("class","d3plus_data")
    .attr("d",function(d){ return area(d.values) })
    .call(d3plus.shape.style,vars)

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // "paths" Update
  //----------------------------------------------------------------------------
  selection.selectAll("path.d3plus_data")
    .data(function(d) {

      if (vars.labels.value) {

        var tops = []
          , bottoms = []
        d.values.forEach(function(v){
          tops.push([v.d3plus.x,v.d3plus.y])
          bottoms.push([v.d3plus.x,v.d3plus.y0])
        })
        tops = tops.concat(bottoms.reverse())
        var lr = largestRectangle(tops)[0]

        if (lr) {

          var label = {
            "w": Math.floor(lr.width),
            "h": Math.floor(lr.height),
            "x": Math.floor(lr.cx),
            "y": Math.floor(lr.cy),
            "angle": lr.angle*-1
          }
          if (lr.angle !== 0) {
            label.translate = {
              "x":label.x,
              "y":label.y
            }
          }
          else {
            label.translate = false
          }

          if (label.w >= 10 && label.h >= 10) {
            d.d3plus_label = label
          }

        }

      }

      return [d];
    })

  if (vars.draw.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.draw.timing)
        .attr("d",function(d){ return area(d.values) })
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .attr("d",function(d){ return area(d.values) })
      .call(d3plus.shape.style,vars)
  }

}
