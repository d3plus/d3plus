//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates "back" button, if applicable
//------------------------------------------------------------------------------
d3plus.ui.history = function(vars) {

  if (!vars.small && vars.history.states.length > 0) {

    var min_height = vars.style.ui["font-size"] + vars.style.ui.padding*4
    if (vars.margin.top < min_height) {
      vars.margin.top = min_height
    }

    var button = vars.svg.selectAll("g#d3plus_history")
      .data(["history"])

    function text_style(elem) {

        elem
          .attr("x",vars.style.ui.padding*2)
          .attr("y",vars.margin.top/2-vars.style.ui["font-size"]/2)
          .attr("font-size",vars.style.ui["font-size"]+"px")
          .attr("dy",vars.style.ui["font-size"]+"px")
          .attr("fill", vars.style.ui["font-color"])
          .attr("text-anchor", "start")
          .attr("font-family", vars.style.ui["font-family"])
          .style("font-weight", vars.style.ui["font-weight"])

    }

    function rect_style(elem) {

        var text = button.select("text").node().getBBox()

        elem
          .attr("x",text.x - vars.style.ui.padding)
          .attr("y",text.y - vars.style.ui.padding)
          .attr("width",text.width + (vars.style.ui.padding*2))
          .attr("height",text.height + (vars.style.ui.padding*2))
          .attr("fill", vars.style.ui.background)
          .attr("stroke", vars.style.ui["border-color"])
          .attr("stroke-width", vars.style.ui["border-width"])
          .attr("shape-rendering",vars.style.rendering)

    }

    var enter = button.enter().append("g")
      .attr("id","d3plus_history")
      .attr("opacity",0)

    enter.append("rect")

    enter.append("text")
      .call(text_style)
      .each(function(){

        if (d3plus.fontawesome) {
          var arrow = "&#xf104 "
        }
        else {
          var arrow = "&laquo; "
        }

        var tspans = d3.select(this).selectAll("tspan")
          .data([arrow,vars.format("Back")])

        tspans.enter().append("tspan")

        tspans
          .html(String)
          .attr("font-family",function(d,i){
            if (i == 0 && d3plus.fontawesome) {
              return "FontAwesome"
            }
            return vars.style.ui["font-family"]
          })

        button.select("rect").call(rect_style)

      })

    button
      .on(d3plus.evt.over,function(){

        d3.select(this)
          .style("cursor","pointer")
          .select("rect")
          .transition().duration(vars.style.timing.mouseevents)
            .attr("fill",vars.style.ui.hover)

      })
      .on(d3plus.evt.out,function(){

        d3.select(this)
          .style("cursor","auto")
          .select("rect")
          .transition().duration(vars.style.timing.mouseevents)
            .attr("fill",vars.style.ui.background)

      })
      .on(d3plus.evt.click,function(){

        vars.back()

      })
      .transition().duration(vars.style.timing.transitions)
        .attr("opacity",1)

    button.select("text")
      .transition().duration(vars.style.timing.transitions)
      .call(text_style)

    button.select("rect")
      .transition().duration(vars.style.timing.transitions)
      .delay(vars.style.timing.transitions)
      .call(rect_style)

  }
  else {
    vars.svg.selectAll("g#d3plus_history")
      .transition().duration(vars.style.timing.transitions)
      .attr("opacity",0)
      .remove()
  }

}
