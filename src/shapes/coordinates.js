//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.coordinates = function(vars,selection,enter,exit) {
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Define the geographical projection
  //----------------------------------------------------------------------------
  var projection = d3.geo[vars.coords.projection.value]()
  
  var clip = d3.geo.clipExtent()
      .extent([[0, 0], [vars.app_width, vars.app_height]]);
      
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
    .attr("class","data")
    .attr("d",path)
    .call(d3plus.shape.style,vars)
    
  selection.selectAll("path.data")
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
    .transition().duration(vars.style.timing.transitions)
      .call(d3plus.shape.style,vars)
      
  if (vars.coords.changed || vars.width.changed || vars.height.changed) {
    if (vars.viewport == vars.bounds) {
      vars.viewport = false
    }
    vars.bounds = false
    selection.each(function(d){
      var b = path.bounds(d)
      if (!vars.bounds) {
        vars.bounds = b
      }
      else {
        if (vars.bounds[0][0] > b[0][0]) {
          vars.bounds[0][0] = b[0][0]
        }
        if (vars.bounds[0][1] > b[0][1]) {
          vars.bounds[0][1] = b[0][1]
        }
        if (vars.bounds[1][0] < b[1][0]) {
          vars.bounds[1][0] = b[1][0]
        }
        if (vars.bounds[1][1] < b[1][1]) {
          vars.bounds[1][1] = b[1][1]
        }
      }
    })
  }
    
  if (!vars.viewport) {
    d3plus.zoom.reset(vars)
  }
  
}
