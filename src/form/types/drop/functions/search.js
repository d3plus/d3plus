var prefix = require("../../../../client/prefix.coffee"),
    print = require("../../../../core/console/print.coffee")
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the search box, if enabled.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( vars.dev.value ) print.time("creating search")

  var data = require("./data.js")
    , items = require("./items.coffee")
    , update = require("./update.js")

  vars.container.search = vars.container.selector.selectAll("div.d3plus_drop_search")
    .data(vars.search.enabled ? ["search"] : [])

  function searchStyle(elem) {

    elem
      .style("padding",vars.ui.padding.css)
      .style("display","block")
      .style("background-color",d3.rgb(vars.ui.color.primary.value).darker(0.15).toString())

  }

  function inputStyle(elem) {

    var width = vars.width.secondary - vars.ui.padding.left*2 - vars.ui.padding.right*2 + vars.ui.border*2

    elem
      .style("padding",vars.ui.padding.left/2+vars.ui.padding.right/2+"px")
      .style("width",width+"px")
      .style("border-width","0px")
      .style("font-family",vars.font.secondary.family.value)
      .style("font-size",vars.font.secondary.size+"px")
      .style("font-weight",vars.font.secondary.weight)
      .style("text-align",vars.font.secondary.align)
      .style("outline","none")
      .style(prefix()+"border-radius","0")
      .attr("placeholder",vars.format.value(vars.format.locale.value.method.search))

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
    var term = this.value;
    if (vars.search.term !== term) {
      vars.search.term = term;
      data(vars);
      items(vars);
      update(vars);
    }
  });

  vars.container.search.exit().remove()

  var oldDisplay = vars.container.selector.style("display")
  vars.container.selector.style("display", "block")
  vars.search.height = vars.search.enabled ? vars.container.search.node().offsetHeight ||
                       vars.container.search.node().getBoundingClientRect().height : 0;
  vars.container.selector.style("display", oldDisplay)

  if ( vars.search.enabled ) {
    vars.margin.title += vars.search.height
  }

  if ( vars.dev.value ) print.timeEnd("creating search")

}
