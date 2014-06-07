//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates and styles the main drop button.
//------------------------------------------------------------------------------
d3plus.input.drop.button = function ( vars ) {

  var self = this

  if ( !("button" in vars.container) ) {

    if ( vars.dev.value ) d3plus.console.time("creating main button")

    var buttonData = d3plus.util.copy(vars.data.value.filter(function(d){
      return d[vars.id.value] === vars.focus.value
    })[0])

    vars.container.button = d3plus.form()
      .container(vars.container.ui)
      .data([buttonData])
      .type("button")
      .ui({
        "margin": 0
      })

    if ( vars.dev.value ) d3plus.console.timeEnd("creating main button")

  }
  else if ( vars.data.changed ) {

    var buttonData = d3plus.util.copy(vars.data.value.filter(function(d){
      return d[vars.id.value] === vars.focus.value
    })[0])

    vars.container.button
      .data([buttonData])

  }

  vars.container.button
    .draw({
      "update": vars.draw.update
    })
    .focus(vars.focus.value)
    .font( vars.font )
    .icon({
      "select": vars.icon.drop.value,
      "value": vars.icon.value
    })
    .id(vars.id.value)
    .text( vars.text.value || vars.text.secondary )
    .timing({
      "ui": vars.draw.timing
    })
    .ui({
      "color": vars.ui.color,
      "padding": vars.ui.padding
    })
    .width(vars.width.value)
    .draw()

  vars.container.button.container(Object).ui.on(d3plus.evt.click,function(){
    self.toggle(vars)
  })

}
