events     = require "../../../client/pointer.coffee"
lighter    = require "../../../color/lighter.coffee"
print      = require "../../../core/console/print.coffee"
stylesheet = require "../../../client/css.coffee"

# Creates "back" button, if applicable
module.exports = (vars) ->

  if !vars.small and vars.history.states.length > 0

    print.time "drawing back button" if vars.dev.value

    button = vars.container.value.selectAll("div#d3plus_back_button")
      .data(["d3plus_back_button"])
      .style("position", "relative")
      .style "z-index", 1900

    size    = vars.title.sub.font.size
    color   = vars.title.sub.font.color
    family  = vars.title.sub.font.family.value
    weight  = vars.title.sub.font.weight
    padding = vars.title.sub.padding

    titleClass = false
    if vars.title.sub.value and
            ["start", "left"].indexOf(vars.title.sub.font.align) < 0
      titleClass = "sub"
    else if vars.title.total.value and
            ["start", "left"].indexOf(vars.title.total.font.align) < 0
      titleClass = "total"
    else if vars.title.value and
       ["start", "left"].indexOf(vars.title.font.align) < 0
      titleClass = "title"

    if titleClass
      stripY = (elem) ->
        y = elem.attr("transform").split(",")
        y = y[y.length - 1]
        parseFloat y.substring(0, y.length - 1)

      titleGroup = vars.svg.select(".d3plus_title." + titleClass)
      top = stripY(titleGroup) + stripY(titleGroup.select("text"))
    else
      top = vars.margin.top - vars.title.padding
      min_height = size + padding * 2
      vars.margin.top += min_height

    containerPadding = parseFloat vars.container.value.style("padding-top"), 10
    top += containerPadding
    containerPadding = parseFloat vars.container.value.style("padding-left"), 10
    left = vars.margin.left + size/2 + containerPadding

    style = (elem) ->

      elem
        .style "position", "absolute"
        .style "left", left + "px"
        .style "top", top + "px"
        .style "color", color
        .style "font-family", family
        .style "font-weight", weight
        .style "font-size", size+"px"

    enter = button.enter().append("div")
      .attr "id","d3plus_back_button"
      .style "opacity", 0
      .call style
      .html () ->

        if stylesheet("font-awesome") and
           vars.icon.back.value.indexOf("fa-") is 0
          arrow = "<i class='fa " + vars.icon.back.value
          arrow += "' style='margin-top:2px;margin-right:4px;'></i>"
        else
          arrow = vars.icon.back.value + " "

        arrow + vars.format.value(vars.format.locale.value.ui.back)

    button
      .on events.over, () ->
        if !vars.small and vars.history.states.length > 0
          d3.select(this).style "cursor","pointer"
            .transition().duration(vars.timing.mouseevents)
              .style "color", lighter(color, .25)
      .on events.out, () ->
        if (!vars.small && vars.history.states.length > 0)
          d3.select(this).style "cursor", "auto"
            .transition().duration(vars.timing.mouseevents)
              .style "color", color
      .on events.click, () -> vars.history.back()
      .transition().duration(vars.draw.timing)
        .style "opacity", 1
        .call style

    print.timeEnd "drawing back button" if vars.dev.value

  else
    vars.container.value.selectAll("div#d3plus_back_button")
      .transition().duration(vars.draw.timing)
      .style("opacity",0)
      .remove()
