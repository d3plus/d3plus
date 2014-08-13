//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates color key
//-------------------------------------------------------------------

d3plus.ui.timeline = function(vars) {

  if ((!vars.internal_error || !vars.data.missing) && !vars.small && vars.data.time && vars.data.time.values.length > 1 && vars.timeline.value) {

    var years = []
    vars.data.time.values.forEach(function(d){
      years.push(new Date(d))
    })

    if ( vars.dev.value ) d3plus.console.time("drawing timeline")

    var timeFormat = vars.time.format.value || vars.data.time.format
      , timeMultiFormat = vars.time.format.value || vars.data.time.multiFormat

    if ((vars.time.value == vars.x.value && vars.x.scale.value == "continuous") || (vars.time.value == vars.y.value && vars.y.scale.value == "continuous")) {
      var min_required = 2
    }
    else {
      var min_required = 1
    }

    if (vars.time.solo.value.length) {
      var init = d3.extent(vars.time.solo.value)
      for (var i = 0; i < init.length; i++) {
        if (init[i].constructor !== Date) {
          var d = new Date(init[i].toString())
          d.setTime( d.getTime() + d.getTimezoneOffset() * 60 * 1000 )
          init[i] = d
        }
      }
    }
    else {
      var init = d3.extent(years)
    }

    var min = years[0],
        start = new Date(init[0]),
        end = new Date(init[1])

    years = vars.data.time.ticks
    var year_ticks = years.slice()
    var d = new Date(min)
    d["set"+vars.data.time.stepType](d["get"+vars.data.time.stepType]() + years.length)
    year_ticks.push(d)

    end["set"+vars.data.time.stepType](end["get"+vars.data.time.stepType]() + 1)
    start = d3plus.util.closest(year_ticks,start)
    end = d3plus.util.closest(year_ticks,end)

    var yearMS = year_ticks.slice(0)
    for (var i = 0; i < yearMS.length; i++) {
      yearMS[i] = yearMS[i].getTime()
    }

    var min_index = yearMS.indexOf(start.getTime())
      , max_index = yearMS.indexOf(end.getTime())

    var brushed = function() {

      if (d3.event.sourceEvent !== null) {

        brushExtent = brush.extent()

        var min_val = d3plus.util.closest(year_ticks,brushExtent[0]),
            max_val = d3plus.util.closest(year_ticks,brushExtent[1])

        if (min_val === max_val) {
          min_index = yearMS.indexOf(min_val.getTime())
          if (min_val < brushExtent[0] || min_index === 0) {
            max_val = year_ticks[min_index + 1]
          }
          else {
            min_val = year_ticks[min_index - 1]
          }

        }

        min_index = yearMS.indexOf(min_val.getTime())
        max_index = yearMS.indexOf(max_val.getTime())

        if (max_index-min_index >= min_required) {
          var extent = [min_val,max_val]
        }
        else if (min_index+min_required <= years.length) {
          var extent = [min_val,year_ticks[min_index+min_required]]
        }
        else {

          var extent = [min_val]
          for (var i = 1; i <= min_required; i++) {
            if (min_index+i <= years.length) {
              extent.push(year_ticks[min_index+i])
            }
            else {
              extent.unshift(year_ticks[min_index-((min_index+i)-(years.length))])
            }
          }
          extent = [extent[0],extent[extent.length-1]]
        }

        brushExtent = extent

        text.attr("fill",textFill)

        d3.select(this).call(brush.extent(extent))

      }
      else {
        return;
      }

    }

    var brushend = function() {

      if (d3.event.sourceEvent !== null) {

        if (vars.time.solo.value.length) {
          var solod = d3.extent(vars.time.solo.value)
            , old_min = yearMS.indexOf(d3plus.util.closest(year_ticks,solod[0]).getTime())
            , old_max = yearMS.indexOf(d3plus.util.closest(year_ticks,solod[1]).getTime())+1
            , change = old_min !== min_index || old_max !== max_index
        }
        else {
          var change = max_index-min_index !== years.length
        }

        if (change) {

          if (max_index-min_index == years.length) {
            var newYears = []
          }
          else {

            var newYears = d3.range(min_index,max_index)
              .map(function(y){
                var i = vars.data.time.dataSteps.indexOf(y)
                return i >= 0 ? vars.data.time.values[i] : years[y]
              })

          }

          vars.self.time({"solo": newYears}).draw()

        }

      }
      else {
        return;
      }

    }

    var textStyle = {
      "font-weight": vars.ui.font.weight,
      "font-family": vars.ui.font.family.value,
      "font-size": vars.ui.font.size,
      "text-anchor": "middle"
    }

    var timeFormatter = function(v,i) {
      if (i === 0 || i === years.length-1) return timeFormat(v)
      else return timeMultiFormat(v)
    }

    var textSizes = d3plus.font.sizes(years.map(timeFormatter),textStyle)
      , yearWidths = textSizes.map(function(t){return t.width})
      , year_width = d3.max(yearWidths)
      , year_height = d3.max(textSizes.map(function(t){return t.height}))

    var label_width = year_width+vars.ui.padding*2,
        timelineHeight = year_height+vars.ui.padding*2
        timeline_width = label_width*years.length,
        available_width = vars.width.value-vars.ui.padding*2,
        tickStep = 1,
        textRotate = 0

    if (timeline_width > available_width) {
      label_width = year_height+vars.ui.padding*2
      timelineHeight = year_width+vars.ui.padding*2
      timeline_width = label_width*years.length
      textRotate = 90
    }

    timelineHeight = d3.max([timelineHeight,vars.timeline.height.value])

    var old_width = label_width
    if (timeline_width > available_width) {
      timeline_width = available_width
      old_width = label_width-vars.ui.padding*2
      label_width = timeline_width/years.length
      if (old_width > label_width) {
        tickStep = Math.ceil(old_width/(timeline_width/years.length))
        for (tickStep; tickStep < years.length-1; tickStep++) {
          if ((years.length-1)%tickStep == 0) {
            break;
          }
        }

      }
    }

    if (vars.timeline.align == "start") {
      var start_x = vars.ui.padding
    }
    else if (vars.timeline.align == "end") {
      var start_x = vars.width.value - vars.ui.padding - timeline_width
    }
    else {
      var start_x = vars.width.value/2 - timeline_width/2
    }

    var brushExtent = [start,end]

    var textFill = function(d) {

      if (d >= brushExtent[0] && d < brushExtent[1]) {
        var opacity = 1
          , color = d3plus.color.text(vars.ui.color.primary.value)
      }
      else {
        var opacity = 0.5
          , color = d3plus.color.text(vars.ui.color.secondary.value)
      }

      var color = d3.rgb(color)

      return "rgba("+color.r+","+color.g+","+color.b+","+opacity+")"

    }

    var background = vars.g.timeline.selectAll("rect.d3plus_timeline_background")
      .data(["background"])

    background.enter().append("rect")
      .attr("class","d3plus_timeline_background")
      .attr("shape-rendering","crispEdges")
      .attr("width",timeline_width+2)
      .attr("height",timelineHeight+2)
      .attr("fill",vars.ui.color.secondary.value)
      .attr("x",start_x-1)
      .attr("y",vars.ui.padding)

    background.transition().duration(vars.draw.timing)
      .attr("width",timeline_width+2)
      .attr("height",timelineHeight+2)
      .attr("fill",vars.ui.color.secondary.value)
      .attr("x",start_x-1)
      .attr("y",vars.ui.padding)

    var ticks = vars.g.timeline.selectAll("g#ticks")
      .data(["ticks"])

    ticks.enter().append("g")
      .attr("id","ticks")
      .attr("transform","translate("+vars.width.value/2+","+vars.ui.padding+")")

    var brush_group = vars.g.timeline.selectAll("g#brush")
      .data(["brush"])

    brush_group.enter().append("g")
      .attr("id","brush")

    var labels = vars.g.timeline.selectAll("g#labels")
      .data(["labels"])

    labels.enter().append("g")
      .attr("id","labels")

    var text = labels.selectAll("text")
      .data(years,function(d,i){
        return i
      })

    text.enter().append("text")
      .attr("y",0)
      .attr("dy","0.5ex")
      .attr("x",0)

    text
      .order()
      .attr(textStyle)
      .text(function(d,i){
        if (i === 0 || i === years.length-1) return timeFormat(d)

        var prev = (i-1)%tickStep === 0
          , next = (i+1)%tickStep === 0
          , data = vars.data.time.dataSteps.indexOf(i) >= 0
          , fits = (yearWidths[i-1]/2 + yearWidths[i] + yearWidths[i+1]/2 + vars.ui.padding*4) < label_width*2

        return i%tickStep === 0 || (!prev && !next && data && old_width < label_width*3) ? timeMultiFormat(d) : ""
      })
      .attr("opacity",function(d,i){
        return vars.data.time.dataSteps.indexOf(i) >= 0 ? 1 : 0.4
      })
      .attr("fill",textFill)
      .attr("transform",function(d,i){
        var x = start_x + (label_width*i) + label_width/2
          , y = timelineHeight/2 + vars.ui.padding + 1

        // var diff = diff = parseFloat(d3.select(this).style("font-size"),10)/4
        // var y = vars.ui.padding+vars.timeline.height/2+this.getBBox().height/2 - diff

        if (textRotate) {
          // x -= vars.ui.padding
          // y += vars.ui.padding
        }
        else {
          // x += vars.ui.padding
          // y += vars.ui.padding
        }
        return "translate("+Math.round(x)+","+Math.round(y)+")rotate("+textRotate+")"
      })

    text.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0)
      .remove()

    var x = d3.time.scale()
      .domain(d3.extent(year_ticks))
      .rangeRound([0,timeline_width])

    var brush = d3.svg.brush()
      .x(x)
      .extent(brushExtent)
      .on("brush", brushed)
      .on("brushend", brushend)

    ticks
      .attr("transform","translate("+start_x+","+vars.ui.padding+")")
      .transition().duration(vars.draw.timing)
      .call(d3.svg.axis()
        .scale(x)
        .orient("top")
        .ticks(function(){
          return year_ticks
        })
        .tickFormat("")
        .tickSize(-timelineHeight)
        .tickPadding(0))
        .selectAll("path").attr("fill","none")

    ticks.selectAll("line")
      .attr("stroke",vars.timeline.tick)
      .attr("stroke-width",1)
      .attr("shape-rendering","crispEdges")

    brush_group
      .attr("transform","translate("+start_x+","+(vars.ui.padding+1)+")")
      .attr("opacity",1)
      .call(brush)

    text.attr("pointer-events","none")

    brush_group.selectAll("rect.background")
      .attr("fill","none")
      // .attr("stroke-width",1)
      // .attr("stroke",vars.ui.color.secondary.value)
      .style("visibility","visible")
      .attr("height",timelineHeight)
      .attr("shape-rendering","crispEdges")
      .on(d3plus.evt.move,function(){
        var c = vars.timeline.hover.value
        if (["grab","grabbing"].indexOf(c) >= 0) c = d3plus.prefix()+c
        d3.select(this).style("cursor",c)
      })

    brush_group.selectAll("rect.extent")
      // .attr("stroke-width",1)
      // .attr("stroke",vars.ui.color.secondary.value)
      .attr("height",timelineHeight)
      .attr("fill",vars.ui.color.primary.value)
      .attr("shape-rendering","crispEdges")
      .on(d3plus.evt.move,function(){
        var c = vars.timeline.hover.value
        if (["grab","grabbing"].indexOf(c) >= 0) c = d3plus.prefix()+c
        d3.select(this).style("cursor",c)
      })

    if (vars.timeline.handles.value) {

      var handles = brush_group.selectAll("g.resize").selectAll("rect.d3plus_handle")
        .data(["d3plus_handle"])

      handles.enter().insert("rect","rect")
        .attr("class","d3plus_handle")

      handles
        .attr("fill",vars.timeline.handles.color)
        .attr("transform",function(d){
          var mod = this.parentNode.className.baseVal === "resize e" ? -vars.timeline.handles.size : 0
          return "translate("+mod+",0)"
        })
        .attr("width",vars.timeline.handles.size)
        .style("visibility","visible")
        .attr("shape-rendering","crispEdges")
        .attr("opacity",vars.timeline.handles.opacity)
        .on(d3plus.evt.over,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.timing.mouseevents)
            .attr("fill",vars.timeline.handles.hover)
        })
        .on(d3plus.evt.out,function(){
          d3.select(this).select("rect")
            .transition().duration(vars.timing.mouseevents)
            .attr("fill",vars.timeline.handles.color)
        })

      brush_group.selectAll("g.resize").selectAll("rect")
        .attr("height",timelineHeight)

    }
    else {

      brush_group.selectAll("g.resize")
        .remove()

    }

    if ( vars.margin.bottom === 0 ) {
      vars.margin.bottom += vars.ui.padding
    }

    var timelineBox = vars.g.timeline.node().getBBox()

    vars.margin.bottom += timelineBox.height+timelineBox.y

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+Math.round(vars.height.value-vars.margin.bottom-vars.ui.padding/2)+")")

    vars.margin.bottom += vars.ui.padding

    if ( vars.dev.value ) d3plus.console.time("drawing timeline")

  }
  else {

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+vars.height.value+")")

  }

}
