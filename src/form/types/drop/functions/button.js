var copy = require("../../../../util/copy.coffee"),
    events = require("../../../../client/pointer.coffee"),
    form   = require("../../../form.js"),
    print  = require("../../../../core/console/print.coffee")

//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the main drop button.
//------------------------------------------------------------------------------
module.exports = function ( vars ) {

  if ( !("button" in vars.container) ) {

    if ( vars.dev.value ) print.time("creating main button")

    vars.container.button = form()
      .container(vars.container.ui)
      .type("button")
      .ui({
        "margin": 0
      })

    if ( vars.dev.value ) print.timeEnd("creating main button")

  }

  if ( vars.focus.changed || vars.data.changed || vars.depth.changed ) {

    var depth = vars.depth.value

    var buttonData = copy(vars.data.value.filter(function(d){
      var match = false
      for ( var i = 0 ; i < vars.id.nesting.length ; i++ ) {
        var level = vars.id.nesting[i]
        match = level in d && d[level] === vars.focus.value
        if (match) {
          depth = i
          break
        }
      }
      return match
    })[0])

    if ( !buttonData ) {
      buttonData = vars.container.button.data()[0] || vars.data.viz[0]
    }

    vars.container.button
      .data([buttonData])
      .id( vars.id.nesting )
      .depth(depth)

  }

  var hover = vars.hover.value === true ? vars.focus.value : false;

  vars.container.button
    .draw({
      "update": vars.draw.update
    })
    .focus("")
    .font( vars.font )
    .hover(hover)
    .icon({
      "button": vars.icon.drop.value,
      "select": vars.icon.drop.value,
      "value": vars.icon.value
    })
    .text( vars.text.value )
    .timing({
      "ui": vars.draw.timing
    })
    .ui({
      "color": vars.ui.color,
      "padding": vars.ui.padding.css
    })
    .width(vars.width.value)
    .draw()

  var button = vars.container.button.container(Object).ui

  vars.margin.top += button.node().offsetHeight || button.node().getBoundingClientRect().height

  button.on(events.click,function(){
    vars.self.open(!vars.open.value).draw()
  })

}
