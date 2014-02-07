d3plus.forms.data = function(vars) {

  vars.tag = vars.element.node().tagName.toLowerCase()
  
  if (vars.tag == "select") {
    
    if (vars.element.attr("id") && vars.id == "default") {
      vars.id = vars.element.attr("id")
    }

    vars.element.selectAll("option")
      .each(function(o,i){
        var data_obj = {
          "selected": this.selected,
          "text": this.innerHTML,
          "value": this.value
        }
        if (this.selected) {
          vars.focus = this.value
        }
        vars.data.push(data_obj)
      })
      
  }
  else if (vars.tag == "input" && vars.element.attr("type") == "radio") {
    
    vars.element
      .each(function(o,i){
        var data_obj = {
          "selected": this.checked,
          "value": this.value
        }
        
        if (this.id) {
          var label = d3.select("label[for="+this.id+"]")
          if (!label.empty()) {
            data_obj.text = label.style("display","none").html()
          }
        }
        
        if (this.checked) {
          vars.focus = this.value
        }
        vars.data.push(data_obj)
      })
  }
  
  if (!vars.focus && vars.data.length) {
    vars.element.node().selectedIndex = 0
    vars.focus = vars.data[0].value
  }
  
  if (!vars.type) {
    if (vars.data.length > 4) {
      vars.type = "drop"
    }
    else {
      vars.type = "radio"
    }
  }
  
  if (vars.data.length > 10 && !("search" in vars)) {
    vars.search = true
  }
  
}