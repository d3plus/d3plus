//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.links = function(vars,links) {
  
  if (!links) var links = []
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialization of Lines
  //----------------------------------------------------------------------------
  function init(l) {
    
    var opacity = vars.style.links.opacity == 1 ? vars.style.links.opacity : 0
    
    l
      .attr("opacity",opacity)
      .style("stroke-width",0)
      .style("stroke",vars.style.background)
      .style("fill","none")
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Styling of Lines
  //----------------------------------------------------------------------------
  function style(l) {
    l
      .style("stroke-width",vars.style.links.width)
      .style("stroke",vars.style.links.color)
      .attr("opacity",vars.style.links.opacity)
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Lines
  //----------------------------------------------------------------------------
  function line(l) {
    l
      .attr("x1",function(d){
        return d.source.d3plus.x
      })
      .attr("y1",function(d){
        return d.source.d3plus.y
      })
      .attr("x2",function(d){
        return d.target.d3plus.x
      })
      .attr("y2",function(d){
        return d.target.d3plus.y
      })
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Splines
  //----------------------------------------------------------------------------
  var diagonal = d3.svg.diagonal(),
      radial = d3.svg.diagonal()
        .projection(function(d){
          var r = d.y, a = d.x;
          return [r * Math.cos(a), r * Math.sin(a)];
        })
      
  function spline(l) {
    l
      .attr("d", function(d) {
        if (d.source.d3plus.r) {
          var x1 = d.source.d3plus.a,
              y1 = d.source.d3plus.r,
              x2 = d.target.d3plus.a,
              y2 = d.target.d3plus.r
          return radial({"source":{"x":x1,"y":y1},"target":{"x":x2,"y":y2}});
              
        }
        else {
          var x1 = d.source.d3plus.x,
              y1 = d.source.d3plus.y,
              x2 = d.target.d3plus.x,
              y2 = d.target.d3plus.y
          return diagonal({"source":{"x":x1,"y":y1},"target":{"x":x2,"y":y2}});
        }
      })
      .attr("transform",function(d){
        if (d.d3plus && d.d3plus.translate) {
          var x = d.d3plus.translate.x || 0
          var y = d.d3plus.translate.y || 0
          return "translate("+x+","+y+")"
        }
        else {
          "translate(0,0)"
        }
      })
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind "links" data to lines in the "links" group
  //----------------------------------------------------------------------------
  var line_data = links.filter(function(l){
    return !l.d3plus || !l.d3plus.spline
  })
  
  var lines = vars.g.links.selectAll("line")
    .data(line_data,function(d){
      return d.source[vars.id.key]+"_"+d.target[vars.id.key]
    })
  
  lines.enter().append("line")
    .call(line)
    .call(init)
  
  lines.transition().duration(vars.style.timing.transitions)
    .call(line)
    .call(style)
  
  lines.exit()
    .call(init)
    .remove()
    
  var spline_data = links.filter(function(l){
    return l.d3plus && l.d3plus.spline
  })
  
  var splines = vars.g.links.selectAll("path")
    .data(spline_data,function(d){
      return d.source[vars.id.key]+"_"+d.target[vars.id.key]
    })
  
  splines.enter().append("path")
    .call(spline)
    .call(init)
  
  splines.transition().duration(vars.style.timing.transitions)
    .call(spline)
    .call(style)
  
  splines.exit().transition().duration(vars.style.timing.transitions)
    .call(init)
    .remove()
  
}
