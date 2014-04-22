//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// If placing into a new container, remove it's contents
// and check text direction.
//
// Also initialized app width and height.
//------------------------------------------------------------------------------
d3plus.draw.container = function(vars) {

  if (vars.container.changed) {

    vars.parent = d3.select(vars.container.value)

    vars.parent
      .style("overflow","hidden")
      .style("position",function(){
        var current = d3.select(this).style("position"),
            remain = ["absolute","fixed"].indexOf(current) >= 0
        return remain ? current : "relative";
      })
      .html("")

    //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // Get overall width and height, if not defined
    //--------------------------------------------------------------------------
    var sizes = ["width","height"]
    sizes.forEach(function(s){
      if (!vars[s].value) {
        function check_parent(element) {

          if (element.tagName === undefined || ["BODY","HTML"].indexOf(element.tagName) >= 0) {
            var val = window["inner"+s.charAt(0).toUpperCase()+s.slice(1)]
              , elem = document != element ? d3.select(element) : null
            if (elem && s == "width") {
              val -= parseFloat(elem.style("margin-left"),10)
              val -= parseFloat(elem.style("margin-right"),10)
              val -= parseFloat(elem.style("padding-left"),10)
              val -= parseFloat(elem.style("padding-right"),10)
            }
            else if (elem && s == "height") {
              val -= parseFloat(elem.style("margin-top"),10)
              val -= parseFloat(elem.style("margin-bottom"),10)
              val -= parseFloat(elem.style("padding-top"),10)
              val -= parseFloat(elem.style("padding-bottom"),10)
            }
            if (d3.selectAll("body > *:not(script)").size() == 1) {
              d3.select("body").style("overflow","hidden")
            }
            if (val <= 20) {
              val = vars[s].small
            }
            vars[s].value = val
          }
          else {

            var val = parseFloat(d3.select(element).style(s),10)
            if (typeof val == "number" && val > 0) {
              vars[s].value = val
            }
            else if (element.tagName != "BODY") {
              check_parent(element.parentNode)
            }

          }

        }
        check_parent(vars.parent.node())
      }
    })

    vars.parent
      .style("width",vars.width.value+"px")
      .style("height",vars.height.value+"px")

  }

  vars.width.viz = vars.width.value;
  vars.height.viz = vars.height.value;

}
