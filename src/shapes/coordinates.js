//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.coordinates = function(vars,selection,enter,exit) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define the geographical projection
  //----------------------------------------------------------------------------
  var projection = d3.geo[vars.coords.projection.value]()
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

  var path = d3.geo.path()
    .projection(projection)
    // .projection(simplify)
    // .projection({stream: function(s) { return simplify.stream(clip.stream(s)); }})

  enter.append("path")
    .attr("id",function(d){
      return d.id
    })
    .attr("class","d3plus_data")
    .attr("d",path)
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

  if (vars.coords.changed || vars.width.changed || vars.height.changed || (vars.focus.value && vars.focus.changed)) {

    if (!vars.focus.value) {
      vars.zoom.bounds = false
    }
    selection.each(function(d){

      if (vars.focus.value && d[vars.id.key] == vars.focus.value) {
        vars.zoom.viewport = path.bounds(d)
      }

      if (!vars.focus.value) {
        var b = path.bounds(d)
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

      }

    })

  }
  else if (vars.focus.changed) {
    if (!vars.focus.value) {
      vars.zoom.viewport = vars.zoom.bounds
    }
  }

}
