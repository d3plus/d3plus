//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Toggle Buttons
//------------------------------------------------------------------------------
d3plus.input.toggle = function( vars ) {

  if ( !("buttons" in vars.container) ) {

    vars.container.buttons = d3plus.form()
      .container(vars.container.ui)
      .type("button")

  }

  var dataLength  = vars.data.value.length
    , buttonWidth = vars.width.value
                  ? vars.width.value/dataLength
                  : false

  vars.container.buttons
    .color(vars.color)
    .data(vars.data.value)
    .icon({
      "select": false,
      "value": vars.icon.value
    })
    .id(vars.id)
    .font(vars.font)
    .focus(vars.focus.value,function(value){

      vars.self.focus(value)

    })
    .ui({
      "border": vars.ui.border,
      "display": "inline-block",
      "margin": 0,
      "padding": vars.ui.padding
    })
    .width(buttonWidth)
    .draw()

}
