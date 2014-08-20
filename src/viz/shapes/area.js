var fetchText = require("../../core/fetch/text.js")
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

      if (vars.labels.value && d.values.length > 1) {

        var tops = []
          , bottoms = []
          , names = fetchText(vars,d)

        d.values.forEach(function(v){
          tops.push([v.d3plus.x,v.d3plus.y])
          bottoms.push([v.d3plus.x,v.d3plus.y0])
        })
        tops = tops.concat(bottoms.reverse())

        var style = {
          "font-weight": vars.labels.font.weight,
          "font-family": vars.labels.font.family.value
        }

        if (names.length) {
          var size = d3plus.font.sizes(names[0],style)
            , ratio = size[0].width/size[0].height
        }
        else {
          var ratio = null
        }

        var lr = d3plus.geom.largestRect(tops,{
          "angle": d3.range(-70,71,1),
          "aspectRatio": ratio,
          "tolerance": 0
        })

        if (lr && lr[0]) {

          var label = {
            "w": Math.floor(lr[0].width),
            "h": Math.floor(lr[0].height),
            "x": Math.floor(lr[0].cx),
            "y": Math.floor(lr[0].cy),
            "angle": lr[0].angle*-1,
            "padding": 2,
            "names": names
          }

          if (lr[0].angle !== 0) {
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
