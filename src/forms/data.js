d3plus.forms.data = function(vars) {

  vars.tag = vars.element.node().tagName.toLowerCase()
  
  if (vars.tag == "select") {

    vars.element.selectAll("option")
      .each(function(o){
        var data_obj = {
          "selected": this.selected,
          "text": this.innerHTML,
          "value": this.value
        }
        if (this.selected) {
          vars.focus = data_obj
        }
        vars.data.push(data_obj)
      })
      
  }
    
  if (!vars.focus && vars.data.length) {
    vars.element.node().selectedIndex = 0
    vars.focus = vars.data[0]
  }
  
  if (!vars.type) {
    if (vars.data.length > 4) {
      vars.type = "drop"
    }
    else {
      vars.type = "radio"
    }
  }
  
}