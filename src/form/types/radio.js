//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.input.radio = function( vars ) {

  if ( !("buttons" in vars.container) ) {

    vars.container.buttons = d3plus.form()
      .container(vars.container.ui)
      .type("button")

  }

  var buttonUI = d3plus.util.copy(vars)
  buttonUI.ui.display.value = "inline-block"
  buttonUI.ui.border = "none"
  buttonUI.ui.margin = 0
  buttonUI.ui.stroke = 0

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
      return value

    })
    .ui(buttonUI)
    .width(false)
    .draw()

}
