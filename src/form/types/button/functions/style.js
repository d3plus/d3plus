//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
//------------------------------------------------------------------------------
d3plus.input.button.style = function ( elem , vars ) {

  elem
    .style("position","relative")
    .style("margin",vars.ui.margin+"px")
    .style("display",vars.ui.display.value)
    .style("border-style","solid")
    .style("border-width",vars.ui.border+"px")
    .style("font-family",vars.font.family.value)
    .style("font-size",vars.font.size+"px")
    .style("font-weight",vars.font.weight)
    .style("text-align",vars.font.align.value)
    .style("letter-spacing",vars.font.spacing+"px")

}
