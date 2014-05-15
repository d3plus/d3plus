d3plus.method.focus = {
  "accepted": [ Boolean , Function , Number , String ],
  "deprecates": ["highlight"],
  "process": function(value) {

    var vars = this.getVars()

    if ( vars.data.element ) {

      var elementTag  = vars.data.element.node().tagName.toLowerCase()
        , elementType = vars.data.element.attr("type")

      if (elementTag === "select") {

        vars.data.element.selectAll("option").each(function(d,i){

          if (d && d[vars.id.value] === value) {
            vars.data.element.node().selectedIndex = i
          }

        })

      }
      else if (elementTag === "input" && elementType === "radio") {

        vars.data.element
          .each(function(d){

            if (d && d[vars.id.value] === value) {
              this.checked = true
            }
            else {
              this.checked = false
            }

          })

      }

    }

    return value

  },
  "tooltip": {
    "accepted": [ Boolean ],
    "value": true
  },
  "value": false
}
