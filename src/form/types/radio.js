//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.form.radio = function(vars,styles,timing) {

  vars.container.transition().duration(timing)
    .style("background-color",styles.secondary)
    .style("padding",styles.stroke+"px")
    .style("margin",styles.margin+"px")

  var button_style = d3plus.util.copy(styles)
  button_style.icon = false
  button_style.display = "inline-block"
  button_style.border = "none"
  button_style.width = false
  button_style.margin = 0
  button_style.stroke = 0

  var text = d3plus.form.value(vars.text,["button"])
  if (!text) {
   text = "text"
  }

  var button = d3plus.form(button_style)
    .type("button")
    .text(text)
    .data(vars.data.array)
    .parent(vars.container)
    .id(vars.id+"_radios")
    .callback(vars.self.value)
    .highlight(vars.focus)
    .enable()
    .draw()

}
