d3plus.form.element = function(vars) {

  function get_attributes(obj,elem) {

    var attributes = ["value","alt","keywords","image","style","color"];

    [].forEach.call(elem.attributes, function(attr) {
        if (/^data-/.test(attr.name)) {
            var camelCaseName = attr.name.substr(5).replace(/-(.)/g, function ($0, $1) {
                return $1.toUpperCase();
            });
            obj[camelCaseName] = attr.value;
        }
    });
    
    attributes.forEach(function(a){

      if (elem.getAttribute(a) !== null) {
        obj[a] = elem.getAttribute(a)
      }

    })

  }

  vars.tag = vars.element.node().tagName.toLowerCase()

  if (vars.tag == "select") {

    if (vars.element.attr("id") && vars.id == "default") {
      vars.id = vars.element.attr("id")
    }

    vars.element.selectAll("option")
      .each(function(o,i){
        var data_obj = {
          "selected": this.selected,
          "text": this.innerHTML
        }

        get_attributes(data_obj,this)

        if (this.selected) {
          vars.focus = this.value
        }
        vars.data.array.push(data_obj)
      })

  }
  else if (vars.tag == "input" && vars.element.attr("type") == "radio") {

    vars.element
      .each(function(o,i){
        var data_obj = {
          "selected": this.checked
        }

        get_attributes(data_obj,this)

        if (this.id) {
          var label = d3.select("label[for="+this.id+"]")
          if (!label.empty()) {
            data_obj.text = label.style("display","none").html()
          }
        }

        if (this.checked) {
          vars.focus = this.value
        }
        vars.data.array.push(data_obj)
      })
  }

  if (!vars.focus && vars.data.array.length) {
    vars.element.node().selectedIndex = 0
    vars.focus = vars.data.array[0].value
  }

  if (!vars.type) {
    if (vars.data.array.length > 4) {
      vars.type = "drop"
    }
    else {
      vars.type = "radio"
    }
  }

}
