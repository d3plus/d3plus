//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.edges = function(vars) {

  var edges = vars.returned.edges,
      scale = vars.zoom_behavior.scaleExtent()[0]

  if (!edges) var edges = []

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialization of Lines
  //----------------------------------------------------------------------------
  function init(l) {

    var opacity = vars.style.edges.opacity == 1 ? vars.style.edges.opacity : 0

    l
      .attr("opacity",opacity)
      .style("stroke-width",0)
      .style("stroke",vars.style.background)
      .style("fill","none")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Styling of Lines
  //----------------------------------------------------------------------------
  function style(edges) {

    var marker = vars.edges.arrows.value ? "url(#d3plus_edge_marker_default)" : "none"

    edges
      .style("stroke-width",vars.style.edges.width)
      .style("stroke",vars.style.edges.color)
      .attr("opacity",vars.style.edges.opacity)
      .attr("marker-start",function(e){
        var direction = vars.edges.arrows.direction.value
        return direction == "source" ? marker : "none"
      })
      .attr("marker-end",function(e){
        var direction = vars.edges.arrows.direction.value
        return direction == "target" ? marker : "none"
      })
      .attr("vector-effect","non-scaling-stroke")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Lines
  //----------------------------------------------------------------------------
  function line(l) {
    l
      .attr("x1",function(d){
        return d[vars.edges.source].d3plus.x
      })
      .attr("y1",function(d){
        return d[vars.edges.source].d3plus.y
      })
      .attr("x2",function(d){
        return d[vars.edges.target].d3plus.x
      })
      .attr("y2",function(d){
        return d[vars.edges.target].d3plus.y
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
        if (d[vars.edges.source].d3plus.r) {
          var x1 = d[vars.edges.source].d3plus.a,
              y1 = d[vars.edges.source].d3plus.r,
              x2 = d[vars.edges.target].d3plus.a,
              y2 = d[vars.edges.target].d3plus.r
          var obj = {}
          obj[vars.edges.source] = {"x":x1,"y":y1}
          obj[vars.edges.target] = {"x":x2,"y":y2}
          return radial(obj);

        }
        else {
          var x1 = d[vars.edges.source].d3plus.x,
              y1 = d[vars.edges.source].d3plus.y,
              x2 = d[vars.edges.target].d3plus.x,
              y2 = d[vars.edges.target].d3plus.y
          var obj = {}
          obj[vars.edges.source] = {"x":x1,"y":y1}
          obj[vars.edges.target] = {"x":x2,"y":y2}
          return diagonal(obj);
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
  // Calculates and Draws Label for edge
  //----------------------------------------------------------------------------
  function label(d) {

    delete d.d3plus_label

    if (vars.g.edges.selectAll("line, path").size() < vars.edges.large && vars.edges.label && d[vars.edges.label]) {

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
            start = {"x": d[vars.edges.source].d3plus.x, "y": d[vars.edges.source].d3plus.y},
            end = {"x": d[vars.edges.target].d3plus.x, "y": d[vars.edges.target].d3plus.y},
            xdiff = end.x-start.x,
            ydiff = end.y-start.y,
            center = {"x": end.x-(xdiff)/2, "y": end.y-(ydiff)/2},
            radians = Math.atan2(ydiff,xdiff),
            angle = radians*(180/Math.PI),
            length = Math.sqrt((xdiff*xdiff)+(ydiff*ydiff)),
            width = length,
            x = center.x,
            y = center.y,
            translate = {
              "x": center.x,
              "y": center.y
            }

      }

      if (vars.edges.arrows.value) {
        var m = typeof vars.edges.arrows.value == "number" ? typeof vars.edges.arrows.value == "number" : 8
        m = m/vars.zoom_behavior.scaleExtent()[1]
        width -= m*2
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
        "color": vars.style.edges.color,
        "resize": false,
        "names": [vars.format(d[vars.edges.label])],
        "background": true
      }

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/update/exit the Arrow Marker
  //----------------------------------------------------------------------------
  var marker_data = vars.edges.arrows.value ? ["default","highlight","focus"] : []
  var marker = vars.defs.selectAll(".d3plus_edge_marker")
    .data(marker_data)

  var m = vars.style.edges.arrows

  var marker_style = function(path) {
    path
      .attr("d",function(){
        if (vars.edges.arrows.direction.value == "target") {
          return "M -"+m+",-"+m/2+" L 0,0 L -"+m+","+m/2+" L -"+m+",-"+m/2
        }
        else {
          return "M "+m+",-"+m/2+" L 0,0 L "+m+","+m/2+" L "+m+",-"+m/2
        }
      })
      .attr("fill",function(d){
        if (d == "default") {
          return vars.style.edges.color
        }
        else if (d == "focus") {
          return vars.style.highlight.focus
        }
        else {
          return vars.style.highlight.primary
        }
      })
  }

  if (vars.timing) {
    marker.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    marker.select("path").transition().duration(vars.timing)
      .attr("opacity",1)
      .attr("markerWidth",m)
      .attr("markerHeight",m)
      .call(marker_style)
  }
  else {
    marker.exit().remove()

    marker.select("path")
      .attr("opacity",1)
      .attr("markerWidth",m)
      .attr("markerHeight",m)
      .call(marker_style)
  }

  var opacity = vars.timing ? 0 : 1
  var enter = marker.enter().append("marker")
    .attr("id",function(d){
      return "d3plus_edge_marker_"+d
    })
    .attr("class","d3plus_edge_marker")
    .attr("orient","auto")
    .attr("markerUnits","userSpaceOnUse")
    .attr("markerWidth",m)
    .attr("markerHeight",m)
    .style("overflow","visible")
    .append("path")
    .attr("opacity",opacity)
    .attr("vector-effect","non-scaling-stroke")
    .call(marker_style)

  if (vars.timing) {
    enter.transition().duration(vars.timing)
      .attr("opacity",1)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind "edges" data to lines in the "edges" group
  //----------------------------------------------------------------------------
  var line_data = edges.filter(function(l){
    return !l.d3plus || (l.d3plus && !("spline" in l.d3plus))
  })

  var lines = vars.g.edges.selectAll("g.d3plus_edge_line")
    .data(line_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.key]+"_"+d[vars.edges.target][vars.id.key]

      return d.d3plus.id
      
    })

  var spline_data = edges.filter(function(l){
    return l.d3plus && l.d3plus.spline
  })

  var splines = vars.g.edges.selectAll("g.d3plus_edge_path")
    .data(spline_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.key]+"_"+d[vars.edges.target][vars.id.key]

      return d.d3plus.id

    })

  if (vars.timing) {

    lines.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    splines.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.timing/2)
      .attr("opacity",0)
      .remove()

    splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.timing/2)
      .attr("opacity",0)
      .remove()

    lines.selectAll("line").transition().duration(vars.timing)
      .call(line)
      .call(style)
      .each("end",label)

    splines.selectAll("path").transition().duration(vars.timing)
      .call(spline)
      .call(style)
      .each("end",label)

    lines.enter().append("g")
      .attr("class","d3plus_edge_line")
      .append("line")
      .call(line)
      .call(init)
      .transition().duration(vars.timing)
        .call(style)
        .each("end",label)

    splines.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(spline)
      .call(init)
      .transition().duration(vars.timing)
        .call(style)
        .each("end",label)

  }
  else {

    lines.exit().remove()

    splines.exit().remove()

    lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .remove()

    splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .remove()

    lines.selectAll("line")
      .call(line)
      .call(style)
      .call(label)

    splines.selectAll("path")
      .call(spline)
      .call(style)
      .call(label)

    lines.enter().append("g")
      .attr("class","d3plus_edge_line")
      .append("line")
      .call(line)
      .call(init)
      .call(style)
      .call(label)

    splines.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(spline)
      .call(init)
      .call(style)
      .call(label)

  }

  vars.g.edges.selectAll("g")
    .sort(function(a,b){
      var a = vars.connected(a),
          b = vars.connected(b)
      return a - b
    })

}
