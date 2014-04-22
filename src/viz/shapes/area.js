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

        var areas = [],
            obj = null,
            obj2 = null,
            label = {
              "w": 0,
              "h": 0,
              "x": 0,
              "y": 0
            }

        function check_area(area) {

          obj.y = d3.max([obj.y,area.y])
          obj.y0 = d3.min([obj.y0,area.y0])
          obj.x0 = area.x

          obj.h = (obj.y0 - obj.y)
          obj.w = (obj.x0 - obj.x)

          var toosmall = obj.h-(vars.labels.padding*2) < 15 || obj.w-(vars.labels.padding*2) < 20,
              aspect_old = label.w/label.h,
              size_old = label.w*label.h,
              aspect_new = obj.w/obj.h,
              size_new = obj.w*obj.h

          if ((!toosmall && size_old < size_new) || !label.w) {
            label = {
              "w": obj.w,
              "h": obj.h,
              "x": obj.x+(obj.w/2),
              "y": obj.y+(obj.h/2)
            }
          }
          if (obj.h < 10) {
            obj = d3plus.util.copy(area)
          }

        }

        d.values.forEach(function(v,i){

          if (!obj) {
            obj = d3plus.util.copy(v.d3plus)
          }
          else {
            var arr = d3plus.util.buckets([0,1],vars.labels.segments+1)
            arr.shift()
            arr.pop()
            arr.forEach(function(n){

              var test = d3plus.util.copy(v.d3plus),
                  last = d.values[i-1].d3plus

              test.x = last.x + (test.x-last.x) * n
              test.y = last.y + (test.y-last.y) * n
              test.y0 = last.y0 + (test.y0-last.y0) * n

              check_area(test)

            })
            check_area(d3plus.util.copy(v.d3plus))
          }
        })

        if (label.w >= 10 && label.h >= 10) {
          d.d3plus_label = label
        }

      }

      return [d];
    })

  if (vars.timing.transitions) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.timing.transitions)
        .attr("d",function(d){ return area(d.values) })
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .attr("d",function(d){ return area(d.values) })
      .call(d3plus.shape.style,vars)
  }

}
