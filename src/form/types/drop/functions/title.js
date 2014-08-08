//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the title and back button.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.open.value ) {

    if ( vars.dev.value ) d3plus.console.time("creating title and back button")

    var self    = this
      , enabled = vars.id.solo.value.length === 1 && vars.depth.value > 0
      , title   = enabled
      , focus   = vars.container.button.data(Object).app[0]

    title = true
    for (var i = 0; i < vars.id.nesting.length; i++) {
      var level = vars.id.nesting[i]
      if ( level in focus && focus[level] === vars.focus.value[0] ) {
        title = false
        break;
      }
    }

    vars.container.title = vars.container.selector.selectAll("div.d3plus_drop_title")
      .data(enabled ? ["title"] : [])

    function boxStyle(elem) {

      elem
        .style("padding",vars.ui.padding+"px")
        .style("display","block")
        .style("background-color",vars.ui.color.secondary.value)
        .style("font-family",vars.font.secondary.family.value)
        .style("font-size",vars.font.secondary.size+"px")
        .style("font-weight",vars.font.secondary.weight)
        .style("text-align",vars.font.secondary.align)
        .style("color",d3plus.color.text(vars.ui.color.secondary.value))

    }

    function backStyle(elem) {

      if ( !elem.empty() ) {

        var className = vars.icon.back.value.indexOf("fa-") === 0 ? " fa "+vars.icon.back.value : ""
        className = "d3plus_drop_back" + className

        var text = vars.icon.back.value.indexOf("fa-") === 0 ? "" : vars.icon.back.value

        elem
          .style("position","absolute")
          .attr("class",className)
          .style("top",vars.ui.padding+(vars.font.secondary.size/2)/2.5+"px")
          .html(text)

      }

    }

    function titleStyle(elem) {

      var text = title ? vars.focus.value.length : vars.format.locale.value.ui.back

      elem
        .text(vars.format.value(text))
        .style("padding","0px "+vars.ui.padding*2+"px")

    }

    if (vars.draw.timing) {

      vars.container.title.transition().duration(vars.draw.timing)
        .call(boxStyle)

      vars.container.title.select("div.d3plus_drop_title_text")
        .transition().duration(vars.draw.timing)
        .call(titleStyle)

    }
    else {

      vars.container.title
        .call(boxStyle)

      vars.container.title.select("div.d3plus_drop_title_text")
        .call(titleStyle)

    }

    vars.container.title.select("span.d3plus_drop_back")
      .call(backStyle)

    var enter = vars.container.title.enter()
      .insert("div","#d3plus_drop_list_"+vars.container.id)
        .attr("class","d3plus_drop_title")
        .attr("id","d3plus_drop_title_"+vars.container.id)
        .call(boxStyle)

    enter.append("span")
      .attr("id","d3plus_drop_back_"+vars.container.id)
      .attr("class","d3plus_drop_back")
      .call(backStyle)

    enter.append("div")
      .attr("id","d3plus_drop_title_text_"+vars.container.id)
      .attr("class","d3plus_drop_title_text")
      .call(titleStyle)

    vars.container.title
      .on(d3plus.evt.over,function(d,i){

        var color = d3plus.color.lighter(vars.ui.color.secondary.value)

        d3.select(this).style("cursor","pointer")
          .transition().duration(vars.timing.mouseevents)
          .style("background-color",color)
          .style("color",d3plus.color.text(color))

      })
      .on(d3plus.evt.out,function(d){

        var color = vars.ui.color.secondary.value

        d3.select(this).style("cursor","auto")
          .transition().duration(vars.timing.mouseevents)
          .style("background-color",color)
          .style("color",d3plus.color.text(color))

      })
      .on(d3plus.evt.click,function(d){
        vars.history.back()
      })

    vars.container.title.exit().remove()

    if ( enabled ) {
      vars.margin.title += vars.container.title.node().offsetHeight || vars.container.title.node().getBoundingClientRect().height
    }

    if ( vars.dev.value ) d3plus.console.timeEnd("creating title and back button")

  }

}
