//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.forms.radio = function(vars,styles,timing) {
  
  vars.container.transition().duration(timing)
    .style("background-color",d3plus.color.darker(styles.color,0.1))
    .style("padding",styles.stroke+"px")
    
  var button_style = d3plus.utils.copy(styles)
  button_style.icon = false
  button_style.display = "inline-block"
  button_style.border = "none"
  button_style.width = false
  button_style.margin = 0
  button_style.stroke = 0
  
  var text = d3plus.forms.value(vars.text,["button"])
  if (!text) {
   text = "text"
  }
  
  var button = d3plus.ui(button_style)
    .type("button")
    .text(text)
    .data(vars.data)
    .parent(vars.container)
    .id(vars.id+"_radios")
    .callback(vars.ui.value)
    .highlight(vars.focus)
    .enable()
    .draw()
  
}
