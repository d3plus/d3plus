var events = require("../../../client/pointer.coffee"),
    lighter    = require("../../../color/lighter.coffee"),
    print      = require("../../../core/console/print.coffee"),
    stylesheet = require("../../../client/css.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates "back" button, if applicable
//------------------------------------------------------------------------------
module.exports = function(vars) {

  if (!vars.small && vars.history.states.length > 0) {

    if ( vars.dev.value ) print.time("drawing back button");

    var button = vars.container.value.selectAll("div#d3plus_back_button")
      .data(["d3plus_back_button"]);

    var size = vars.title.sub.font.size;
    var color = vars.title.sub.font.color;
    var family = vars.title.sub.font.family.value;
    var weight = vars.title.sub.font.weight;
    var padding = vars.title.sub.padding;

    function style(elem) {

        elem
          .style("position","absolute")
          .style("left",size/2+"px")
          .style("top",vars.margin.top/2-size/2+"px")
          .style("color", color)
          .style("font-family", family)
          .style("font-weight", weight)
          .style("font-size",size+"px")
          .style("z-index",2000)

    }

    var min_height = size + padding*2
    if (vars.margin.top < min_height) {
      vars.margin.top = min_height
    }

    var enter = button.enter().append("div")
      .attr("id","d3plus_back_button")
      .style("opacity",0)
      .call(style)
      .html(function(){

        if (stylesheet("font-awesome")) {
          var arrow = "<span style='font-family:FontAwesome;margin-right:5px;'>&#xf104</span>"
        }
        else {
          var arrow = "&laquo; "
        }

        return arrow+vars.format.value(vars.format.locale.value.ui.back)

      })

    button
      .on(events.over,function(){

        if (!vars.small && vars.history.states.length > 0) {

          d3.select(this)
            .style("cursor","pointer")
            .transition().duration(vars.timing.mouseevents)
              .style("color",lighter(color,.25))

        }

      })
      .on(events.out,function(){

        if (!vars.small && vars.history.states.length > 0) {

          d3.select(this)
            .style("cursor","auto")
            .transition().duration(vars.timing.mouseevents)
              .style("color",color)

        }

      })
      .on(events.click,function(){

        vars.history.back()

      })
      .transition().duration(vars.draw.timing)
        .style("opacity",1)
        .call(style)

    if ( vars.dev.value ) print.timeEnd("drawing back button")

  }
  else {
    vars.container.value.selectAll("div#d3plus_back_button")
      .transition().duration(vars.draw.timing)
      .style("opacity",0)
      .remove()
  }

}
