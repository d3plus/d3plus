closest    = require "../../../util/closest.coffee"
css        = require "../../../client/css.coffee"
fontSizes  = require "../../../font/sizes.coffee"
events     = require "../../../client/pointer.coffee"
mix        = require "../../../color/mix.coffee"
prefix     = require "../../../client/prefix.coffee"
print      = require "../../../core/console/print.coffee"
textColor  = require "../../../color/text.coffee"
timeDetect = require "../../../core/data/time.coffee"

playInterval = false

# Creates color key
module.exports = (vars) ->

  if vars.timeline.value and (!vars.error.internal or !vars.data.missing) and !vars.small and vars.data.time and vars.data.time.values.length > 1

    print.time "drawing timeline" if vars.dev.value

    textStyle =
      "font-weight": vars.ui.font.weight
      "font-family": vars.ui.font.family.value
      "font-size":   vars.ui.font.size + "px"
      "text-anchor": "middle"

    years           = vars.data.time.ticks.map (d) -> new Date(d)
    timeReturn      = timeDetect vars,
      values: years
      style:  textStyle
    visible    = timeReturn.values.map Number
    timeFormat = timeReturn.format

    if vars.time.solo.value.length
      init = d3.extent vars.time.solo.value
      for d, i in init
        if d.constructor isnt Date
          d += ""
          d += "/01/01" if d.length is 4 and parseInt(d)+"" is d
          d = new Date d
          # d.setTime d.getTime() + d.getTimezoneOffset() * 60 * 1000
          init[i] = d
    else
      init = d3.extent years

    year_ticks      = years.slice()
    yearHeight      = d3.max(timeReturn.sizes.map (t) -> t.height)
    labelWidth      = ~~(d3.max(timeReturn.sizes.map (t) -> t.width))+1
    labelWidth     += vars.ui.padding*2
    timelineHeight  = vars.timeline.height.value or yearHeight + vars.ui.padding * 2
    timelineWidth   = labelWidth * years.length
    playbackWidth   = timelineHeight
    tallEnough      = timelineHeight - vars.ui.padding * 2 >= yearHeight

    availableWidth = vars.width.value-vars.ui.padding*2
    if tallEnough and vars.timeline.play.value
      availableWidth -= playbackWidth + vars.ui.padding

    if not tallEnough or visible.length < years.length or
       availableWidth < labelWidth * visible.length
      oldWidth       = labelWidth
      labelWidth     = (availableWidth-labelWidth)/years.length
      timelineWidth  = labelWidth*years.length
      timelineOffset = 1
      tickStep = ~~(oldWidth/(timelineWidth/visible.length))+1
      while tickStep < visible.length - 1
        break if (visible.length - 1) % tickStep is 0
        tickStep++
      visible = visible.filter (t, i) -> i % tickStep is 0
    else
      timelineOffset = 0

      min = new Date years[0]
      step = vars.data.time.stepType
      min["set"+step] min["get"+step]() + years.length
      year_ticks.push(min)

    start = new Date init[0]
    start = closest year_ticks, start

    end = new Date init[1]
    unless timelineOffset
      end["set"+vars.data.time.stepType] end["get"+vars.data.time.stepType]() + 1
    end = closest year_ticks, end

    yearMS      = year_ticks.map Number
    min_index   = yearMS.indexOf +start
    max_index   = yearMS.indexOf +end
    brushExtent = [start,end]

    if vars.timeline.align is "start"
      start_x = vars.ui.padding
    else if vars.timeline.align is "end"
      start_x = vars.width.value - vars.ui.padding - timelineWidth
    else
      start_x = vars.width.value/2 - timelineWidth/2

    if tallEnough and vars.timeline.play.value
      start_x += (playbackWidth + vars.ui.padding)/2

    stopPlayback = ->
      clearInterval playInterval
      playInterval = false
      playIcon.call playIconChar, "icon"

    brushed = () ->

      if d3.event.sourceEvent isnt null

        stopPlayback() if playInterval

        brushExtent = brush.extent()

        min_val = closest year_ticks, brushExtent[0]
        max_val = closest year_ticks, brushExtent[1]

        if min_val is max_val
          min_index = yearMS.indexOf +min_val
          if min_val < brushExtent[0] or min_index is 0
            max_val = year_ticks[min_index + 1]
          else
            min_val = year_ticks[min_index - 1]

        min_index = yearMS.indexOf +min_val
        max_index = yearMS.indexOf +max_val

        if max_index-min_index >= 1
          extent = [min_val,max_val]
        else if min_index+1 <= years.length
          extent = [min_val,year_ticks[min_index+1]]
        else

          extent = [min_val]
          i = 1
          while i <= 1
            if min_index+i <= years.length
              extent.push year_ticks[min_index+i]
            else
              extent.unshift year_ticks[min_index-((min_index+i)-(years.length))]
            i++
          extent = [extent[0],extent[extent.length-1]]

        brushExtent = extent
        text.attr "fill", textFill
        d3.select(this).call brush.extent(extent)

    setYears = () ->

      if max_index - min_index is years.length - timelineOffset
        newYears = []
      else
        newYears = yearMS.filter (t, i) ->
          i >= min_index and i < (max_index + timelineOffset)
        newYears = newYears.map (t) -> new Date t
      playUpdate()
      vars.self.time({"solo": newYears}).draw()

    brushend = () ->

      if d3.event.sourceEvent isnt null

        if vars.time.solo.value.length
          solo = d3.extent(vars.time.solo.value)
          old_min = yearMS.indexOf(+closest(year_ticks, solo[0]))
          old_max = yearMS.indexOf(+closest(year_ticks, solo[1]))
          change = old_min isnt min_index or old_max isnt max_index
        else
          change = max_index - min_index isnt years.length - timelineOffset
        setYears() if change

    playButton = vars.g.timeline.selectAll("rect.d3plus_timeline_play")
      .data if tallEnough and vars.timeline.play.value then [0] else []

    playStyle = (btn) ->
      btn
        .attr "width", playbackWidth + 1
        .attr "height", timelineHeight + 1
        .attr "fill", vars.ui.color.primary.value
        .attr "stroke", vars.ui.color.primary.value
        .attr "stroke-width", 1
        .attr "x", start_x - playbackWidth - 1 - vars.ui.padding
        .attr "y", vars.ui.padding

    playButton.enter().append("rect")
      .attr "class", "d3plus_timeline_play"
      .attr "shape-rendering", "crispEdges"
      .attr "opacity", 0
      .call playStyle

    playButton.transition().duration(vars.draw.timing)
      .call playStyle

    playButton.exit().transition().duration(vars.draw.timing)
      .attr("opacity", 0).remove()

    playIcon = vars.g.timeline.selectAll("text.d3plus_timeline_playIcon")
      .data if tallEnough and vars.timeline.play.value then [0] else []

    playIconChar = (text, char) ->
      char = vars.timeline.play[char]
      if css "font-awesome"
        char = char.awesome
        font = "FontAwesome"
      else
        char = char.fallback
        font = "inherit"
      text
        .style "font-family", font
        .text char

    playIconStyle = (text) ->
      y = timelineHeight/2 + vars.ui.padding + 1
      text
        .attr "fill", textColor vars.ui.color.primary.value
        .attr textStyle
        .attr "x", start_x - (playbackWidth - 1)/2 - vars.ui.padding
        .attr "y", y
        .attr "dy", "0.5ex"
        .call playIconChar, if playInterval then "pause" else "icon"

    playIcon.enter().append("text")
      .attr "class", "d3plus_timeline_playIcon"
      .call playIconStyle
      .style "pointer-events", "none"
      .attr "opacity", 0

    playIcon
      .call playIconStyle
      .transition().duration(vars.draw.timing).attr("opacity", 1)

    playIcon.exit().transition().duration(vars.draw.timing)
      .attr("opacity", 0).remove()

    playUpdate = ->
      if max_index-min_index is years.length-timelineOffset
        playButton
          .on events.hover, null
          .on events.click, null
          .transition().duration(vars.draw.timing)
          .attr "opacity", 0.3
        playIcon.transition().duration(vars.draw.timing)
          .attr "opacity", 0.3
      else
        playButton
          .on events.over, ->
            d3.select(this).style "cursor", "pointer"
          .on events.out, ->
            d3.select(this).style "cursor", "auto"
          .on events.click, ->
            if playInterval
              stopPlayback()
            else
              playIcon.call playIconChar, "pause"
              if max_index is years.length
                max_index = max_index-min_index
                min_index = 0
              else
                min_index++
                max_index++
              setYears()
              playInterval = setInterval ->
                if max_index is years.length - timelineOffset
                  stopPlayback()
                else
                  min_index++
                  max_index++
                  setYears()
              , vars.timeline.play.timing.value
          .transition().duration(vars.draw.timing)
            .attr "opacity", 1
        playIcon.transition().duration(vars.draw.timing)
          .attr "opacity", 1

    playUpdate()

    textFill = (d) ->
      less = if timelineOffset then d <= brushExtent[1] else d < brushExtent[1]
      if d >= brushExtent[0] and less
        opacity = 1
        color = textColor vars.ui.color.secondary.value
      else
        opacity = 0.5
        color = textColor vars.ui.color.primary.value
      if timelineOffset and vars.background.value and vars.background.value isnt "none"
        color = d3.rgb(textColor(vars.background.value))
      color = d3.rgb color
      "rgba("+color.r+","+color.g+","+color.b+","+opacity+")"

    background = vars.g.timeline.selectAll("rect.d3plus_timeline_background")
      .data(["background"])

    background.enter().append("rect")
      .attr("class","d3plus_timeline_background")
      .attr("shape-rendering","crispEdges")
      .attr("width",timelineWidth+2)
      .attr("height",timelineHeight+2)
      .attr("fill",vars.ui.color.primary.value)
      .attr("x",start_x-1)
      .attr("y",vars.ui.padding)

    background.transition().duration(vars.draw.timing)
      .attr("width",timelineWidth+2)
      .attr("height",timelineHeight+2)
      .attr("fill",vars.ui.color.primary.value)
      .attr("x",start_x-1)
      .attr("y",vars.ui.padding)

    ticks = vars.g.timeline.selectAll("g#ticks").data(["ticks"])

    ticks.enter().append("g")
      .attr("id","ticks")
      .attr("transform","translate("+vars.width.value/2+","+vars.ui.padding+")")

    brush_group = vars.g.timeline.selectAll("g#brush").data(["brush"])
    brush_group.enter().append("g").attr("id","brush")

    labels = vars.g.timeline.selectAll("g#labels").data(["labels"])
    labels.enter().append("g").attr("id","labels")

    text = labels.selectAll("text").data years, (d,i) -> i
    text.enter().append("text")
      .attr("y",0)
      .attr("dy","0.5ex")
      .attr("x",0)

    x = d3.time.scale()
      .domain(d3.extent year_ticks)
      .rangeRound([0,timelineWidth])

    text
      .order()
      .attr textStyle
      .text (d, i) ->
        if visible.indexOf(+d) >= 0 then timeFormat(d) else ""
      .attr "opacity", (d, i) ->
        if vars.data.time.dataSteps.indexOf(i) >= 0 then 1 else 0.4
      .attr "fill", textFill
      .attr "transform", (d,i) ->
        dx = start_x + x(d)
        dx += labelWidth/2 unless timelineOffset
        dy = timelineHeight/2 + vars.ui.padding + 1
        dy += timelineHeight/2 + yearHeight if timelineOffset
        "translate("+Math.round(dx)+","+Math.round(dy)+")"

    text.exit().transition().duration(vars.draw.timing)
      .attr("opacity",0).remove()

    brush = d3.svg.brush()
      .x(x)
      .extent(brushExtent)
      .on("brush", brushed)
      .on("brushend", brushend)

    if vars.axes.discrete and vars[vars.axes.discrete].value is vars.time.value
      tickColor = vars[vars.axes.discrete].ticks.color
    else
      tickColor = vars.x.ticks.color

    ticks
      .attr("transform","translate("+start_x+","+(vars.ui.padding+1)+")")
      .transition().duration(vars.draw.timing)
      .call(d3.svg.axis()
              .scale(x)
              .orient("top")
              .ticks(() -> year_ticks)
              .tickFormat("")
              .tickSize(-timelineHeight)
              .tickPadding(0))
      .selectAll("line")
        .attr("stroke-width",1)
        .attr("shape-rendering","crispEdges")
        .attr "stroke", (d) ->
          if visible.indexOf(+d) >= 0
            tickColor
          else
            mix(tickColor, vars.background.value, 0.4, 1)

    ticks.selectAll("path").attr("fill","none")

    brush_group
      .attr("transform","translate("+start_x+","+(vars.ui.padding+1)+")")
      .attr("opacity",1)
      .call(brush)

    text.attr("pointer-events","none")

    brush_group.selectAll("rect.background")
      .attr("fill","none")
      # .attr("stroke-width",1)
      # .attr("stroke",vars.ui.color.primary.value)
      .style("visibility","visible")
      .attr("height",timelineHeight)
      .attr("shape-rendering","crispEdges")
      .on events.move,() ->
        c = vars.timeline.hover.value
        c = prefix()+c if ["grab","grabbing"].indexOf(c) >= 0
        d3.select(this).style("cursor",c)

    brush_group.selectAll("rect.extent")
      # .attr("stroke-width",1)
      # .attr("stroke",vars.ui.color.primary.value)
      .attr("opacity", 0.75)
      .attr("height",timelineHeight)
      .attr("fill",vars.ui.color.secondary.value)
      .attr("shape-rendering","crispEdges")
      .on events.move, () ->
        c = vars.timeline.hover.value
        c = prefix()+c if ["grab","grabbing"].indexOf(c) >= 0
        d3.select(this).style("cursor",c)

    if vars.timeline.handles.value

      handles = brush_group.selectAll("g.resize").selectAll("rect.d3plus_handle")
        .data(["d3plus_handle"])

      handles.enter().insert("rect","rect")
        .attr("class","d3plus_handle")

      handles
        .attr("fill",vars.timeline.handles.color)
        .attr "transform", (d) ->
          if this.parentNode.className.baseVal is "resize e"
            mod = -vars.timeline.handles.size
          else
            mod = 0
          "translate("+mod+",0)"
        .attr("width",vars.timeline.handles.size)
        .style("visibility","visible")
        .attr("shape-rendering","crispEdges")
        .attr("opacity",vars.timeline.handles.opacity)

      brush_group.selectAll("g.resize").selectAll("rect")
        .attr("height",timelineHeight)

    else
      brush_group.selectAll("g.resize").remove()


    timelineBox         = vars.g.timeline.node().getBBox()
    vars.margin.bottom += vars.ui.padding if vars.margin.bottom is 0
    vars.margin.bottom += timelineBox.height+timelineBox.y

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr("transform","translate(0,"+Math.round(vars.height.value-vars.margin.bottom-vars.ui.padding/2)+")")

    vars.margin.bottom += vars.ui.padding

    print.time "drawing timeline" if vars.dev.value

  else

    vars.g.timeline.transition().duration(vars.draw.timing)
      .attr "transform", "translate(0," + vars.height.value + ")"
