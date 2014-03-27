//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.coordinates = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define the geographical projection
  //----------------------------------------------------------------------------
  var projection = d3.geo[vars.coords.projection.value]()
    .center(vars.coords.center)
    // .translate([-vars.app_width/2,-vars.app_height/2])

  // var clip = d3.geo.clipExtent()
  //     .extent([[0, 0], [vars.app_width, vars.app_height]]);

  if (!vars.zoom.scale) {
    vars.zoom.scale = 1
  }

  vars.zoom.area = 1/vars.zoom.scale/vars.zoom.scale

  // console.log(vars.zoom)

  // var simplify = d3.geo.transform({
  //   point: function(x, y, z) {
  //     if (z >= vars.zoom.area) this.stream.point(x,y);
  //   }
  // });

  vars.path = d3.geo.path()
    .projection(projection)
    // .projection(simplify)
    // .projection({stream: function(s) { return simplify.stream(clip.stream(s)); }})

  enter.append("path")
    .attr("id",function(d){

      var areas = []
      d.geometry.coordinates = d.geometry.coordinates.filter(function(c,i){

        var test = d3plus.utils.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a >= vars.coords.threshold) {
          areas.push(a)
          return true
        }
        return false

      })
      areas.sort(function(a,b){
        return a-b
      })

      var reduced = d3plus.utils.copy(d),
          largest = d3plus.utils.copy(d)
      reduced.geometry.coordinates = reduced.geometry.coordinates.filter(function(c,i){

        var test = d3plus.utils.copy(d)
        test.geometry.coordinates = [test.geometry.coordinates[i]]
        var a = vars.path.area(test)
        if (a == areas[areas.length-1]) {
          largest.geometry.coordinates = test.geometry.coordinates
        }
        return a >= d3.quantile(areas,.9)

      })
      d.reduced = reduced
      d.largest = largest

      return d.id
    })
    .attr("class","d3plus_data")
    .attr("d",vars.path)
    .call(d3plus.shape.style,vars)

  selection.selectAll("path.d3plus_data")
    .on(d3plus.evt.over,function(d){

      if (!vars.frozen) {

        d3.select(this).attr("opacity",1)

      }
    })
    .on(d3plus.evt.out,function(d){

      if (!vars.frozen) {

        d3.select(this).attr("opacity",vars.style.data.opacity)

      }
    })

  if (vars.timing) {
    selection.selectAll("path.d3plus_data")
      .transition().duration(vars.timing)
        .call(d3plus.shape.style,vars)
  }
  else {
    selection.selectAll("path.d3plus_data")
      .call(d3plus.shape.style,vars)
  }

  if (vars.coords.changed || vars.width.changed || vars.height.changed) {

    selection.each(function(d){

      var b = vars.path.bounds(d)

      if (!("d3plus_label" in d) && d.largest) {

        var center = vars.path.centroid(d.largest),
            lb = vars.path.bounds(d.largest)

        d.d3plus_label = {
          "anchor": "middle",
          "h": (lb[1][1]-lb[0][1])*.4,
          "w": (lb[1][0]-lb[0][0])*.4,
          "resize": true,
          "valign": "center",
          "x": center[0],
          "y": center[1]
        }
      }

      if (!vars.zoom.bounds) {
        vars.zoom.bounds =  b
      }
      else {
        if (vars.zoom.bounds[0][0] > b[0][0]) {
          vars.zoom.bounds[0][0] = b[0][0]
        }
        if (vars.zoom.bounds[0][1] > b[0][1]) {
          vars.zoom.bounds[0][1] = b[0][1]
        }
        if (vars.zoom.bounds[1][0] < b[1][0]) {
          vars.zoom.bounds[1][0] = b[1][0]
        }
        if (vars.zoom.bounds[1][1] < b[1][1]) {
          vars.zoom.bounds[1][1] = b[1][1]
        }
      }

    })

  }
  else if (!vars.focus.value) {
    vars.zoom.viewport = false
  }

}
