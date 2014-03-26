//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates "back" button, if applicable
//------------------------------------------------------------------------------
d3plus.ui.history = function(vars) {

  if (!vars.small && vars.history.states.length > 0) {

    var min_height = vars.style.ui["font-size"] + vars.style.ui.padding*4
    if (vars.margin.top < min_height) {
      vars.margin.top = min_height
    }

    var button = vars.parent.selectAll("div#d3plus_back_button")
      .data(["d3plus_back_button"])

    function style(elem) {

        elem
          .style("position","absolute")
          .style("left",vars.style.ui.padding*2+"px")
          .style("top",vars.margin.top/2-vars.style.ui["font-size"]/2+"px")
          .style("color", vars.style.ui["font-color"])
          .style("font-family", vars.style.ui["font-family"])
          .style("font-weight", vars.style.ui["font-weight"])
          .style("font-size",vars.style.ui["font-size"]+"px")
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
            .style("color",d3plus.color.lighter(vars.style.ui["font-color"]))

      })
      .on(d3plus.evt.out,function(){

        d3.select(this)
          .style("cursor","auto")
          .transition().duration(vars.style.timing.mouseevents)
            .style("color",vars.style.ui["font-color"])

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
