//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the search box, if enabled.
//------------------------------------------------------------------------------
d3plus.input.drop.search = function ( vars ) {

  if (vars.dev.value) d3plus.console.time("creating search")

  var self = this

  vars.container.search = vars.container.selector.selectAll("div.d3plus_drop_search")
    .data(vars.search.enabled ? ["search"] : [])

  function searchStyle(elem) {

    elem
      .style("padding",vars.ui.padding+"px")
      .style("display","block")
      .style("background-color",vars.ui.color.secondary.value)

  }

  function inputStyle(elem) {

    var width = vars.width.secondary - vars.ui.padding*4 - vars.ui.border*2

    elem
      .style("padding",vars.ui.padding+"px")
      .style("width",width+"px")
      .style("border-style","solid")
      .style("border-width","0px")
      .style("font-family",vars.font.secondary.family.value)
      .style("font-size",vars.font.secondary.size+"px")
      .style("font-weight",vars.font.secondary.weight)
      .style("text-align",vars.font.secondary.align)
      .style("outline","none")
      .style(d3plus.prefix()+"border-radius","0")
      .attr("placeholder",vars.format.value("Search"))

  }

  if (vars.draw.timing) {

    vars.container.search.transition().duration(vars.draw.timing)
      .call(searchStyle)

    vars.container.search.select("input").transition().duration(vars.draw.timing)
      .call(inputStyle)

  }
  else {

    vars.container.search
      .call(searchStyle)

    vars.container.search.select("input")
      .call(inputStyle)

  }

  vars.container.search.enter()
    .insert("div","#d3plus_drop_list_"+vars.container.id)
      .attr("class","d3plus_drop_search")
      .attr("id","d3plus_drop_search_"+vars.container.id)
      .call(searchStyle)
      .append("input")
        .attr("id","d3plus_drop_input_"+vars.container.id)
        .style("-webkit-appearance","none")
        .call(inputStyle)

  vars.container.search.select("input").on("keyup."+vars.container.id,function(d){
    if (vars.text.solo[0] !== this.value) {
      vars.self.text({"solo":[this.value]})
      self.data( vars )
      self.items( vars )
      self.update( vars )
    }
  })

  vars.container.search.exit().remove()

  if (vars.dev.value) d3plus.console.timeEnd("creating search")

}
