//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.input.radio = function( vars ) {

  vars.container.ui.transition().duration(vars.draw.timing)
    .style("background-color",vars.ui.color.secondary.value)
    .style("padding",vars.ui.stroke+"px")
    .style("margin",vars.ui.margin+"px")

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
