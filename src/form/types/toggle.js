var form = require("../form.js")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Toggle Buttons
//------------------------------------------------------------------------------
module.exports = function( vars ) {

  if ( !("buttons" in vars.container) ) {

    vars.container.buttons = form()
      .container(vars.container.ui)
      .type("button")

  }

  var dataLength  = vars.data.viz.length
    , buttonWidth = vars.width.value
                  ? vars.width.value/dataLength
                  : false

  var toggles = vars.container.ui.selectAll("div.d3plus_toggle")
    .data(vars.data.viz,function(d){
      return d[vars.id.value];
    })

  toggles.exit().remove();

  toggles.enter().append("div")
    .attr("class","d3plus_toggle")
    .style("display","inline-block")
    .style("vertical-align","top")

  toggles.order()
    .each(function(d){

      if (!("form" in d.d3plus)) {
        d.d3plus.form = form().container(d3.select(this))
      }

      var id = vars.id.nesting.length > vars.depth.value ? vars.id.nesting[vars.depth.value+1] : vars.id.value

      if (d[id] instanceof Array) {
        d.d3plus.form
          .container({"id": vars.container.id+"_"+d[vars.id.value]})
          .data(d[id])
          .id(vars.id.nesting.slice(1))
          .type("drop")
      }
      else {
        d.d3plus.form
          .data([d])
          .id(vars.id.value)
          .type("button")
      }

      d.d3plus.form
        .color(vars.color)
        .focus(vars.focus.value,function(value){

          if (value !== vars.focus.value) {
            vars.self.focus(value).draw()
          }

        })
        .hover(vars.hover.value)
        .icon({
          "select": false,
          "value": vars.icon.value
        })
        .font(vars.font)
        .format(vars.format)
        .order(vars.order)
        .text(vars.text.value)
        .ui({
          "border": vars.ui.border,
          "color": vars.ui.color,
          "display": "inline-block",
          "margin": 0,
          "padding": vars.ui.padding.css
        })
        .width(buttonWidth)
        .draw()

    })

  if (vars.data.element.value) {
    vars.data.element.value
      .on("focus."+vars.container.id, function(){
        vars.self.focus(this.value).hover(this.value).draw();
      })
      .on("blur."+vars.container.id, function(){
        vars.self.hover(false).draw();
      })
  }

}
