//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates "back" button, if applicable
//------------------------------------------------------------------------------
d3plus.ui.history = function(vars) {

  if (!vars.small && vars.history.states.length > 0) {

    var min_height = size + vars.style.labels.padding*4
    if (vars.margin.top < min_height) {
      vars.margin.top = min_height
    }

    var button = vars.parent.selectAll("div#d3plus_back_button")
      .data(["d3plus_back_button"])

    var size = vars.title.value
      ? vars.style.title["font-size"] : vars.style.title.sub["font-size"]

    var color = vars.title.sub.value
      ? vars.style.title.sub["font-color"] : vars.style.title["font-color"]

    var family = vars.title.sub.value
      ? vars.style.title.sub["font-family"] : vars.style.title["font-family"]

    var weight = vars.title.sub.value
      ? vars.style.title.sub["font-weight"] : vars.style.title["font-weight"]

    function style(elem) {

        elem
          .style("position","absolute")
          .style("left",vars.style.labels.padding*2+"px")
          .style("top",vars.margin.top/2-size/2+"px")
          .style("color", color)
          .style("font-family", family)
          .style("font-weight", weight)
          .style("font-size",size+"px")
          .style("z-index",2000)

    }

    var enter = button.enter().append("div")
      .attr("id","d3plus_back_button")
      .style("opacity",0)
      .call(style)
      .html(function(){

        if (d3plus.fonts.awesome) {
          var arrow = "<span style='font-family:FontAwesome;margin-right:5px;'>&#xf104</span>"
        }
        else {
          var arrow = "&laquo; "
        }

        return arrow+vars.format("Back")

      })

    button
      .on(d3plus.evt.over,function(){

        d3.select(this)
          .style("cursor","pointer")
          .transition().duration(vars.style.timing.mouseevents)
            .style("color",d3plus.color.lighter(color))

      })
      .on(d3plus.evt.out,function(){

        d3.select(this)
          .style("cursor","auto")
          .transition().duration(vars.style.timing.mouseevents)
            .style("color",color)

      })
      .on(d3plus.evt.click,function(){

        vars.back()

      })
      .transition().duration(vars.style.timing.transitions)
        .style("opacity",1)
        .call(style)

  }
  else {
    vars.parent.selectAll("div#d3plus_back_button")
      .transition().duration(vars.style.timing.transitions)
      .style("opacity",0)
      .remove()
  }

}
