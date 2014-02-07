//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates a set of Radio Buttons
//------------------------------------------------------------------------------
d3plus.forms.radio = function(vars,styles,timing) {
  
  vars.container.transition().duration(timing)
    .style("border-style","solid")
    .style("border-width",styles.stroke+"px")
    .style("border-color",styles.color)
    // .style("background-color",styles.color)
    // .style("padding",styles.padding+"px")
    
  var button_style = d3plus.utils.copy(styles)
  button_style.icon = false
  button_style.display = "inline-block"
  button_style.border = "none"
  button_style.width = false
  button_style.margin = 0
  
  var text = d3plus.forms.value(vars.text,["button"])
  if (!text) {
   text = "text"
  }
  
  var buttons = []
  vars.data.forEach(function(d,i){

    var button = d3plus.ui(button_style)
      .type("button")
      .text(text)
      .data([d])
      .parent(vars.container)
      .id(vars.id+"_option"+i)
      .callback(vars.ui.value)
      
    if (vars.focus == d.value) {
      button.enable()
    }
      
    button
      .draw()
      
    buttons.push(button)
      
  })
  
}
