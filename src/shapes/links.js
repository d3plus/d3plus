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
  // Calculates and Draws Label for link
  //----------------------------------------------------------------------------
  function label(d) {
    
    if (!d.d3plus) {
      d.d3plus = {}
    }
      
    delete d.d3plus_label
  
    if (vars.g.links.selectAll("line, path").size() < vars.links.large && vars.links.label && d[vars.links.label]) {
      
      if ("spline" in d.d3plus) {

        var length = this.getTotalLength(),
            center = this.getPointAtLength(length/2),
            prev = this.getPointAtLength((length/2)-(length*.1)),
            next = this.getPointAtLength((length/2)+(length*.1)),
            radians = Math.atan2(next.y-prev.y,next.x-prev.x),
            angle = radians*(180/Math.PI),
            bounding = this.parentNode.getBBox(),
            width = length*.8,
            x = d.d3plus.translate.x+center.x,
            y = d.d3plus.translate.y+center.y,
            translate = {
              "x": d.d3plus.translate.x+center.x,
              "y": d.d3plus.translate.y+center.y
            }
            
      }
      else {

        var bounds = this.getBBox()
            start = {"x": d.source.d3plus.x, "y": d.source.d3plus.y},
            end = {"x": d.target.d3plus.x, "y": d.target.d3plus.y},
            xdiff = end.x-start.x,
            ydiff = end.y-start.y,
            center = {"x": end.x-(xdiff)/2, "y": end.y-(ydiff)/2},
            radians = Math.atan2(ydiff,xdiff),
            angle = radians*(180/Math.PI),
            length = Math.sqrt((xdiff*xdiff)+(ydiff*ydiff)),
            width = length-(vars.style.labels.padding*2),
            x = center.x,
            y = center.y,
            translate = {
              "x": center.x,
              "y": center.y
            }
            
      }
      
      if (angle < -90 || angle > 90) {
        angle -= 180
      }
    
      d.d3plus_label = {
        "x": x,
        "y": y,
        "translate": translate,
        "w": width,
        "h": 15,
        "angle": angle,
        "anchor": "middle",
        "valign": "center",
        "color": d3plus.color.legible(vars.style.links.color),
        "resize": false,
        "names": [vars.format(d[vars.links.label])],
        "background": true
      }
    
    }
    
    d3plus.shape.labels(vars,d3.select(this.parentNode))
        
  }
  
  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind "links" data to lines in the "links" group
  //----------------------------------------------------------------------------
  var line_data = links.filter(function(l){
    return !l.d3plus || (l.d3plus && !("spline" in l.d3plus))
  })
  
  var lines = vars.g.links.selectAll("g.d3plus_link_line")
    .data(line_data,function(d){
      return d.source[vars.id.key]+"_"+d.target[vars.id.key]
    })
    
  lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
    .transition().duration(vars.style.timing.transitions/2)
    .attr("opacity",0)
    .remove()
  
  lines.selectAll("line").transition().duration(vars.style.timing.transitions)
    .call(line)
    .call(style)
    .each("end",label)
  
  lines.enter().append("g")
    .attr("class","d3plus_link_line")
    .append("line")
    .call(line)
    .call(init)
    .transition().duration(vars.style.timing.transitions)
      .call(style)
      .each("end",label)
  
  lines.exit().transition().duration(vars.style.timing.transitions)
    .attr("opacity",0)
    .remove()
    
  var spline_data = links.filter(function(l){
    return l.d3plus && l.d3plus.spline
  })
  
  var splines = vars.g.links.selectAll("g.d3plus_link_path")
    .data(spline_data,function(d){
      return d.source[vars.id.key]+"_"+d.target[vars.id.key]
    })
    
  splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
    .transition().duration(vars.style.timing.transitions/2)
    .attr("opacity",0)
    .remove()
  
  splines.selectAll("path").transition().duration(vars.style.timing.transitions)
    .call(spline)
    .call(style)
    .each("end",label)
    
  splines.enter().append("g")
    .attr("class","d3plus_link_path")
    .append("path")
    .call(spline)
    .call(init)
    .transition().duration(vars.style.timing.transitions)
      .call(style)
      .each("end",label)
  
  splines.exit().transition().duration(vars.style.timing.transitions)
    .attr("opacity",0)
    .remove()
  
}
