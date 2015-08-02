var buckets = require("../../../util/buckets.coffee"),
    offset  = require("../../../geom/offset.coffee");

module.exports = function(vars) {

  var edges = vars.returned.edges || [],
      scale = vars.zoom.behavior.scaleExtent()[0];

  if (typeof vars.edges.size.value === "string") {

    var strokeDomain = d3.extent(edges, function(e){
                         return e[vars.edges.size.value];
                       }),
        maxSize = d3.min(vars.returned.nodes || [], function(n){
                        return n.d3plus.r;
                      }) * (vars.edges.size.scale * 2);

    vars.edges.scale = d3.scale.sqrt()
      .domain(strokeDomain)
      .range([vars.edges.size.min,maxSize*scale]);

  }
  else {

    var defaultWidth = typeof vars.edges.size.value == "number" ?
                       vars.edges.size.value : vars.edges.size.min;

    vars.edges.scale = function(){
      return defaultWidth;
    };

  }

  var o = vars.edges.opacity.value;
  var o_type = typeof o;

  if (vars.edges.opacity.changed && o_type === "string") {
    vars.edges.opacity.scale.value
      .domain(d3.extent(edges, function(d){
        return d[o];
      }))
      .range([vars.edges.opacity.min.value,1]);
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Initialization of Lines
  //----------------------------------------------------------------------------
  function init(l) {

    l
      .attr("opacity", 0)
      .style("stroke-width",0)
      .style("stroke",vars.background.value)
      .style("fill","none");
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Styling of Lines
  //----------------------------------------------------------------------------
  function style(edges) {

    var marker = vars.edges.arrows.value;

    edges
      .attr("opacity", function(d){
        return o_type === "number" ? o :
               o_type === "function" ? o(d, vars) :
               vars.edges.opacity.scale.value(d[o]);
      })
      .style("stroke-width",function(e){
        return vars.edges.scale(e[vars.edges.size.value]);
      })
      .style("stroke",vars.edges.color)
      .attr("marker-start",function(e){

        var direction = vars.edges.arrows.direction.value;

        if ("bucket" in e.d3plus) {
          var d = "_"+e.d3plus.bucket;
        }
        else {
          var d = "";
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
        return d[vars.edges.source].d3plus.edges[d[vars.edges.target][vars.id.value]].x;
      })
      .attr("y1",function(d){
        return d[vars.edges.source].d3plus.edges[d[vars.edges.target][vars.id.value]].y;
      })
      .attr("x2",function(d){
        return d[vars.edges.target].d3plus.edges[d[vars.edges.source][vars.id.value]].x;
      })
      .attr("y2",function(d){
        return d[vars.edges.target].d3plus.edges[d[vars.edges.source][vars.id.value]].y;
      });
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Positioning of Splines
  //----------------------------------------------------------------------------
  var curve = d3.svg.line().interpolate(vars.edges.interpolate.value);

  function spline(l) {
    l
      .attr("d", function(d) {

        return curve(d.d3plus.spline);

      });
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
            x = center.x,
            y = center.y

      }
      else {

        var bounds = this.getBBox(),
            source = d[vars.edges.source],
            target = d[vars.edges.target],
            start = {"x": source.d3plus.edges[target[vars.id.value]].x, "y": source.d3plus.edges[target[vars.id.value]].y},
            end = {"x": target.d3plus.edges[source[vars.id.value]].x, "y": target.d3plus.edges[source[vars.id.value]].y},
            xdiff = end.x-start.x,
            ydiff = end.y-start.y,
            center = {"x": end.x-(xdiff)/2, "y": end.y-(ydiff)/2},
            radians = Math.atan2(ydiff,xdiff),
            angle = radians*(180/Math.PI),
            length = Math.sqrt((xdiff*xdiff)+(ydiff*ydiff)),
            width = length,
            x = center.x,
            y = center.y

      }

      width += vars.labels.padding*2

      var m = 0
      if (vars.edges.arrows.value) {
        m = typeof vars.edges.arrows.value === "number"
          ? vars.edges.arrows.value : 8
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
          "translate": {"x": x, "y": y},
          "w": width,
          "h": 15+vars.labels.padding*2,
          "angle": angle,
          "anchor": "middle",
          "valign": "center",
          "color": vars.edges.color,
          "resize": false,
          "names": [vars.format.value(d[vars.edges.label])],
          "background": 1
        }

      }

    }

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/update/exit the Arrow Marker
  //----------------------------------------------------------------------------
  var markerData = vars.edges.arrows.value ? typeof vars.edges.size.value == "string"
                  ? [ "default_0", "default_1", "default_2",
                      "highlight_0", "highlight_1", "highlight_2",
                      "focus_0", "focus_1", "focus_2" ]
                  : [ "default", "highlight", "focus" ] : []

  if (typeof vars.edges.size.value == "string") {
    var b = buckets(vars.edges.scale.range(),4)
      , markerSize = []
    for (var i = 0; i < 3; i++) {
      markerSize.push(b[i+1]+(b[1]-b[0])*(i+2)*2)
    }
  }
  else {
    var m = typeof vars.edges.arrows.value === "number"
          ? vars.edges.arrows.value : 8

    var markerSize = typeof vars.edges.size.value === "number"
                    ? vars.edges.size.value/m : m
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
          return vars.edges.color
        }
        else if (type == "focus") {
          return vars.color.focus
        }
        else {
          return vars.color.primary
        }
      })
      .attr("transform","scale("+1/scale+")")
  }

  if (vars.draw.timing) {
    marker.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

    marker.select("path").transition().duration(vars.draw.timing)
      .attr("opacity",1)
      .call(marker_style)
  }
  else {
    marker.exit().remove()

    marker.select("path")
      .attr("opacity",1)
      .call(marker_style)
  }

  var opacity = vars.draw.timing ? 0 : 1
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

  if (vars.draw.timing) {
    enter.transition().duration(vars.draw.timing)
      .attr("opacity",1)
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Bind "edges" data to lines in the "edges" group
  //----------------------------------------------------------------------------
  var strokeBuckets = typeof vars.edges.size.value == "string"
                    ? buckets(vars.edges.scale.domain(),4)
                    : null
    , direction = vars.edges.arrows.direction.value

  var line_data = edges.filter(function(l){

    if (!l.d3plus) l.d3plus = {}

    l.d3plus.id = "edge_"+l[vars.edges.source][vars.id.value]+"_"+l[vars.edges.target][vars.id.value]

    if ( l.d3plus.spline !== true ) {

      if (strokeBuckets) {
        var size = l[vars.edges.size.value]
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

      if (!source.d3plus || !target.d3plus) return false

      var sourceAngle = Math.atan2( source.d3plus.y - target.d3plus.y
                                  , source.d3plus.x - target.d3plus.x )
        , targetAngle = Math.atan2( target.d3plus.y - source.d3plus.y
                                  , target.d3plus.x - source.d3plus.x )
        , sourceRadius = direction == "source" && vars.edges.arrows.value
                       ? source.d3plus.r + marker
                       : source.d3plus.r
        , targetRadius = direction == "target" && vars.edges.arrows.value
                       ? target.d3plus.r + marker
                       : target.d3plus.r
        , sourceOffset = offset( sourceAngle
                                           , sourceRadius
                                           , vars.shape.value )
        , targetOffset = offset( targetAngle
                                           , targetRadius
                                           , vars.shape.value )

      if (!("edges" in source.d3plus)) source.d3plus.edges = {}
      source.d3plus.edges[target[vars.id.value]] = {
          "x": source.d3plus.x - sourceOffset.x,
          "y": source.d3plus.y - sourceOffset.y
      }

      if (!("edges" in target.d3plus)) target.d3plus.edges = {}
      target.d3plus.edges[source[vars.id.value]] = {
          "x": target.d3plus.x - targetOffset.x,
          "y": target.d3plus.y - targetOffset.y
      }

      return true
    }

    return false

  })

  var lines = vars.g.edges.selectAll("g.d3plus_edge_line")
    .data(line_data,function(d){

      return d.d3plus.id

    })

  var spline_data = edges.filter(function(l){

    if (l.d3plus.spline) {

      if (strokeBuckets) {
        var size = l[vars.edges.size.value]
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
        , sourceEdge = source.d3plus.edges ? source.d3plus.edges[target[vars.id.value]] || {} : {}
        , targetEdge = target.d3plus.edges ? target.d3plus.edges[source[vars.id.value]] || {} : {}
        , sourceMod = vars.edges.arrows.value && direction == "source" ? marker : 0
        , targetMod = vars.edges.arrows.value && direction == "target" ? marker : 0
        , angleTweak = 0.1
        , sourceTweak = source.d3plus.x > target.d3plus.x ? 1-angleTweak : 1+angleTweak
        , targetTweak = source.d3plus.x > target.d3plus.x ? 1+angleTweak : 1-angleTweak
        , sourceAngle = typeof sourceEdge.angle === "number" ? sourceEdge.angle
                      : Math.atan2( source.d3plus.y - target.d3plus.y
                                  , source.d3plus.x - target.d3plus.x ) * sourceTweak
        , sourceOffset = offset(sourceAngle, source.d3plus.r + sourceMod, vars.shape.value )
        , targetAngle = typeof targetEdge.angle === "number" ? targetEdge.angle
                      : Math.atan2( target.d3plus.y - source.d3plus.y
                                  , target.d3plus.x - source.d3plus.x ) * targetTweak
        , targetOffset = offset(targetAngle, target.d3plus.r + targetMod, vars.shape.value )
        , start = [source.d3plus.x-sourceOffset.x, source.d3plus.y-sourceOffset.y]
        , startOffset = sourceEdge.offset ? offset(sourceAngle,sourceEdge.offset) : false
        , startPoint = startOffset ? [start[0]-startOffset.x,start[1]-startOffset.y] : start
        , end = [target.d3plus.x-targetOffset.x, target.d3plus.y-targetOffset.y]
        , endOffset = targetEdge.offset ? offset(targetAngle,targetEdge.offset) : false
        , endPoint = endOffset ? [end[0]-endOffset.x,end[1]-endOffset.y] : end
        , xd = endPoint[0] - startPoint[0]
        , yd = endPoint[1] - startPoint[1]
        , sourceDistance = typeof sourceEdge.radius === "number" ? sourceEdge.radius : Math.sqrt(xd*xd+yd*yd)/4
        , targetDistance = typeof targetEdge.radius === "number" ? targetEdge.radius : Math.sqrt(xd*xd+yd*yd)/4
        , startAnchor = offset(sourceAngle,sourceDistance-source.d3plus.r-sourceMod*2)
        , endAnchor = offset(targetAngle,targetDistance-target.d3plus.r-targetMod*2)

      l.d3plus.spline = [ start, end ]
      var testAngle = Math.abs(Math.atan2( source.d3plus.y - target.d3plus.y
                                         , source.d3plus.x - target.d3plus.x )).toFixed(5)
        , testStart = Math.abs(sourceAngle).toFixed(5)
        , testEnd   = Math.abs(targetAngle - Math.PI).toFixed(5)

      if (testStart !== testEnd || [testStart,testEnd].indexOf(testAngle) < 0) {

        l.d3plus.spline.splice(1,0,[startPoint[0]-startAnchor.x,startPoint[1]-startAnchor.y],
                                   [endPoint[0]-endAnchor.x,endPoint[1]-endAnchor.y])

        if (startOffset) l.d3plus.spline.splice(1,0,startPoint)
        if (endOffset) l.d3plus.spline.splice(l.d3plus.spline.length-1,0,endPoint)

      }

      return true

    }

    return false

  })

  var splines = vars.g.edges.selectAll("g.d3plus_edge_path")
    .data(spline_data,function(d){

      return d.d3plus.id

    })

  if (vars.draw.timing) {

    lines.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

    splines.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

    lines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.draw.timing/2)
      .attr("opacity",0)
      .remove()

    splines.selectAll("text.d3plus_label, rect.d3plus_label_bg")
      .transition().duration(vars.draw.timing/2)
      .attr("opacity",0)
      .remove()

    lines.selectAll("line")
      .data(function(d){ return [d] })
      .transition().duration(vars.draw.timing)
        .call(line)
        .call(style)
        .each("end",label)

    splines.selectAll("path")
      .data(function(d){ return [d] })
      .transition().duration(vars.draw.timing)
        .call(spline)
        .call(style)
        .each("end",label)

    lines.enter().append("g")
      .attr("class","d3plus_edge_line")
      .append("line")
      .call(line)
      .call(init)
      .transition().duration(vars.draw.timing)
        .call(style)
        .each("end",label)

    splines.enter().append("g")
      .attr("class","d3plus_edge_path")
      .append("path")
      .call(spline)
      .call(init)
      .transition().duration(vars.draw.timing)
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
      .data(function(d){ return [d] })
      .call(line)
      .call(style)
      .call(label)

    splines.selectAll("path")
      .data(function(d){ return [d] })
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

}
