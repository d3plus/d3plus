var fetchValue = require("../../core/fetch/value.js")
  , fetchColor = require("../../core/fetch/color.js")
  , fetchData  = require("../../core/fetch/data.js")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Chart
//------------------------------------------------------------------------------
var chart = function(vars) {

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate size and position of graph
  //-------------------------------------------------------------------
  if (vars.small) {
    var graph = {"margin": {"top": 0, "right": 0, "bottom": 0, "left": 0}}
  }
  else {
    var graph = {"margin": {"top": 10, "right": 10, "bottom": 40, "left": 40}}
  }
  graph.width = vars.width.viz-graph.margin.left-graph.margin.right
  graph.height = vars.height.viz-graph.margin.top-graph.margin.bottom

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // If there is data, run the needed calculations
  //-------------------------------------------------------------------
  if (vars.data.app.length) {

    if (!vars.tickValues) vars.tickValues = {}

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine X and Y axis
    //-------------------------------------------------------------------
    vars.continuous_axis = null
    vars.opp_axis = null
    vars.stacked_axis = null

    vars.axes.values.forEach(function(axis){

      if (vars[axis].stacked.value) {
        vars.stacked_axis = axis
      }
      if (!vars.continuous_axis && vars[axis].scale.value == "continuous") {
        vars.continuous_axis = axis
        vars.opp_axis = axis == "x" ? "y" : "x"
      }

      if (vars.data.changed || vars.depth.changed || !vars[axis+"_range"] || vars.time.fixed.value) {

        if ( vars.dev.value ) d3plus.console.time("determining "+axis+"-axis")
        if (vars[axis].scale.value == "share") {
          vars[axis+"_range"] = [0,1]
          vars.tickValues[axis] = d3plus.util.buckets([0,1],11)
          vars.stacked_axis = axis
        }
        else if (vars[axis].stacked.value) {
          if (vars.time.fixed.value) {
            var range_data = vars.data.app
          }
          else {
            var range_data = fetchData(vars,["all"])
          }
          var xaxis_sums = d3.nest()
            .key(function(d){return d[vars.x.value] })
            .rollup(function(leaves){
              return d3.sum(leaves, function(d){
                return fetchValue(vars,d,vars[axis].value)
              })
            })
            .entries(range_data)

          vars[axis+"_range"] = [0,d3.max(xaxis_sums, function(d){ return d.values; })]
        }
        else if (vars[axis].domain instanceof Array) {
          vars[axis+"_range"] = vars[axis].domain
          vars.tickValues[axis] = d3plus.util.uniques(vars.data.app,vars[axis].value)
          vars.tickValues[axis] = vars.tickValues[axis].filter(function(t){
            return t >= vars[axis+"_range"][0] && t <= vars[axis+"_range"][1]
          })
        }
        else if (vars.time.fixed.value) {
          vars[axis+"_range"] = d3.extent(vars.data.app,function(d){
            return fetchValue(vars,d,vars[axis].value)
          })
          vars.tickValues[axis] = d3plus.util.uniques(vars.data.app,vars[axis].value)
        }
        else {
          var all_depths = []
          for (id in vars.id.nesting) {
            all_depths = all_depths.concat(vars.data.grouped[vars.id.nesting[id]].all)
          }
          vars[axis+"_range"] = d3.extent(all_depths,function(d){
            return fetchValue(vars,d,vars[axis].value)
          })
          vars.tickValues[axis] = d3plus.util.uniques(fetchData(vars,["all"]),vars[axis].value)
        }

        // add padding to axis if there is only 1 value
        if (vars[axis+"_range"][0] === vars[axis+"_range"][1]) {
          if (vars[axis].value === vars.time.value) {
            var closestTime = d3plus.util.closest(vars.data.time.ticks,vars[axis+"_range"][0])
              , timeIndex = vars.data.time.ticks.indexOf(closestTime)

            if (timeIndex > 0) {
              vars[axis+"_range"][0] = vars.data.time.ticks[timeIndex-1]
            }
            else {
              var diff = vars.data.time.ticks[timeIndex+1] - closestTime
              vars[axis+"_range"][0] = new Date(closestTime.getTime() - diff)
            }
            if (timeIndex < vars.data.time.ticks.length - 1) {
              vars[axis+"_range"][1] = vars.data.time.ticks[timeIndex+1]
            }
            else {
              var diff = closestTime - vars.data.time.ticks[timeIndex-1]
              vars[axis+"_range"][1] = new Date(closestTime.getTime() + diff)
            }
          }
          else {
            vars[axis+"_range"][0] -= 1
            vars[axis+"_range"][1] += 1
          }
        }

        // reverse Y axis
        if (axis == "y") vars.y_range = vars.y_range.reverse()

        if ( vars.dev.value ) d3plus.console.timeEnd("determining "+axis+"-axis")
      }
      else if (!vars[axis+"_range"]) {
        vars[axis+"_range"] = [-1,1]
      }

    })

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Mirror axes, if applicable
    //-------------------------------------------------------------------
    if (vars.axes.mirror.value) {
      var domains = vars.y_range.concat(vars.x_range)
      vars.x_range = d3.extent(domains)
      vars.y_range = d3.extent(domains).reverse()
    }

    //===================================================================

    var data = vars.data.app

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Determine size of nodes
    //-------------------------------------------------------------------

    if (data) {

      if ( vars.dev.value ) d3plus.console.time("determining size scale")
      if (typeof vars.size.value === "number"){
        var size_domain = [vars.size.value, vars.size.value]
      }
      else if (vars.size.value) {
        if (vars.time.fixed.value) {
          var size_domain = d3.extent(vars.data.app,function(d){
            var val = fetchValue(vars,d,vars.size.value)
            return val == 0 ? null : val
          })
        }
        else {
          var all_depths = []
          for (id in vars.id.nesting) {
            all_depths = all_depths.concat(vars.data.grouped[vars.id.nesting[id]].all)
          }
          var size_domain = d3.extent(all_depths,function(d){
            var val = fetchValue(vars,d,vars.size.value)
            return val == 0 ? null : val
          })
        }
        if (!size_domain[0] || !size_domain[1]) size_domain = [0,0]
      }
      else {
        var size_domain = [0,0]
      }

      if(typeof vars.size.value == "number"){
        var size_range = size_domain;
      }
      else {
        var min_size = 2,
            max_size = Math.floor(d3.max([d3.min([graph.width,graph.height])/15, min_size]));
            

        if (size_domain[0] == size_domain[1]) var min_size = max_size

        var size_range = [min_size,max_size]
      }

      var radius = vars.size.scale.value
        .domain(size_domain)
        .rangeRound(size_range)

      if ( vars.dev.value ) d3plus.console.timeEnd("determining size scale")

    }

    //===================================================================

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Create axis scales and add buffer if necessary
    //-------------------------------------------------------------------
    var tickAttrs = {
      "font-size":   vars.axes.ticks.font.size,
      "fill":        vars.axes.ticks.font.color,
      "font-family": vars.axes.ticks.font.family.value,
      "font-weight": vars.axes.ticks.font.weight
    }

    vars.axes.values.forEach(function(axis){

      // Create Axes
      var range_max = axis == "x" ? graph.width : graph.height

      if (["continuous","share"].indexOf(vars[axis].scale.value) >= 0) {
        var s = "linear"
      }
      else {
        var s = vars[axis].scale.value
      }

      vars[axis+"_scale"] = d3.scale[s]()
        .domain(vars[axis+"_range"])
        .rangeRound([0,range_max])

      // set buffer room (take into account largest size var)
      if (["square","circle","donut"].indexOf(vars.shape.value) >= 0 &&
          ["share"].indexOf(vars[axis].scale.value) < 0) {

        var scale = vars[axis+"_scale"]
          , largest_size = radius.range()[1]*2
          , domainHigh = scale.invert(-largest_size)
          , domainLow= scale.invert(range_max+largest_size)

        vars[axis+"_scale"].domain([domainHigh,domainLow])

      }

      var orient = axis == "x" ? "bottom" : "left"

      vars[axis+"_axis"] = d3.svg.axis()
        .tickSize(vars.axes.ticks.size)
        .tickPadding(5)
        .orient(orient)
        .scale(vars[axis+"_scale"])
        .tickFormat(function(d, i) {

          var visible = true
          if (vars[axis].value == vars.time.value && d % 1 != 0) {
            visible = false
          }

          if (((vars[axis].scale.value == "log" && d.toString().charAt(0) == "1")
              || vars[axis].scale.value != "log") && visible) {

            if (vars[axis].scale.value == "share") {
              var text = d*100+"%"
            }
            else if (d.constructor === Date) {
              var text = vars.data.time.multiFormat(d)
            }
            else {
              var text = vars.format.value(d,vars[axis].value);
            }

          }
          else {
            var text = null
          }

          return text;

        })

      if (vars[axis].value === vars.time.value) {
        var range = vars[axis+"_range"]
        vars[axis].ticks = vars.data.time.ticks.filter(function(t){
          return t <= range[1] && t >= range[0]
        })

        var minClosest = d3plus.util.closest(vars.data.time.ticks,range[0])
        var maxClosest = d3plus.util.closest(vars.data.time.ticks,range[1])
        if (vars[axis].ticks.indexOf(minClosest) < 0) {
          vars[axis].ticks.unshift(minClosest)
        }
        if (vars[axis].ticks.indexOf(maxClosest) < 0) {
          vars[axis].ticks.push(maxClosest)
        }
      }
      else if (vars.continuous_axis === axis) {
        vars[axis].ticks = vars.tickValues[axis]
      }
      else {
        vars[axis].ticks = vars[axis+"_scale"].ticks()
      }

      vars[axis+"_axis"].tickValues(vars[axis].ticks)

    })

  }

  // Function for Tick Styling
  function tick_style(t,axis) {
    t
      .attr("stroke",vars.axes.ticks.color)
      .attr("stroke-width",vars.axes.ticks.width)
      .attr("shape-rendering",vars.shape.rendering.value)
      .style("opacity",function(d){
        var lighter = vars[axis].scale.value == "log" && d.toString().charAt(0) != "1"
        return lighter ? 0.25 : 1
      })
  }

  // Function for Tick Styling
  function tick_position(t,axis) {
    t
      .attr("x1",function(d){
        return axis == "x" ? vars.x_scale(d) : 0
      })
      .attr("x2",function(d){
        return axis == "x" ? vars.x_scale(d) : graph.width
      })
      .attr("y1",function(d){
        return axis == "y" ? vars.y_scale(d) : 0
      })
      .attr("y2",function(d){
        return axis == "y" ? vars.y_scale(d) : graph.height
      })
  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Calculate Spacing Needed for Axes Labels
  //-------------------------------------------------------------------
  var yTicks = vars.y.ticks.map(function(d){
        return vars.format.value(d,vars.y.value)
      })
    , yAxisWidth = d3.max(d3plus.font.sizes(yTicks,tickAttrs),function(d){return d.width}) + vars.labels.padding
  graph.margin.left += yAxisWidth
  graph.width -= yAxisWidth

  var xTicks = vars.x.ticks.map(function(d){
        return vars.format.value(d,vars.x.value)
      })
    , xSizes = d3plus.font.sizes(xTicks,tickAttrs)
    , xAxisWidth = d3.max(xSizes,function(d){return d.width})
    , xAxisHeight = d3.max(xSizes,function(d){return d.height})
    , xMaxWidth = d3.min([graph.width/(xTicks.length+1),graph.margin.left*2]) - vars.labels.padding*2

  if (xAxisWidth < xMaxWidth) {
    xAxisWidth += vars.labels.padding
    var xAnchor = "middle"
      , xDy     = "0ex"
      , xTransform = "translate(0,10)"
  }
  else {
    xAxisWidth = xAxisHeight + vars.labels.padding
    xAxisHeight = d3.max(xSizes,function(d){return d.width})
    var xRotate = true
      , xAnchor = "start"
      , xDy     = "0.5ex"
      , xTransform = "translate(15,10)rotate(70)"
  }

  graph.height -= xAxisHeight
  graph.width -= xAxisWidth/2
  vars.x_scale.rangeRound([0,graph.width])
  vars.y_scale.rangeRound([0,graph.height])

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter SVG Elements
  //-------------------------------------------------------------------

  // Enter Background Plane
  var plane = vars.group.selectAll("g#plane").data(["plane"])
  plane.enter().append("g")
    .attr("id","plane")
    .attr("transform", "translate(" + graph.margin.left + "," + graph.margin.top + ")")

  // Enter Background Rectangle
  var bg = plane.selectAll("rect#background").data(["background"])
  bg.enter().append("rect")
    .attr("id","background")
    .attr("x",0)
    .attr("y",0)
    .attr("width", graph.width)
    .attr("height", graph.height)
    .attr("stroke-width",1)
    .attr("stroke","#ccc")
    .attr("shape-rendering",vars.shape.rendering.value)
    .attr("fill","#fafafa")

  // Enter Background Mirror
  var mirror = plane.selectAll("path#mirror").data(["mirror"])
  mirror.enter().append("path")
    .attr("id","mirror")
    .attr("fill","#000")
    .attr("fill-opacity",0.03)
    .attr("stroke-width",1)
    .attr("stroke","#ccc")
    .attr("stroke-dasharray","10,10")
    .attr("opacity",0)

  // Enter Axes
  var axes = vars.group.selectAll("g#axes").data(["axes"])
  axes.enter().append("g")
    .attr("id","axes")

  // Enter X Axis Grid
  var xgrid = plane.selectAll("g#xgrid").data(["xgrid"])
  xgrid.enter().append("g")
    .attr("id","xgrid")

  // Enter Y Axis Grid
  var ygrid = plane.selectAll("g#ygrid").data(["ygrid"])
  ygrid.enter().append("g")
    .attr("id","ygrid")

  // Enter X Axis Scale
  var xaxis = plane.selectAll("g#xaxis").data(["xaxis"])
  xaxis.enter().append("g")
    .attr("id","xaxis")
    .attr("transform", "translate(0," + graph.height + ")")
    .call(vars.x_axis.scale(vars.x_scale))
    .selectAll("g.tick").select("text")
      .attr(tickAttrs)
      .style("text-anchor",xAnchor)
      .attr("dy",xDy)
      .attr("transform",xTransform)

  // Enter Y Axis Scale
  var yaxis = plane.selectAll("g#yaxis").data(["yaxis"])
  yaxis.enter().append("g")
    .attr("id","yaxis")
    .call(vars.y_axis.scale(vars.y_scale))
    .selectAll("g.tick").select("text")
      .attr(tickAttrs)

  // Enter X Axis Label
  var xlabel = axes.selectAll("text#xlabel").data(vars.small ? [] : ["xlabel"])
  xlabel.enter().append("text")
    .attr("id", "xlabel")
    .attr("x", vars.width.viz/2)
    .attr("y", vars.height.viz-10)
    .text(vars.format.value(vars.x.value))
    .attr("font-family",vars.labels.font.family.value)
    .attr("font-weight",vars.labels.font.weight)
    .attr("font-size",vars.labels.font.size)
    .attr("fill",vars.labels.font.color)
    .style("text-anchor",vars.labels.font.align)
  xlabel.exit().remove()

  // Enter Y Axis Label
  var ylabel = axes.selectAll("text#ylabel").data(vars.small ? [] : ["ylabel"])
  ylabel.enter().append("text")
    .attr("id", "ylabel")
    .attr("y", 15)
    .attr("x", -(graph.height/2+graph.margin.top))
    .text(vars.format.value(vars.y.value))
    .attr("transform","rotate(-90)")
    .attr("font-family",vars.labels.font.family.value)
    .attr("font-weight",vars.labels.font.weight)
    .attr("font-size",vars.labels.font.size)
    .attr("fill",vars.labels.font.color)
    .style("text-anchor",vars.labels.font.align)
  ylabel.exit().remove()

  // Enter Mouse Event Group
  var mouseevents = vars.group.selectAll("g#mouseevents").data(["mouseevents"])
  mouseevents.enter().append("g")
    .attr("id","mouseevents")

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Update SVG Elements
  //-------------------------------------------------------------------

  // Update Plane Group
  plane.transition().duration(vars.draw.timing)
    .attr("transform", "translate(" + graph.margin.left + "," + graph.margin.top + ")")

  // Update Plane Background
  bg.attr("width", graph.width)
    .attr("height", graph.height)

  // Update Mirror Triangle
  mirror.transition().duration(vars.draw.timing)
    .attr("opacity",function(){
      return vars.axes.mirror.value ? 1 : 0
    })
    .attr("d",function(){
      var w = graph.width, h = graph.height
      return "M "+w+" "+h+" L 0 "+h+" L "+w+" 0 Z"
    })

  // Update Y Axis
  yaxis.transition().duration(vars.draw.timing)
    .call(vars.y_axis.scale(vars.y_scale))
    .selectAll("g.tick").select("text")
      .attr(tickAttrs)

  yaxis.selectAll("line").transition().duration(vars.draw.timing)
      .call(tick_style,"y")

  yaxis.selectAll("path").attr("fill","none")

  // Update X Axis
  xaxis.transition().duration(vars.draw.timing)
    .attr("transform", "translate(0," + graph.height + ")")
    .call(vars.x_axis.scale(vars.x_scale))
    .selectAll("g.tick").select("text")
      .attr(tickAttrs)
      .style("text-anchor",xAnchor)
      .attr("dy",xDy)
      .attr("transform",xTransform)

  xaxis.selectAll("line").transition().duration(vars.draw.timing)
      .call(tick_style,"x")

  xaxis.selectAll("path").attr("fill","none")

  // Update Y Grid
  var ylines = ygrid.selectAll("line")
    .data(vars.y.ticks)

  ylines.enter().append("line")
    .style("opacity",0)
    .call(tick_position,"y")
    .call(tick_style,"y")

  ylines.transition().duration(vars.draw.timing)
    .style("opacity",1)
    .call(tick_position,"y")
    .call(tick_style,"y")

  ylines.exit().transition().duration(vars.draw.timing)
    .style("opacity",0)
    .remove()

  // Update X Grid
  var xlines = xgrid.selectAll("line")
    .data(vars.x.ticks)

  xlines.enter().append("line")
    .style("opacity",0)
    .call(tick_position,"x")
    .call(tick_style,"x")

  xlines.transition().duration(vars.draw.timing)
    .style("opacity",1)
    .call(tick_position,"x")
    .call(tick_style,"x")

  xlines.exit().transition().duration(vars.draw.timing)
    .style("opacity",0)
    .remove()

  // Update X Axis Label
  xlabel.text(vars.format.value(vars.x.value))
    .attr("x", vars.width.viz/2)
    .attr("y", vars.height.viz-10)
    .attr("opacity",function(){
      if (vars.data.app.length == 0) return 0
      else return 1
    })

  // Update Y Axis Label
  ylabel.text(vars.format.value(vars.y.value))
    .attr("y", 15)
    .attr("x", -(graph.height/2+graph.margin.top))
    .attr("opacity",function(){
      if (vars.data.app.length == 0) return 0
      else return 1
    })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Enter/Update User-Defined Axis Lines
  //-------------------------------------------------------------------

  function get_name(d) {
    if (typeof d == "number" || typeof d == "string") {
      return null;
    }
    else {
      return d3.keys(d)[0]
    }
  }

  function get_val(d) {
    if (typeof d == "number") {
      return d;
    }
    else if (typeof d == "string") {
      return parseFloat(d);
    }
    else {
      var v = d[d3.keys(d)[0]]
      if (typeof v == "string") {
        return parseFloat(v);
      }
      else {
        return v;
      }
    }
  }

  vars.axes.values.forEach(function(axis){

    var lines = plane.selectAll("g.d3plus_"+axis+"line")
      .data(vars[axis].lines,function(l){
        if (typeof l == "number" || typeof l == "string") {
          return l
        }
        else {
          return d3.keys(l)[0]
        }
      })

    var enter = lines.enter().append("g")
      .attr("class","d3plus_"+axis+"line")

    var max = axis == "x" ? "height" : "width",
        pos = axis == "x" ? (graph.height-8)+"px" : "10px",
        padding = axis == "x" ? 10 : 20

    enter.append("line")
      .attr(axis+"1",0)
      .attr(axis+"2",graph[max])
      .attr("stroke","#ccc")
      .attr("stroke-width",3)
      .attr("stroke-dasharray","10,10")

    enter.append("text")
      .attr("font-size",vars.axes.ticks.font.size)
      .attr("fill",vars.axes.ticks.font.color)
      .attr("text-align","start")
      .attr(axis,pos)

    lines.selectAll("line").transition().duration(vars.draw.timing)
      .attr(axis+"1",function(d){
        return get_val(d) ? vars[axis+"_scale"](get_val(d)) : 0
      })
      .attr(axis+"2",function(d){
        return get_val(d) ? vars[axis+"_scale"](get_val(d)) : 0
      })
      .attr("opacity",function(d){
        var yes = get_val(d) > vars[axis+"_scale"].domain()[1] && get_val(d) < vars[axis+"_scale"].domain()[0]
        return get_val(d) !== null && yes ? 1 : 0
      })

    lines.selectAll("text").transition().duration(vars.draw.timing)
      .text(function(){
        if (get_val(d) !== null) {
          var v = vars.format.value(get_val(d),y_name)
          return get_name(d) ? vars.format.value(get_name(d)) + ": " + v : v
        }
        else return null
      })
      .attr(axis,function(d){
        return (vars[axis+"_scale"](get_val(d))+padding)+"px"
      })

  })

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Format Data for Plotting
  //-------------------------------------------------------------------

  if (["line","area"].indexOf(vars.shape.value) >= 0) {
    radius.rangeRound([2,2])
  }

  vars.axis_offset = {
    "x": graph.margin.left,
    "y": graph.margin.top
  }

  data.forEach(function(d){
    d.d3plus.x = vars.x_scale(fetchValue(vars,d,vars.x.value))
    d.d3plus.x += vars.axis_offset.x

    d.d3plus.r = radius(fetchValue(vars,d,vars.size.value))

    if (!vars.stacked_axis) {

      d.d3plus.y = vars.y_scale(fetchValue(vars,d,vars.y.value))
      d.d3plus.y += vars.axis_offset.y

      if (vars.shape.value == "area") {
        d.d3plus[vars.opp_axis+"0"] = vars[vars.opp_axis+"_scale"].range()[1]
        d.d3plus[vars.opp_axis+"0"] += vars.axis_offset[vars.opp_axis]
      }

    }

  })

  var sort = vars.order.value ? vars.order.value : vars.continuous_axis
           ? vars[vars.opp_axis].value : vars.size.value || vars.id.value

  if (["line","area"].indexOf(vars.shape.value) >= 0) {

    data = d3.nest()
      .key(function(d){
        var id = fetchValue(vars,d,vars.id.value),
            depth = d.d3plus.depth ? d.d3plus.depth : 0
        return d3plus.string.strip(id)+"_"+depth+"_"+vars.shape.value
      })
      .rollup(function(leaves){

        var availables = d3plus.util.uniques(leaves,vars[vars.continuous_axis].value),
            previousMissing = false,
            timeVars = vars[vars.continuous_axis].value === vars.time.value

        if (timeVars && availables[0].constructor === Date) {
          availables = availables.map(function(t){return t.getTime()})
        }

        vars[vars.continuous_axis].ticks.forEach(function(v,i,arr){

          var tester = timeVars ? v.getTime() : v

          if(availables.indexOf(tester) < 0){

            var obj = {}
            obj[vars[vars.continuous_axis].value] = v
            obj[vars.id.value] = leaves[0][vars.id.value]
            obj[vars[vars.opp_axis].value] = vars[vars.opp_axis+"_scale"].domain()[1]
            obj.d3plus = {}

            obj.d3plus.r = radius(radius.domain()[0])
            obj.d3plus[vars.continuous_axis] += vars.axis_offset[vars.continuous_axis]

            if (!vars.stacked_axis) {
              obj.d3plus[vars.opp_axis] = vars[vars.opp_axis+"_scale"].range()[1]
              obj.d3plus[vars.opp_axis] += vars.axis_offset[vars.opp_axis]
              obj.d3plus[vars.opp_axis+"0"] = obj.d3plus[vars.opp_axis]
            }

            if (vars[vars.continuous_axis].zerofill.value || vars[vars.opp_axis].stacked.value) {
              var position = vars[vars.continuous_axis+"_scale"](v)
              position += vars.axis_offset[vars.continuous_axis]
              obj.d3plus[vars.continuous_axis] = position
              leaves.push(obj)
            }
            else if (vars.shape.value != "line") {
              if (!previousMissing && i > 0) {
                var position = vars[vars.continuous_axis+"_scale"](arr[i-1])
                position += vars.axis_offset[vars.continuous_axis]
                obj.d3plus[vars.continuous_axis] = position
                leaves.push(obj)
              }
              if (i < arr.length-1) {
                var position = vars[vars.continuous_axis+"_scale"](arr[i+1])
                position += vars.axis_offset[vars.continuous_axis]
                var obj2 = d3plus.util.copy(obj)
                obj2.d3plus[vars.continuous_axis] = position
                leaves.push(obj2)
              }
            }
            previousMissing = true

          }
          else {
            previousMissing = false
          }

        })

        leaves.sort(function(a,b){
          var xsort = a.d3plus[vars.continuous_axis] - b.d3plus[vars.continuous_axis]
          if (xsort) return xsort
          var ksort = a[vars[vars.continuous_axis].value] - b[vars[vars.continuous_axis].value]
          return ksort
        })

        return leaves
      })
      .entries(data)

    data.forEach(function(d,i){

      if ("d3plus" in d.values[0]) {

        if (!d.d3plus) d.d3plus = {}

        d.values.forEach(function(l){
          if (l.d3plus.merged instanceof Array) {
            if (!d.d3plus.merged) d.d3plus.merged = []
            d.d3plus.merged = d.d3plus.merged.concat(l.d3plus.merged)
          }
          if (l.d3plus.text) d.d3plus.text = l.d3plus.text
        })
      }

      vars.id.nesting.forEach(function(n,i){
        if (i <= vars.depth.value && !d[n]) {
          d[n] = d3plus.util.uniques(d.values,n).filter(function(unique){
            return unique && unique != "undefined"
          })[0]
        }
      })

      if ( !(sort in d) ) {
        d[sort] = 0
        d.values.forEach(function(v){
          var val = fetchValue(vars,v,sort)
          if (val) {
            if (typeof val == "number") {
              d[sort] += val
            }
            else {
              d[sort] = val
            }
          }
        })
      }

    })

  }

  if (sort) {

    d3plus.array.sort( data , sort
                     , vars.order.sort.value === "desc" ? "asc" : "desc"
                     , vars.color.value || [] , vars )

  }

  if (vars.stacked_axis) {

    var stack = d3.layout.stack()
      .values(function(d) { return d.values; })
      .x(function(d) { return d.d3plus.x; })
      // .x(function(d) { return d.d3plus.y; })
      .y(function(d) {
        var flip = graph.height,
            val = fetchValue(vars,d,vars.y.value)
        return flip-vars.y_scale(val);
      })
      .out(function(d,y0,y){

        var flip = graph.height

        if (vars[vars.stacked_axis].scale.value == "share") {
          d.d3plus.y0 = (1-y0)*flip
          d.d3plus.y = d.d3plus.y0-(y*flip)
        }
        else {
          d.d3plus.y0 = flip-y0
          d.d3plus.y = d.d3plus.y0-y
        }
        d.d3plus.y += graph.margin.top
        d.d3plus.y0 += graph.margin.top

      })

    var offset = vars[vars.stacked_axis].scale.value == "share" ? "expand" : "zero";
    var data = stack.offset(offset)(data)

  }
  else if (["area","line"].indexOf(vars.shape.value) < 0) {

    function data_tick(l,axis) {
      l
        .attr("x1",function(d){
          return axis == "y" ? 0 : d.d3plus.x-graph.margin.left
        })
        .attr("x2",function(d){
          return axis == "y" ? -5 : d.d3plus.x-graph.margin.left
        })
        .attr("y1",function(d){
          return axis == "x" ? graph.height : d.d3plus.y-graph.margin.top
        })
        .attr("y2",function(d){
          return axis == "x" ? graph.height+5 : d.d3plus.y-graph.margin.top
        })
        .style("stroke",function(d){
          return d3plus.color.legible(fetchColor(vars,d));
        })
        .style("stroke-width",vars.data.stroke.width)
        .attr("shape-rendering",vars.shape.rendering.value)
    }

    var data_ticks = plane.selectAll("g.d3plus_data_ticks")
      .data(data,function(d){
        return d[vars.id.value]+"_"+d.d3plus.depth
      })

    var tick_enter = data_ticks.enter().append("g")
      .attr("class","d3plus_data_ticks")
      .attr("opacity",0)

    tick_enter.append("line")
      .attr("class","d3plus_data_y")
      .call(data_tick,"y")

    data_ticks.selectAll("line.d3plus_data_y")
      .call(data_tick,"y")

    tick_enter.append("line")
      .attr("class","d3plus_data_x")
      .call(data_tick,"x")

    data_ticks.selectAll("line.d3plus_data_x")
      .call(data_tick,"x")

    data_ticks.transition().duration(vars.draw.timing)
      .attr("opacity",1)

    data_ticks.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

  }

  //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // Plot data on chart!
  //-------------------------------------------------------------------

  function axis_lines(node) {

    var click_remove = d3.event.type == d3plus.evt.click && (vars.tooltip.value.long || vars.tooltip.html.value),
        create = [d3plus.evt.over,d3plus.evt.move].indexOf(d3.event.type) >= 0

    if (!click_remove && create && vars.shape.value != "area") {

      if (node.data) var node = node.data

      var line_data = [
        d3plus.util.copy(node.d3plus),
        d3plus.util.copy(node.d3plus)
      ]
      line_data[0].axis = "x"
      line_data[1].axis = "y"

    }
    else {
      var line_data = []
    }

    function line_init(l) {
      l
        .attr("x2",function(d){
          var ret = d.axis == "x" ? d.x : d.x-d.r
          return ret
        })
        .attr("y2",function(d){
          var ret = d.axis == "y" ? d.y : d.y+d.r
          return ret
        })
        .style("stroke-width",0)
        .attr("opacity",0)
    }

    var lines = mouseevents.selectAll("line.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    lines.enter().append("line")
      .attr("class","d3plus_axis_label")
      .call(line_init)
      .attr("x1",function(d){
        return d.axis == "x" ? d.x : d.x-d.r
      })
      .attr("y1",function(d){
        return d.axis == "y" ? d.y : d.y+d.r
      })
      .style("stroke",function(d){
        return fetchColor(vars,node)
      })
      .attr("shape-rendering",vars.shape.rendering.value)

    lines.transition().duration(vars.timing.mouseevents)
      .attr("class","d3plus_axis_label")
      .attr("x2",function(d){
        return d.axis == "x" ? d.x : graph.margin.left-vars.axes.ticks.size
      })
      .attr("y2",function(d){
        return d.axis == "y" ? d.y : graph.height+graph.margin.top+vars.axes.ticks.size
      })
      .style("stroke",function(d){
        return d3plus.color.legible(fetchColor(vars,node));
      })
      .style("stroke-width",vars.data.stroke.width)
      .attr("opacity",1)

    lines.exit().transition().duration(vars.timing.mouseevents)
      .call(line_init)
      .remove()

    var texts = mouseevents.selectAll("text.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    texts.enter().append("text")
      .attr("class","d3plus_axis_label")
      .attr("id",function(d){
        return d.axis+"_"+d.id
      })
      .text(function(d){
        var val = fetchValue(vars,node.d3plus_data || node,vars[d.axis].value)
        return vars.format.value(val,vars[d.axis].value)
      })
      .attr("x",function(d){
        return d.axis == "x" ? d.x : graph.margin.left-5-vars.axes.ticks.size
      })
      .attr("y",function(d){
        return d.axis == "y" ? d.y : graph.height+graph.margin.top+5+vars.axes.ticks.size
      })
      .attr("dy",function(d){
        return d.axis == "y" ? (vars.axes.ticks.font.size*.35) : vars.axes.ticks.font.size
      })
      .style("text-anchor",function(d){
        return d.axis == "y" ? "end": "middle"
      })
      .attr("fill",function(d){
        return d3plus.color.legible(fetchColor(vars,node));
      })
      .attr("font-size",vars.axes.ticks.font.size)
      .attr("font-family",vars.axes.ticks.font.family.value)
      .attr("font-weight",vars.axes.ticks.font.weight)
      .attr("opacity",0)

    texts.transition().duration(vars.timing.mouseevents)
      .delay(vars.timing.mouseevents)
      .attr("opacity",1)

    texts.exit().transition().duration(vars.timing.mouseevents)
      .attr("opacity",0)
      .remove()

    var rects = mouseevents.selectAll("rect.d3plus_axis_label")
      .data(line_data,function(d){
        return d.axis+"_"+d.id
      })

    rects.enter().insert("rect","text")
      .attr("class","d3plus_axis_label")
      .attr("x",function(d){
        var width = d3.select("text#"+d.axis+"_"+d.id).node().getBBox().width
        var ret = d.axis == "x" ? d.x : graph.margin.left-vars.axes.ticks.size
        return d.axis == "x" ? ret-width/2-5 : ret-width-10
      })
      .attr("y",function(d){
        var height = d3.select("text#"+d.axis+"_"+d.id).node().getBBox().height
        var ret = d.axis == "y" ? d.y : graph.height+graph.margin.top
        return d.axis == "x" ? ret+vars.axes.ticks.size : ret-height/2-5
      })
      .attr("width",function(d){
        var text = d3.select("text#"+d.axis+"_"+d.id).node().getBBox()
        return text.width + 10
      })
      .attr("height",function(d){
        var text = d3.select("text#"+d.axis+"_"+d.id).node().getBBox()
        return text.height + 10
      })
      .style("stroke",function(d){
        return d3plus.color.legible(fetchColor(vars,node));
      })
      .attr("fill","white")
      .style("stroke-width",vars.data.stroke.width)
      .attr("shape-rendering",vars.shape.rendering.value)
      .attr("opacity",0)

    rects.transition().duration(vars.timing.mouseevents)
      .delay(vars.timing.mouseevents)
      .attr("opacity",1)

    rects.exit().transition().duration(vars.timing.mouseevents)
      .attr("opacity",0)
      .remove()

  }

  vars.mouse = axis_lines

  return data

}

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Visualization Settings and Helper Functions
//------------------------------------------------------------------------------
chart.fill         = true
chart.requirements = ["data","x","y"]
chart.scale        = {"circle": 1.1, "donut": 1.1, "square": 1.1 }
chart.setup        = function(vars) {
  if (vars.x.value === vars.time.value) vars.self.x({"scale": "continuous"})
  if (vars.y.value === vars.time.value) vars.self.y({"scale": "continuous"})
}
chart.shapes       = ["circle","donut","line","square","area"]
chart.tooltip      = "static"

module.exports = chart
