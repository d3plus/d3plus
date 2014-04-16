//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Draws "square" and "circle" shapes using svg:rect
//------------------------------------------------------------------------------
d3plus.shape.edges = function(vars) {

  var edges = vars.returned.edges || [],
      scale = vars.zoom.behavior.scaleExtent()[0]

  if (typeof vars.edges.size === "string") {

    var strokeDomain = d3.extent(edges, function(e){
                         return e[vars.edges.size]
                       })
      , maxSize = d3.min(vars.returned.nodes || [], function(n){
                        return n.d3plus.r
                      })*.6

    vars.edges.scale = d3.scale.sqrt()
                        .domain(strokeDomain)
                        .range([vars.style.edges.width,maxSize*scale])

  }
  else {

    var defaultWidth = typeof vars.edges.size == "number"
                     ? vars.edges.size : vars.style.edges.width

    vars.edges.scale = function(){
      return defaultWidth
    }

  }

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

    var marker = vars.edges.arrows.value

    edges
      .style("stroke-width",function(e){
        return vars.edges.scale(e[vars.edges.size])
      })
      .style("stroke",vars.style.edges.color)
      .attr("opacity",vars.style.edges.opacity)
      .attr("marker-start",function(e){

        var direction = vars.edges.arrows.direction.value

        if ("bucket" in e.d3plus) {
          var d = "_"+e.d3plus.bucket
        }
        else {
          var d = ""
        }

        return direction == "source" && marker
             ? "url(#d3plus_edge_marker_default"+d+")" : "none"

      })
      .attr("marker-end",function(e){

        var direction = vars.edges.arrows.direction.value

        if ("bucket" in e.d3plus) {
          var d = "_"+e.d3plus.bucket
        }
        else {
          var d = ""
        }

        return direction == "target" && marker
             ? "url(#d3plus_edge_marker_default"+d+")" : "none"

      })
      .attr("vector-effect","non-scaling-stroke")
      .attr("pointer-events","none")
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Lines
  //----------------------------------------------------------------------------
  function line(l) {
    l
      .attr("x1",function(d){
        return d[vars.edges.source].d3plus.dx
      })
      .attr("y1",function(d){
        return d[vars.edges.source].d3plus.dy
      })
      .attr("x2",function(d){
        return d[vars.edges.target].d3plus.dx
      })
      .attr("y2",function(d){
        return d[vars.edges.target].d3plus.dy
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
        if (d[vars.edges.source].d3plus.dr) {
          var x1 = d[vars.edges.source].d3plus.a,
              y1 = d[vars.edges.source].d3plus.dr,
              x2 = d[vars.edges.target].d3plus.a,
              y2 = d[vars.edges.target].d3plus.dr
          var obj = {}
          obj[vars.edges.source] = {"x":x1,"y":y1}
          obj[vars.edges.target] = {"x":x2,"y":y2}
          return radial(obj);

        }
        else {
          var x1 = d[vars.edges.source].d3plus.dx,
              y1 = d[vars.edges.source].d3plus.dy,
              x2 = d[vars.edges.target].d3plus.dx,
              y2 = d[vars.edges.target].d3plus.dy
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
            start = {"x": d[vars.edges.source].d3plus.dx, "y": d[vars.edges.source].d3plus.dy},
            end = {"x": d[vars.edges.target].d3plus.dx, "y": d[vars.edges.target].d3plus.dy},
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

      width += vars.style.labels.padding*2

      var m = 0
      if (vars.edges.arrows.value) {
        m = vars.style.edges.arrows
        m = m/vars.zoom.behavior.scaleExtent()[1]
        width -= m*2
      }

      if (angle < -90 || angle > 90) {
        angle -= 180
      }
      
      if (width*vars.zoom.behavior.scaleExtent()[0] > 20) {

        d.d3plus_label = {
          "x": x,
          "y": y,
          "translate": translate,
          "w": width,
          "h": 15+vars.style.labels.padding*2,
          "angle": angle,
          "anchor": "middle",
          "valign": "center",
          "color": vars.style.edges.color,
          "resize": false,
          "names": [vars.format(d[vars.edges.label])],
          "background": 1
        }

      }

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/update/exit the Arrow Marker
  //----------------------------------------------------------------------------
  var markerData = vars.edges.arrows.value ? typeof vars.edges.size == "string"
                  ? [ "default_0", "default_1", "default_2",
                      "highlight_0", "highlight_1", "highlight_2",
                      "focus_0", "focus_1", "focus_2" ]
                  : [ "default", "highlight", "focus" ] : []

  if (typeof vars.edges.size == "string") {
    var buckets = d3plus.util.buckets(vars.edges.scale.range(),4)
      , markerSize = []
    for (var i = 0; i < 3; i++) {
      markerSize.push(buckets[i+1]+(buckets[1]-buckets[0])*(i+2))
    }
  }
  else {
    var markerSize = typeof vars.edges.size == "number"
                    ? vars.edges.size/vars.style.edges.arrows
                    : vars.style.edges.arrows
  }

  var marker = vars.defs.selectAll(".d3plus_edge_marker")
    .data(markerData, String)

  var marker_style = function(path) {
    path
      .attr("d",function(id){

        var depth = id.split("_")

        if (depth.length == 2 && vars.edges.scale) {
          depth = parseInt(depth[1])
          var m = markerSize[depth]
        }
        else {
          var m = markerSize
        }

        if (vars.edges.arrows.direction.value == "target") {
          return "M 0,-"+m/2+" L "+m*.85+",0 L 0,"+m/2+" L 0,-"+m/2
        }
        else {
          return "M 0,-"+m/2+" L -"+m*.85+",0 L 0,"+m/2+" L 0,-"+m/2
        }
      })
      .attr("fill",function(d){

        var type = d.split("_")[0]

        if (type == "default") {
          return vars.style.edges.color
        }
        else if (type == "focus") {
          return vars.style.highlight.focus
        }
        else {
          return vars.style.highlight.primary
        }
      })
      .attr("transform","scale("+1/scale+")")
  }

  if (vars.timing) {
    marker.exit().transition().duration(vars.timing)
      .attr("opacity",0)
      .remove()

    marker.select("path").transition().duration(vars.timing)
      .attr("opacity",1)
      .call(marker_style)
  }
  else {
    marker.exit().remove()

    marker.select("path")
      .attr("opacity",1)
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
  var strokeBuckets = typeof vars.edges.size == "string"
                    ? d3plus.util.buckets(vars.edges.scale.domain(),4)
                    : null
    , direction = vars.edges.arrows.direction.value

  var line_data = edges.filter(function(l){

    if (!l.d3plus || (l.d3plus && !("spline" in l.d3plus))) {

      if (!l.d3plus) {
        l.d3plus = {}
      }

      if (strokeBuckets) {
        var size = l[vars.edges.size]
        l.d3plus.bucket = size < strokeBuckets[1] ? 0
                        : size < strokeBuckets[2] ? 1 : 2
        var marker = markerSize[l.d3plus.bucket]*.85/scale
      }
      else {
        delete l.d3plus.bucket
        var marker = markerSize*.85/scale
      }

      var source = l[vars.edges.source]
        , target = l[vars.edges.target]
        , angle = Math.atan2( source.d3plus.y - target.d3plus.y
                            , source.d3plus.x - target.d3plus.x )
        , sourceRadius = direction == "source" && vars.edges.arrows.value
                       ? source.d3plus.r + marker
                       : source.d3plus.r
        , targetRadius = direction == "target" && vars.edges.arrows.value
                       ? target.d3plus.r + marker
                       : target.d3plus.r
        , sourceOffset = d3plus.util.offset( angle
                                           , sourceRadius
                                           , vars.shape.value )
        , targetOffset = d3plus.util.offset( angle
                                           , targetRadius
                                           , vars.shape.value )

      source.d3plus.dx = source.d3plus.x - sourceOffset.x
      source.d3plus.dy = source.d3plus.y - sourceOffset.y
      target.d3plus.dx = target.d3plus.x + targetOffset.x
      target.d3plus.dy = target.d3plus.y + targetOffset.y

      return true
    }

    return false

  })

  var lines = vars.g.edges.selectAll("g.d3plus_edge_line")
    .data(line_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.value]+"_"+d[vars.edges.target][vars.id.value]

      return d.d3plus.id

    })

  var spline_data = edges.filter(function(l){

    if (l.d3plus && l.d3plus.spline) {

      if (!l.d3plus) {
        l.d3plus = {}
      }

      if (strokeBuckets) {
        var size = l[vars.edges.size]
        l.d3plus.bucket = size < strokeBuckets[1] ? 0
                        : size < strokeBuckets[2] ? 1 : 2
        var marker = markerSize[l.d3plus.bucket]*.85/scale
      }
      else {
        delete l.d3plus.bucket
        var marker = markerSize*.85/scale
      }

      var source = l[vars.edges.source]
        , target = l[vars.edges.target]
        , sourceMod = source.d3plus.depth == 2 ? -marker : marker
        , targetMod = target.d3plus.depth == 2 ? -marker : marker
        , sourceRadius = direction == "source" && vars.edges.arrows.value
                       ? source.d3plus.r + sourceMod
                       : source.d3plus.r
        , targetRadius = direction == "target" && vars.edges.arrows.value
                       ? target.d3plus.r + targetMod
                       : target.d3plus.r

      source.d3plus.dr = sourceRadius
      target.d3plus.dr = targetRadius

      return true

    }

    return false

  })

  var splines = vars.g.edges.selectAll("g.d3plus_edge_path")
    .data(spline_data,function(d){

      if (!d.d3plus) {
        d.d3plus = {}
      }

      d.d3plus.id = d[vars.edges.source][vars.id.value]+"_"+d[vars.edges.target][vars.id.value]

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
