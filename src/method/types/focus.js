d3plus.method.focus = {
  "accepted"   : [ false , Array , Function , Number , String ],
  "deprecates" : "highlight",
  "process"    : function(value) {

    if (value === false) {
      return []
    }
    else {

      if (!(value instanceof Array)) value = [value]

      var vars = this.getVars()

      if ( ["string","number"].indexOf(typeof value[0]) >= 0 && vars.data.element.value ) {

        var elementTag  = vars.data.element.value.node().tagName.toLowerCase()
          , elementType = vars.data.element.value.attr("type")

        if (elementTag === "select") {

          vars.data.element.value.selectAll("option").each(function(d,i){

            if (d && d[vars.id.value] === value[0]) {
              vars.data.element.value.node().selectedIndex = i
            }

          })

        }
        else if (elementTag === "input" && elementType === "radio") {

          vars.data.element.value
            .each(function(d){

              if (d && d[vars.id.value] === value[0]) {
                this.checked = true
              }
              else {
                this.checked = false
              }

            })

        }

      }

      return value

    }

  },
  "tooltip"    : {
    "accepted" : [ Boolean ],
    "value"    : true
  },
  "value"      : []
}
