//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
//------------------------------------------------------------------------------
d3plus.input.button.style = function ( elem , vars ) {

  if (vars.ui.border == "all") {
    var border_width = vars.ui.stroke+"px"
  }
  else {
    var sides = ["top","right","bottom","left"]
    var border_width = ""
    sides.forEach(function(s,i){
      if (vars.ui.border.indexOf(s) >= 0) {
        border_width += vars.ui.stroke+"px"
      }
      else {
        border_width += "0px"
      }
      if (i < sides.length-1) {
        border_width += " "
      }
    })
  }

  elem
    .style("position","relative")
    .style("margin",vars.ui.margin+"px")
    .style("display",vars.ui.display.value)
    .style("border-style","solid")
    .style("border-width",border_width)
    .style("font-family",vars.font.family)
    .style("font-size",vars.font.size+"px")
    .style("font-weight",vars.font.weight)
    .style("text-align",vars.font.align.value)
    .style("letter-spacing",vars.font.spacing+"px")

}
